/* =========================================================
   STUDYMIND AI — 1v1 BATTLE DATABASE
========================================================= */

create extension if not exists pgcrypto;


/* =========================================================
   MATCHES
========================================================= */

create table if not exists public.game_matches (

    id uuid primary key default gen_random_uuid(),

    subject text not null,

    topic text not null,

    difficulty text not null
        check (
            difficulty in (
                'mixed',
                'easy',
                'medium',
                'hard'
            )
        ),

    status text not null default 'waiting'
        check (
            status in (
                'waiting',
                'starting',
                'active',
                'finished',
                'cancelled'
            )
        ),

    question_set jsonb,

    current_question integer not null default 0,

    question_started_at timestamptz,

    created_by uuid not null
        references auth.users(id)
        on delete cascade,

    created_at timestamptz not null default now(),

    started_at timestamptz,

    finished_at timestamptz

);


/* =========================================================
   PLAYERS
========================================================= */

create table if not exists public.game_match_players (

    id uuid primary key default gen_random_uuid(),

    match_id uuid not null
        references public.game_matches(id)
        on delete cascade,

    user_id uuid not null
        references auth.users(id)
        on delete cascade,

    player_number integer not null
        check (
            player_number in (1, 2)
        ),

    display_name text,

    score integer not null default 0,

    answered_question integer not null default -1,

    finished boolean not null default false,

    joined_at timestamptz not null default now(),

    unique(match_id, user_id),

    unique(match_id, player_number)

);


/* =========================================================
   ANSWERS
========================================================= */

create table if not exists public.game_match_answers (

    id uuid primary key default gen_random_uuid(),

    match_id uuid not null
        references public.game_matches(id)
        on delete cascade,

    user_id uuid not null
        references auth.users(id)
        on delete cascade,

    question_number integer not null
        check (
            question_number >= 0
            and question_number < 10
        ),

    selected_answer integer,

    correct boolean not null default false,

    answer_time_ms integer,

    created_at timestamptz not null default now(),

    unique(match_id, user_id, question_number)

);


/* =========================================================
   LEADERBOARD
========================================================= */

create table if not exists public.game_leaderboard (

    user_id uuid primary key
        references auth.users(id)
        on delete cascade,

    display_name text,

    battle_points integer not null default 0,

    wins integer not null default 0,

    losses integer not null default 0,

    draws integer not null default 0,

    battles_played integer not null default 0,

    updated_at timestamptz not null default now()

);


/* =========================================================
   INDEXES
========================================================= */

create index if not exists
game_matches_status_idx
on public.game_matches(status);

create index if not exists
game_matches_created_by_idx
on public.game_matches(created_by);

create index if not exists
game_match_players_match_idx
on public.game_match_players(match_id);

create index if not exists
game_match_players_user_idx
on public.game_match_players(user_id);

create index if not exists
game_match_answers_match_idx
on public.game_match_answers(match_id);

create index if not exists
game_match_answers_user_idx
on public.game_match_answers(user_id);


/* =========================================================
   ROW LEVEL SECURITY
========================================================= */

alter table public.game_matches
enable row level security;

alter table public.game_match_players
enable row level security;

alter table public.game_match_answers
enable row level security;

alter table public.game_leaderboard
enable row level security;


/* =========================================================
   MATCH POLICIES
========================================================= */

drop policy if exists
"Players can view their matches"
on public.game_matches;

create policy
"Players can view their matches"
on public.game_matches
for select
to authenticated
using (

    created_by = (select auth.uid())

    or exists (
        select 1
        from public.game_match_players p
        where p.match_id = game_matches.id
        and p.user_id = (select auth.uid())
    )

);


/* =========================================================
   PLAYER POLICIES
========================================================= */

drop policy if exists
"Players can view match players"
on public.game_match_players;

create policy
"Players can view match players"
on public.game_match_players
for select
to authenticated
using (

    exists (
        select 1
        from public.game_match_players me
        where me.match_id = game_match_players.match_id
        and me.user_id = (select auth.uid())
    )

    or exists (
        select 1
        from public.game_matches m
        where m.id = game_match_players.match_id
        and m.created_by = (select auth.uid())
    )

);


drop policy if exists
"Users can insert themselves into matches"
on public.game_match_players;

create policy
"Users can insert themselves into matches"
on public.game_match_players
for insert
to authenticated
with check (

    user_id = (select auth.uid())

);


/* =========================================================
   ANSWER POLICIES
========================================================= */

drop policy if exists
"Players can view match answers"
on public.game_match_answers;

