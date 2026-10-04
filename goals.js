/* =========================================================
   STUDYMIND AI — GOALS
   PROFESSIONAL GOALS DASHBOARD
   BLACK / GOLD + LIGHT / DARK THEME
========================================================= */

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

:root {
    /* ---------- LIGHT THEME ---------- */
    --bg: #f6f3eb;
    --surface: #ffffff;
    --surface-soft: #faf8f2;
    --surface-hover: #f4f0e5;

    --sidebar-bg: #ffffff;
    --sidebar-border: rgba(0, 0, 0, 0.08);

    --text: #171717;
    --text-soft: #555555;
    --text-muted: #777777;

    --border: rgba(0, 0, 0, 0.09);
    --border-strong: rgba(0, 0, 0, 0.14);

    --gold: #c89b22;
    --gold-light: #e0b83f;
    --gold-dark: #9f7610;
    --gold-soft: rgba(200, 155, 34, 0.10);
    --gold-border: rgba(200, 155, 34, 0.25);

    --green: #16a34a;
    --green-soft: rgba(22, 163, 74, 0.10);

    --orange: #ea8a00;
    --orange-soft: rgba(234, 138, 0, 0.10);

    --danger: #dc2626;

    --shadow-sm:
        0 2px 10px rgba(0, 0, 0, 0.05);

    --shadow-md:
        0 10px 30px rgba(0, 0, 0, 0.08);

    --shadow-lg:
        0 20px 50px rgba(0, 0, 0, 0.10);

    --sidebar-width: 250px;
    --radius-sm: 10px;
    --radius-md: 16px;
    --radius-lg: 22px;

    --transition:
        180ms ease;
}


/* =========================================================
   DARK THEME
========================================================= */

body.dark {
    --bg: #070707;
    --surface: #101010;
    --surface-soft: #151515;
    --surface-hover: #1b1b1b;

    --sidebar-bg: #0b0b0b;
    --sidebar-border: rgba(255, 255, 255, 0.08);

    --text: #f5f5f5;
    --text-soft: #b7b7b7;
    --text-muted: #858585;

    --border: rgba(255, 255, 255, 0.08);
    --border-strong: rgba(255, 255, 255, 0.14);

    --gold: #f5c542;
    --gold-light: #ffd966;
    --gold-dark: #c99b16;
    --gold-soft: rgba(245, 197, 66, 0.10);
    --gold-border: rgba(245, 197, 66, 0.20);

    --green: #35c76f;
    --green-soft: rgba(53, 199, 111, 0.10);

    --orange: #ffad32;
    --orange-soft: rgba(255, 173, 50, 0.10);

    --danger: #ff5c5c;

    --shadow-sm:
        0 2px 10px rgba(0, 0, 0, 0.25);

    --shadow-md:
        0 10px 30px rgba(0, 0, 0, 0.35);

    --shadow-lg:
        0 20px 50px rgba(0, 0, 0, 0.50);
}


/* =========================================================
   BODY
========================================================= */

html {
    min-height: 100%;
}

body {
    min-height: 100vh;

    background: var(--bg);
    color: var(--text);

    font-family:
        Inter,
        ui-sans-serif,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;

    line-height: 1.5;

    transition:
        background-color var(--transition),
        color var(--transition);
}

button,
a {
    font: inherit;
}

button {
    border: 0;
}

a {
    color: inherit;
    text-decoration: none;
}


/* =========================================================
   APP SHELL
========================================================= */

.app-shell {
    display: flex;
    min-height: 100vh;
}


/* =========================================================
   SIDEBAR
========================================================= */

.sidebar {
    position: fixed;
    inset: 0 auto 0 0;

    width: var(--sidebar-width);

    display: flex;
    flex-direction: column;

    background: var(--sidebar-bg);

    border-right: 1px solid var(--sidebar-border);

    z-index: 1000;

    transition:
        background-color var(--transition),
        border-color var(--transition),
        transform 220ms ease;
}


/* =========================================================
   BRAND
========================================================= */

.brand {
    display: flex;
    align-items: center;
    gap: 12px;

    padding: 24px 20px;

    border-bottom: 1px solid var(--border);
}

