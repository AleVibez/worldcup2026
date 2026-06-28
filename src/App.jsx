import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ─── DATA ────────────────────────────────────────────────────────────────────

const FLAGS = {
  "Argentina":"🇦🇷","Brazil":"🇧🇷","France":"🇫🇷","England":"🏴󠁧󠁢󠁥󠁮󠁧󠁿","Spain":"🇪🇸","Germany":"🇩🇪",
  "Portugal":"🇵🇹","Netherlands":"🇳🇱","Belgium":"🇧🇪","Croatia":"🇭🇷","Uruguay":"🇺🇾",
  "Mexico":"🇲🇽","USA":"🇺🇸","Canada":"🇨🇦","Morocco":"🇲🇦","Senegal":"🇸🇳",
  "Japan":"🇯🇵","South Korea":"🇰🇷","Australia":"🇦🇺","Saudi Arabia":"🇸🇦","Iran":"🇮🇷",
  "Qatar":"🇶🇦","Ecuador":"🇪🇨","Peru":"🇵🇪","Colombia":"🇨🇴","Chile":"🇨🇱",
  "Switzerland":"🇨🇭","Denmark":"🇩🇰","Poland":"🇵🇱","Serbia":"🇷🇸","Austria":"🇦🇹","Turkey":"🇹🇷",
  "South Africa":"🇿🇦","Norway":"🇳🇴","Bosnia & Herz.":"🇧🇦","Sweden":"🇸🇪",
  "New Zealand":"🇳🇿","Tunisia":"🇹🇳","Iraq":"🇮🇶","Ivory Coast":"🇨🇮","Cape Verde":"🇨🇻",
  "Paraguay":"🇵🇾","Algeria":"🇩🇿","Jordan":"🇯🇴","Scotland":"🏴󠁧󠁢󠁳󠁣󠁴󠁿","Haiti":"🇭🇹","Curaçao":"🇨🇼",
  "TBD":"❓"
};

const ALL_TEAMS = [
  "Algeria","Argentina","Australia","Austria","Belgium","Bosnia & Herz.","Brazil","Canada",
  "Cape Verde","Chile","Colombia","Croatia","Curaçao","Denmark","Ecuador","Egypt",
  "England","France","Germany","Haiti","Iran","Iraq","Ivory Coast","Japan","Jordan",
  "Mexico","Morocco","Netherlands","New Zealand","Norway","Paraguay","Peru","Poland",
  "Portugal","Qatar","Saudi Arabia","Scotland","Senegal","Serbia","South Africa",
  "South Korea","Spain","Sweden","Switzerland","Tunisia","Turkey","Uruguay","USA"
];

const ROUNDS = ["R32","R16","QF","SF","F"];
const ROUND_LABELS = { R32:"Round of 32", R16:"Round of 16", QF:"Quarterfinals", SF:"Semifinals", F:"Final" };

// R32 indices: M73=0,M74=1,M75=2,M76=3,M77=4,M78=5,M79=6,M80=7,M81=8,M82=9,M83=10,M84=11,M85=12,M86=13,M87=14,M88=15
const R16_MAP = [[0,1],[2,3],[4,5],[6,7],[8,9],[10,11],[12,13],[14,15]];
const QF_MAP  = [[0,1],[2,3],[4,5],[6,7]];
const SF_MAP  = [[0,1],[2,3]];