create policy
"Players can view match answers"
on public.game_match_answers
for select
to authenticated
using (

    exists (
        select 1
        from public.game_match_players p
        where p.match_id = game_match_answers.match_id
        and p.user_id = (select auth.uid())
    )

);


drop policy if exists
"Users can submit their own answers"
on public.game_match_answers;

create policy
"Users can submit their own answers"
on public.game_match_answers
for insert
to authenticated
with check (

    user_id = (select auth.uid())

    and exists (
        select 1
        from public.game_match_players p
        where p.match_id = game_match_answers.match_id
        and p.user_id = (select auth.uid())
    )

);


/* =========================================================
   LEADERBOARD POLICIES
========================================================= */

drop policy if exists
"Authenticated users can view leaderboard"
on public.game_leaderboard;

create policy
"Authenticated users can view leaderboard"
on public.game_leaderboard
for select
to authenticated
using (true);


/* =========================================================
   RPC — CREATE MATCH
========================================================= */

create or replace function public.create_game_match(

    p_subject text,

    p_topic text,

    p_difficulty text,

    p_display_name text default null

)

returns uuid

language plpgsql

security definer

set search_path = ''

as $$

declare

    v_match_id uuid;

    v_user_id uuid;

begin

    v_user_id :=
        (select auth.uid());

    if v_user_id is null then

        raise exception
            'You must be logged in to play 1v1.';

    end if;


    insert into public.game_matches (

        subject,

        topic,

        difficulty,

        status,

        created_by

    )

    values (

        p_subject,

        p_topic,

        p_difficulty,

        'waiting',

        v_user_id

    )

    returning id into v_match_id;


    insert into public.game_match_players (

        match_id,

        user_id,

        player_number,

        display_name

    )

    values (

        v_match_id,

        v_user_id,

        1,

        nullif(trim(p_display_name), '')

    );


    return v_match_id;

end;

$$;


/* =========================================================
   RPC — JOIN MATCH
========================================================= */

create or replace function public.join_game_match(

    p_match_id uuid,

    p_display_name text default null

)

returns integer

language plpgsql

security definer

set search_path = ''

as $$

declare

    v_user_id uuid;

    v_player_number integer;

begin

    v_user_id :=
        (select auth.uid());


    if v_user_id is null then

        raise exception
            'You must be logged in to join a 1v1 battle.';

    end if;


    if exists (

        select 1

        from public.game_match_players

        where match_id = p_match_id

        and user_id = v_user_id

    ) then

        select player_number

        into v_player_number

        from public.game_match_players

        where match_id = p_match_id

        and user_id = v_user_id;

        return v_player_number;

    end if;


    if not exists (

        select 1

        from public.game_matches

        where id = p_match_id

        and status = 'waiting'

    ) then

        raise exception
            'This match is no longer available.';

    end if;


    if exists (

        select 1

        from public.game_match_players

        where match_id = p_match_id

        and player_number = 2

    ) then

        raise exception
            'This match is already full.';

    end if;


    insert into public.game_match_players (

        match_id,

        user_id,

        player_number,

        display_name

    )

    values (

        p_match_id,

        v_user_id,

        2,

        nullif(trim(p_display_name), '')

    );


    update public.game_matches

    set status = 'starting'

    where id = p_match_id;


    return 2;

end;

$$;


/* =========================================================
   RPC — UPDATE MATCH
========================================================= */

create or replace function public.update_game_match(

    p_match_id uuid,

    p_status text default null,

    p_question_set jsonb default null,

    p_current_question integer default null,

    p_question_started_at timestamptz default null

)

returns boolean

language plpgsql

security definer

set search_path = ''

as $$

declare

    v_user_id uuid;

begin

    v_user_id :=
        (select auth.uid());


    if not exists (

        select 1

        from public.game_match_players

        where match_id = p_match_id
        and user_id = v_user_id

        and player_number = 1

    ) then

        raise exception
            'Only player 1 can control match state.';

    end if;


    update public.game_matches

    set

        status =
            coalesce(
                p_status,
                status
            ),

        question_set =
            coalesce(
                p_question_set,
                question_set
            ),

        current_question =
            coalesce(
                p_current_question,
                current_question
            ),

        question_started_at =
            coalesce(
                p_question_started_at,
                question_started_at
            ),

        started_at =
            case
                when p_status = 'active'
                then coalesce(
                    started_at,
                    now()
                )
                else started_at
            end,

        finished_at =
            case
                when p_status = 'finished'
                then now()
                else finished_at
            end

    where id = p_match_id;


    return true;

end;

$$;


/* =========================================================
   RPC — UPDATE PLAYER SCORE
========================================================= */

create or replace function public.record_game_answer(

    p_match_id uuid,

    p_question_number integer,

    p_selected_answer integer,

    p_correct boolean,

    p_answer_time_ms integer

)