.brand-icon {
    width: 38px;
    height: 38px;

    display: grid;
    place-items: center;

    flex-shrink: 0;

    border-radius: 11px;

    background:
        linear-gradient(
            135deg,
            var(--gold-light),
            var(--gold-dark)
        );

    color: #080808;

    font-size: 18px;
    font-weight: 900;

    box-shadow:
        0 5px 18px rgba(200, 155, 34, 0.20);
}

.brand strong {
    display: block;

    color: var(--text);

    font-size: 15px;
    font-weight: 800;
    letter-spacing: -0.2px;
}

.brand span {
    display: block;

    margin-top: 2px;

    color: var(--text-muted);

    font-size: 11px;
}


/* =========================================================
   NAVIGATION
========================================================= */

.navigation {
    flex: 1;

    padding: 18px 12px;

    overflow-y: auto;
}

.nav-item {
    position: relative;

    display: flex;
    align-items: center;
    gap: 12px;

    width: 100%;

    margin-bottom: 5px;
    padding: 11px 13px;

    border-radius: 11px;

    color: var(--text-soft);

    font-size: 13px;
    font-weight: 600;

    transition:
        background var(--transition),
        color var(--transition),
        transform var(--transition);
}

.nav-item > span:first-child {
    width: 22px;

    display: inline-grid;
    place-items: center;

    flex-shrink: 0;

    color: var(--text-muted);

    font-size: 15px;

    transition: color var(--transition);
}

.nav-item:hover {
    background: var(--surface-hover);

    color: var(--text);
}

.nav-item:hover > span:first-child {
    color: var(--gold);
}

.nav-item.active {
    background:
        linear-gradient(
            135deg,
            var(--gold),
            var(--gold-dark)
        );

    color: #090909;

    box-shadow:
        0 7px 18px rgba(200, 155, 34, 0.18);
}

.nav-item.active > span:first-child {
    color: #090909;
}

.nav-divider {
    height: 1px;

    margin: 14px 8px;

    background: var(--border);
}


/* =========================================================
   SIDEBAR BOTTOM
========================================================= */

.sidebar-bottom {
    padding: 14px 12px 18px;

    border-top: 1px solid var(--border);
}

.premium-link,
.theme-button {
    width: 100%;

    display: flex;
    align-items: center;
    gap: 12px;

    padding: 11px 13px;

    border-radius: 11px;

    color: var(--text-soft);

    font-size: 13px;
    font-weight: 600;

    background: transparent;

    cursor: pointer;

    transition:
        background var(--transition),
        color var(--transition);
}

.premium-link:hover,
.theme-button:hover {
    background: var(--surface-hover);
    color: var(--text);
}

.premium-link span:first-child,
.theme-button span:first-child {
    width: 22px;

    display: inline-grid;
    place-items: center;

    color: var(--gold);
}


/* =========================================================
   MAIN CONTENT
========================================================= */

.main-content {
    width: calc(100% - var(--sidebar-width));

    min-height: 100vh;

    margin-left: var(--sidebar-width);

    background: var(--bg);

    transition: background-color var(--transition);
}


/* =========================================================
   TOPBAR
========================================================= */

.topbar {
    position: sticky;
    top: 0;

    min-height: 88px;

    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;

    padding: 20px 34px;

    background:
        color-mix(
            in srgb,
            var(--bg) 94%,
            transparent
        );

    backdrop-filter: blur(14px);

    border-bottom: 1px solid var(--border);

    z-index: 100;
}

.welcome {
    min-width: 0;
}

.welcome > span {
    display: block;

    margin-bottom: 2px;

    color: var(--gold-dark);

    font-size: 12px;
    font-weight: 700;
}

body.dark .welcome > span {
    color: var(--gold);
}

.welcome h1 {
    color: var(--text);

    font-size: 25px;
    font-weight: 800;
    letter-spacing: -0.7px;
}

.welcome h1 span {
    color: var(--gold);
}

.welcome p {
    margin-top: 3px;

    color: var(--text-muted);

    font-size: 13px;
}

.topbar-actions {
    display: flex;
    align-items: center;
}

.date-pill {
    padding: 9px 14px;

    border: 1px solid var(--gold-border);

    border-radius: 999px;

    background: var(--gold-soft);

    color: var(--gold-dark);

    font-size: 12px;
    font-weight: 700;
}