function initBracket() {
  return {
    R32: [
      {id:"R32_0",  home:"Germany",      away:"Paraguay",      result:null, label:"M74 · Jun 29 · Boston"},
      {id:"R32_1",  home:"France",       away:"Sweden",        result:null, label:"M77 · Jun 30 · New Jersey"},
      {id:"R32_2",  home:"South Africa", away:"Canada",        result:null, label:"M73 · Jun 28 · Los Angeles"},
      {id:"R32_3",  home:"Netherlands",  away:"Morocco",       result:null, label:"M75 · Jun 29 · Monterrey"},
      {id:"R32_4",  home:"Portugal",     away:"Croatia",       result:null, label:"M83 · Jul 2 · Toronto"},
      {id:"R32_5",  home:"Spain",        away:"Austria",       result:null, label:"M84 · Jul 2 · Los Angeles"},
      {id:"R32_6",  home:"USA",          away:"Bosnia & Herz.",result:null, label:"M81 · Jul 1 · San Francisco"},
      {id:"R32_7",  home:"Belgium",      away:"Senegal",       result:null, label:"M82 · Jul 1 · Seattle"},
      {id:"R32_8",  home:"Brazil",       away:"Japan",         result:null, label:"M76 · Jun 29 · Houston"},
      {id:"R32_9",  home:"Ivory Coast",  away:"Norway",        result:null, label:"M78 · Jun 30 · Dallas"},
      {id:"R32_10", home:"Mexico",       away:"Ecuador",       result:null, label:"M79 · Jul 1 · Mexico City"},
      {id:"R32_11", home:"England",      away:"DR Congo",      result:null, label:"M80 · Jul 1 · Atlanta"},
      {id:"R32_12", home:"Argentina",    away:"Cape Verde",    result:null, label:"M86 · Jul 3 · Miami"},
      {id:"R32_13", home:"Australia",    away:"Egypt",         result:null, label:"M88 · Jul 3 · Dallas"},
      {id:"R32_14", home:"Switzerland",  away:"Algeria",       result:null, label:"M85 · Jul 2 · Vancouver"},
      {id:"R32_15", home:"Colombia",     away:"Ghana",         result:null, label:"M87 · Jul 3 · Kansas City"},
    ],
    R16: Array.from({length:8}, (_,i) => ({id:`R16_${i}`, home:"TBD", away:"TBD", result:null, label:`R16 Match ${i+1}`})),
    QF:  Array.from({length:4}, (_,i) => ({id:`QF_${i}`,  home:"TBD", away:"TBD", result:null, label:`QF Match ${i+1}`})),
    SF:  Array.from({length:2}, (_,i) => ({id:`SF_${i}`,  home:"TBD", away:"TBD", result:null, label:`SF Match ${i+1}`})),
    F:   [{id:"F_0", home:"TBD", away:"TBD", result:null, label:"Final · Jul 19 · MetLife Stadium"}],
  };
}

function propagate(b) {
  R16_MAP.forEach(([a,bb],i) => {
    b.R16[i].home = b.R32[a]?.result  || "TBD";
    b.R16[i].away = b.R32[bb]?.result || "TBD";
  });
  QF_MAP.forEach(([a,bb],i) => {
    b.QF[i].home = b.R16[a]?.result  || "TBD";
    b.QF[i].away = b.R16[bb]?.result || "TBD";
  });
  SF_MAP.forEach(([a,bb],i) => {
    b.SF[i].home = b.QF[a]?.result  || "TBD";
    b.SF[i].away = b.QF[bb]?.result || "TBD";
  });
  b.F[0].home = b.SF[0]?.result || "TBD";
  b.F[0].away = b.SF[1]?.result || "TBD";
}

function flag(t) { return FLAGS[t] || "🏳️"; }
function isTBD(t) { return !t || t === "TBD" || /^(TBD|Winner|Runner|3rd)/.test(t); }

// ─── SUPABASE HELPERS ─────────────────────────────────────────────────────────

async function loadFromDB() {
  const { data, error } = await supabase.from("bracket_data").select("data").eq("id","main").single();
  if (error || !data?.data) return null;
  return data.data;
}

async function saveToDB(payload) {
  await supabase.from("bracket_data").upsert({ id:"main", data: payload, updated_at: new Date().toISOString() });
}