returns boolean

language plpgsql

security definer

set search_path = ''

as $$

declare

    v_user_id uuid;

    v_player_number integer;

begin

    v_user_id :=
        (select auth.uid());


    select player_number
    into v_player_number

    from public.game_match_players

    where match_id = p_match_id

    and user_id = v_user_id;


    if v_player_number is null then

        raise exception
            'You are not part of this match.';

    end if;


    insert into public.game_match_answers (

        match_id,

        user_id,

        question_number,

        selected_answer,

        correct,

        answer_time_ms

    )

    values (

        p_match_id,

        v_user_id,

        p_question_number,

        p_selected_answer,

        p_correct,

        p_answer_time_ms

    )

    on conflict (
        match_id,
        user_id,
        question_number
    )

    do nothing;


    update public.game_match_players

    set

        score =
            score +
            case
                when p_correct
                then 1
                else 0
            end,

        answered_question =
            greatest(
                answered_question,
                p_question_number
            )

    where match_id = p_match_id

    and user_id = v_user_id;


    return true;

end;

$$;


/* =========================================================
   RPC — FINISH PLAYER
========================================================= */

create or replace function public.finish_game_player(

    p_match_id uuid

)

returns boolean

language plpgsql

security definer

set search_path = ''

as $$

declare

    v_user_id uuid;

begin

    v_user_id :=
        (select auth.uid());


    update public.game_match_players

    set finished = true

    where match_id = p_match_id

    and user_id = v_user_id;


    return true;

end;

$$;


/* =========================================================
   RPC — CANCEL MATCH
========================================================= */

create or replace function public.cancel_game_match(

    p_match_id uuid

)

returns boolean

language plpgsql

security definer

set search_path = ''

as $$

declare

    v_user_id uuid;

begin

    v_user_id :=
        (select auth.uid());


    update public.game_matches

    set status = 'cancelled'

    where id = p_match_id

    and exists (

        select 1

        from public.game_match_players p

        where p.match_id = id

        and p.user_id = v_user_id

    );


    return true;

end;

$$;


/* =========================================================
   RPC — UPDATE LEADERBOARD
========================================================= */

create or replace function public.record_game_result(

    p_display_name text,

    p_points integer,

    p_result text

)

returns boolean

language plpgsql

security definer

set search_path = ''

as $$

declare

    v_user_id uuid;

begin

    v_user_id :=
        (select auth.uid());


    if v_user_id is null then

        raise exception
            'Authentication required.';

    end if;


    insert into public.game_leaderboard (

        user_id,

        display_name,

        battle_points,

        wins,

        losses,

        draws,

        battles_played

    )

    values (

        v_user_id,

        nullif(trim(p_display_name), ''),

        greatest(p_points, 0),

        case when p_result = 'win' then 1 else 0 end,

        case when p_result = 'loss' then 1 else 0 end,

        case when p_result = 'draw' then 1 else 0 end,

        1

    )

    on conflict (user_id)

    do update set

        display_name =
            coalesce(
                excluded.display_name,
                public.game_leaderboard.display_name
            ),

        battle_points =
            public.game_leaderboard.battle_points
            + excluded.battle_points,

        wins =
            public.game_leaderboard.wins
            + excluded.wins,

        losses =
            public.game_leaderboard.losses
            + excluded.losses,

        draws =
            public.game_leaderboard.draws
            + excluded.draws,

        battles_played =
            public.game_leaderboard.battles_played
            + 1,

        updated_at =
            now();


    return true;

end;

$$;


/* =========================================================
   FUNCTION PERMISSIONS
========================================================= */

grant execute
on function public.create_game_match(
    text,
    text,
    text,
    text
)
to authenticated;


grant execute
on function public.join_game_match(
    uuid,
    text
)
to authenticated;


grant execute
on function public.update_game_match(
    uuid,
    text,
    jsonb,
    integer,
    timestamptz
)
to authenticated;


grant execute
on function public.record_game_answer(
    uuid,
    integer,
    integer,
    boolean,
    integer
)
to authenticated;


grant execute
on function public.finish_game_player(
    uuid
)
to authenticated;


grant execute
on function public.cancel_game_match(
    uuid
)
to authenticated;


grant execute
on function public.record_game_result(
    text,
    integer,
    text
)
to authenticated;


/* =========================================================
   REALTIME
========================================================= */

alter publication supabase_realtime
add table public.game_matches;

alter publication supabase_realtime
add table public.game_match_players;

alter publication supabase_realtime
add table public.game_match_answers;

alter publication supabase_realtime
add table public.game_leaderboard;