body.dark .date-pill {
    color: var(--gold);
}

.mobile-menu {
    display: none;

    width: 40px;
    height: 40px;

    place-items: center;

    border-radius: 10px;

    background: var(--surface);

    border: 1px solid var(--border);

    color: var(--text);

    cursor: pointer;
}


/* =========================================================
   GOALS HERO
========================================================= */

.goals-hero {
    position: relative;

    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 30px;

    margin: 28px 34px 0;

    padding: 38px;

    min-height: 230px;

    overflow: hidden;

    border-radius: var(--radius-lg);

    background:
        radial-gradient(
            circle at 85% 20%,
            rgba(245, 197, 66, 0.18),
            transparent 32%
        ),
        linear-gradient(
            135deg,
            #171717,
            #090909
        );

    border: 1px solid rgba(245, 197, 66, 0.18);

    box-shadow: var(--shadow-lg);
}

body:not(.dark) .goals-hero {
    background:
        radial-gradient(
            circle at 85% 20%,
            rgba(200, 155, 34, 0.13),
            transparent 32%
        ),
        linear-gradient(
            135deg,
            #fffdf7,
            #f2ede0
        );

    border-color: var(--gold-border);
}

.hero-copy {
    position: relative;
    z-index: 2;

    max-width: 650px;
}

.eyebrow {
    display: inline-block;

    margin-bottom: 10px;

    color: var(--gold);

    font-size: 11px;
    font-weight: 800;

    letter-spacing: 1.5px;
}

body:not(.dark) .eyebrow {
    color: var(--gold-dark);
}

.hero-copy h2 {
    color: #ffffff;

    font-size: clamp(30px, 4vw, 46px);
    line-height: 1.05;
    letter-spacing: -1.8px;
}

body:not(.dark) .hero-copy h2 {
    color: #171717;
}

.hero-copy h2 span {
    display: block;

    color: var(--gold);
}

.hero-copy p {
    max-width: 600px;

    margin-top: 15px;

    color: rgba(255, 255, 255, 0.68);

    font-size: 14px;
}

body:not(.dark) .hero-copy p {
    color: #666666;
}


/* =========================================================
   HERO SCORE
========================================================= */

.hero-score {
    position: relative;
    z-index: 2;

    flex-shrink: 0;
}

.score-ring {
    width: 150px;
    height: 150px;

    display: grid;
    place-items: center;

    border-radius: 50%;

    background:
        conic-gradient(
            var(--gold) 0deg,
            var(--gold) 0deg,
            rgba(255, 255, 255, 0.13) 0deg
        );

    box-shadow:
        0 0 0 8px rgba(245, 197, 66, 0.06),
        0 15px 40px rgba(0, 0, 0, 0.22);
}

body:not(.dark) .score-ring {
    background:
        conic-gradient(
            var(--gold) 0deg,
            var(--gold) 0deg,
            rgba(0, 0, 0, 0.10) 0deg
        );

    box-shadow:
        0 0 0 8px rgba(200, 155, 34, 0.07),
        0 15px 40px rgba(0, 0, 0, 0.10);
}

.score-ring::before {
    content: "";

    position: absolute;

    width: 116px;
    height: 116px;

    border-radius: 50%;

    background: #111111;
}

body:not(.dark) .score-ring::before {
    background: #fffdf7;
}

.score-ring > div {
    position: relative;
    z-index: 2;

    text-align: center;
}

.score-ring strong {
    display: block;

    color: var(--gold);

    font-size: 28px;
    font-weight: 900;
}

.score-ring span {
    display: block;

    margin-top: 1px;

    color: var(--text-muted);

    font-size: 11px;
}


/* =========================================================
   SECTIONS
========================================================= */

.section {
    margin: 38px 34px 0;
}

.section-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;

    margin-bottom: 17px;
}

.section-label,
.mini-label {
    display: block;

    margin-bottom: 4px;

    color: var(--gold-dark);

    font-size: 10px;
    font-weight: 800;

    letter-spacing: 1.4px;
}

body.dark .section-label,
body.dark .mini-label {
    color: var(--gold);
}

