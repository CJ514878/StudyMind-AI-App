/* =========================================================
   STUDYMIND AI — 1V1 + LEADERBOARD
   CLEAN REPLACEMENT
========================================================= */

/* =========================================================
   GAME MODE STORAGE
========================================================= */

const GAME_STORAGE = {
    theme: "studyMindGameTheme"
};

/* =========================================================
   GLOBAL BATTLE STATE
========================================================= */

let battleState = {
    mode: null,
    subject: "",
    topic: "",
    difficulty: "mixed",
    questions: [],
    currentQuestion: 0,
    playerScore: 0,
    opponentScore: 0,
    timer: 0,
    timerInterval: null,
    answering: false,
    battleActive: false
};
/* =========================================================
   1V1 STATE
========================================================= */

let oneVOneMatchId = null;
let oneVOnePlayerNumber = null;
let oneVOneMyName = "Player";
let oneVOnePolling = null;
let oneVOneMatchmakingStartedAt = 0;
let oneVOneActive = false;
let oneVOneResultsRecorded = false;
let oneVOneAnsweredQuestions = new Set();
let oneVOneChannel = null;

const MATCHMAKING_INTERVAL = 2500;
const MATCH_TIMEOUT = 120000;


/* =========================================================
   SUPABASE
========================================================= */

function getSupabase() {

    if (
        typeof window.supabaseClient !== "undefined" &&
        window.supabaseClient
    ) {
        return window.supabaseClient;
    }

    if (
        typeof window.supabase !== "undefined" &&
        window.supabase &&
        typeof window.supabase.from === "function"
    ) {
        return window.supabase;
    }

    if (
        typeof supabase !== "undefined" &&
        supabase &&
        typeof supabase.from === "function"
    ) {
        return supabase;
    }

    throw new Error(
        "Supabase is not connected on the Game Mode page."
    );
}


/* =========================================================
   ELEMENT
========================================================= */

function getElement(id) {
    return document.getElementById(id);
}


/* =========================================================
   CURRENT USER
========================================================= */

async function getCurrentUser() {

    const client = getSupabase();

    const {
        data,
        error
    } = await client.auth.getUser();

    if (error) {
        throw error;
    }

    if (!data?.user) {
        throw new Error(
            "You must be logged in before playing 1v1."
        );
    }

    return data.user;
}


/* =========================================================
   DISPLAY NAME
========================================================= */

function getDisplayName(user) {

    if (!user) {
        return "Player";
    }

    const metadata =
        user.user_metadata || {};

    return (
        metadata.display_name ||
        metadata.full_name ||
        metadata.name ||
        metadata.username ||
        user.email?.split("@")[0] ||
        "Player"
    );
}


/* =========================================================
   PREMIUM
========================================================= */

function isPremiumUser() {

    const premium =
        localStorage.getItem(
            "studyMindPremium"
        );

    return (
        premium === "true" ||
        premium === "1"
    );
}


/* =========================================================
   MATCHMAKING POLLING
========================================================= */

function clearOneVOnePolling() {

    if (oneVOnePolling) {

        clearInterval(
            oneVOnePolling
        );

        oneVOnePolling = null;
    }
}


/* =========================================================
   MATCHMAKING UI
========================================================= */

function showMatchmaking() {

    const status =
        getElement("matchmakingStatus");

    const button =
        getElement("findOpponentButton");

    if (status) {
        status.hidden = false;
    }

    if (button) {

        button.disabled = true;

        button.textContent =
            "🔎 Searching...";
    }

    updateMatchmakingText(
        "Looking for an opponent...",
        "StudyMind is searching for another student with the same subject, topic and difficulty."
    );
}


function hideMatchmaking() {

    const status =
        getElement("matchmakingStatus");

    const button =
        getElement("findOpponentButton");

    if (status) {
        status.hidden = true;
    }

    if (button) {

        const subject =
            getElement("oneVOneSubject")?.value;

        const topic =
            getElement("oneVOneTopic")?.value;

        button.disabled =
            !subject ||
            !topic;

        button.textContent =
            "⚔️ Find Opponent";
    }
}


function updateMatchmakingText(
    title,
    message
) {

    const titleElement =
        getElement("matchmakingTitle");

    const messageElement =
        getElement("matchmakingMessage");

    if (titleElement) {
        titleElement.textContent = title;
    }

    if (messageElement) {
        messageElement.textContent = message;
    }
}


/* =========================================================
   MATCH ID NORMALIZER
========================================================= */

function normalizeMatchId(value) {

    if (!value) {
        return null;
    }

    if (typeof value === "string") {
        return value;
    }

    if (Array.isArray(value)) {

        return value.length
            ? normalizeMatchId(value[0])
            : null;
    }

    if (typeof value === "object") {

        return (
            value.match_id ||
            value.matchId ||
            value.game_match_id ||
            value.id ||
            null
        );
    }

    return null;
}


/* =========================================================
   START 1V1 MODE
========================================================= */

