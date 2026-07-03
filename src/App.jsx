import React, { useState, useMemo, useRef } from "react";
import {
  Landmark, Calendar, Ticket, LogIn, LogOut, Plus, Trash2, X, Check,
  ShieldCheck, User, Heart, MapPin, Clock, ChevronRight, Search,
  LayoutGrid, Users, Wallet, Sparkles, ArrowLeft, Pencil
} from "lucide-react";

/* ---------------------------------------------------------
   DARSHAN — Temple Darshan Ticket Booking (frontend demo)
   Simulates the MERN app described in the brief:
   React UI + mock Express/MongoDB layer (in-memory) +
   simulated JWT session with USER / ADMIN / ORGANIZER roles.
   No real network/database — all "API calls" are local
   functions standing in for their Express/Mongo counterparts.
--------------------------------------------------------- */

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Yatra+One&family=Work+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
`;

const TOKENS = {
  bg: "#160F0B",
  surface: "#231810",
  card: "#2E2015",
  cardHover: "#3A2A1A",
  marigold: "#E8A33D",
  marigoldDim: "#8C6A2F",
  vermilion: "#C1440E",
  sandstone: "#F1E6D2",
  muted: "#B7A488",
  sage: "#7C9473",
  rose: "#B84A4A",
  hairline: "#4A3A28",
};

const ARCH = (w = 64, h = 40, fill = TOKENS.marigold) => (
  <svg width={w} height={h} viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M2 38 L2 22 Q2 4 32 4 Q62 4 62 22 L62 38"
      stroke={fill}
      strokeWidth="2.5"
      fill="none"
    />
    <path d="M14 38 L14 26 Q14 14 32 14 Q50 14 50 26 L50 38" stroke={fill} strokeWidth="1.5" fill="none" opacity="0.6" />
    <circle cx="32" cy="8" r="2" fill={fill} />
  </svg>
);

const uid = (() => {
  let n = 1000;
  return (p = "ID") => `${p}-${(n++).toString(36).toUpperCase()}`;
})();

const fakeToken = (role, name) =>
  "eyJhbGciOiJIUzI1NiJ9." +
  btoa(JSON.stringify({ name, role, iat: Date.now() })).replace(/=+$/, "") +
  "." + Math.random().toString(36).slice(2, 12);

/* ---------------------- seed data ---------------------- */

const seedTemples = () => ([
  {
    id: uid("TMP"),
    name: "Shantideep Mandir",
    deity: "Devi Shanti",
    city: "Varanasi",
    description: "A riverside sanctuary known for its dawn aarti and quiet inner courtyard.",
    slots: [
      { id: uid("SLT"), date: "2026-07-05", time: "06:00", poojaType: "General Darshan", capacity: 200, booked: 142, price: 0 },
      { id: uid("SLT"), date: "2026-07-05", time: "08:00", poojaType: "Special Abhishekam", capacity: 40, booked: 31, price: 501 },
      { id: uid("SLT"), date: "2026-07-06", time: "06:00", poojaType: "General Darshan", capacity: 200, booked: 60, price: 0 },
    ],
  },
  {
    id: uid("TMP"),
    name: "Meru Hill Shrine",
    deity: "Lord Meruesha",
    city: "Rishikesh",
    description: "Perched above the valley, reached by a stone stair lined with prayer bells.",
    slots: [
      { id: uid("SLT"), date: "2026-07-05", time: "07:00", poojaType: "General Darshan", capacity: 150, booked: 150, price: 0 },
      { id: uid("SLT"), date: "2026-07-05", time: "17:00", poojaType: "Evening Aarti", capacity: 100, booked: 22, price: 101 },
    ],
  },
  {
    id: uid("TMP"),
    name: "Vishwadham",
    deity: "Vishwanatha",
    city: "Ujjain",
    description: "One of the oldest recorded shrines in the region, famed for its midnight shringar.",
    slots: [
      { id: uid("SLT"), date: "2026-07-06", time: "05:30", poojaType: "Mangala Aarti", capacity: 60, booked: 18, price: 251 },
      { id: uid("SLT"), date: "2026-07-06", time: "09:00", poojaType: "General Darshan", capacity: 300, booked: 95, price: 0 },
    ],
  },
]);

const ROLES = {
  USER: { label: "Devotee", icon: User, color: TOKENS.sage },
  ORGANIZER: { label: "Organizer", icon: LayoutGrid, color: TOKENS.marigold },
  ADMIN: { label: "Admin", icon: ShieldCheck, color: TOKENS.vermilion },
};

/* ---------------------- root app ---------------------- */

export default function DarshanApp() {
  const [temples, setTemples] = useState(seedTemples());
  const [bookings, setBookings] = useState([]);
  const [donations, setDonations] = useState([]);
  const [session, setSession] = useState(null); // { token, role, name }
  const [view, setView] = useState("home");
  const [activeTemple, setActiveTemple] = useState(null);
  const [toast, setToast] = useState(null);
  const [query, setQuery] = useState("");

  const notify = (msg, tone = "ok") => {
    setToast({ msg, tone });
    window.clearTimeout(notify._t);
    notify._t = window.setTimeout(() => setToast(null), 2600);
  };

  function login(role, name) {
    const token = fakeToken(role, name);
    setSession({ token, role, name });
    notify(`Signed in as ${name} · ${ROLES[role].label}`);
    setView(role === "USER" ? "home" : "admin");
  }
  function logout() {
    setSession(null);
    setView("home");
    notify("Signed out");
  }

  function bookSlot(temple, slot, qty, poojaType) {
    if (!session) return notify("Sign in to book a slot", "warn");
    const remaining = slot.capacity - slot.booked;
    if (qty > remaining) return notify("Not enough seats left in this slot", "warn");
    setTemples((ts) =>
      ts.map((t) =>
        t.id !== temple.id ? t : {
          ...t,
          slots: t.slots.map((s) => (s.id === slot.id ? { ...s, booked: s.booked + qty } : s)),
        }
      )
    );
    const booking = {
      id: uid("BKG"),
      code: uid("DRS"),
      userName: session.name,
      templeId: temple.id,
      templeName: temple.name,
      slotId: slot.id,
      date: slot.date,
      time: slot.time,
      poojaType,
      qty,
      price: slot.price,
      status: "CONFIRMED",
    };
    setBookings((b) => [booking, ...b]);
    notify(`Booked ${qty} slot(s) at ${temple.name}`);
    setView("bookings");
  }

  function cancelBooking(bk) {
    setBookings((bs) => bs.map((b) => (b.id === bk.id ? { ...b, status: "CANCELLED" } : b)));
    setTemples((ts) =>
      ts.map((t) =>
        t.id !== bk.templeId ? t : {
          ...t,
          slots: t.slots.map((s) => (s.id === bk.slotId ? { ...s, booked: Math.max(0, s.booked - bk.qty) } : s)),
        }
      )
    );
    notify("Booking cancelled");
  }

  function addDonation(templeId, amount, purpose) {
    if (!session) return notify("Sign in to donate", "warn");
    const t = temples.find((x) => x.id === templeId);
    setDonations((d) => [
      { id: uid("DON"), userName: session.name, templeId, templeName: t?.name, amount, purpose, date: new Date().toISOString().slice(0, 10) },
      ...d,
    ]);
    notify(`Thank you — ₹${amount} received for ${t?.name}`);
  }

  function addTemple(payload) {
    setTemples((ts) => [{ id: uid("TMP"), slots: [], ...payload }, ...ts]);
    notify("Temple added");
  }
  function deleteTemple(id) {
    setTemples((ts) => ts.filter((t) => t.id !== id));
    notify("Temple removed", "warn");
  }
  function addSlot(templeId, slot) {
    setTemples((ts) => ts.map((t) => (t.id !== templeId ? t : { ...t, slots: [{ id: uid("SLT"), booked: 0, ...slot }, ...t.slots] })));
    notify("Slot added");
  }
  function deleteSlot(templeId, slotId) {
    setTemples((ts) => ts.map((t) => (t.id !== templeId ? t : { ...t, slots: t.slots.filter((s) => s.id !== slotId) })));
    notify("Slot removed", "warn");
  }

  const filteredTemples = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return temples;
    return temples.filter((t) => [t.name, t.city, t.deity].join(" ").toLowerCase().includes(q));
  }, [temples, query]);

  return (
    <div style={{ fontFamily: "'Work Sans', sans-serif", background: TOKENS.bg, color: TOKENS.sandstone, minHeight: "100%" }}>
      <style>{FONTS}{`
        .yatra { font-family: 'Yatra One', cursive; }
        .mono { font-family: 'Space Mono', monospace; }
        .darshan-scope * { box-sizing: border-box; }
        .darshan-scope button { font-family: inherit; cursor: pointer; }
        .darshan-scope input, .darshan-scope select { font-family: inherit; }
        .card-hover:hover { background: ${TOKENS.cardHover} !important; transform: translateY(-2px); }
        .fade-in { animation: fadeIn .25s ease; }
        @keyframes fadeIn { from { opacity:0; transform: translateY(4px);} to {opacity:1; transform:none;} }
        .darshan-scope ::selection { background: ${TOKENS.marigold}; color: #1a1208; }
      `}</style>

      <div className="darshan-scope">
        <TopNav session={session} setView={setView} view={view} onLogout={logout} />

        <main style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 20px 80px" }}>
          {view === "home" && (
            <>
              <Hero setView={setView} session={session} />
              <SearchBar query={query} setQuery={setQuery} />
              <TempleGrid
                temples={filteredTemples}
                onOpen={(t) => { setActiveTemple(t); setView("temple"); }}
              />
            </>
          )}

          {view === "temple" && activeTemple && (
            <TempleDetail
              temple={temples.find((t) => t.id === activeTemple.id) || activeTemple}
              onBack={() => setView("home")}
              onBook={bookSlot}
              onDonate={addDonation}
              session={session}
            />
          )}

          {view === "login" && <LoginPanel onLogin={login} />}

          {view === "bookings" && (
            <BookingsPanel
              session={session}
              bookings={bookings.filter((b) => session && b.userName === session.name)}
              onCancel={cancelBooking}
              goHome={() => setView("home")}
            />
          )}

          {view === "donations" && (
            <DonationsPanel donations={donations} session={session} temples={temples} onDonate={addDonation} />
          )}

          {view === "admin" && session && (session.role === "ADMIN" || session.role === "ORGANIZER") && (
            <AdminPanel
              session={session}
              temples={temples}
              bookings={bookings}
              donations={donations}
              addTemple={addTemple}
              deleteTemple={deleteTemple}
              addSlot={addSlot}
              deleteSlot={deleteSlot}
            />
          )}
        </main>

        {toast && <Toast toast={toast} />}
      </div>
    </div>
  );
}

/* ---------------------- nav ---------------------- */

function TopNav({ session, setView, view, onLogout }) {
  const NavBtn = ({ id, label, icon: Icon, guardedRoles }) => {
    if (guardedRoles && (!session || !guardedRoles.includes(session.role))) return null;
    const active = view === id;
    return (
      <button
        onClick={() => setView(id)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: active ? TOKENS.card : "transparent",
          color: active ? TOKENS.marigold : TOKENS.muted,
          border: "none", borderRadius: 8, padding: "8px 12px",
          fontSize: 14, fontWeight: 600, transition: "all .15s",
        }}
      >
        <Icon size={15} /> {label}
      </button>
    );
  };

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(22,15,11,0.92)", backdropFilter: "blur(6px)", borderBottom: `1px solid ${TOKENS.hairline}` }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setView("home")}>
          {ARCH(30, 20)}
          <span className="yatra" style={{ fontSize: 24, color: TOKENS.sandstone, letterSpacing: 0.5 }}>Darshan</span>
        </div>
        <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <NavBtn id="home" label="Temples" icon={Landmark} />
          <NavBtn id="bookings" label="My Bookings" icon={Ticket} guardedRoles={["USER", "ADMIN", "ORGANIZER"]} />
          <NavBtn id="donations" label="Donations" icon={Heart} guardedRoles={["USER", "ADMIN", "ORGANIZER"]} />
          <NavBtn id="admin" label="Console" icon={ShieldCheck} guardedRoles={["ADMIN", "ORGANIZER"]} />
          <div style={{ width: 1, height: 20, background: TOKENS.hairline, margin: "0 6px" }} />
          {session ? (
            <button onClick={onLogout} style={{ display: "flex", alignItems: "center", gap: 6, background: TOKENS.vermilion, color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 700 }}>
              <LogOut size={14} /> Sign out
            </button>
          ) : (
            <button onClick={() => setView("login")} style={{ display: "flex", alignItems: "center", gap: 6, background: TOKENS.marigold, color: "#1a1208", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 700 }}>
              <LogIn size={14} /> Sign in
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

/* ---------------------- hero ---------------------- */

function Hero({ setView, session }) {
  return (
    <section style={{ padding: "36px 0 28px", borderBottom: `1px solid ${TOKENS.hairline}`, marginBottom: 24, display: "flex", gap: 28, alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ flex: "1 1 340px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: TOKENS.marigold, fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>
          <Sparkles size={14} /> Book your darshan, without the queue
        </div>
        <h1 className="yatra" style={{ fontSize: 44, lineHeight: 1.15, margin: "0 0 12px", color: TOKENS.sandstone }}>
          Reserve your moment at the sanctum
        </h1>
        <p style={{ color: TOKENS.muted, fontSize: 16, lineHeight: 1.6, maxWidth: 460, margin: "0 0 18px" }}>
          Browse temples, pick a pooja slot that suits your day, and carry a confirmed
          ticket — no on-site queueing required.
        </p>
        {!session && (
          <button onClick={() => setView("login")} style={{ background: TOKENS.marigold, color: "#1a1208", border: "none", borderRadius: 10, padding: "12px 20px", fontWeight: 700, fontSize: 14, display: "inline-flex", alignItems: "center", gap: 6 }}>
            Sign in to book <ChevronRight size={16} />
          </button>
        )}
      </div>
      <div style={{ flex: "0 0 220px", display: "flex", justifyContent: "center" }}>
        <svg width="220" height="150" viewBox="0 0 220 150" fill="none">
          <path d="M10 148 L10 90 Q10 30 110 30 Q210 30 210 90 L210 148" stroke={TOKENS.marigold} strokeWidth="3" fill="none" />
          <path d="M40 148 L40 96 Q40 56 110 56 Q180 56 180 96 L180 148" stroke={TOKENS.vermilion} strokeWidth="2" fill="none" opacity="0.8" />
          <path d="M70 148 L70 104 Q70 80 110 80 Q150 80 150 104 L150 148" stroke={TOKENS.sandstone} strokeWidth="1.5" fill="none" opacity="0.5" />
          <circle cx="110" cy="34" r="4" fill={TOKENS.marigold} />
          <line x1="110" y1="14" x2="110" y2="30" stroke={TOKENS.marigold} strokeWidth="2" />
        </svg>
      </div>
    </section>
  );
}

function SearchBar({ query, setQuery }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: TOKENS.surface, border: `1px solid ${TOKENS.hairline}`, borderRadius: 10, padding: "10px 14px", marginBottom: 20, maxWidth: 420 }}>
      <Search size={16} color={TOKENS.muted} />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search temple, deity, or city"
        style={{ background: "transparent", border: "none", outline: "none", color: TOKENS.sandstone, fontSize: 14, width: "100%" }}
      />
    </div>
  );
}

/* ---------------------- temple grid ---------------------- */

function TempleGrid({ temples, onOpen }) {
  if (!temples.length) {
    return <EmptyState title="No temples match your search" subtitle="Try a different name or city." />;
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
      {temples.map((t) => {
        const totalSeats = t.slots.reduce((a, s) => a + (s.capacity - s.booked), 0);
        return (
          <div
            key={t.id}
            className="card-hover fade-in"
            onClick={() => onOpen(t)}
            style={{ background: TOKENS.card, border: `1px solid ${TOKENS.hairline}`, borderRadius: "26px 26px 12px 12px", padding: 18, cursor: "pointer", transition: "all .18s" }}
          >
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>{ARCH(56, 34)}</div>
            <h3 className="yatra" style={{ fontSize: 20, margin: "0 0 4px", textAlign: "center", color: TOKENS.sandstone }}>{t.name}</h3>
            <div style={{ textAlign: "center", color: TOKENS.marigold, fontSize: 12, fontWeight: 600, marginBottom: 10 }}>{t.deity}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "center", color: TOKENS.muted, fontSize: 13, marginBottom: 10 }}>
              <MapPin size={13} /> {t.city}
            </div>
            <p style={{ color: TOKENS.muted, fontSize: 13, lineHeight: 1.5, minHeight: 40, textAlign: "center" }}>{t.description}</p>
            <div style={{ borderTop: `1px solid ${TOKENS.hairline}`, marginTop: 10, paddingTop: 10, display: "flex", justifyContent: "space-between", fontSize: 12, color: TOKENS.muted }}>
              <span>{t.slots.length} slot{t.slots.length !== 1 ? "s" : ""}</span>
              <span style={{ color: totalSeats > 0 ? TOKENS.sage : TOKENS.rose }}>{totalSeats > 0 ? `${totalSeats} seats open` : "Full"}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------------- temple detail / booking ---------------------- */

function TempleDetail({ temple, onBack, onBook, onDonate, session }) {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [qty, setQty] = useState(1);
  const [donateOpen, setDonateOpen] = useState(false);
  const [amount, setAmount] = useState(101);

  return (
    <div className="fade-in">
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: TOKENS.muted, fontSize: 13, marginBottom: 16, padding: 0 }}>
        <ArrowLeft size={15} /> Back to temples
      </button>

      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 24 }}>
        <div style={{ background: TOKENS.card, border: `1px solid ${TOKENS.hairline}`, borderRadius: 16, padding: 14 }}>{ARCH(64, 40)}</div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <h1 className="yatra" style={{ fontSize: 34, margin: "0 0 4px", color: TOKENS.sandstone }}>{temple.name}</h1>
          <div style={{ color: TOKENS.marigold, fontWeight: 600, marginBottom: 6 }}>{temple.deity}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, color: TOKENS.muted, fontSize: 13, marginBottom: 8 }}>
            <MapPin size={13} /> {temple.city}
          </div>
          <p style={{ color: TOKENS.muted, fontSize: 14, maxWidth: 520, lineHeight: 1.6 }}>{temple.description}</p>
        </div>
        <button
          onClick={() => setDonateOpen(true)}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: `1px solid ${TOKENS.marigold}`, color: TOKENS.marigold, borderRadius: 10, padding: "10px 16px", fontWeight: 700, fontSize: 13 }}
        >
          <Heart size={14} /> Donate
        </button>
      </div>

      <h3 style={{ fontSize: 15, color: TOKENS.sandstone, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
        <Calendar size={15} color={TOKENS.marigold} /> Available slots
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px,1fr))", gap: 12, marginBottom: 20 }}>
        {temple.slots.map((s) => {
          const remaining = s.capacity - s.booked;
          const full = remaining <= 0;
          const selected = selectedSlot?.id === s.id;
          return (
            <div
              key={s.id}
              onClick={() => !full && setSelectedSlot(s)}
              style={{
                background: selected ? TOKENS.cardHover : TOKENS.surface,
                border: `1px solid ${selected ? TOKENS.marigold : TOKENS.hairline}`,
                borderRadius: 12, padding: 14, cursor: full ? "not-allowed" : "pointer",
                opacity: full ? 0.5 : 1,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{s.poojaType}</span>
                <span className="mono" style={{ fontSize: 11, color: TOKENS.muted }}>{s.price ? `₹${s.price}` : "Free"}</span>
              </div>
              <div style={{ display: "flex", gap: 12, fontSize: 12, color: TOKENS.muted }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Calendar size={12} /> {s.date}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} /> {s.time}</span>
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: full ? TOKENS.rose : TOKENS.sage, fontWeight: 600 }}>
                {full ? "Fully booked" : `${remaining} of ${s.capacity} seats open`}
              </div>
            </div>
          );
        })}
      </div>

      {selectedSlot && (
        <div style={{ background: TOKENS.card, border: `1px solid ${TOKENS.marigold}`, borderRadius: 14, padding: 18, maxWidth: 420 }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Confirm your slot</div>
          <div style={{ fontSize: 13, color: TOKENS.muted, marginBottom: 10 }}>
            {selectedSlot.poojaType} · {selectedSlot.date} at {selectedSlot.time}
          </div>
          <label style={{ fontSize: 12, color: TOKENS.muted, display: "block", marginBottom: 6 }}>Number of devotees</label>
          <input
            type="number" min={1} max={selectedSlot.capacity - selectedSlot.booked} value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
            style={{ width: "100%", background: TOKENS.surface, border: `1px solid ${TOKENS.hairline}`, borderRadius: 8, padding: "8px 10px", color: TOKENS.sandstone, marginBottom: 14 }}
          />
          <button
            onClick={() => onBook(temple, selectedSlot, qty, selectedSlot.poojaType)}
            style={{ width: "100%", background: TOKENS.marigold, color: "#1a1208", border: "none", borderRadius: 10, padding: "11px 0", fontWeight: 700, fontSize: 14 }}
          >
            {session ? `Book ${qty} slot${qty > 1 ? "s" : ""}` : "Sign in to book"}
          </button>
        </div>
      )}

      {donateOpen && (
        <Modal onClose={() => setDonateOpen(false)} title={`Donate to ${temple.name}`}>
          <label style={{ fontSize: 12, color: TOKENS.muted, display: "block", marginBottom: 6 }}>Amount (₹)</label>
          <input
            type="number" min={11} value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)}
            style={{ width: "100%", background: TOKENS.surface, border: `1px solid ${TOKENS.hairline}`, borderRadius: 8, padding: "8px 10px", color: TOKENS.sandstone, marginBottom: 14 }}
          />
          <button
            onClick={() => { onDonate(temple.id, amount, "General offering"); setDonateOpen(false); }}
            style={{ width: "100%", background: TOKENS.vermilion, color: "#fff", border: "none", borderRadius: 10, padding: "11px 0", fontWeight: 700 }}
          >
            {session ? "Confirm donation" : "Sign in to donate"}
          </button>
        </Modal>
      )}
    </div>
  );
}

/* ---------------------- login ---------------------- */

function LoginPanel({ onLogin }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("USER");

  return (
    <div className="fade-in" style={{ maxWidth: 420, margin: "20px auto" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        {ARCH(48, 30)}
        <h2 className="yatra" style={{ fontSize: 26, margin: "8px 0 4px" }}>Sign in</h2>
        <p style={{ color: TOKENS.muted, fontSize: 13 }}>Demo auth — issues a mock JWT with your chosen role.</p>
      </div>
      <label style={{ fontSize: 12, color: TOKENS.muted, display: "block", marginBottom: 6 }}>Your name</label>
      <input
        value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Asha Rao"
        style={{ width: "100%", background: TOKENS.surface, border: `1px solid ${TOKENS.hairline}`, borderRadius: 8, padding: "10px 12px", color: TOKENS.sandstone, marginBottom: 16 }}
      />
      <label style={{ fontSize: 12, color: TOKENS.muted, display: "block", marginBottom: 8 }}>Role</label>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {Object.entries(ROLES).map(([key, r]) => {
          const Icon = r.icon;
          const active = role === key;
          return (
            <button
              key={key} onClick={() => setRole(key)}
              style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                background: active ? TOKENS.card : TOKENS.surface, border: `1px solid ${active ? r.color : TOKENS.hairline}`,
                borderRadius: 10, padding: "10px 6px", color: active ? r.color : TOKENS.muted, fontSize: 12, fontWeight: 700,
              }}
            >
              <Icon size={16} /> {r.label}
            </button>
          );
        })}
      </div>
      <button
        disabled={!name.trim()}
        onClick={() => onLogin(role, name.trim())}
        style={{ width: "100%", background: name.trim() ? TOKENS.marigold : TOKENS.marigoldDim, color: "#1a1208", border: "none", borderRadius: 10, padding: "12px 0", fontWeight: 700, opacity: name.trim() ? 1 : 0.6 }}
      >
        Sign in as {ROLES[role].label}
      </button>
    </div>
  );
}

/* ---------------------- bookings ---------------------- */

function BookingsPanel({ session, bookings, onCancel, goHome }) {
  if (!session) return <EmptyState title="Sign in to view your bookings" onAction={goHome} actionLabel="Go to temples" />;
  if (!bookings.length) return <EmptyState title="No bookings yet" subtitle="Browse temples and reserve a darshan slot." onAction={goHome} actionLabel="Browse temples" />;

  return (
    <div className="fade-in">
      <h2 className="yatra" style={{ fontSize: 26, marginBottom: 16 }}>My Bookings</h2>
      <div style={{ display: "grid", gap: 10 }}>
        {bookings.map((b) => (
          <div key={b.id} style={{ background: TOKENS.card, border: `1px solid ${TOKENS.hairline}`, borderRadius: 12, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 3 }}>{b.templeName}</div>
              <div style={{ fontSize: 12, color: TOKENS.muted }}>{b.poojaType} · {b.date} at {b.time} · {b.qty} devotee{b.qty > 1 ? "s" : ""}</div>
              <div className="mono" style={{ fontSize: 11, color: TOKENS.marigold, marginTop: 4 }}>{b.code}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: b.status === "CONFIRMED" ? TOKENS.sage : TOKENS.rose, border: `1px solid ${b.status === "CONFIRMED" ? TOKENS.sage : TOKENS.rose}`, borderRadius: 20, padding: "3px 10px" }}>
                {b.status}
              </span>
              {b.status === "CONFIRMED" && (
                <button onClick={() => onCancel(b)} style={{ background: "transparent", border: `1px solid ${TOKENS.rose}`, color: TOKENS.rose, borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 700 }}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------- donations ---------------------- */

function DonationsPanel({ donations, session, temples, onDonate }) {
  const [templeId, setTempleId] = useState(temples[0]?.id || "");
  const [amount, setAmount] = useState(101);
  const mine = donations.filter((d) => session && d.userName === session.name);

  return (
    <div className="fade-in">
      <h2 className="yatra" style={{ fontSize: 26, marginBottom: 16 }}>Donations</h2>
      <div style={{ background: TOKENS.card, border: `1px solid ${TOKENS.hairline}`, borderRadius: 14, padding: 18, maxWidth: 420, marginBottom: 24 }}>
        <label style={{ fontSize: 12, color: TOKENS.muted, display: "block", marginBottom: 6 }}>Temple</label>
        <select value={templeId} onChange={(e) => setTempleId(e.target.value)} style={{ width: "100%", background: TOKENS.surface, border: `1px solid ${TOKENS.hairline}`, borderRadius: 8, padding: "9px 10px", color: TOKENS.sandstone, marginBottom: 14 }}>
          {temples.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <label style={{ fontSize: 12, color: TOKENS.muted, display: "block", marginBottom: 6 }}>Amount (₹)</label>
        <input type="number" min={11} value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} style={{ width: "100%", background: TOKENS.surface, border: `1px solid ${TOKENS.hairline}`, borderRadius: 8, padding: "9px 10px", color: TOKENS.sandstone, marginBottom: 14 }} />
        <button onClick={() => onDonate(templeId, amount, "General offering")} style={{ width: "100%", background: TOKENS.vermilion, color: "#fff", border: "none", borderRadius: 10, padding: "11px 0", fontWeight: 700 }}>
          {session ? "Donate" : "Sign in to donate"}
        </button>
      </div>

      <h3 style={{ fontSize: 14, color: TOKENS.muted, marginBottom: 10 }}>Your donation history</h3>
      {!mine.length ? <EmptyState title="No donations yet" /> : (
        <div style={{ display: "grid", gap: 8 }}>
          {mine.map((d) => (
            <div key={d.id} style={{ background: TOKENS.surface, border: `1px solid ${TOKENS.hairline}`, borderRadius: 10, padding: 12, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span>{d.templeName} · {d.purpose}</span>
              <span className="mono" style={{ color: TOKENS.marigold }}>₹{d.amount}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------- admin / organizer console ---------------------- */

function AdminPanel({ session, temples, bookings, donations, addTemple, deleteTemple, addSlot, deleteSlot }) {
  const [tab, setTab] = useState("temples");
  const [newTemple, setNewTemple] = useState({ name: "", city: "", deity: "", description: "" });
  const [slotForm, setSlotForm] = useState({});

  const Tab = ({ id, label, icon: Icon }) => (
    <button onClick={() => setTab(id)} style={{ display: "flex", alignItems: "center", gap: 6, background: tab === id ? TOKENS.card : "transparent", border: `1px solid ${tab === id ? TOKENS.marigold : TOKENS.hairline}`, color: tab === id ? TOKENS.marigold : TOKENS.muted, borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 700 }}>
      <Icon size={14} /> {label}
    </button>
  );

  return (
    <div className="fade-in">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <h2 className="yatra" style={{ fontSize: 26, margin: 0 }}>Console</h2>
        <span style={{ fontSize: 11, fontWeight: 700, color: ROLES[session.role].color, border: `1px solid ${ROLES[session.role].color}`, borderRadius: 20, padding: "3px 10px" }}>
          {ROLES[session.role].label}
        </span>
      </div>
      <p className="mono" style={{ fontSize: 11, color: TOKENS.muted, marginBottom: 18, wordBreak: "break-all" }}>token: {session.token.slice(0, 46)}…</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <Tab id="temples" label="Temples & Slots" icon={Landmark} />
        <Tab id="bookings" label="All Bookings" icon={Ticket} />
        {session.role === "ADMIN" && <Tab id="donations" label="Donations" icon={Wallet} />}
      </div>

      {tab === "temples" && (
        <div>
          <div style={{ background: TOKENS.card, border: `1px solid ${TOKENS.hairline}`, borderRadius: 14, padding: 16, marginBottom: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}><Plus size={15} color={TOKENS.marigold} /> Add temple</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10, marginBottom: 10 }}>
              {["name", "city", "deity"].map((f) => (
                <input key={f} placeholder={f[0].toUpperCase() + f.slice(1)} value={newTemple[f]} onChange={(e) => setNewTemple({ ...newTemple, [f]: e.target.value })}
                  style={{ background: TOKENS.surface, border: `1px solid ${TOKENS.hairline}`, borderRadius: 8, padding: "8px 10px", color: TOKENS.sandstone }} />
              ))}
            </div>
            <input placeholder="Short description" value={newTemple.description} onChange={(e) => setNewTemple({ ...newTemple, description: e.target.value })}
              style={{ width: "100%", background: TOKENS.surface, border: `1px solid ${TOKENS.hairline}`, borderRadius: 8, padding: "8px 10px", color: TOKENS.sandstone, marginBottom: 10 }} />
            <button
              disabled={!newTemple.name.trim()}
              onClick={() => { addTemple(newTemple); setNewTemple({ name: "", city: "", deity: "", description: "" }); }}
              style={{ background: TOKENS.marigold, color: "#1a1208", border: "none", borderRadius: 8, padding: "9px 16px", fontWeight: 700, opacity: newTemple.name.trim() ? 1 : 0.5 }}
            >
              Add temple
            </button>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            {temples.map((t) => (
              <div key={t.id} style={{ background: TOKENS.surface, border: `1px solid ${TOKENS.hairline}`, borderRadius: 12, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: TOKENS.muted }}>{t.city} · {t.deity}</div>
                  </div>
                  <button onClick={() => deleteTemple(t.id)} style={{ background: "transparent", border: `1px solid ${TOKENS.rose}`, color: TOKENS.rose, borderRadius: 8, padding: "6px 10px", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                    <Trash2 size={13} /> Remove
                  </button>
                </div>

                <div style={{ display: "grid", gap: 6, marginBottom: 10 }}>
                  {t.slots.map((s) => (
                    <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: TOKENS.card, borderRadius: 8, padding: "8px 10px", fontSize: 12 }}>
                      <span>{s.poojaType} · {s.date} {s.time} · {s.booked}/{s.capacity} booked</span>
                      <button onClick={() => deleteSlot(t.id, s.id)} style={{ background: "none", border: "none", color: TOKENS.rose }}><X size={14} /></button>
                    </div>
                  ))}
                  {!t.slots.length && <div style={{ fontSize: 12, color: TOKENS.muted }}>No slots yet.</div>}
                </div>

                <SlotAdder templeId={t.id} onAdd={addSlot} />
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "bookings" && (
        <div style={{ display: "grid", gap: 8 }}>
          {!bookings.length && <EmptyState title="No bookings recorded yet" />}
          {bookings.map((b) => (
            <div key={b.id} style={{ background: TOKENS.surface, border: `1px solid ${TOKENS.hairline}`, borderRadius: 10, padding: 12, display: "flex", justifyContent: "space-between", fontSize: 13, flexWrap: "wrap", gap: 6 }}>
              <span>{b.userName} → {b.templeName} · {b.poojaType} · {b.date} {b.time} · x{b.qty}</span>
              <span style={{ color: b.status === "CONFIRMED" ? TOKENS.sage : TOKENS.rose, fontWeight: 700 }}>{b.status}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "donations" && (
        <div style={{ display: "grid", gap: 8 }}>
          {!donations.length && <EmptyState title="No donations recorded yet" />}
          {donations.map((d) => (
            <div key={d.id} style={{ background: TOKENS.surface, border: `1px solid ${TOKENS.hairline}`, borderRadius: 10, padding: 12, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span>{d.userName} → {d.templeName}</span>
              <span className="mono" style={{ color: TOKENS.marigold }}>₹{d.amount}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SlotAdder({ templeId, onAdd }) {
  const [f, setF] = useState({ date: "2026-07-10", time: "06:00", poojaType: "General Darshan", capacity: 100, price: 0 });
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", borderTop: `1px solid ${TOKENS.hairline}`, paddingTop: 10 }}>
      <input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} style={{ background: TOKENS.card, border: `1px solid ${TOKENS.hairline}`, borderRadius: 6, padding: "6px 8px", color: TOKENS.sandstone, fontSize: 12 }} />
      <input type="time" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} style={{ background: TOKENS.card, border: `1px solid ${TOKENS.hairline}`, borderRadius: 6, padding: "6px 8px", color: TOKENS.sandstone, fontSize: 12 }} />
      <input placeholder="Pooja type" value={f.poojaType} onChange={(e) => setF({ ...f, poojaType: e.target.value })} style={{ background: TOKENS.card, border: `1px solid ${TOKENS.hairline}`, borderRadius: 6, padding: "6px 8px", color: TOKENS.sandstone, fontSize: 12, width: 120 }} />
      <input type="number" placeholder="Capacity" value={f.capacity} onChange={(e) => setF({ ...f, capacity: Number(e.target.value) || 0 })} style={{ background: TOKENS.card, border: `1px solid ${TOKENS.hairline}`, borderRadius: 6, padding: "6px 8px", color: TOKENS.sandstone, fontSize: 12, width: 80 }} />
      <input type="number" placeholder="Price ₹" value={f.price} onChange={(e) => setF({ ...f, price: Number(e.target.value) || 0 })} style={{ background: TOKENS.card, border: `1px solid ${TOKENS.hairline}`, borderRadius: 6, padding: "6px 8px", color: TOKENS.sandstone, fontSize: 12, width: 70 }} />
      <button onClick={() => onAdd(templeId, f)} style={{ background: TOKENS.marigold, color: "#1a1208", border: "none", borderRadius: 6, padding: "7px 10px", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
        <Plus size={13} /> Add slot
      </button>
    </div>
  );
}

/* ---------------------- shared bits ---------------------- */

function EmptyState({ title, subtitle, onAction, actionLabel }) {
  return (
    <div style={{ textAlign: "center", padding: "50px 20px", border: `1px dashed ${TOKENS.hairline}`, borderRadius: 14 }}>
      {ARCH(40, 26, TOKENS.muted)}
      <div style={{ fontWeight: 700, marginTop: 10 }}>{title}</div>
      {subtitle && <div style={{ color: TOKENS.muted, fontSize: 13, marginTop: 4 }}>{subtitle}</div>}
      {onAction && (
        <button onClick={onAction} style={{ marginTop: 14, background: TOKENS.marigold, color: "#1a1208", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 700, fontSize: 13 }}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function Modal({ children, onClose, title }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,7,4,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: TOKENS.card, border: `1px solid ${TOKENS.hairline}`, borderRadius: 14, padding: 20, width: 340 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontWeight: 700 }}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: TOKENS.muted }}><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Toast({ toast }) {
  const color = toast.tone === "warn" ? TOKENS.rose : TOKENS.sage;
  return (
    <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: TOKENS.card, border: `1px solid ${color}`, color: TOKENS.sandstone, borderRadius: 10, padding: "10px 16px", fontSize: 13, display: "flex", alignItems: "center", gap: 8, zIndex: 60 }}>
      <Check size={14} color={color} /> {toast.msg}
    </div>
  );
}
