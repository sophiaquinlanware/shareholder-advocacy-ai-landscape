// Posting from the site (Prediction board and Plan an engagement), through the site's Supabase project.
// Sign-in is by an emailed link (no password). A signed-in person picks a display name once; forecasts and
// proposal suggestions they post are saved straight away and shown live. Emails stay in Supabase's sign-in system
// and are never readable from here. Row-level security (supabase/schema.sql) lets each person add only their own
// rows. Every night .github/workflows/forecasts-sync.yml copies the posts into data/predictions.json for the
// public record and scoring. The key below is Supabase's publishable key: meant for browsers, safe to publish.
(() => {
  const URL_ = "https://cnpcczhigpufaitjtedj.supabase.co";
  const KEY = "sb_publishable_jyyM-P9LovDsBfVyq-536w_197paJyd";
  const LIB = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm";
  let client = null, loading = null, user = null, profile = null, failed = false;
  const listeners = new Set();
  const emit = () => { for (const f of listeners) { try { f(api.state()); } catch (e) { /* a view failed to redraw */ } } };

  async function load() {
    if (client) return client;
    if (!loading) {
      loading = import(LIB).then(async ({ createClient }) => {
        client = createClient(URL_, KEY, { auth: { flowType: "pkce", detectSessionInUrl: true, persistSession: true } });
        client.auth.onAuthStateChange((_e, session) => { user = session ? session.user : null; refreshProfile(); });
        const { data } = await client.auth.getSession();
        user = data.session ? data.session.user : null;
        await refreshProfile();
        // Remove ?code= from the address after sign-in, keeping the view's #hash.
        if (/[?&]code=/.test(location.search)) history.replaceState(null, "", location.pathname + location.hash);
        return client;
      }).catch((e) => { loading = null; failed = true; emit(); throw e; });
    }
    return loading;
  }
  async function refreshProfile() {
    profile = null;
    if (client && user) {
      const { data } = await client.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle();
      profile = data || null;
    }
    emit();
  }
  const here = () => `${location.origin}${location.pathname}${location.hash || "#predict"}`;
  const nice = (e) => (e && e.message ? e.message.replace(/^new row violates.*$/i, "That was refused; check the form and try again.") : "Something went wrong; please try again.");

  const api = {
    state: () => ({ failed: failed && !client, ready: !!client, signedIn: !!user, name: profile && profile.display_name, email: user && user.email }),
    on(f) { listeners.add(f); return () => listeners.delete(f); },
    init: () => load().catch(() => null),
    async signIn(email) {
      await load();
      const { error } = await client.auth.signInWithOtp({ email, options: { emailRedirectTo: here() } });
      if (error) throw new Error(nice(error));
    },
    async signOut() { await load(); await client.auth.signOut(); user = null; profile = null; emit(); },
    async setName(name) {
      await load();
      const { error } = await client.from("profiles").insert({ display_name: name.trim() });
      if (error) throw new Error(/duplicate|unique/i.test(error.message) ? "That name is taken; try another." : nice(error));
      await refreshProfile();
    },
    async forecast({ question, p, group, stake }) {
      await load();
      const { error } = await client.from("forecasts").insert({ question, p, stakeholder_group: group, stake: !!stake, confirmed: true });
      if (error) throw new Error(nice(error));
    },
    async suggest(row) {
      await load();
      const { error } = await client.from("suggestions").insert({ ...row, confirmed: true });
      if (error) throw new Error(nice(error));
    },
    // Everyone's posted forecasts (display name, question, figure, group, stake, time), for the live crowd figures.
    async forecasts() {
      await load();
      const { data, error } = await client.from("forecasts_public").select("question,p,stakeholder_group,stake,made,display_name").order("made").limit(5000);
      if (error) throw new Error(nice(error));
      return data || [];
    },
  };
  // The sign-in box, shared by the Prediction board and Plan an engagement. Redraws itself when the state changes.
  const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  api.mountAccount = (box) => {
    if (!box || box.dataset.mounted) return;
    box.dataset.mounted = "1";
    let msg = "";
    const draw = () => {
      const st = api.state();
      box.innerHTML = st.failed ? `<p class="note">Posting from the site isn't available right now; use the GitHub links instead.</p>`
        : !st.ready ? `<p class="note">Loading sign-in…</p>`
        : !st.signedIn ? `<form class="bd-acct-form" data-act="email"><label for="${box.id}-email">Sign in to post, with an emailed link (no password)</label>
            <div class="bd-acct-row"><input type="email" id="${box.id}-email" required autocomplete="email" placeholder="you@example.org"><button type="submit" class="bd-btn">Email me a sign-in link</button></div>
            <p class="note">Your email is used only to sign in and is never shown. Open the link in this browser.</p></form>`
        : !st.name ? `<form class="bd-acct-form" data-act="name"><label for="${box.id}-name">Choose the name shown with what you post</label>
            <div class="bd-acct-row"><input id="${box.id}-name" required minlength="2" maxlength="40" pattern="[^<>@]{2,40}" placeholder="for example, J. Rivera (Acme Pension)" value="${esc(String(st.email || "").split("@")[0].replace(/[^A-Za-z0-9._ -]/g, "").slice(0, 40))}"><button type="submit" class="bd-btn">Save my name</button></div>
            <p class="note">Signed in as ${esc(st.email)}. Use your own name or your organization's; it is public.</p></form>`
        : `<p class="bd-acct-in">Posting as <strong>${esc(st.name)}</strong> <button type="button" class="linklike" data-act="out">Sign out</button></p>`;
      if (msg) box.insertAdjacentHTML("beforeend", `<p class="note bd-acct-msg" role="status">${esc(msg)}</p>`);
    };
    box.addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target;
      const input = f.querySelector("input");
      try {
        if (f.dataset.act === "email") { await api.signIn(input.value.trim()); msg = `Check ${input.value.trim()} for a sign-in link, and open it in this browser.`; }
        else { await api.setName(input.value); msg = ""; }
      } catch (err) { msg = err.message; }
      draw();
    });
    box.addEventListener("click", async (e) => { if (e.target.closest('[data-act="out"]')) { await api.signOut(); msg = "Signed out."; draw(); } });
    const off = api.on(() => { if (!box.isConnected) { off(); return; } draw(); });
    draw();
    api.init().then(draw);
  };
  window.BOARD_LIVE = api;
  // Finish an emailed sign-in, or restore one, as soon as the page loads.
  try {
    if (/[?&]code=/.test(location.search) || Object.keys(localStorage).some((k) => /^sb-.*-auth-token/.test(k))) api.init();
  } catch (e) { /* storage blocked */ }
})();