function startOneVOneMode() {

    battleState.mode = "1v1";

    const setup =
        $("battleSetup");

    const oneVOneSetup =
        $("oneVOneSetup");

    const arena =
        $("battleArena");

    const oneVOneArena =
        $("oneVOneArena");

    const results =
        $("battleResults");

    if (setup) {
        setup.hidden = true;
    }

    if (oneVOneSetup) {
        oneVOneSetup.hidden = false;
    }

    if (arena) {
        arena.hidden = true;
    }

    if (oneVOneArena) {
        oneVOneArena.hidden = true;
    }

    if (results) {
        results.hidden = true;
    }

    window.oneVOneArenaStarted = false;

    if (oneVOneSetup) {

        oneVOneSetup.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}


/* =========================================================
   1V1 VALUES
========================================================= */

function oneVOneSubjectValue() {

    return normalizeSubjectName(
        getElement("oneVOneSubject")
            ?.value
            ?.trim() || ""
    );
}


function oneVOneTopicValue() {

    return (
        getElement("oneVOneTopic")
            ?.value
            ?.trim() || ""
    );
}


function oneVOneDifficultyValue() {

    return (
        getElement("oneVOneDifficulty")
            ?.value ||
        "mixed"
    );
}


/* =========================================================
   FIND OPPONENT
========================================================= */

async function findOneVOneOpponent() {

    if (
        !isPremiumUser() &&
        getBattleCount() >= FREE_BATTLE_LIMIT
    ) {

        showPremiumMessage();
        return;
    }

    if (oneVOneMatchId) {
        return;
    }

    try {

        const user =
            await getCurrentUser();

        const subject =
            oneVOneSubjectValue();

        const topic =
            oneVOneTopicValue();

        const difficulty =
            oneVOneDifficultyValue();

        if (!subject || !topic) {

            alert(
                "Choose a subject and topic first."
            );

            return;
        }

        oneVOneMyName =
            getDisplayName(user);

        showMatchmaking();

        const client =
            getSupabase();


        /* -------------------------------------------------
           LOOK FOR EXISTING WAITING ROOM
        ------------------------------------------------- */

        const {
            data: waitingMatches,
            error: searchError
        } =
            await client
                .from("game_matches")
                .select("*")
                .eq("status", "waiting")
                .eq("subject", subject)
                .eq("topic", topic)
                .eq("difficulty", difficulty)
                .neq("created_by", user.id)
                .order("created_at", {
                    ascending: true
                })
                .limit(1);

        if (searchError) {
            throw searchError;
        }


        const existingMatch =
            waitingMatches?.[0] || null;


        /* -------------------------------------------------
           JOIN EXISTING ROOM
        ------------------------------------------------- */

        if (existingMatch) {

            await joinExistingMatch(
                existingMatch
            );

            return;
        }


        /* -------------------------------------------------
           CREATE NEW ROOM
        ------------------------------------------------- */

        console.log(
            "No existing 1v1 match found. Creating waiting room..."
        );

        const {
            data: createdMatch,
            error: createError
        } =
            await client.rpc(
                "create_game_match",
                {
                    p_subject: subject,
                    p_topic: topic,
                    p_difficulty: difficulty,
                    p_display_name: oneVOneMyName
                }
            );

        if (createError) {
            throw createError;
        }

        oneVOneMatchId =
            normalizeMatchId(
                createdMatch
            );

        if (!oneVOneMatchId) {

            throw new Error(
                "The battle room was created but no match ID was returned."
            );
        }

        oneVOnePlayerNumber = 1;
        oneVOneActive = false;
        oneVOneResultsRecorded = false;
        oneVOneAnsweredQuestions =
            new Set();

        window.oneVOneArenaStarted = false;

        console.log(
            "Created new 1v1 waiting room:",
            oneVOneMatchId
        );

        await subscribeToOneVOne(
            oneVOneMatchId
        );

        oneVOneMatchmakingStartedAt =
            Date.now();


        /* -------------------------------------------------
           POLL
        ------------------------------------------------- */

        const pollForOpponent =
            async function() {

                if (
                    !oneVOneMatchId ||
                    oneVOneActive
                ) {
                    return;
                }

                if (
                    Date.now() -
                    oneVOneMatchmakingStartedAt >=
                    MATCH_TIMEOUT
                ) {

                    clearOneVOnePolling();

                    updateMatchmakingText(
                        "Still waiting...",
                        "No opponent has joined yet. You can keep waiting or cancel the search."
                    );

                    return;
                }

                try {

                    await checkMatchPlayers();

                } catch (error) {

                    console.warn(
                        "1v1 polling error:",
                        error
                    );
                }
            };


        clearOneVOnePolling();

        oneVOnePolling =
            setInterval(
                pollForOpponent,
                MATCHMAKING_INTERVAL
            );

    } catch (error) {

        console.error(
            "1v1 matchmaking error:",
            error
        );

        clearOneVOnePolling();

        await cleanupOneVOneConnection();

        oneVOneMatchId = null;
        oneVOnePlayerNumber = null;
        oneVOneActive = false;

        hideMatchmaking();

        alert(
            cleanErrorMessage(
                error?.message
            )
        );
    }
}


/* =========================================================
   JOIN EXISTING MATCH
   ONLY ONE DEFINITION
========================================================= */

async function joinExistingMatch(match) {

    if (!match?.id) {
        throw new Error(
            "Invalid match."
        );
    }

    const client =
        getSupabase();

    const user =
        await getCurrentUser();

    const displayName =
        getDisplayName(user);

    oneVOneMatchId =
        match.id;

    oneVOneMyName =
        displayName;

    oneVOneResultsRecorded =
        false;

    oneVOneAnsweredQuestions =
        new Set();

    window.oneVOneArenaStarted = false;

    clearOneVOnePolling();

    /*
     * Check whether this user is already in
     * the match before attempting another insert.
     */

    const {
        data: existingPlayer,
        error: existingPlayerError
    } =
        await client
            .from("game_match_players")
            .select(
                "user_id,player_number,display_name"
            )
            .eq(
                "match_id",
                match.id
            )
            .eq(
                "user_id",
                user.id
            )
            .maybeSingle();

    if (existingPlayerError) {
        throw existingPlayerError;
    }


    /* -----------------------------------------------------
       ALREADY JOINED
    ----------------------------------------------------- */

    if (existingPlayer) {

        oneVOnePlayerNumber =
            Number(
                existingPlayer.player_number
            );

        oneVOneMyName =
            existingPlayer.display_name ||
            displayName;

        console.log(
            "Already joined 1v1 match:",
            existingPlayer
        );

    } else {

        /* -------------------------------------------------
           JOIN THROUGH RPC
        ------------------------------------------------- */

        const {
            data: joinedMatch,
            error: joinError
        } =
            await client.rpc(
                "join_game_match",
                {
                    p_match_id: match.id,
                    p_display_name: displayName
                }
            );

        if (joinError) {
            throw joinError;
        }

        oneVOnePlayerNumber =
            Number(
                joinedMatch?.player_number || 2
            );

        console.log(
            "Successfully joined 1v1 match:",
            joinedMatch
        );
    }


    updateMatchmakingText(
        "Opponent found! ⚔️",
        "Both players are connected. Preparing your battle..."
    );

    await subscribeToOneVOne(
        match.id
    );

    await checkMatchPlayers();

    return true;
}


/* =========================================================
   CHECK MATCH PLAYERS
   ONLY ONE DEFINITION
========================================================= */

async function checkMatchPlayers() {

    if (!oneVOneMatchId) {
        return;
    }

    try {

        const client =
            getSupabase();


        /* -------------------------------------------------
           LOAD PLAYERS
        ------------------------------------------------- */

        const {
            data: players,
            error: playersError
        } =
            await client
                .from("game_match_players")
                .select(
                    "match_id,user_id,player_number,display_name"
                )
                .eq(
                    "match_id",
                    oneVOneMatchId
                )
                .order(
                    "player_number",
                    {
                        ascending: true
                    }
                );

        if (playersError) {
            throw playersError;
        }

        const matchPlayers =
            Array.isArray(players)
                ? players
                : [];


        /* -------------------------------------------------
           IDENTIFY CURRENT PLAYER
        ------------------------------------------------- */

        const user =
            await getCurrentUser();

        const currentPlayer =
            matchPlayers.find(
                player =>
                    String(player.user_id) ===
                    String(user.id)
            );

        if (currentPlayer) {

            oneVOnePlayerNumber =
                Number(
                    currentPlayer.player_number
                );

            oneVOneMyName =
                currentPlayer.display_name ||
                oneVOneMyName;
        }


        /* -------------------------------------------------
           WAITING
        ------------------------------------------------- */

        if (
            matchPlayers.length < 2
        ) {

            updateMatchmakingText(
                "Looking for an opponent...",
                "Your battle room is ready. Searching for another student..."
            );

            return;
        }


        /* -------------------------------------------------
           LOAD MATCH
        ------------------------------------------------- */

        const {
            data: match,
            error: matchError
        } =
            await client
                .from("game_matches")
                .select("*")
                .eq(
                    "id",
                    oneVOneMatchId
                )
                .maybeSingle();

        if (matchError) {
            throw matchError;
        }

        if (!match) {
            throw new Error(
                "The 1v1 match no longer exists."
            );
        }


        console.log(
            "1v1 match:",
            match.status
        );


        /* -------------------------------------------------
           FINISHED / CANCELLED
        ------------------------------------------------- */

        if (
            match.status === "finished" ||
            match.status === "cancelled"
        ) {

            clearOneVOnePolling();

            oneVOneActive = false;

            updateMatchmakingText(
                "Match unavailable",
                "This battle is no longer available."
            );

            return;
        }


        /* -------------------------------------------------
           STARTING
        ------------------------------------------------- */

        if (
            match.status === "starting"
        ) {

            updateMatchmakingText(
                "Opponent found! ⚔️",
                "Both players are connected. Starting the battle..."
            );


            /*
             * Only Player 1 activates.
             */

            if (
                oneVOnePlayerNumber === 1
            ) {

                const {
                    data,
                    error
                } =
                    await client.rpc(
                        "start_game_match",
                        {
                            p_match_id:
                                oneVOneMatchId
                        }
                    );

                if (error) {

                    console.warn(
                        "start_game_match:",
                        error
                    );

                    /*
                     * Re-read instead of assuming
                     * the match failed.
                     */

                    const {
                        data: latestMatch
                    } =
                        await client
                            .from("game_matches")
                            .select("status")
                            .eq(
                                "id",
                                oneVOneMatchId
                            )
                            .maybeSingle();

                    if (
                        latestMatch?.status ===
                        "active"
                    ) {

                        activateOneVOneMatch(
                            latestMatch
                        );
                    }

                    return;
                }

                console.log(
                    "1v1 start RPC:",
                    data
                );


                /*
                 * Check database status after RPC.
                 */

                const {
                    data: latestMatch
                } =
                    await client
                        .from("game_matches")
                        .select("*")
                        .eq(
                            "id",
                            oneVOneMatchId
                        )
                        .maybeSingle();

                if (
                    latestMatch?.status ===
                    "active"
                ) {

                    activateOneVOneMatch(
                        latestMatch
                    );
                }
            }

            return;
        }


        /* -------------------------------------------------
           ACTIVE
        ------------------------------------------------- */

        if (
            match.status === "active"
        ) {

            activateOneVOneMatch(
                match
            );

            return;
        }


        console.warn(
            "Unexpected 1v1 status:",
            match.status
        );

    } catch (error) {

        console.error(
            "checkMatchPlayers error:",
            error
        );
    }
}


/* =========================================================
   REALTIME SUBSCRIPTION
========================================================= */

async function subscribeToOneVOne(
    matchId
) {

    const client =
        getSupabase();

    if (!matchId) {
        return null;
    }

    await cleanupOneVOneConnection();

    oneVOneMatchId =
        matchId;

    console.log(
        "Subscribing to 1v1 match:",
        matchId
    );


    const channel =
        client
            .channel(
                `game-match-${matchId}`
            )


            /* ---------------------------------------------
               MATCH CHANGES
            --------------------------------------------- */

            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "game_matches",
                    filter:
                        `id=eq.${matchId}`
                },
                async function(payload) {

                    console.log(
                        "1v1 match realtime:",
                        payload
                    );

                    const match =
                        payload.new;

                    if (!match) {
                        return;
                    }

                    if (
                        match.status === "active"
                    ) {

                        activateOneVOneMatch(
                            match
                        );

                    } else {

                        await checkMatchPlayers();
                    }
                }
            )


            /* ---------------------------------------------
               PLAYER CHANGES
            --------------------------------------------- */

            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table:
                        "game_match_players",
                    filter:
                        `match_id=eq.${matchId}`
                },
                async function(payload) {

                    console.log(
                        "1v1 player realtime:",
                        payload
                    );

                    await checkMatchPlayers();
                }
            )


            .subscribe(
                function(status) {

                    console.log(
                        "1v1 realtime status:",
                        status
                    );
                }
            );

    oneVOneChannel =
        channel;

    window.oneVOneChannel =
        channel;

    /*
     * Important:
     * Immediately check because the second player
     * may already have joined.
     */

    await checkMatchPlayers();

    return channel;
}