.section-heading h2 {
    color: var(--text);

    font-size: 21px;
    font-weight: 800;
    letter-spacing: -0.5px;
}

.goal-status,
.week-range {
    color: var(--text-muted);

    font-size: 12px;
    font-weight: 600;
}


/* =========================================================
   TODAY GOAL GRID
========================================================= */

.goal-grid {
    display: grid;

    grid-template-columns:
        repeat(3, minmax(0, 1fr));

    gap: 17px;
}

.goal-card {
    min-width: 0;

    padding: 21px;

    border-radius: var(--radius-md);

    background: var(--surface);

    border: 1px solid var(--border);

    box-shadow: var(--shadow-sm);

    transition:
        background var(--transition),
        border-color var(--transition),
        transform var(--transition),
        box-shadow var(--transition);
}

.goal-card:hover {
    transform: translateY(-2px);

    border-color: var(--gold-border);

    box-shadow: var(--shadow-md);
}

.goal-card-top {
    display: flex;
    align-items: center;
    gap: 11px;
}

.goal-icon {
    width: 42px;
    height: 42px;

    display: grid;
    place-items: center;

    flex-shrink: 0;

    border-radius: 12px;

    font-size: 18px;
    font-weight: 800;
}

.goal-icon.time {
    background: var(--gold-soft);
    color: var(--gold-dark);
}

.goal-icon.topics {
    background: var(--green-soft);
    color: var(--green);
}

.goal-icon.streak {
    background: var(--orange-soft);
    color: var(--orange);
}

.goal-heading {
    min-width: 0;

    flex: 1;
}

.goal-heading h3 {
    color: var(--text);

    font-size: 14px;
    font-weight: 800;
}

.goal-heading span {
    display: block;

    margin-top: 1px;

    color: var(--text-muted);

    font-size: 11px;
}

.goal-percent {
    color: var(--gold-dark);

    font-size: 13px;
    font-weight: 900;
}

body.dark .goal-percent {
    color: var(--gold);
}

.goal-numbers {
    display: flex;
    align-items: baseline;
    gap: 6px;

    margin-top: 24px;
}

.goal-numbers strong {
    color: var(--text);

    font-size: 27px;
    font-weight: 850;
}

.goal-numbers span {
    color: var(--text-muted);

    font-size: 12px;
}

.goal-numbers b {
    color: var(--text-soft);
}

.progress-track {
    width: 100%;
    height: 7px;

    margin-top: 15px;

    overflow: hidden;

    border-radius: 999px;

    background: var(--surface-hover);
}

.progress-bar {
    width: 0;
    height: 100%;

    border-radius: inherit;

    background:
        linear-gradient(
            90deg,
            var(--gold-dark),
            var(--gold-light)
        );

    transition: width 500ms ease;
}

#topicProgress {
    background:
        linear-gradient(
            90deg,
            #168a43,
            var(--green)
        );
}

#streakProgress {
    background:
        linear-gradient(
            90deg,
            #d97706,
            var(--orange)
        );
}

.goal-card p {
    min-height: 36px;

    margin-top: 13px;

    color: var(--text-muted);

    font-size: 11px;
    line-height: 1.55;
}


/* =========================================================
   WEEKLY GRID
========================================================= */

.weekly-grid {
    display: grid;

    grid-template-columns:
        minmax(0, 1.6fr)
        repeat(2, minmax(0, 1fr));

    gap: 17px;
}

.weekly-card {
    min-width: 0;

    padding: 22px;

    border-radius: var(--radius-md);

    background: var(--surface);

    border: 1px solid var(--border);

    box-shadow: var(--shadow-sm);

    transition:
        background var(--transition),
        border-color var(--transition);
}

.weekly-card:hover {
    border-color: var(--gold-border);
}

.weekly-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 15px;
}

.weekly-card h3 {
    color: var(--text);

    font-size: 30px;
    line-height: 1;
}

.weekly-card h3 small {
    color: var(--text-muted);

    font-size: 12px;
    font-weight: 600;
}

.weekly-target {
    text-align: right;
}

.weekly-target span {
    display: block;

    color: var(--text-muted);

    font-size: 10px;
}

.weekly-target strong {
    color: var(--gold-dark);

    font-size: 13px;
}