// ─── APP ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab]           = useState("bracket");
  const [bracket, setBracket]   = useState(initBracket());
  const [friends, setFriends]   = useState([]);
  const [loaded, setLoaded]     = useState(false);
  const [saving, setSaving]     = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [focusMatch, setFocusMatch] = useState(null);
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [newFriendName, setNewFriendName] = useState("");
  const [predOpen, setPredOpen] = useState(null);
  const [note, setNote]         = useState("");

  // Load on mount
  useEffect(() => {
    loadFromDB().then(d => {
      if (d && d.bracket) { setBracket(d.bracket); setFriends(d.friends || []); }
      setLoaded(true);
    });
  }, []);

  // Save on change
  const save = useCallback(async (b, f) => {
    setSaving(true);
    await saveToDB({ bracket: b, friends: f });
    setSaving(false);
  }, []);

  useEffect(() => { if (loaded) save(bracket, friends); }, [bracket, friends, loaded]);

  function notify(m) { setNote(m); setTimeout(() => setNote(""), 2500); }

  function setResult(matchId, winner) {
    setBracket(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      for (const r of ROUNDS) { const m = next[r]?.find(x => x.id === matchId); if (m) { m.result = winner; break; } }
      propagate(next);
      return next;
    });
    notify(winner ? `✅ ${winner} advances!` : "Result cleared");
  }

  function setTeam(matchId, side, team) {
    setBracket(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      for (const r of ROUNDS) { const m = next[r]?.find(x => x.id === matchId); if (m) { m[side] = team; m.result = null; break; } }
      return next;
    });
  }

  function calcPoints(f) {
    let pts = 0;
    for (const r of ROUNDS) for (const m of bracket[r]) if (m.result && f.predictions?.[m.id] === m.result) pts++;
    return pts;
  }

  if (!loaded) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#060d1f",color:"#fff",fontSize:18,fontFamily:"'Segoe UI',sans-serif"}}>
      ⚽ Loading World Cup...
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#060d1f",color:"#fff",fontFamily:"'Segoe UI',sans-serif"}}>
      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#c8102e 0%,#8b0000 40%,#002868 100%)",padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 4px 24px rgba(0,0,0,0.6)"}}>
        <div>
          <div style={{fontSize:20,fontWeight:800,letterSpacing:.5}}>🏆 FIFA World Cup 2026</div>
          <div style={{fontSize:12,opacity:.75,marginTop:2}}>Bracket Challenge · USA · Canada · Mexico {saving && "· saving..."}</div>
        </div>
        <button onClick={() => setAdminOpen(true)} style={btnSt}>⚙️ Enter Results</button>
      </div>

      {note && <div style={{background:"#15803d",textAlign:"center",padding:"8px",fontSize:13,fontWeight:700}}>{note}</div>}

      <div style={{background:"rgba(245,158,11,0.12)",borderBottom:"1px solid rgba(245,158,11,0.25)",padding:"7px 20px",fontSize:12,color:"#fbbf24",textAlign:"center"}}>
        ⚡ Group stage ends June 27 — bracket fully locks then. Confirmed teams shown; TBD slots fill as groups finish.
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:2,padding:"14px 20px 0",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
        {[["bracket","🗂 Bracket"],["leaderboard","🏅 Leaderboard"],["friends","👥 Friends"]].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} style={{padding:"9px 18px",borderRadius:"8px 8px 0 0",border:"none",cursor:"pointer",fontWeight:700,fontSize:13,background:tab===k?"rgba(255,255,255,0.95)":"rgba(255,255,255,0.07)",color:tab===k?"#060d1f":"#ccc"}}>
            {l}
          </button>
        ))}
      </div>

      <div style={{padding:"20px",overflowX:"auto"}}>
        {tab === "bracket"     && <BracketView bracket={bracket} onMatchClick={m => { setFocusMatch(m); setAdminOpen(true); }} />}
        {tab === "leaderboard" && <Leaderboard friends={friends} bracket={bracket} calcPoints={calcPoints} />}
        {tab === "friends"     && <FriendsTab  friends={friends} bracket={bracket} setFriends={setFriends} onAdd={() => setAddFriendOpen(true)} onPred={i => setPredOpen(i)} calcPoints={calcPoints} />}
      </div>

      {adminOpen    && <AdminModal bracket={bracket} focusMatch={focusMatch} onClose={() => { setAdminOpen(false); setFocusMatch(null); }} onSetResult={setResult} onSetTeam={setTeam} />}
      {addFriendOpen && (
        <Modal onClose={() => setAddFriendOpen(false)} title="Add Player">
          <input value={newFriendName} onChange={e => setNewFriendName(e.target.value)} onKeyDown={e => { if (e.key==="Enter" && newFriendName.trim()) { setFriends(f => [...f, {name:newFriendName.trim(), predictions:{}}]); setNewFriendName(""); setAddFriendOpen(false); notify(`${newFriendName.trim()} added!`); }}} placeholder="Player name" style={inputSt} autoFocus />
          <button onClick={() => { if(!newFriendName.trim())return; setFriends(f=>[...f,{name:newFriendName.trim(),predictions:{}}]); setNewFriendName(""); setAddFriendOpen(false); notify(`${newFriendName.trim()} added!`); }} style={{...btnSt,width:"100%",padding:12}}>Add Player</button>
        </Modal>
      )}
      {predOpen !== null && <PredictionsModal friend={friends[predOpen]} bracket={bracket} onClose={() => setPredOpen(null)} onSave={p => { setFriends(f => f.map((fr,i) => i===predOpen ? {...fr,predictions:p} : fr)); setPredOpen(null); notify("Predictions saved!"); }} />}
    </div>
  );
}