/* =========================================================
   ACTIVATE MATCH
========================================================= */

async function activateOneVOneMatch(
    match
) {

    if (!match) {
        return;
    }

    if (
        oneVOneMatchId &&
        match.id &&
        String(match.id) !==
        String(oneVOneMatchId)
    ) {
        return;
    }

    oneVOneMatchId =
        match.id ||
        oneVOneMatchId;

    oneVOneActive =
        true;

    clearOneVOnePolling();

    if (
        window.oneVOneArenaStarted
    ) {
        return;
    }

    window.oneVOneArenaStarted =
        true;

    updateMatchmakingText(
        "Battle starting! ⚔️",
        "Your 1v1 match is active. Get ready!"
    );

    setTimeout(
        async function() {

            try {

                await startOneVOneArena();

            } catch (error) {

                console.error(
                    "Could not start 1v1 arena:",
                    error
                );

                window.oneVOneArenaStarted =
                    false;

                updateMatchmakingText(
                    "Could not start battle",
                    cleanErrorMessage(
                        error?.message
                    )
                );
            }

        },
        500
    );
}


/* =========================================================
   START ARENA
========================================================= */

async function startOneVOneArena() {

    clearOneVOnePolling();

    const setup =
        $("battleSetup");

    const oneVOneSetup =
        $("oneVOneSetup");

    const computerArena =
        $("battleArena");

    const oneVOneArena =
        $("oneVOneArena");

    const results =
        $("battleResults");


    if (setup) {
        setup.hidden = true;
    }

    if (oneVOneSetup) {
        oneVOneSetup.hidden = true;
    }

    if (computerArena) {
        computerArena.hidden = true;
    }

    if (results) {
        results.hidden = true;
    }


    if (!oneVOneArena) {

        throw new Error(
            "The 1v1 arena element (#oneVOneArena) is missing from game-mode.html."
        );
    }

    oneVOneArena.hidden =
        false;

    oneVOneArena.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });


    oneVOneActive =
        true;

    oneVOneResultsRecorded =
        false;

    oneVOneAnsweredQuestions =
        new Set();


    /*
     * Reset local battle state.
     */

    battleState = {

        mode: "1v1",

        subject:
            oneVOneSubjectValue(),

        topic:
            oneVOneTopicValue(),

        difficulty:
            oneVOneDifficultyValue(),

        questions: [],

        currentQuestion: 0,

        playerScore: 0,

        opponentScore: 0,

        timer:
            QUESTION_TIME_SECONDS,

        timerInterval: null,

        answering: false,

        battleActive: true
    };


    updateOneVOnePlayerLabels();

    updateOneVOneArenaMessage(
        "Preparing your questions..."
    );


    try {

        const questions =
            await generateBattleQuestions(
                battleState.subject,
                battleState.topic,
                battleState.difficulty
            );

        if (
            !Array.isArray(questions) ||
            questions.length <
            QUESTIONS_PER_BATTLE
        ) {

            throw new Error(
                "The AI did not return enough questions for the 1v1 battle."
            );
        }

        battleState.questions =
            questions.slice(
                0,
                QUESTIONS_PER_BATTLE
            );

    } catch (error) {

        battleState.battleActive =
            false;

        oneVOneActive =
            false;

        window.oneVOneArenaStarted =
            false;

        updateOneVOneArenaMessage(
            "Could not prepare the battle questions."
        );

        throw error;
    }


    showOneVOneQuestion();
}