body.dark .weekly-target strong {
    color: var(--gold);
}

.weekly-progress {
    width: 100%;
    height: 8px;

    margin-top: 20px;

    overflow: hidden;

    border-radius: 999px;

    background: var(--surface-hover);
}

#weeklyHoursProgress {
    width: 0;
    height: 100%;

    border-radius: inherit;

    background:
        linear-gradient(
            90deg,
            var(--gold-dark),
            var(--gold-light)
        );

    transition: width 500ms ease;
}

.weekly-card p {
    margin-top: 13px;

    color: var(--text-muted);

    font-size: 11px;
    line-height: 1.5;
}

.big-stat {
    display: flex;
    align-items: baseline;
    gap: 6px;

    margin-top: 17px;
}

.big-stat strong {
    color: var(--text);

    font-size: 32px;
    font-weight: 850;
}

.big-stat span {
    color: var(--text-muted);

    font-size: 12px;
}

.big-stat b {
    color: var(--text-soft);
}

.mini-progress {
    width: 100%;
    height: 7px;

    margin-top: 18px;

    overflow: hidden;

    border-radius: 999px;

    background: var(--surface-hover);
}

#weeklyDaysProgress,
#weeklyTopicsProgress {
    width: 0;
    height: 100%;

    border-radius: inherit;

    background:
        linear-gradient(
            90deg,
            var(--gold-dark),
            var(--gold-light)
        );

    transition: width 500ms ease;
}


/* =========================================================
   PLAN CARD
========================================================= */

.plan-card {
    display: grid;

    grid-template-columns:
        minmax(0, 1.4fr)
        auto
        minmax(180px, 0.8fr);

    align-items: center;

    gap: 25px;

    padding: 23px;

    border-radius: var(--radius-md);

    background: var(--surface);

    border: 1px solid var(--border);

    box-shadow: var(--shadow-sm);
}

.plan-info {
    display: flex;
    align-items: center;
    gap: 15px;

    min-width: 0;
}

.plan-icon {
    width: 48px;
    height: 48px;

    display: grid;
    place-items: center;

    flex-shrink: 0;

    border-radius: 13px;

    background: var(--gold-soft);

    color: var(--gold-dark);

    font-size: 21px;
}

body.dark .plan-icon {
    color: var(--gold);
}

.plan-info h3 {
    margin-top: 2px;

    color: var(--text);

    font-size: 16px;
    font-weight: 800;
}

.plan-info p {
    margin-top: 3px;

    color: var(--text-muted);

    font-size: 11px;
}

.plan-stat {
    text-align: center;
}

.plan-stat strong {
    display: block;

    color: var(--text);

    font-size: 28px;
    font-weight: 850;
}

.plan-stat span {
    color: var(--text-muted);

    font-size: 11px;
}

.plan-stat b {
    color: var(--text-soft);
}

.plan-progress-container {
    display: flex;
    align-items: center;
    gap: 10px;
}

.plan-progress {
    flex: 1;

    height: 8px;

    overflow: hidden;

    border-radius: 999px;

    background: var(--surface-hover);
}

#planProgress {
    width: 0;
    height: 100%;

    border-radius: inherit;

    background:
        linear-gradient(
            90deg,
            var(--gold-dark),
            var(--gold-light)
        );

    transition: width 500ms ease;
}

#planPercent {
    min-width: 36px;

    color: var(--gold-dark);

    font-size: 11px;
    font-weight: 900;

    text-align: right;
}

body.dark #planPercent {
    color: var(--gold);
}


/* =========================================================
   SUBJECT GRID
========================================================= */

.subject-grid {
    display: grid;

    grid-template-columns:
        repeat(
            auto-fit,
            minmax(220px, 1fr)
        );

    gap: 15px;
}

.subject-card {
    padding: 18px;

    border-radius: var(--radius-md);

    background: var(--surface);

    border: 1px solid var(--border);

    box-shadow: var(--shadow-sm);

    transition:
        transform var(--transition),
        border-color var(--transition);
}

.subject-card:hover {
    transform: translateY(-2px);

    border-color: var(--gold-border);
}

.subject-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
}