// ─── BRACKET VIEW ─────────────────────────────────────────────────────────────

function BracketView({ bracket, onMatchClick }) {
  const gaps = { R32:4, R16:14, QF:36, SF:76, F:100 };
  return (
    <div style={{minWidth:950}}>
      <div style={{display:"flex",alignItems:"stretch"}}>
        {ROUNDS.map(rnd => (
          <div key={rnd} style={{flex:1,minWidth:155,display:"flex",flexDirection:"column",padding:"0 5px"}}>
            <div style={{textAlign:"center",fontSize:11,fontWeight:800,color:"#f59e0b",letterSpacing:1.5,marginBottom:10,borderBottom:"1px solid rgba(245,158,11,0.25)",paddingBottom:6,textTransform:"uppercase"}}>{ROUND_LABELS[rnd]}</div>
            <div style={{display:"flex",flexDirection:"column",justifyContent:"space-around",flex:1,gap:gaps[rnd]}}>
              {bracket[rnd].map(m => <MatchCard key={m.id} match={m} onClick={() => onMatchClick(m)} />)}
            </div>
          </div>
        ))}
      </div>
      {bracket.F[0].result && (
        <div style={{textAlign:"center",marginTop:32,padding:28,background:"linear-gradient(135deg,rgba(245,158,11,0.15),rgba(245,158,11,0.04))",borderRadius:16,border:"2px solid #f59e0b"}}>
          <div style={{fontSize:36}}>🏆</div>
          <div style={{fontSize:26,fontWeight:800,marginTop:8}}>{flag(bracket.F[0].result)} {bracket.F[0].result}</div>
          <div style={{color:"#f59e0b",fontSize:13,marginTop:4,fontWeight:600}}>2026 FIFA World Cup Champion</div>
        </div>
      )}
    </div>
  );
}

function MatchCard({ match, onClick }) {
  const { home, away, result, label } = match;
  return (
    <div onClick={onClick} title={label||""} style={{background:result?"rgba(21,128,61,0.1)":"rgba(255,255,255,0.04)",border:`1px solid ${result?"rgba(74,222,128,0.35)":"rgba(255,255,255,0.1)"}`,borderRadius:8,padding:"7px 10px",cursor:"pointer",minHeight:52}}>
      <TeamRow name={home} won={result===home} />
      <div style={{height:1,background:"rgba(255,255,255,0.08)",margin:"4px 0"}} />
      <TeamRow name={away} won={result===away} />
    </div>
  );
}