/* =========================================================
   PLAYER LABELS
========================================================= */

function updateOneVOnePlayerLabels() {

    const playerOneName =
        getElement(
            "oneVOnePlayerOneName"
        );

    const playerTwoName =
        getElement(
            "oneVOnePlayerTwoName"
        );

    const opponentName =
        getElement(
            "oneVOneOpponentName"
        );


    if (playerOneName) {

        playerOneName.textContent =
            playerOneName.textContent.trim() ||
            "Player 1";
    }


    if (playerTwoName) {

        playerTwoName.textContent =
            playerTwoName.textContent.trim() ||
            "Player 2";
    }


    if (opponentName) {

        opponentName.textContent =
            oneVOnePlayerNumber === 1
                ? "Player 2"
                : "Player 1";
    }


    const playerScore =
        getElement(
            "oneVOnePlayerScore"
        );

    const opponentScore =
        getElement(
            "oneVOneOpponentScore"
        );

    if (playerScore) {
        playerScore.textContent = "0";
    }

    if (opponentScore) {
        opponentScore.textContent = "0";
    }
}


/* =========================================================
   ARENA MESSAGE
========================================================= */

function updateOneVOneArenaMessage(
    message
) {

    const ids = [
        "oneVOneArenaMessage",
        "oneVOneStatusMessage",
        "oneVOneBattleStatus",
        "oneVOneQuestionStatus"
    ];

    for (const id of ids) {

        const element =
            getElement(id);

        if (element) {

            element.textContent =
                message;

            return;
        }
    }
}