.subject-name {
    color: var(--text);

    font-size: 14px;
    font-weight: 800;
}

.subject-percent {
    color: var(--gold-dark);

    font-size: 12px;
    font-weight: 900;
}

body.dark .subject-percent {
    color: var(--gold);
}

.subject-count {
    margin-top: 7px;

    color: var(--text-muted);

    font-size: 11px;
}

.subject-progress {
    width: 100%;
    height: 6px;

    margin-top: 13px;

    overflow: hidden;

    border-radius: 999px;

    background: var(--surface-hover);
}

.subject-progress > div {
    height: 100%;

    border-radius: inherit;

    background:
        linear-gradient(
            90deg,
            var(--gold-dark),
            var(--gold-light)
        );

    transition: width 500ms ease;
}


/* =========================================================
   ACHIEVEMENTS
========================================================= */

.achievement-grid {
    display: grid;

    grid-template-columns:
        repeat(4, minmax(0, 1fr));

    gap: 15px;
}

.achievement {
    position: relative;

    display: flex;
    align-items: center;
    gap: 12px;

    min-width: 0;

    padding: 17px;

    border-radius: var(--radius-md);

    background: var(--surface);

    border: 1px solid var(--border);

    opacity: 0.58;

    transition:
        opacity var(--transition),
        border-color var(--transition),
        background var(--transition);
}

.achievement.unlocked {
    opacity: 1;

    border-color: var(--gold-border);

    background:
        linear-gradient(
            135deg,
            var(--surface),
            var(--gold-soft)
        );
}

.achievement-icon {
    width: 39px;
    height: 39px;

    display: grid;
    place-items: center;

    flex-shrink: 0;

    border-radius: 11px;

    background: var(--surface-hover);

    font-size: 17px;
}

.achievement.unlocked .achievement-icon {
    background: var(--gold-soft);
}

.achievement strong {
    display: block;

    color: var(--text);

    font-size: 12px;
    font-weight: 800;
}

.achievement p {
    margin-top: 2px;

    color: var(--text-muted);

    font-size: 10px;
    line-height: 1.4;
}

.achievement-check {
    margin-left: auto;

    color: transparent;

    font-size: 15px;
    font-weight: 900;
}

.achievement.unlocked .achievement-check {
    color: var(--gold);
}


/* =========================================================
   EMPTY PLAN
========================================================= */

.empty-plan {
    margin: 38px 34px;

    padding: 55px 25px;

    text-align: center;

    border-radius: var(--radius-lg);

    background: var(--surface);

    border: 1px dashed var(--gold-border);
}

.empty-icon {
    width: 58px;
    height: 58px;

    display: grid;
    place-items: center;

    margin: 0 auto 16px;

    border-radius: 17px;

    background: var(--gold-soft);

    font-size: 25px;
}

.empty-plan h2 {
    color: var(--text);

    font-size: 22px;
}

.empty-plan p {
    max-width: 480px;

    margin: 8px auto 20px;

    color: var(--text-muted);

    font-size: 13px;
}

.primary-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;

    padding: 11px 18px;

    border-radius: 10px;

    background:
        linear-gradient(
            135deg,
            var(--gold-light),
            var(--gold-dark)
        );

    color: #080808;

    font-size: 12px;
    font-weight: 800;

    box-shadow:
        0 7px 18px rgba(200, 155, 34, 0.18);

    transition:
        transform var(--transition),
        box-shadow var(--transition);
}

.primary-button:hover {
    transform: translateY(-1px);

    box-shadow:
        0 10px 24px rgba(200, 155, 34, 0.25);
}


/* =========================================================
   FOOTER
========================================================= */

.footer {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;

    margin: 45px 34px 25px;

    color: var(--text-muted);

    font-size: 10px;
}

.footer span:first-child {
    color: var(--gold-dark);

    font-weight: 800;
}

body.dark .footer span:first-child {
    color: var(--gold);
}


/* =========================================================
   TOAST
========================================================= */

.toast {
    position: fixed;

    left: 50%;
    bottom: 25px;

    transform:
        translate(-50%, 20px);

    z-index: 9999;

    padding: 11px 17px;

    border-radius: 10px;

    background: #111111;

    color: #ffffff;

    font-size: 12px;
    font-weight: 700;

    opacity: 0;
    pointer-events: none;

    box-shadow: var(--shadow-lg);

    transition:
        opacity 200ms ease,
        transform 200ms ease;
}