function TeamRow({ name, won }) {
  const tbd = isTBD(name);
  return (
    <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11.5,fontWeight:won?700:400,color:won?"#4ade80":tbd?"#6b7280":"#e2e8f0"}}>
      <span style={{fontSize:13,flexShrink:0}}>{tbd ? "❓" : flag(name)}</span>
      <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name||"TBD"}</span>
      {won && <span style={{color:"#4ade80",fontSize:10}}>✓</span>}
    </div>
  );
}

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────

function Leaderboard({ friends, bracket, calcPoints }) {
  const played = ROUNDS.reduce((s,r) => s + bracket[r].filter(m => m.result).length, 0);
  const sorted = [...friends].map(f => ({...f, pts:calcPoints(f)})).sort((a,b) => b.pts-a.pts);
  return (
    <div style={{maxWidth:560,margin:"0 auto"}}>
      <div style={{display:"flex",gap:12,marginBottom:20}}>
        {[["⚽",played,"Matches Played"],["🏅",31,"Total Picks"],["👥",friends.length,"Players"]].map(([ic,v,l]) => (
          <div key={l} style={{flex:1,background:"rgba(255,255,255,0.04)",borderRadius:12,padding:"14px 10px",textAlign:"center",border:"1px solid rgba(255,255,255,0.08)"}}>
            <div style={{fontSize:10,opacity:.5,marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>{l}</div>
            <div style={{fontSize:24,fontWeight:800,color:"#f59e0b"}}>{ic} {v}</div>
          </div>
        ))}
      </div>
      {sorted.length === 0 && <div style={{textAlign:"center",opacity:.4,marginTop:60,fontSize:15}}>No players yet — add some in the Friends tab!</div>}
      {sorted.map((f,i) => (
        <div key={f.name} style={{display:"flex",alignItems:"center",gap:14,background:i===0?"linear-gradient(90deg,rgba(245,158,11,0.18),rgba(245,158,11,0.03))":"rgba(255,255,255,0.03)",border:`1px solid ${i===0?"rgba(245,158,11,0.5)":"rgba(255,255,255,0.08)"}`,borderRadius:12,padding:"14px 18px",marginBottom:10}}>
          <div style={{fontSize:22,width:30,textAlign:"center"}}>{["🥇","🥈","🥉"][i]||`#${i+1}`}</div>
          <div style={{width:40,height:40,borderRadius:"50%",background:`hsl(${i*47+210},60%,45%)`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:16,flexShrink:0}}>{f.name[0].toUpperCase()}</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:15}}>{f.name}</div>
            <div style={{fontSize:11,opacity:.5,marginTop:2}}>{Object.keys(f.predictions||{}).length}/31 picks made</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:28,fontWeight:800,color:i===0?"#f59e0b":"#fff"}}>{f.pts}</div>
            <div style={{fontSize:10,opacity:.4}}>pts</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── FRIENDS TAB ──────────────────────────────────────────────────────────────

function FriendsTab({ friends, bracket, setFriends, onAdd, onPred, calcPoints }) {
  return (
    <div style={{maxWidth:560,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontWeight:700,fontSize:17}}>Players <span style={{opacity:.4,fontWeight:400}}>({friends.length}/8)</span></div>
        {friends.length < 8 && <button onClick={onAdd} style={btnSt}>+ Add Player</button>}
      </div>
      {friends.length === 0 && <div style={{textAlign:"center",opacity:.4,marginTop:60,fontSize:15}}>Add up to 8 players to track predictions!</div>}
      {friends.map((f,i) => (
        <div key={f.name} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:12,padding:"14px 18px",marginBottom:10,display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:42,height:42,borderRadius:"50%",background:`hsl(${i*47+210},60%,45%)`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:17,flexShrink:0}}>{f.name[0].toUpperCase()}</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:15}}>{f.name}</div>
            <div style={{fontSize:11,opacity:.5,marginTop:2}}>{Object.keys(f.predictions||{}).length}/31 picks · {calcPoints(f)} pts</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={() => onPred(i)} style={{...btnSt,background:"rgba(59,130,246,0.25)",fontSize:12,padding:"6px 12px"}}>✏️ Picks</button>
            <button onClick={() => setFriends(ff => ff.filter((_,j) => j!==i))} style={{...btnSt,background:"rgba(239,68,68,0.2)",fontSize:12,padding:"6px 10px"}}>✕</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── ADMIN MODAL ──────────────────────────────────────────────────────────────

function AdminModal({ bracket, focusMatch, onClose, onSetResult, onSetTeam }) {
  const [selRound, setSelRound] = useState(focusMatch?.round || "R32");
  const [selId, setSelId]       = useState(focusMatch?.id    || null);

  const matches = bracket[selRound] || [];
  const m = selId ? bracket[selRound]?.find(x => x.id === selId) : null;
  const canPick = m && !isTBD(m.home) && !isTBD(m.away);

  return (
    <Modal onClose={onClose} title="⚙️ Enter Results" wide>
      <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
        {ROUNDS.map(r => (
          <button key={r} onClick={() => { setSelRound(r); setSelId(null); }} style={{...btnSt,background:selRound===r?"#f59e0b":"rgba(255,255,255,0.08)",color:selRound===r?"#000":"#fff",fontSize:12,padding:"6px 12px"}}>{ROUND_LABELS[r]}</button>
        ))}
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16,maxHeight:130,overflowY:"auto"}}>
        {matches.map(match => (
          <button key={match.id} onClick={() => setSelId(match.id)} style={{padding:"6px 10px",borderRadius:7,border:`1px solid ${selId===match.id?"#60a5fa":match.result?"rgba(74,222,128,0.4)":"rgba(255,255,255,0.15)"}`,background:selId===match.id?"rgba(96,165,250,0.2)":"rgba(255,255,255,0.04)",color:"#fff",cursor:"pointer",fontSize:11.5,opacity:(isTBD(match.home)||isTBD(match.away))?.5:1}}>
            {isTBD(match.home)?"❓":flag(match.home)} vs {isTBD(match.away)?"❓":flag(match.away)}
            {match.result && <span style={{color:"#4ade80",marginLeft:4}}>✓</span>}
          </button>
        ))}
      </div>
      {m ? (
        <div style={{background:"rgba(255,255,255,0.04)",borderRadius:12,padding:16,border:"1px solid rgba(255,255,255,0.1)"}}>
          <div style={{fontSize:11,opacity:.5,marginBottom:10,textTransform:"uppercase",letterSpacing:1}}>{m.label}</div>
          {selRound === "R32" && (
            <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
              {["home","away"].map(side => (
                <div key={side} style={{flex:1,minWidth:140}}>
                  <div style={{fontSize:11,opacity:.5,marginBottom:5,textTransform:"uppercase"}}>{side} team</div>
                  <select value={m[side]} onChange={e => onSetTeam(m.id, side, e.target.value)} style={selSt}>
                    <option value="TBD">❓ TBD</option>
                    {ALL_TEAMS.map(t => <option key={t} value={t}>{flag(t)} {t}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}
          <div style={{fontSize:11,opacity:.5,marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>Match Winner</div>
          {!canPick && <div style={{opacity:.4,fontSize:13}}>Both teams must be confirmed before picking a winner.</div>}
          {canPick && (
            <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
              {[m.home, m.away].map(t => (
                <button key={t} onClick={() => onSetResult(m.id, t)} style={{...btnSt,flex:1,minWidth:110,padding:"13px 8px",fontSize:14,background:m.result===t?"#15803d":"rgba(255,255,255,0.07)",border:`2px solid ${m.result===t?"#4ade80":"transparent"}`}}>
                  {flag(t)} {t} {m.result===t?"✓":""}
                </button>
              ))}
              {m.result && <button onClick={() => onSetResult(m.id, null)} style={{...btnSt,background:"rgba(239,68,68,0.25)",fontSize:12,padding:"8px 12px"}}>Clear</button>}
            </div>
          )}
        </div>
      ) : (
        <div style={{opacity:.4,fontSize:13,textAlign:"center",padding:"20px 0"}}>Select a match above to enter its result.</div>
      )}
    </Modal>
  );
}

// ─── PREDICTIONS MODAL ────────────────────────────────────────────────────────

function PredictionsModal({ friend, bracket, onClose, onSave }) {
  const [preds, setPreds] = useState({...friend.predictions});
  return (
    <Modal onClose={() => onSave(preds)} title={`✏️ ${friend.name}'s Picks`} wide>
      <div style={{maxHeight:"62vh",overflowY:"auto",paddingRight:4}}>
        {ROUNDS.map(rnd => (
          <div key={rnd} style={{marginBottom:18}}>
            <div style={{fontWeight:800,color:"#f59e0b",fontSize:12,marginBottom:8,textTransform:"uppercase",letterSpacing:1.5}}>{ROUND_LABELS[rnd]}</div>
            {bracket[rnd].map(m => {
              const teams = [m.home, m.away].filter(t => !isTBD(t));
              const actual = m.result;
              const correct = preds[m.id] && actual && preds[m.id] === actual;
              const wrong   = preds[m.id] && actual && preds[m.id] !== actual;
              return (
                <div key={m.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:7,background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"7px 12px",border:`1px solid ${correct?"rgba(74,222,128,0.3)":wrong?"rgba(239,68,68,0.3)":"rgba(255,255,255,0.07)"}`}}>
                  <div style={{flex:1,fontSize:12,opacity:.65,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{flag(m.home)} {m.home} vs {flag(m.away)} {m.away}</div>
                  <select value={preds[m.id]||""} onChange={e => setPreds(p => ({...p, [m.id]: e.target.value||undefined}))} style={{...selSt,width:130,fontSize:12}}>
                    <option value="">Pick winner</option>
                    {teams.map(t => <option key={t} value={t}>{flag(t)} {t}</option>)}
                    {teams.length === 0 && <option disabled>Teams TBD</option>}
                  </select>
                  {correct && <span style={{color:"#4ade80",fontSize:16}}>✓</span>}
                  {wrong   && <span style={{color:"#f87171",fontSize:16}}>✗</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <button onClick={() => onSave(preds)} style={{...btnSt,width:"100%",marginTop:12,padding:13,fontSize:15}}>💾 Save Picks</button>
    </Modal>
  );
}

// ─── MODAL WRAPPER ────────────────────────────────────────────────────────────

function Modal({ onClose, title, children, wide }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16}}>
      <div style={{background:"#111827",borderRadius:16,padding:22,width:"100%",maxWidth:wide?660:400,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 80px rgba(0,0,0,0.7)",border:"1px solid rgba(255,255,255,0.1)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontWeight:800,fontSize:17}}>{title}</div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.08)",border:"none",color:"#fff",fontSize:18,cursor:"pointer",width:30,height:30,borderRadius:6}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── SHARED STYLES ────────────────────────────────────────────────────────────

const btnSt   = {background:"linear-gradient(135deg,#2563eb,#1d4ed8)",border:"none",color:"#fff",padding:"9px 18px",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:13};
const inputSt = {width:"100%",padding:"10px 14px",borderRadius:8,border:"1px solid rgba(255,255,255,0.15)",background:"rgba(255,255,255,0.06)",color:"#fff",fontSize:15,marginBottom:12,boxSizing:"border-box",outline:"none"};
const selSt   = {padding:"7px 10px",borderRadius:7,border:"1px solid rgba(255,255,255,0.15)",background:"#1f2937",color:"#fff",fontSize:13,width:"100%",cursor:"pointer"};