/* =========================================================
   SHOW QUESTION
========================================================= */

function showOneVOneQuestion() {

    stopOneVOneTimer();

    const question =
        battleState.questions[
            battleState.currentQuestion
        ];

    if (!question) {

        finishOneVOneBattle();

        return;
    }


    battleState.answering =
        false;


    const questionNumber =
        battleState.currentQuestion + 1;


    [
        "oneVOneQuestionNumber",
        "oneVOneCurrentQuestionNumber"
    ].forEach(
        id => {

            const element =
                getElement(id);

            if (element) {
                element.textContent =
                    questionNumber;
            }
        }
    );


    [
        "oneVOneQuestionTopic",
        "oneVOneBattleTopic"
    ].forEach(
        id => {

            const element =
                getElement(id);

            if (element) {
                element.textContent =
                    battleState.topic;
            }
        }
    );


    let questionElement =
        null;

    for (
        const id of [
            "oneVOneQuestion",
            "oneVOneBattleQuestion"
        ]
    ) {

        const element =
            getElement(id);

        if (element) {

            questionElement =
                element;

            break;
        }
    }


    if (questionElement) {

        questionElement.textContent =
            question.question;
    }


    let answerGrid =
        getElement(
            "oneVOneAnswerGrid"
        );

    if (!answerGrid) {

        answerGrid =
            getElement(
                "answerGrid"
            );
    }

    if (!answerGrid) {

        throw new Error(
            "The 1v1 answer grid is missing from game-mode.html."
        );
    }


    answerGrid.innerHTML = "";


    question.options.forEach(
        function(
            option,
            index
        ) {

            const button =
                document.createElement(
                    "button"
                );

            button.type =
                "button";

            button.className =
                "answer-button";

            button.textContent =
                option;

            button.addEventListener(
                "click",
                function() {

                    answerOneVOneQuestion(
                        index
                    );
                }
            );

            answerGrid.appendChild(
                button
            );
        }
    );


    updateOneVOneScores();

    startOneVOneTimer();
}


/* =========================================================
   TIMER
========================================================= */

function startOneVOneTimer() {

    stopOneVOneTimer();

    battleState.timer =
        QUESTION_TIME_SECONDS;

    updateOneVOneTimer();

    battleState.timerInterval =
        setInterval(
            function() {

                if (
                    !battleState.battleActive
                ) {

                    stopOneVOneTimer();
                    return;
                }

                battleState.timer--;

                updateOneVOneTimer();

                if (
                    battleState.timer <= 0
                ) {

                    stopOneVOneTimer();

                    handleOneVOneTimeout();
                }

            },
            1000
        );
}


function stopOneVOneTimer() {

    if (
        battleState?.timerInterval
    ) {

        clearInterval(
            battleState.timerInterval
        );

        battleState.timerInterval =
            null;
    }
}


function updateOneVOneTimer() {

    const ids = [
        "oneVOneTimer",
        "oneVOneBattleTimer"
    ];

    for (const id of ids) {

        const element =
            getElement(id);

        if (element) {

            element.textContent =
                Math.max(
                    0,
                    battleState.timer
                );

            return;
        }
    }
}


/* =========================================================
   ANSWER QUESTION
========================================================= */

function answerOneVOneQuestion(
    selectedIndex
) {

    if (
        battleState.answering ||
        !battleState.battleActive
    ) {
        return;
    }

    battleState.answering =
        true;

    stopOneVOneTimer();


    const question =
        battleState.questions[
            battleState.currentQuestion
        ];

    if (!question) {
        return;
    }


    let answerGrid =
        getElement(
            "oneVOneAnswerGrid"
        );

    if (!answerGrid) {
        answerGrid =
            getElement(
                "answerGrid"
            );
    }


    const buttons =
        answerGrid
            ? answerGrid.querySelectorAll(
                ".answer-button"
            )
            : [];


    buttons.forEach(
        function(
            button,
            index
        ) {

            button.disabled =
                true;

            if (
                index ===
                question.answer
            ) {

                button.classList.add(
                    "correct"
                );
            }

            if (
                index === selectedIndex &&
                index !== question.answer
            ) {

                button.classList.add(
                    "incorrect"
                );
            }
        }
    );


    oneVOneAnsweredQuestions.add(
        battleState.currentQuestion
    );


    /*
     * LOCAL PLAYER SCORE
     */

    if (
        selectedIndex ===
        question.answer
    ) {

        battleState.playerScore += 10;
    }


    updateOneVOneScores();


    /*
     * Move forward.
     */

    setTimeout(
        function() {

            if (
                !battleState.battleActive
            ) {
                return;
            }

            battleState.currentQuestion++;

            showOneVOneQuestion();

        },
        900
    );
}


/* =========================================================
   TIMEOUT
========================================================= */

function handleOneVOneTimeout() {

    if (
        battleState.answering ||
        !battleState.battleActive
    ) {
        return;
    }

    battleState.answering =
        true;


    const question =
        battleState.questions[
            battleState.currentQuestion
        ];


    let answerGrid =
        getElement(
            "oneVOneAnswerGrid"
        );

    if (!answerGrid) {
        answerGrid =
            getElement(
                "answerGrid"
            );
    }


    const buttons =
        answerGrid
            ? answerGrid.querySelectorAll(
                ".answer-button"
            )
            : [];


    buttons.forEach(
        function(
            button,
            index
        ) {

            button.disabled =
                true;

            if (
                question &&
                index === question.answer
            ) {

                button.classList.add(
                    "correct"
                );
            }
        }
    );


    /*
     * IMPORTANT:
     *
     * Do NOT add 10 to the local opponent score.
     *
     * The other player's browser owns that score.
     *
     * The current player's unanswered question
     * simply gives the opponent an opportunity to
     * score on their own client.
     */


    updateOneVOneScores();


    setTimeout(
        function() {

            if (
                !battleState.battleActive
            ) {
                return;
            }

            battleState.currentQuestion++;

            showOneVOneQuestion();

        },
        900
    );
}


