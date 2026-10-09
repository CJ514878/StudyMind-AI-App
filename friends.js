/* =========================================================
   STUDYMIND AI — FRIENDS
   SUPABASE FRIEND REQUESTS + FRIEND LIST
========================================================= */

"use strict";

(() => {
    const $ = (selector) => document.querySelector(selector);

    const state = {
        supabase: null,
        user: null,
        profile: null,
        friends: [],
        incoming: [],
        outgoing: [],
        searchResults: [],
        loading: false
    };

    const el = {
        sidebar: $("#sidebar"),
        overlay: $("#mobileOverlay"),
        menu: $("#menuButton"),
        theme: $("#themeToggle"),
        logout: $("#logoutButton"),
        searchForm: $("#friendSearchForm"),
        searchInput: $("#friendSearchInput"),
        searchButton: $("#searchButton"),
        searchResults: $("#searchResults"),
        searchMessage: $("#searchMessage"),
        incoming: $("#incomingRequests"),
        friends: $("#friendsList"),
        friendsFilter: $("#friendFilterInput"),
        friendsMessage: $("#friendsMessage"),
        refresh: $("#refreshButton"),
        findButton: $("#findFriendsButton"),
        friendsStat: $("#friendsStat"),
        requestsStat: $("#requestsStat"),
        requestCount: $("#requestCount"),
        sidebarRequestCount: $("#sidebarRequestCount"),
        username: $("#sidebarUsername"),
        email: $("#sidebarUserEmail"),
        sidebarAvatar: $("#sidebarAvatar"),
        topAvatar: $("#topAvatar"),
        premiumLabel: $("#premiumLabel"),
        toastContainer: $("#toastContainer")
    };

    const TABLES = {
        profiles: "profiles",
        requests: "friend_requests"
    };

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, (char) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);
    }

    function usernameOf(profile) {
        return profile?.username ||
            profile?.display_name ||
            profile?.full_name ||
            "Student";
    }

    function displayNameOf(profile) {
        return profile?.display_name ||
            profile?.full_name ||
            profile?.username ||
            "Student";
    }

    function avatarMarkup(profile, extraClass = "") {
        const name = displayNameOf(profile);
        const avatarURL = profile?.avatar_url;

        if (avatarURL) {
            return `
                <div class="person-avatar ${extraClass}">
                    <img src="${escapeHTML(avatarURL)}"
                         alt="${escapeHTML(name)}"
                         loading="lazy"
                         referrerpolicy="no-referrer"
                         onerror="this.remove()">
                </div>`;
        }

        const initial = name.trim().charAt(0).toUpperCase() || "S";

        return `
            <div class="person-avatar ${extraClass}"
                 aria-label="${escapeHTML(name)}">
                ${escapeHTML(initial)}
            </div>`;
    }

    function setMessage(element, message, type = "") {
        if (!element) return;

        element.textContent = message;
        element.className = "inline-message" + (type ? ` ${type}` : "");
        element.hidden = !message;
    }

    function showToast(message, type = "") {
        if (!el.toastContainer) return;

        const toast = document.createElement("div");
        toast.className = `toast ${type}`.trim();
        toast.textContent = message;
        el.toastContainer.appendChild(toast);

        window.setTimeout(() => toast.remove(), 3800);
    }

    function showEmpty(container, title, description, icon = "users") {
        if (!container) return;

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i data-lucide="${escapeHTML(icon)}"></i>
                </div>
                <strong>${escapeHTML(title)}</strong>
                <p>${escapeHTML(description)}</p>
            </div>`;

        refreshIcons();
    }

    function showLoading(container, message = "Loading…") {
        if (!container) return;
        container.innerHTML = `
            <div class="loading-state">${escapeHTML(message)}</div>`;
    }

    function refreshIcons() {
        if (window.lucide?.createIcons) {
            window.lucide.createIcons();
        }
    }

    function getSupabaseClient() {
        return window.supabaseClient ||
               window.studyMindSupabase ||
               null;
    }

    function getStoredTheme() {
        try {
            return localStorage.getItem("studyMindTheme") || "";
        } catch {
            return "";
        }
    }

    function applyTheme(theme) {
        const dark = theme === "dark";

        document.documentElement.dataset.theme = dark ? "dark" : "light";
        document.body.classList.toggle("dark", dark);
        document.body.classList.toggle("dark-mode", dark);

        if (el.theme) {
            el.theme.innerHTML = dark
                ? '<i data-lucide="sun"></i>'
                : '<i data-lucide="moon"></i>';

            el.theme.setAttribute(
                "aria-label",
                dark ? "Switch to light theme" : "Switch to dark theme"
            );
        }

        refreshIcons();
    }

    function initTheme() {
        const stored = getStoredTheme();
        const dark = stored
            ? stored === "dark"
            : document.documentElement.dataset.theme === "dark" ||
              document.body.classList.contains("dark");

        applyTheme(dark ? "dark" : "light");
    }

    function toggleTheme() {
        const next =
            document.documentElement.dataset.theme === "dark"
                ? "light"
                : "dark";

        applyTheme(next);

        try {
            localStorage.setItem("studyMindTheme", next);
        } catch {
            // Theme still changes for the current page session.
        }
    }

    function closeMobileMenu() {
        el.sidebar?.classList.remove("open");
        el.overlay?.classList.remove("visible");
    }

    function toggleMobileMenu() {
        const isOpen = el.sidebar?.classList.toggle("open");
        el.overlay?.classList.toggle("visible", Boolean(isOpen));
    }

    function updateUserHeader() {
        const profile = state.profile || {};
        const metadata = state.user?.user_metadata || {};

        const name =
            profile.display_name ||
            profile.username ||
            metadata.username ||
            metadata.full_name ||
            state.user?.email?.split("@")[0] ||
            "Student";

        const email = state.user?.email || "StudyMind member";
        const initial = String(name).trim().charAt(0).toUpperCase() || "S";

        if (el.username) el.username.textContent = name;
        if (el.email) el.email.textContent = email;

        [el.sidebarAvatar, el.topAvatar].forEach((avatar) => {
            if (!avatar) return;

            if (profile.avatar_url) {
                avatar.innerHTML = "";
                const image = document.createElement("img");
                image.src = profile.avatar_url;
                image.alt = name;
                image.referrerPolicy = "no-referrer";
                image.onerror = () => {
                    avatar.textContent = initial;
                };
                avatar.appendChild(image);
            } else {
                avatar.textContent = initial;
            }
        });

        const isPremium =
            localStorage.getItem("studyMindPremium") === "true" ||
            document.body.classList.contains("premium-active") ||
            document.body.classList.contains("premium-user");

        if (el.premiumLabel) el.premiumLabel.hidden = !isPremium;
    }

    async function loadOwnProfile() {
        const { data, error } = await state.supabase
            .from(TABLES.profiles)
            .select("id, username, display_name, full_name, avatar_url")
            .eq("id", state.user.id)
            .maybeSingle();

        if (error) throw error;

        state.profile = data || {
            id: state.user.id,
            username: state.user.user_metadata?.username ||
                      state.user.email?.split("@")[0] ||
                      "Student",
            display_name: state.user.user_metadata?.full_name || ""
        };

        updateUserHeader();
    }

    function isMissingTableError(error) {
        const text = `${error?.message || ""} ${error?.details || ""}`;
        return error?.code === "42P01" ||
               error?.code === "PGRST205" ||
               /relation .* does not exist|could not find the table/i.test(text);
    }

    function isPermissionError(error) {
        return error?.code === "42501" ||
               /permission denied|row-level security|violates row-level security/i
                   .test(error?.message || "");
    }

    function explainError(error) {
        if (isMissingTableError(error)) {
            return "The Friends database tables are missing. Run the SQL setup supplied with this page in your Supabase SQL Editor.";
        }

        if (isPermissionError(error)) {
            return "Supabase blocked this action. Check the table's row-level security policies and confirm that you are signed in.";
        }

        if (error?.code === "PGRST116") {
            return "The requested profile could not be found.";
        }

        return error?.message || "Something went wrong. Please try again.";
    }

    function requireSignedIn() {
        if (state.user) return true;

        showToast("Please sign in to use Friends.", "error");
        window.location.href = "login.html";
        return false;
    }

    async function runSearch(query) {
        if (!requireSignedIn()) return;

        query = query.trim().replace(/^@/, "");

        if (query.length < 2) {
            setMessage(el.searchMessage, "Enter at least 2 characters to search.", "error");
            return;
        }

        if (!/^[a-zA-Z0-9_.-]{2,40}$/.test(query)) {
            setMessage(
                el.searchMessage,
                "Use 2–40 letters, numbers, dots, underscores, or hyphens.",
                "error"
            );
            return;
        }

        el.searchButton.disabled = true;
        el.searchButton.textContent = "Searching…";
        setMessage(el.searchMessage, "");
        showLoading(el.searchResults, "Searching StudyMind users…");

        try {
            const { data, error } = await state.supabase
                .from(TABLES.profiles)
                .select("id, username, display_name, full_name, avatar_url")
                .ilike("username", `%${query}%`)
                .neq("id", state.user.id)
                .order("username", { ascending: true })
                .limit(20);

            if (error) throw error;

            state.searchResults = data || [];

            if (!state.searchResults.length) {
                showEmpty(
                    el.searchResults,
                    "No matching users found",
                    "Check the username or try another search.",
                    "search-x"
                );
                return;
            }

            await loadRelationshipIds();
            renderSearchResults();
        } catch (error) {
            console.error("[StudyMind Friends] Search failed:", error);
            showEmpty(el.searchResults, "Search unavailable", explainError(error), "alert-circle");
            setMessage(el.searchMessage, explainError(error), "error");
        } finally {
            el.searchButton.disabled = false;
            el.searchButton.textContent = "Search";
            refreshIcons();
        }
    }

    async function loadRelationshipIds() {
        const { data, error } = await state.supabase
            .from(TABLES.requests)
            .select("sender_id, receiver_id, status")
            .or(`sender_id.eq.${state.user.id},receiver_id.eq.${state.user.id}`);

        if (error) throw error;

        const records = data || [];
        const friends = new Set();
        const pending = new Set();

        records.forEach((request) => {
            const otherId = request.sender_id === state.user.id
                ? request.receiver_id
                : request.sender_id;

            if (request.status === "accepted") friends.add(otherId);
            if (request.status === "pending") pending.add(otherId);
        });

        state.relationshipIds = { friends, pending };
    }

    function relationshipStatus(userId) {
        const ids = state.relationshipIds || {
            friends: new Set(),
            pending: new Set()
        };

        if (ids.friends.has(userId)) return "friends";
        if (ids.pending.has(userId)) return "pending";
        return "none";
    }

    function renderSearchResults() {
        if (!state.searchResults.length) {
            showEmpty(
                el.searchResults,
                "No matching users found",
                "Try another username.",
                "search-x"
            );
            return;
        }

        el.searchResults.innerHTML = state.searchResults.map((profile) => {
            const relationship = relationshipStatus(profile.id);
            let action = "";

            if (relationship === "friends") {
                action = `<span class="status-chip accepted">Already friends</span>`;
            } else if (relationship === "pending") {
                action = `<span class="status-chip pending">Request pending</span>`;
            } else {
                action = `
                    <button class="action-button primary"
                            type="button"
                            data-action="send"
                            data-user-id="${escapeHTML(profile.id)}">
                        <i data-lucide="user-plus"></i> Add friend
                    </button>`;
            }

            return `
                <article class="person-card">
                    ${avatarMarkup(profile)}
                    <div class="person-details">
                        <div class="person-name-row">
                            <span class="person-name">${escapeHTML(displayNameOf(profile))}</span>
                        </div>
                        <div class="person-username">@${escapeHTML(usernameOf(profile))}</div>
                    </div>
                    <div class="person-actions">${action}</div>
                </article>`;
        }).join("");

        refreshIcons();
    }

    async function sendRequest(receiverId) {
        if (!requireSignedIn()) return;
        if (!receiverId || receiverId === state.user.id) return;

        const button = el.searchResults.querySelector(
            `[data-action="send"][data-user-id="${CSS.escape(receiverId)}"]`
        );

        if (button) {
            button.disabled = true;
            button.textContent = "Sending…";
        }

        try {
            const { data: existing, error: lookupError } = await state.supabase
                .from(TABLES.requests)
                .select("id, sender_id, receiver_id, status")
                .or(
                    `and(sender_id.eq.${state.user.id},receiver_id.eq.${receiverId}),` +
                    `and(sender_id.eq.${receiverId},receiver_id.eq.${state.user.id})`
                )
                .limit(1);

            if (lookupError) throw lookupError;

            if (existing?.some((item) => item.status === "accepted")) {
                showToast("You are already friends.", "success");
                await refreshAll();
                return;
            }

            if (existing?.some((item) => item.status === "pending")) {
                showToast("A friend request is already pending.", "error");
                await refreshAll();
                return;
            }

            if (existing?.length) {
                const { error: deleteError } = await state.supabase
                    .from(TABLES.requests)
                    .delete()
                    .eq("id", existing[0].id)
                    .eq("sender_id", state.user.id);

                if (deleteError) {
                    throw new Error(
                        "An earlier request exists. It may need to be handled by the other user before a new request can be sent."
                    );
                }
            }

            const { error } = await state.supabase
                .from(TABLES.requests)
                .insert({
                    sender_id: state.user.id,
                    receiver_id: receiverId,
                    status: "pending"
                });

            if (error) throw error;

            showToast("Friend request sent!", "success");
            await refreshAll();
            await runSearch(el.searchInput.value);
        } catch (error) {
            console.error("[StudyMind Friends] Send request failed:", error);
            showToast(explainError(error), "error");
            if (button) {
                button.disabled = false;
                button.innerHTML = '<i data-lucide="user-plus"></i> Add friend';
            }
        } finally {
            refreshIcons();
        }
    }

    async function loadIncomingRequests() {
        const { data: requests, error } = await state.supabase
            .from(TABLES.requests)
            .select("id, sender_id, receiver_id, status, created_at")
            .eq("receiver_id", state.user.id)
            .eq("status", "pending")
            .order("created_at", { ascending: false });

        if (error) throw error;

        const records = requests || [];
        const senderIds = records.map((request) => request.sender_id);

        let profiles = [];

        if (senderIds.length) {
            const { data, error: profilesError } = await state.supabase
                .from(TABLES.profiles)
                .select("id, username, display_name, full_name, avatar_url")
                .in("id", senderIds);

            if (profilesError) throw profilesError;
            profiles = data || [];
        }

        state.incoming = records.map((request) => ({
            ...request,
            profile: profiles.find((profile) => profile.id === request.sender_id) || {
                id: request.sender_id,
                username: "StudyMind user",
                display_name: "StudyMind user"
            }
        }));

        renderIncomingRequests();
    }

    function renderIncomingRequests() {
        const count = state.incoming.length;

        if (el.requestsStat) el.requestsStat.textContent = String(count);
        if (el.requestCount) {
            el.requestCount.textContent = `${count} request${count === 1 ? "" : "s"}`;
        }

        if (el.sidebarRequestCount) {
            el.sidebarRequestCount.hidden = count === 0;
            el.sidebarRequestCount.textContent = count > 99 ? "99+" : String(count);
        }

        if (!count) {
            showEmpty(
                el.incoming,
                "You're all caught up",
                "New friend requests will appear here.",
                "user-check"
            );
            return;
        }

        el.incoming.innerHTML = state.incoming.map((request) => `
            <article class="person-card">
                ${avatarMarkup(request.profile)}
                <div class="person-details">
                    <div class="person-name">${escapeHTML(displayNameOf(request.profile))}</div>
                    <div class="person-username">
                        @${escapeHTML(usernameOf(request.profile))} wants to connect
                    </div>
                </div>
                <div class="person-actions">
                    <button class="action-button primary"
                            type="button"
                            data-action="accept"
                            data-request-id="${escapeHTML(request.id)}">
                        <i data-lucide="check"></i> Accept
                    </button>
                    <button class="action-button danger"
                            type="button"
                            data-action="decline"
                            data-request-id="${escapeHTML(request.id)}">
                        <i data-lucide="x"></i> Decline
                    </button>
                </div>
            </article>
        `).join("");

        refreshIcons();
    }

    async function handleRequest(requestId, action) {
        if (!requireSignedIn()) return;

        const request = state.incoming.find((item) => item.id === requestId);
        if (!request) return;

        const button = el.incoming.querySelector(
            `[data-request-id="${CSS.escape(requestId)}"][data-action="${action}"]`
        );

        if (button) {
            button.disabled = true;
            button.textContent = "Please wait…";
        }

        try {
            if (action === "accept") {
                const { error } = await state.supabase
                    .from(TABLES.requests)
                    .update({ status: "accepted" })
                    .eq("id", requestId)
                    .eq("receiver_id", state.user.id)
                    .eq("status", "pending");

                if (error) throw error;
                showToast("Friend request accepted!", "success");
            } else {
                const { error } = await state.supabase
                    .from(TABLES.requests)
                    .delete()
                    .eq("id", requestId)
                    .eq("receiver_id", state.user.id)
                    .eq("status", "pending");

                if (error) throw error;
                showToast("Friend request declined.", "success");
            }

            await refreshAll();
        } catch (error) {
            console.error("[StudyMind Friends] Request action failed:", error);
            showToast(explainError(error), "error");
            if (button) button.disabled = false;
        } finally {
            refreshIcons();
        }
    }

    async function loadFriends() {
        const { data: requests, error } = await state.supabase
            .from(TABLES.requests)
            .select("id, sender_id, receiver_id, status, created_at")
            .eq("status", "accepted")
            .or(`sender_id.eq.${state.user.id},receiver_id.eq.${state.user.id}`)
            .order("created_at", { ascending: false });

        if (error) throw error;

        const records = requests || [];
        const friendIds = [...new Set(records.map((request) =>
            request.sender_id === state.user.id
                ? request.receiver_id
                : request.sender_id
        ))];

        let profiles = [];

        if (friendIds.length) {
            const { data, error: profilesError } = await state.supabase
                .from(TABLES.profiles)
                .select("id, username, display_name, full_name, avatar_url")
                .in("id", friendIds);

            if (profilesError) throw profilesError;
            profiles = data || [];
        }

        state.friends = friendIds.map((id) => {
            const profile = profiles.find((item) => item.id === id);
            return profile || {
                id,
                username: "StudyMind user",
                display_name: "StudyMind user"
            };
        });

        if (el.friendsStat) el.friendsStat.textContent = String(state.friends.length);
        renderFriends();
    }

    function renderFriends() {
        const query = (el.friendsFilter?.value || "").trim().toLowerCase();

        const filtered = state.friends.filter((profile) => {
            return usernameOf(profile).toLowerCase().includes(query) ||
                   displayNameOf(profile).toLowerCase().includes(query);
        });

        if (!filtered.length) {
            showEmpty(
                el.friends,
                query ? "No friends match that filter" : "Your circle starts here",
                query
                    ? "Try a different name or username."
                    : "Find a friend above and start building your study community.",
                query ? "search-x" : "users"
            );
            return;
        }

        el.friends.innerHTML = filtered.map((profile) => `
            <article class="person-card">
                ${avatarMarkup(profile)}
                <div class="person-details">
                    <div class="person-name-row">
                        <span class="person-name">${escapeHTML(displayNameOf(profile))}</span>
                        <span class="status-chip accepted">Friend</span>
                    </div>
                    <div class="person-username">@${escapeHTML(usernameOf(profile))}</div>
                    <div class="person-meta">
                        <span><i data-lucide="book-open"></i> StudyMind learner</span>
                    </div>
                </div>
            </article>
        `).join("");

        refreshIcons();
    }

    async function refreshAll() {
        if (!state.supabase || !state.user || state.loading) return;

        state.loading = true;
        showLoading(el.incoming, "Loading friend requests…");
        showLoading(el.friends, "Loading your friends…");

        try {
            await Promise.all([
                loadIncomingRequests(),
                loadFriends()
            ]);

            await loadRelationshipIds();
        } catch (error) {
            console.error("[StudyMind Friends] Refresh failed:", error);

            const message = explainError(error);
            showEmpty(el.incoming, "Requests unavailable", message, "alert-circle");
            showEmpty(el.friends, "Friends unavailable", message, "alert-circle");
            setMessage(el.friendsMessage, message, "error");
        } finally {
            state.loading = false;
            refreshIcons();
        }
    }

    async function logout() {
        if (!state.supabase) {
            window.location.href = "login.html";
            return;
        }

        try {
            const { error } = await state.supabase.auth.signOut();
            if (error) throw error;
            window.location.href = "login.html";
        } catch (error) {
            console.error("[StudyMind Friends] Logout failed:", error);
            showToast("Could not log out. Please try again.", "error");
        }
    }

    async function initialize() {
        initTheme();
        refreshIcons();

        el.theme?.addEventListener("click", toggleTheme);
        el.menu?.addEventListener("click", toggleMobileMenu);
        el.overlay?.addEventListener("click", closeMobileMenu);
        el.logout?.addEventListener("click", logout);

        el.findButton?.addEventListener("click", () => {
            $("#findFriendsSection")?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
            window.setTimeout(() => el.searchInput?.focus(), 250);
        });

        el.searchForm?.addEventListener("submit", (event) => {
            event.preventDefault();
            runSearch(el.searchInput.value);
        });

        el.searchResults?.addEventListener("click", (event) => {
            const button = event.target.closest("[data-action='send']");
            if (button) sendRequest(button.dataset.userId);
        });

        el.incoming?.addEventListener("click", (event) => {
            const button = event.target.closest("[data-action]");
            if (!button) return;

            const action = button.dataset.action;
            if (action !== "accept" && action !== "decline") return;

            handleRequest(button.dataset.requestId, action);
        });

        el.friendsFilter?.addEventListener("input", renderFriends);
        el.refresh?.addEventListener("click", refreshAll);

        window.addEventListener("studyMindPremiumChanged", () => {
            const isPremium =
                localStorage.getItem("studyMindPremium") === "true";
            if (el.premiumLabel) el.premiumLabel.hidden = !isPremium;
        });

        state.supabase = getSupabaseClient();

        if (!state.supabase?.auth) {
            const message =
                "Supabase client not found. Load your existing Supabase initialization script before friends.js.";

            showEmpty(el.incoming, "Connection not configured", message, "database");
            showEmpty(el.friends, "Connection not configured", message, "database");
            setMessage(el.searchMessage, message, "error");
            setMessage(el.friendsMessage, message, "error");
            return;
        }

        try {
            const { data, error } = await state.supabase.auth.getUser();

            if (error) throw error;
            state.user = data?.user || null;

            if (!state.user) {
                window.location.href = "login.html";
                return;
            }

            await loadOwnProfile();
            await refreshAll();
        } catch (error) {
            console.error("[StudyMind Friends] Initialization failed:", error);

            const message = explainError(error);
            showEmpty(el.incoming, "Could not load Friends", message, "alert-circle");
            showEmpty(el.friends, "Could not load Friends", message, "alert-circle");
            setMessage(el.searchMessage, message, "error");
        }

        refreshIcons();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialize);
    } else {
        initialize();
    }
})();