body:not(.dark) .toast {
    background: #ffffff;

    color: #171717;

    border: 1px solid var(--border);
}

.toast.show {
    opacity: 1;

    transform:
        translate(-50%, 0);
}


/* =========================================================
   MOBILE
========================================================= */

@media (max-width: 1100px) {

    .goal-grid {
        grid-template-columns:
            repeat(2, minmax(0, 1fr));
    }

    .weekly-grid {
        grid-template-columns:
            repeat(2, minmax(0, 1fr));
    }

    .weekly-card.large {
        grid-column: 1 / -1;
    }

    .achievement-grid {
        grid-template-columns:
            repeat(2, minmax(0, 1fr));
    }

    .plan-card {
        grid-template-columns:
            1fr 1fr;
    }

    .plan-progress-container {
        grid-column: 1 / -1;
    }
}


@media (max-width: 820px) {

    :root {
        --sidebar-width: 250px;
    }

    .sidebar {
        transform:
            translateX(-100%);

        box-shadow:
            15px 0 40px rgba(0, 0, 0, 0.18);
    }

    .sidebar.open {
        transform:
            translateX(0);
    }

    .main-content {
        width: 100%;

        margin-left: 0;
    }

    .mobile-menu {
        display: grid;
    }

    .topbar {
        padding: 16px 20px;
    }

    .welcome {
        flex: 1;
    }

    .welcome h1 {
        font-size: 21px;
    }

    .welcome p {
        display: none;
    }

    .goals-hero,
    .section,
    .empty-plan {
        margin-left: 20px;
        margin-right: 20px;
    }

    .goals-hero {
        padding: 28px;

        min-height: 210px;
    }

    .hero-copy h2 {
        font-size: 32px;
    }

    .score-ring {
        width: 125px;
        height: 125px;
    }

    .score-ring::before {
        width: 96px;
        height: 96px;
    }
}


@media (max-width: 620px) {

    .topbar {
        min-height: 75px;

        gap: 10px;
    }

    .topbar-actions {
        display: none;
    }

    .welcome h1 {
        font-size: 19px;
    }

    .goals-hero {
        flex-direction: column;
        align-items: flex-start;

        padding: 25px;
    }

    .hero-score {
        align-self: center;
    }

    .goal-grid,
    .weekly-grid,
    .achievement-grid {
        grid-template-columns: 1fr;
    }

    .weekly-card.large {
        grid-column: auto;
    }

    .plan-card {
        grid-template-columns: 1fr;
    }

    .plan-stat {
        text-align: left;
    }

    .plan-progress-container {
        grid-column: auto;
    }

    .subject-grid {
        grid-template-columns: 1fr;
    }

    .section {
        margin-top: 30px;
    }

    .section-heading {
        align-items: flex-start;
        flex-direction: column;
        gap: 6px;
    }

    .footer {
        margin-left: 20px;
        margin-right: 20px;
    }
}


/* =========================================================
   SMALL MOBILE
========================================================= */

@media (max-width: 400px) {

    .topbar {
        padding-left: 14px;
        padding-right: 14px;
    }

    .goals-hero,
    .section,
    .empty-plan {
        margin-left: 14px;
        margin-right: 14px;
    }

    .goals-hero {
        padding: 22px;
    }

    .hero-copy h2 {
        font-size: 28px;
    }

    .goal-card,
    .weekly-card,
    .subject-card,
    .achievement {
        padding: 15px;
    }
}


/* =========================================================
   ACCESSIBILITY
========================================================= */

@media (prefers-reduced-motion: reduce) {

    *,
    *::before,
    *::after {
        scroll-behavior: auto !important;

        transition-duration: 0.01ms !important;
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
    }
}


/* =========================================================
   SCROLLBAR
========================================================= */

::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

::-webkit-scrollbar-track {
    background: var(--bg);
}

::-webkit-scrollbar-thumb {
    background: var(--border-strong);

    border-radius: 999px;
}

::-webkit-scrollbar-thumb:hover {
    background: var(--gold);
}