/* =========================================================
   SCORES
========================================================= */

function updateOneVOneScores() {

    const playerScore =
        getElement(
            "oneVOnePlayerScore"
        );

    const opponentScore =
        getElement(
            "oneVOneOpponentScore"
        );


    if (playerScore) {

        playerScore.textContent =
            battleState.playerScore;
    }


    if (opponentScore) {

        opponentScore.textContent =
            battleState.opponentScore;
    }


    const normalPlayerScore =
        getElement(
            "playerScore"
        );

    const normalOpponentScore =
        getElement(
            "computerScore"
        );


    if (
        battleState.mode === "1v1"
    ) {

        if (normalPlayerScore) {

            normalPlayerScore.textContent =
                battleState.playerScore;
        }

        if (normalOpponentScore) {

            normalOpponentScore.textContent =
                battleState.opponentScore;
        }
    }
}


/* =========================================================
   FINISH 1V1
========================================================= */

function finishOneVOneBattle() {

    stopOneVOneTimer();

    battleState.battleActive =
        false;

    oneVOneActive =
        false;


    const arena =
        getElement(
            "oneVOneArena"
        );

    const results =
        getElement(
            "battleResults"
        );


    if (arena) {
        arena.hidden = true;
    }

    if (results) {
        results.hidden = false;
    }


    const player =
        Number(
            battleState.playerScore || 0
        );

    const opponent =
        Number(
            battleState.opponentScore || 0
        );


    let title =
        "1v1 Battle Complete";

    let message =
        "Great work!";

    let points =
        player;


    if (
        player > opponent
    ) {

        title =
            "🏆 Victory!";

        message =
            "You won the 1v1 battle!";

        points =
            player + 25;

    } else if (
        player < opponent
    ) {

        title =
            "Keep Studying!";

        message =
            "Your opponent won this round.";

    } else {

        title =
            "🤝 Draw!";

        message =
            "Both players finished with the same score.";

        points =
            player + 10;
    }


    /*
     * Award local battle points once.
     */

    if (
        !oneVOneResultsRecorded
    ) {

        oneVOneResultsRecorded =
            true;

        setBattlePoints(
            getBattlePoints() +
            points
        );

        setBattlesUsed(
            getBattlesUsed() + 1
        );
    }


    if ($("battleResultTitle")) {

        $("battleResultTitle")
            .textContent =
            title;
    }

    if ($("battleResultMessage")) {

        $("battleResultMessage")
            .textContent =
            message;
    }

    if ($("finalPlayerScore")) {

        $("finalPlayerScore")
            .textContent =
            player;
    }

    if ($("finalComputerScore")) {

        $("finalComputerScore")
            .textContent =
            opponent;
    }

    if ($("pointsEarned")) {

        $("pointsEarned")
            .textContent =
            `+${points}`;
    }

    if ($("finalOpponentLabel")) {

        $("finalOpponentLabel")
            .textContent =
            "OPPONENT";
    }


    updateLeaderboardUI();


    console.log(
        "🏁 1v1 finished:",
        {
            player,
            opponent,
            points
        }
    );
}


/* =========================================================
   CANCEL 1V1
========================================================= */

async function cancelOneVOne() {

    clearOneVOnePolling();

    const matchId =
        oneVOneMatchId;

    try {

        if (matchId) {

            const client =
                getSupabase();

            await client.rpc(
                "cancel_game_match",
                {
                    p_match_id:
                        matchId
                }
            );
        }

    } catch (error) {

        console.warn(
            "Could not cancel 1v1:",
            error
        );
    }


    await cleanupOneVOneConnection();


    oneVOneMatchId = null;
    oneVOnePlayerNumber = null;
    oneVOneActive = false;
    oneVOneResultsRecorded = false;

    oneVOneAnsweredQuestions =
        new Set();

    window.oneVOneArenaStarted =
        false;

    hideMatchmaking();
}


/* =========================================================
   RESET 1V1
========================================================= */

function resetOneVOneArena() {

    stopOneVOneTimer();

    clearOneVOnePolling();

    cleanupOneVOneConnection();

    battleState.battleActive =
        false;

    oneVOneActive =
        false;

    oneVOneMatchId =
        null;

    oneVOnePlayerNumber =
        null;

    oneVOneResultsRecorded =
        false;

    oneVOneAnsweredQuestions =
        new Set();

    window.oneVOneArenaStarted =
        false;


    const arena =
        getElement(
            "oneVOneArena"
        );

    if (arena) {
        arena.hidden = true;
    }

    startOneVOneMode();
}


/* =========================================================
   CLEANUP REALTIME
========================================================= */

async function cleanupOneVOneConnection() {

    clearOneVOnePolling();

    try {

        const channel =
            oneVOneChannel ||
            window.oneVOneChannel;

        if (channel) {

            const client =
                getSupabase();

            await client.removeChannel(
                channel
            );
        }

    } catch (error) {

        console.warn(
            "Could not remove 1v1 realtime channel:",
            error
        );
    }

    oneVOneChannel =
        null;

    window.oneVOneChannel =
        null;
}


/* =========================================================
   PREMIUM MESSAGE
========================================================= */

function showPremiumMessage() {

    if (
        typeof openPremium ===
        "function"
    ) {

        openPremium();

        return;
    }

    alert(
        "You have used all 5 free Game Mode battles. Upgrade to Premium for unlimited battles."
    );
}


/* =========================================================
   LEADERBOARD
========================================================= */

async function getLeaderboardCurrentUser() {

    try {

        return await getCurrentUser();

    } catch (error) {

        console.warn(
            "Could not get current leaderboard user:",
            error
        );

        return null;
    }
}


function escapeLeaderboardHTML(value) {

    return String(
        value ?? ""
    )
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function getLeaderboardRankDisplay(rank) {

    if (rank === 1) {
        return "🥇";
    }

    if (rank === 2) {
        return "🥈";
    }

    if (rank === 3) {
        return "🥉";
    }

    return `#${rank}`;
}


function updateYourLeaderboardRank(
    rank,
    totalPlayers
) {

    const container =
        $("yourLeaderboardRank");

    if (!container) {
        return;
    }

    const span =
        container.querySelector("span");

    const value =
        rank
            ? `#${rank}`
            : "—";

    if (span) {
        span.textContent = value;
    } else {
        container.textContent = value;
    }

    container.title =
        rank
            ? `Rank ${rank} of ${totalPlayers}`
            : "Not ranked yet";
}


/* =========================================================
   LOAD GLOBAL LEADERBOARD
========================================================= */

async function getGlobalLeaderboard() {

    const client =
        getSupabase();

    const {
        data,
        error
    } =
        await client
            .from("game_leaderboard")
            .select(`
                user_id,
                display_name,
                battle_points,
                wins,
                losses,
                draws,
                battles_played,
                updated_at,
                battles
            `)
            .order(
                "battle_points",
                {
                    ascending: false
                }
            )
            .order(
                "wins",
                {
                    ascending: false
                }
            )
            .order(
                "battles_played",
                {
                    ascending: true
                }
            );

    if (error) {
        throw error;
    }

    return Array.isArray(data)
        ? data
        : [];
}


/* =========================================================
   UPDATE LEADERBOARD UI
========================================================= */

async function updateLeaderboardUI() {

    const rows =
        $("leaderboardRows");

    if (!rows) {
        return;
    }


    rows.innerHTML = `
        <div class="leaderboard-row">
            <span>⏳</span>
            <span>Loading leaderboard...</span>
            <strong>—</strong>
        </div>
    `;


    try {

        const currentUser =
            await getLeaderboardCurrentUser();

        const currentUserId =
            currentUser?.id || null;


        const leaderboard =
            await getGlobalLeaderboard();


        /*
         * Remove duplicate user rows.
         */

        const uniquePlayers =
            new Map();


        leaderboard.forEach(
            function(player) {

                if (
                    !player?.user_id
                ) {
                    return;
                }

                const userId =
                    String(
                        player.user_id
                    );

                const existing =
                    uniquePlayers.get(
                        userId
                    );

                if (!existing) {

                    uniquePlayers.set(
                        userId,
                        player
                    );

                    return;
                }

                if (
                    Number(
                        player.battle_points || 0
                    ) >
                    Number(
                        existing.battle_points || 0
                    )
                ) {

                    uniquePlayers.set(
                        userId,
                        player
                    );
                }
            }
        );


        const players =
            Array.from(
                uniquePlayers.values()
            );


        players.sort(
            function(a, b) {

                const pointsA =
                    Number(
                        a.battle_points || 0
                    );

                const pointsB =
                    Number(
                        b.battle_points || 0
                    );

                if (
                    pointsA !== pointsB
                ) {

                    return (
                        pointsB -
                        pointsA
                    );
                }


                const winsA =
                    Number(
                        a.wins || 0
                    );

                const winsB =
                    Number(
                        b.wins || 0
                    );

                if (
                    winsA !== winsB
                ) {

                    return (
                        winsB -
                        winsA
                    );
                }


                const battlesA =
                    Number(
                        a.battles_played ||
                        a.battles ||
                        0
                    );

                const battlesB =
                    Number(
                        b.battles_played ||
                        b.battles ||
                        0
                    );

                return (
                    battlesA -
                    battlesB
                );
            }
        );


        const totalPlayersElement =
            $("totalPlayers");

        if (totalPlayersElement) {

            totalPlayersElement.textContent =
                players.length;
        }


        if (!players.length) {

            rows.innerHTML = `
                <div class="leaderboard-row">
                    <span>🏆</span>
                    <span>No players yet</span>
                    <strong>0</strong>
                </div>
            `;

            if ($("yourBattlePoints")) {

                $("yourBattlePoints")
                    .textContent =
                    "0";
            }

            updateYourLeaderboardRank(
                null,
                0
            );

            return;
        }


        const currentPlayerIndex =
            players.findIndex(
                player =>
                    currentUserId &&
                    String(player.user_id) ===
                    String(currentUserId)
            );


        if ($("yourBattlePoints")) {

            $("yourBattlePoints")
                .textContent =
                currentPlayerIndex !== -1
                    ? Number(
                        players[
                            currentPlayerIndex
                        ].battle_points || 0
                    )
                    : Number(
                        getBattlePoints() || 0
                    );
        }


        rows.innerHTML =
            players
                .map(
                    function(player, index) {

                        const rank =
                            index + 1;

                        const points =
                            Number(
                                player.battle_points || 0
                            );

                        const isYou =
                            Boolean(
                                currentUserId &&
                                String(
                                    player.user_id
                                ) ===
                                String(
                                    currentUserId
                                )
                            );

                        const displayName =
                            player.display_name ||
                            "StudyMind Student";


                        return `
                            <div
                                class="leaderboard-row ${
                                    isYou
                                        ? "current-player"
                                        : ""
                                }"
                                data-rank="${rank}"
                                data-user-id="${escapeLeaderboardHTML(
                                    player.user_id
                                )}"
                            >

                                <span class="leaderboard-rank">
                                    ${getLeaderboardRankDisplay(
                                        rank
                                    )}
                                </span>

                                <span class="leaderboard-player">
                                    ${escapeLeaderboardHTML(
                                        displayName
                                    )}
                                    ${
                                        isYou
                                            ? " <small>(You)</small>"
                                            : ""
                                    }
                                </span>

                                <strong class="leaderboard-points">
                                    ${points}
                                </strong>

                            </div>
                        `;
                    }
                )
                .join("");


        if (
            currentPlayerIndex !== -1
        ) {

            updateYourLeaderboardRank(
                currentPlayerIndex + 1,
                players.length
            );

        } else {

            const localPoints =
                Number(
                    getBattlePoints() || 0
                );

            const calculatedRank =
                players.filter(
                    player =>
                        Number(
                            player.battle_points || 0
                        ) > localPoints
                ).length + 1;

            updateYourLeaderboardRank(
                calculatedRank,
                players.length + 1
            );
        }


        console.log(
            "GLOBAL LEADERBOARD:",
            players
        );

    } catch (error) {

        console.error(
            "GLOBAL LEADERBOARD ERROR:",
            error
        );

        rows.innerHTML = `
            <div class="leaderboard-row">
                <span>⚠️</span>
                <span>Leaderboard temporarily unavailable</span>
                <strong>—</strong>
            </div>
        `;
    }
}


/* =========================================================
   LEADERBOARD REFRESH
========================================================= */

async function refreshLeaderboard() {
    await updateLeaderboardUI();
}


/* =========================================================
   LEADERBOARD REALTIME
========================================================= */

let leaderboardRealtimeChannel =
    null;


async function subscribeToLeaderboard() {

    try {

        const client =
            getSupabase();


        if (
            leaderboardRealtimeChannel
        ) {

            try {

                await client.removeChannel(
                    leaderboardRealtimeChannel
                );

            } catch (_) {}

            leaderboardRealtimeChannel =
                null;
        }


        leaderboardRealtimeChannel =
            client
                .channel(
                    "global-game-leaderboard"
                )
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table:
                            "game_leaderboard"
                    },
                    function(payload) {

                        console.log(
                            "GLOBAL LEADERBOARD CHANGED:",
                            payload
                        );

                        setTimeout(
                            function() {

                                updateLeaderboardUI();

                            },
                            300
                        );
                    }
                )
                .subscribe(
                    function(status) {

                        console.log(
                            "Leaderboard realtime:",
                            status
                        );
                    }
                );

    } catch (error) {

        console.warn(
            "Leaderboard realtime subscription failed:",
            error
        );
    }
}


async function initializeLeaderboard() {

    await updateLeaderboardUI();

    await subscribeToLeaderboard();
}


/* =========================================================
   PREMIUM
========================================================= */

function openPremium() {

    alert(
        "Premium will give you unlimited Game Mode battles."
    );
}


/* =========================================================
   NAVIGATION
========================================================= */

function openHome() {
    window.location.href = "home.html";
}


function openNewStudyPlan() {
    window.location.href =
        "home.html#newStudyPlan";
}


function openSummarizer() {
    window.location.href =
        "dashboard.html#summarizer";
}


function openStudyStreak() {
    window.location.href =
        "dashboard.html#studyStreak";
}


function openStudyScore() {
    window.location.href =
        "dashboard.html#studyScore";
}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutStudyMind() {

    try {

        const client =
            getSupabase();

        await client.auth.signOut();

    } catch (error) {

        console.warn(
            "Supabase logout error:",
            error
        );
    }

    localStorage.removeItem(
        "studyMindCurrentUser"
    );

    window.location.href =
        "index.html";
}


/* =========================================================
   THEME
========================================================= */

function toggleGameTheme() {

    const body =
        document.body;

    const isLight =
        body.classList.contains(
            "light-mode"
        );

    if (isLight) {

        body.classList.remove(
            "light-mode"
        );

        localStorage.setItem(
            GAME_STORAGE.theme,
            "dark"
        );

    } else {

        body.classList.add(
            "light-mode"
        );

        localStorage.setItem(
            GAME_STORAGE.theme,
            "light"
        );
    }

    updateThemeButton();
}


function updateThemeButton() {

    const button =
        $("themeButton");

    if (!button) {
        return;
    }

    button.textContent =
        document.body.classList.contains(
            "light-mode"
        )
            ? "☀️ Light Mode"
            : "🌙 Dark Mode";
}


/* =========================================================
   SAVED THEME
========================================================= */

(function loadSavedTheme() {

    const saved =
        localStorage.getItem(
            GAME_STORAGE.theme
        );

    if (
        saved === "light"
    ) {

        document.body.classList.add(
            "light-mode"
        );
    }

})();


/* =========================================================
   CLEAN ERROR
========================================================= */

function cleanErrorMessage(
    message
) {

    if (!message) {
        return "Unknown server error.";
    }

    let text =
        String(message)
            .replace(
                /<[^>]*>/g,
                " "
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();

    if (
        text.length > 500
    ) {

        text =
            text.slice(0, 500) +
            "...";
    }

    return text;
}


/* =========================================================
   GLOBAL EXPORTS
========================================================= */

window.startComputerBattle =
    startComputerBattle;

window.beginBattle =
    beginBattle;

window.startOneVOneMode =
    startOneVOneMode;

window.findOneVOneOpponent =
    findOneVOneOpponent;

window.joinExistingMatch =
    joinExistingMatch;

window.cancelOneVOne =
    cancelOneVOne;

window.resetOneVOneArena =
    resetOneVOneArena;

window.resetBattle =
    resetBattle;

window.openHome =
    openHome;

window.openNewStudyPlan =
    openNewStudyPlan;

window.openSummarizer =
    openSummarizer;

window.openStudyStreak =
    openStudyStreak;

window.openStudyScore =
    openStudyScore;

window.openPremium =
    openPremium;

window.logoutStudyMind =
    logoutStudyMind;

window.toggleGameTheme =
    toggleGameTheme;

window.SUBJECT_DATABASE =
    SUBJECT_DATABASE;
