import { useState, useMemo, useEffect, useRef, useCallback } from "react";

const ADSENSE_CLIENT = "ca-pub-XXXXXXXXXXXXXXXX";
const ADSENSE_SLOT_BANNER = "1234567890";
const ADSENSE_SLOT_INLINE = "0987654321";

function AdBanner({ slot, style = {}, format = "auto" }) {
  const ref = useRef(null);
  useEffect(() => { try { if (window.adsbygoogle && ref.current) (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch {} }, []);
  const isDev = ADSENSE_CLIENT.includes("XXXXXXXX");
  if (isDev) return (
    <div style={{ background:"linear-gradient(135deg,#0d0d1e,#111128)", border:"1px dashed #2a2a50", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:4, color:"#3a3a6a", fontSize:11, fontFamily:"monospace", ...style }}>
      <span style={{fontSize:16}}>📢</span><span>Anúncio Google AdSense</span>
    </div>
  );
  return <div ref={ref} style={style}><ins className="adsbygoogle" style={{display:"block"}} data-ad-client={ADSENSE_CLIENT} data-ad-slot={slot} data-ad-format={format} data-full-width-responsive="true"/></div>;
}

// ── DADOS FIFA 2026 ──────────────────────────────────────────────────────────
const GRUPOS = {
  A:["México","África do Sul","Coreia do Sul","Dinamarca"],
  B:["Canadá","Bósnia e Herz.","Catar","Suíça"],
  C:["Brasil","Marrocos","Haiti","Escócia"],
  D:["Estados Unidos","Paraguai","Austrália","Turquia"],
  E:["Alemanha","Curaçao","Costa do Marfim","Equador"],
  F:["Holanda","Japão","Suécia","Tunísia"],
  G:["Bélgica","Egito","Irã","Nova Zelândia"],
  H:["Espanha","Cabo Verde","Arábia Saudita","Uruguai"],
  I:["França","Senegal","Iraque","Noruega"],
  J:["Argentina","Argélia","Áustria","Jordânia"],
  K:["Portugal","RD do Congo","Uzbequistão","Colômbia"],
  L:["Inglaterra","Croácia","Panamá","Gana"],
};
const TODOS_TIMES = Object.values(GRUPOS).flat();
const FIGS = 5;
const BANDEIRAS = {
  México:"🇲🇽","África do Sul":"🇿🇦","Coreia do Sul":"🇰🇷",Dinamarca:"🇩🇰",
  Canadá:"🇨🇦","Bósnia e Herz.":"🇧🇦",Catar:"🇶🇦",Suíça:"🇨🇭",
  Brasil:"🇧🇷",Marrocos:"🇲🇦",Haiti:"🇭🇹",Escócia:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "Estados Unidos":"🇺🇸",Paraguai:"🇵🇾",Austrália:"🇦🇺",Turquia:"🇹🇷",
  Alemanha:"🇩🇪",Curaçao:"🇨🇼","Costa do Marfim":"🇨🇮",Equador:"🇪🇨",
  Holanda:"🇳🇱",Japão:"🇯🇵",Suécia:"🇸🇪",Tunísia:"🇹🇳",
  Bélgica:"🇧🇪",Egito:"🇪🇬",Irã:"🇮🇷","Nova Zelândia":"🇳🇿",
  Espanha:"🇪🇸","Cabo Verde":"🇨🇻","Arábia Saudita":"🇸🇦",Uruguai:"🇺🇾",
  França:"🇫🇷",Senegal:"🇸🇳",Iraque:"🇮🇶",Noruega:"🇳🇴",
  Argentina:"🇦🇷",Argélia:"🇩🇿",Áustria:"🇦🇹",Jordânia:"🇯🇴",
  Portugal:"🇵🇹","RD do Congo":"🇨🇩",Uzbequistão:"🇺🇿",Colômbia:"🇨🇴",
  Inglaterra:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",Croácia:"🇭🇷",Panamá:"🇵🇦",Gana:"🇬🇭",
};

const ST = { F:"falta", T:"tenho", R:"repetida" };
const CICLO = { falta:"tenho", tenho:"repetida", repetida:"falta" };
const COR = {
  falta:   { bg:"#0f0f1c", border:"#22224a", text:"#3a3a70", icon:"·" },
  tenho:   { bg:"#051510", border:"#15803d", text:"#4ade80", icon:"✔" },
  repetida:{ bg:"#160e00", border:"#b45309", text:"#fbbf24", icon:"★" },
};

const K = {
  users:   () => "copa26:users",
  figs:    (uid) => `copa26:figs:${uid}`,
  profile: (uid) => `copa26:profile:${uid}`,
  friends: (uid) => `copa26:friends:${uid}`,
  invites: (uid) => `copa26:invites:${uid}`,
};

function estadoVazio() {
  const s = {};
  TODOS_TIMES.forEach(t => { for (let i = 1; i <= FIGS; i++) s[`${t}-${i}`] = ST.F; });
  return s;
}
function calcStats(figs) {
  const vals = Object.values(figs);
  const tenho = vals.filter(v => v === ST.T).length;
  const rep   = vals.filter(v => v === ST.R).length;
  const total = vals.length;
  return { total, tenho, rep, falta: total - tenho - rep, pct: Math.round(((tenho + rep) / total) * 100) };
}
async function sg(key) { try { const r = await window.storage.get(key, true); return r?.value ? JSON.parse(r.value) : null; } catch { return null; } }
async function ss(key, val) { try { await window.storage.set(key, JSON.stringify(val), true); return true; } catch { return false; } }

// ── AUTH ─────────────────────────────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [modo, setModo] = useState("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setErro(""); setLoading(true);
    const users = await sg(K.users()) || {};
    if (modo === "registro") {
      if (!nome.trim()) { setErro("Digite seu nome."); setLoading(false); return; }
      if (email.length < 5) { setErro("Email inválido."); setLoading(false); return; }
      if (senha.length < 4) { setErro("Senha com mínimo 4 caracteres."); setLoading(false); return; }
      if (users[email]) { setErro("Email já cadastrado."); setLoading(false); return; }
      const uid = `u_${Date.now()}`;
      users[email] = { uid, nome, senha };
      await ss(K.users(), users);
      await ss(K.figs(uid), estadoVazio());
      await ss(K.profile(uid), { nome, email, pct: 0, tenho: 0, rep: 0, falta: 240, repetidas: [] });
      onLogin({ uid, nome, email });
    } else {
      const u = users[email];
      if (!u || u.senha !== senha) { setErro("Email ou senha incorretos."); setLoading(false); return; }
      onLogin({ uid: u.uid, nome: u.nome, email });
    }
    setLoading(false);
  }

  const Field = ({ ph, val, set, type = "text" }) => (
    <input placeholder={ph} value={val} onChange={e => set(e.target.value)} type={type} onKeyDown={e => e.key === "Enter" && submit()}
      style={{ width:"100%", padding:"11px 14px", borderRadius:8, border:"1px solid #1e2040", background:"#0a0a18", color:"#dde0ff", fontSize:14, outline:"none", boxSizing:"border-box", marginBottom:10, fontFamily:"inherit" }}/>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#07070e", display:"flex", alignItems:"center", justifyContent:"center", padding:16, fontFamily:"'Trebuchet MS',sans-serif" }}>
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", overflow:"hidden" }}>
        {["⚽","🏆","⭐","🇧🇷","⚽","🌟"].map((e,i) => <div key={i} style={{ position:"absolute", fontSize:80, opacity:0.025, top:`${8+i*15}%`, left:`${4+i*16}%`, transform:`rotate(${i*20}deg)` }}>{e}</div>)}
      </div>
      <div style={{ width:"100%", maxWidth:380, position:"relative" }}>
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ fontSize:50, marginBottom:6 }}>⚽</div>
          <h1 style={{ margin:0, fontSize:22, fontWeight:900, color:"#eef0ff", letterSpacing:-0.5 }}>Álbum Copa 2026</h1>
          <p style={{ margin:"4px 0 0", fontSize:11, color:"#252550", letterSpacing:2 }}>FIGURINHAS · AMIGOS · TROCAS</p>
        </div>
        <AdBanner slot={ADSENSE_SLOT_INLINE} style={{ height:80, marginBottom:16, borderRadius:8 }}/>
        <div style={{ background:"#0d0d1e", border:"1px solid #1e1e3a", borderRadius:16, padding:26, boxShadow:"0 20px 60px #00000090" }}>
          <div style={{ display:"flex", gap:3, marginBottom:22, background:"#07070e", borderRadius:8, padding:3 }}>
            {["login","registro"].map(m => (
              <button key={m} onClick={() => { setModo(m); setErro(""); }} style={{ flex:1, padding:"8px", borderRadius:6, border:"none", cursor:"pointer", background:modo===m?"#1a1a38":"transparent", color:modo===m?"#818cf8":"#252550", fontSize:13, fontWeight:700 }}>
                {m === "login" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>
          {modo === "registro" && <Field ph="Seu nome" val={nome} set={setNome}/>}
          <Field ph="Email" val={email} set={setEmail} type="email"/>
          <Field ph="Senha" val={senha} set={setSenha} type="password"/>
          {erro && <div style={{ background:"#1a0808", border:"1px solid #7f1d1d", borderRadius:6, padding:"8px 12px", marginBottom:10, fontSize:12, color:"#fca5a5" }}>{erro}</div>}
          <button onClick={submit} disabled={loading} style={{ width:"100%", padding:"12px", borderRadius:8, border:"none", cursor:"pointer", background:loading?"#1a1a38":"linear-gradient(135deg,#4f46e5,#7c3aed)", color:"#fff", fontSize:15, fontWeight:800, boxShadow:loading?"none":"0 4px 20px #4f46e550" }}>
            {loading ? "Aguarde..." : modo === "login" ? "Entrar →" : "Criar conta →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ABA ESTATÍSTICAS ─────────────────────────────────────────────────────────
function AbaEstatisticas({ figs }) {
  const [ordenar, setOrdenar] = useState("grupo");   // grupo | pct_asc | pct_desc | nome
  const [filtroSt, setFiltroSt] = useState("todos"); // todos | completo | parcial | vazio
  const [buscaSt, setBuscaSt] = useState("");

  // Calcula stats por país
  const statsPaises = useMemo(() => {
    return TODOS_TIMES.map(time => {
      const ids = Array.from({ length: FIGS }, (_, i) => `${time}-${i + 1}`);
      const tenho = ids.filter(id => figs[id] === ST.T).length;
      const rep   = ids.filter(id => figs[id] === ST.R).length;
      const coletadas = tenho + rep;
      const pct = Math.round((coletadas / FIGS) * 100);
      const grupo = Object.entries(GRUPOS).find(([, ts]) => ts.includes(time))?.[0] || "?";
      return { time, grupo, tenho, rep, coletadas, falta: FIGS - coletadas, total: FIGS, pct };
    });
  }, [figs]);

  // Stats globais resumidas
  const resumo = useMemo(() => {
    const completos   = statsPaises.filter(s => s.pct === 100).length;
    const parciais    = statsPaises.filter(s => s.pct > 0 && s.pct < 100).length;
    const zerados     = statsPaises.filter(s => s.pct === 0).length;
    const totalFigs   = statsPaises.reduce((a, s) => a + s.coletadas, 0);
    const totalRep    = statsPaises.reduce((a, s) => a + s.rep, 0);
    const mediaPct    = Math.round(statsPaises.reduce((a, s) => a + s.pct, 0) / statsPaises.length);
    return { completos, parciais, zerados, totalFigs, totalRep, mediaPct };
  }, [statsPaises]);

  // Stats por grupo
  const statsGrupos = useMemo(() => {
    return Object.entries(GRUPOS).map(([g, times]) => {
      const sp = times.map(t => statsPaises.find(s => s.time === t));
      const totalFigs = sp.reduce((a, s) => a + s.coletadas, 0);
      const maxFigs = times.length * FIGS;
      const pct = Math.round((totalFigs / maxFigs) * 100);
      return { grupo: g, times, totalFigs, maxFigs, pct, completos: sp.filter(s => s.pct === 100).length };
    });
  }, [statsPaises]);

  // Filtra e ordena
  const listagem = useMemo(() => {
    let lista = [...statsPaises];
    if (buscaSt) lista = lista.filter(s => s.time.toLowerCase().includes(buscaSt.toLowerCase()));
    if (filtroSt === "completo") lista = lista.filter(s => s.pct === 100);
    if (filtroSt === "parcial")  lista = lista.filter(s => s.pct > 0 && s.pct < 100);
    if (filtroSt === "vazio")    lista = lista.filter(s => s.pct === 0);
    if (ordenar === "grupo")     lista.sort((a, b) => a.grupo.localeCompare(b.grupo) || GRUPOS[a.grupo].indexOf(a.time) - GRUPOS[b.grupo].indexOf(b.time));
    if (ordenar === "pct_desc")  lista.sort((a, b) => b.pct - a.pct || a.time.localeCompare(b.time));
    if (ordenar === "pct_asc")   lista.sort((a, b) => a.pct - b.pct || a.time.localeCompare(b.time));
    if (ordenar === "nome")      lista.sort((a, b) => a.time.localeCompare(b.time));
    return lista;
  }, [statsPaises, ordenar, filtroSt, buscaSt]);

  const corPct = (pct) => pct === 100 ? "#4ade80" : pct >= 60 ? "#86efac" : pct >= 30 ? "#fbbf24" : pct > 0 ? "#f97316" : "#3a3a70";
  const bgPct  = (pct) => pct === 100 ? "#15803d" : pct >= 60 ? "#166534" : pct >= 30 ? "#92400e" : pct > 0 ? "#7c2d12" : "#1a1a30";

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

      {/* ── CARDS RESUMO GLOBAL ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:8 }}>
        {[
          { icon:"📊", label:"Progresso geral", val:`${resumo.mediaPct}%`, sub:"média por seleção", c:"#818cf8", bg:"#0f0e2a" },
          { icon:"✅", label:"Álbuns completos", val:resumo.completos, sub:`de 48 seleções`, c:"#4ade80", bg:"#061510" },
          { icon:"⚡", label:"Em andamento", val:resumo.parciais, sub:"seleções parciais", c:"#fbbf24", bg:"#160e00" },
          { icon:"⭕", label:"Não iniciadas", val:resumo.zerados, sub:"seleções sem fig.", c:"#f87171", bg:"#1a0808" },
          { icon:"🃏", label:"Figs coletadas", val:resumo.totalFigs, sub:`de ${48 * FIGS} totais`, c:"#a78bfa", bg:"#12102a" },
          { icon:"★", label:"Repetidas", val:resumo.totalRep, sub:"disponíveis p/ troca", c:"#fbbf24", bg:"#160e00" },
        ].map(card => (
          <div key={card.label} style={{ background:card.bg, border:`1px solid ${card.c}22`, borderRadius:12, padding:"12px 14px" }}>
            <div style={{ fontSize:18, marginBottom:4 }}>{card.icon}</div>
            <div style={{ fontSize:22, fontWeight:900, color:card.c, lineHeight:1 }}>{card.val}</div>
            <div style={{ fontSize:10, color:"#4a4a6a", marginTop:3 }}>{card.label}</div>
            <div style={{ fontSize:9, color:"#2a2a4a", marginTop:1 }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* ── PROGRESSO POR GRUPO ── */}
      <div style={{ background:"#0b0b1a", border:"1px solid #16163a", borderRadius:12, padding:16 }}>
        <div style={{ fontSize:13, fontWeight:800, color:"#c0c3e0", marginBottom:12 }}>📁 Progresso por Grupo</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:8 }}>
          {statsGrupos.map(({ grupo, times, totalFigs, maxFigs, pct, completos }) => (
            <div key={grupo} style={{ background:"#0d0d1e", borderRadius:10, border:`1px solid ${pct===100?"#15803d55":"#16163a"}`, padding:"10px 12px" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                <div style={{ fontSize:12, fontWeight:800, color:"#818cf8" }}>Grupo {grupo}</div>
                <div style={{ fontSize:14, fontWeight:900, color:corPct(pct) }}>{pct}%</div>
              </div>
              <div style={{ height:5, background:"#16163a", borderRadius:99, overflow:"hidden", marginBottom:6 }}>
                <div style={{ height:"100%", width:`${pct}%`, background:pct===100?"#15803d":"linear-gradient(90deg,#4f46e5,#818cf8)", borderRadius:99, transition:"width 0.5s" }}/>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ fontSize:10, color:"#25254a" }}>
                  {times.slice(0,2).map(t => BANDEIRAS[t]||"🏳️").join(" ")} {times.length > 2 ? `+${times.length-2}` : ""}
                </div>
                <div style={{ fontSize:10, color:"#25254a" }}>{totalFigs}/{maxFigs} figs · {completos} ✅</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FILTROS + ORDENAÇÃO ── */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
        <div style={{ fontSize:11, color:"#25254a", fontWeight:700, marginRight:2 }}>Filtrar:</div>
        {[
          { k:"todos", l:"Todas (48)" },
          { k:"completo", l:`✅ Completas (${resumo.completos})` },
          { k:"parcial",  l:`⚡ Parciais (${resumo.parciais})` },
          { k:"vazio",    l:`⭕ Zeradas (${resumo.zerados})` },
        ].map(f => (
          <button key={f.k} onClick={() => setFiltroSt(f.k)} style={{
            padding:"4px 11px", borderRadius:99, cursor:"pointer",
            border:`1px solid ${filtroSt===f.k?"#4f46e5":"#16163a"}`,
            background:filtroSt===f.k?"#4f46e5":"transparent",
            color:filtroSt===f.k?"#c7d2fe":"#252545", fontSize:10, fontWeight:700,
          }}>{f.l}</button>
        ))}

        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontSize:10, color:"#25254a" }}>Ordenar:</span>
          <select value={ordenar} onChange={e => setOrdenar(e.target.value)} style={{ padding:"4px 8px", borderRadius:7, border:"1px solid #16163a", background:"#0b0b1a", color:"#d8daf0", fontSize:10, outline:"none", cursor:"pointer" }}>
            <option value="grupo">Por grupo</option>
            <option value="pct_desc">Mais completas</option>
            <option value="pct_asc">Menos completas</option>
            <option value="nome">Nome A-Z</option>
          </select>
          <input placeholder="🔍 Buscar..." value={buscaSt} onChange={e => setBuscaSt(e.target.value)} style={{ padding:"4px 9px", borderRadius:99, border:"1px solid #16163a", background:"#0b0b1a", color:"#d8daf0", fontSize:10, outline:"none", width:100 }}/>
        </div>
      </div>

      {/* ── TABELA DE PAÍSES ── */}
      <div style={{ background:"#0b0b1a", border:"1px solid #16163a", borderRadius:12, overflow:"hidden" }}>
        {/* Cabeçalho */}
        <div style={{ display:"grid", gridTemplateColumns:"36px 1fr 56px 200px 60px 60px 60px", gap:0, background:"#0d0d1e", borderBottom:"1px solid #16163a", padding:"8px 14px", fontSize:10, fontWeight:700, color:"#3a3a6a", letterSpacing:0.5 }}>
          <div></div>
          <div>SELEÇÃO</div>
          <div style={{ textAlign:"center" }}>GRP</div>
          <div style={{ paddingLeft:8 }}>PROGRESSO</div>
          <div style={{ textAlign:"center" }}>✔ TENHO</div>
          <div style={{ textAlign:"center" }}>★ REP.</div>
          <div style={{ textAlign:"center" }}>· FALTA</div>
        </div>

        {listagem.length === 0 ? (
          <div style={{ textAlign:"center", padding:32, color:"#25254a", fontSize:12 }}>Nenhuma seleção encontrada.</div>
        ) : listagem.map((s, i) => (
          <div key={s.time} style={{
            display:"grid", gridTemplateColumns:"36px 1fr 56px 200px 60px 60px 60px",
            gap:0, padding:"9px 14px", alignItems:"center",
            background: s.pct === 100 ? "#06150d" : i % 2 === 0 ? "#0b0b1a" : "#0d0d1e",
            borderBottom:"1px solid #12122a",
            transition:"background 0.15s",
          }}>
            {/* Bandeira */}
            <div style={{ fontSize:20 }}>{BANDEIRAS[s.time] || "🏳️"}</div>

            {/* Nome */}
            <div>
              <div style={{ fontSize:12, fontWeight:700, color: s.pct === 100 ? "#4ade80" : "#c0c3e0" }}>
                {s.time} {s.pct === 100 ? "✅" : ""}
              </div>
            </div>

            {/* Grupo */}
            <div style={{ textAlign:"center" }}>
              <span style={{ fontSize:10, fontWeight:700, color:"#4f46e5", background:"#1a1a38", padding:"2px 7px", borderRadius:99 }}>
                {s.grupo}
              </span>
            </div>

            {/* Barra de progresso */}
            <div style={{ paddingLeft:8, paddingRight:12 }}>
              <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                <div style={{ flex:1, height:6, background:"#16163a", borderRadius:99, overflow:"hidden" }}>
                  <div style={{
                    height:"100%", width:`${s.pct}%`,
                    background: s.pct === 100 ? "#15803d" : s.pct >= 60 ? "linear-gradient(90deg,#15803d,#4ade80)" : s.pct >= 30 ? "linear-gradient(90deg,#92400e,#fbbf24)" : "linear-gradient(90deg,#7c2d12,#f97316)",
                    borderRadius:99, transition:"width 0.5s",
                  }}/>
                </div>
                <span style={{ fontSize:11, fontWeight:800, color:corPct(s.pct), minWidth:30, textAlign:"right" }}>{s.pct}%</span>
              </div>
              <div style={{ fontSize:9, color:"#25254a", marginTop:2 }}>{s.coletadas} de {s.total} figurinhas</div>
            </div>

            {/* Tenho */}
            <div style={{ textAlign:"center" }}>
              <span style={{ fontSize:13, fontWeight:800, color:"#4ade80" }}>{s.tenho}</span>
            </div>

            {/* Repetidas */}
            <div style={{ textAlign:"center" }}>
              <span style={{ fontSize:13, fontWeight:800, color: s.rep > 0 ? "#fbbf24" : "#252545" }}>{s.rep}</span>
            </div>

            {/* Faltam */}
            <div style={{ textAlign:"center" }}>
              <span style={{ fontSize:13, fontWeight:800, color: s.falta === 0 ? "#25254a" : "#f87171" }}>{s.falta}</span>
            </div>
          </div>
        ))}

        {/* Rodapé com totais */}
        <div style={{ display:"grid", gridTemplateColumns:"36px 1fr 56px 200px 60px 60px 60px", gap:0, padding:"10px 14px", background:"#0f0f22", borderTop:"2px solid #16163a", alignItems:"center" }}>
          <div></div>
          <div style={{ fontSize:11, fontWeight:800, color:"#818cf8" }}>TOTAL ({listagem.length} seleções)</div>
          <div></div>
          <div style={{ paddingLeft:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:7 }}>
              <div style={{ flex:1, height:6, background:"#16163a", borderRadius:99, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${Math.round(listagem.reduce((a,s)=>a+s.pct,0)/(listagem.length||1))}%`, background:"linear-gradient(90deg,#4f46e5,#4ade80)", borderRadius:99 }}/>
              </div>
              <span style={{ fontSize:11, fontWeight:800, color:"#818cf8", minWidth:30, textAlign:"right" }}>
                {Math.round(listagem.reduce((a,s)=>a+s.pct,0)/(listagem.length||1))}%
              </span>
            </div>
          </div>
          <div style={{ textAlign:"center", fontSize:12, fontWeight:800, color:"#4ade80" }}>{listagem.reduce((a,s)=>a+s.tenho,0)}</div>
          <div style={{ textAlign:"center", fontSize:12, fontWeight:800, color:"#fbbf24" }}>{listagem.reduce((a,s)=>a+s.rep,0)}</div>
          <div style={{ textAlign:"center", fontSize:12, fontWeight:800, color:"#f87171" }}>{listagem.reduce((a,s)=>a+s.falta,0)}</div>
        </div>
      </div>

      {/* Legenda de cores */}
      <div style={{ display:"flex", gap:12, flexWrap:"wrap", alignItems:"center", padding:"8px 12px", background:"#0b0b1a", borderRadius:9, border:"1px solid #16163a" }}>
        <span style={{ fontSize:10, color:"#25254a", fontWeight:700 }}>Legenda:</span>
        {[
          { cor:"#4ade80", label:"100% — Completo" },
          { cor:"#86efac", label:"60–99% — Quase lá" },
          { cor:"#fbbf24", label:"30–59% — Metade" },
          { cor:"#f97316", label:"1–29% — Iniciado" },
          { cor:"#3a3a70", label:"0% — Não iniciado" },
        ].map(l => (
          <div key={l.label} style={{ display:"flex", alignItems:"center", gap:5 }}>
            <div style={{ width:10, height:10, borderRadius:2, background:l.cor }}/>
            <span style={{ fontSize:10, color:"#2e2e5a" }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── APP PRINCIPAL ─────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser]       = useState(null);
  const [figs, setFigs]       = useState(estadoVazio);
  const [aba, setAba]         = useState("album");
  const [grupo, setGrupo]     = useState("C");
  const [filtro, setFiltro]   = useState("todos");
  const [busca, setBusca]     = useState("");
  const [syncSt, setSyncSt]   = useState("idle");
  const [friends, setFriends] = useState([]);
  const [friendProfiles, setFriendProfiles] = useState({});
  const [invites, setInvites] = useState([]);
  const [addEmail, setAddEmail] = useState("");
  const [addMsg, setAddMsg]   = useState(null);
  const [loadingF, setLoadingF] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    if (!user) return;
    sg(K.figs(user.uid)).then(d => { if (d) setFigs(d); });
    loadFriends();
    loadInvites();
  }, [user]);

  const salvar = useCallback(async (novoFigs) => {
    if (!user) return;
    setSyncSt("saving");
    const st = calcStats(novoFigs);
    const reps = Object.entries(novoFigs).filter(([, v]) => v === ST.R).map(([k]) => k);
    await ss(K.figs(user.uid), novoFigs);
    await ss(K.profile(user.uid), { nome: user.nome, email: user.email, ...st, repetidas: reps });
    setSyncSt("ok"); setTimeout(() => setSyncSt("idle"), 2000);
  }, [user]);

  const ciclar = (id) => {
    setFigs(prev => {
      const novo = { ...prev, [id]: CICLO[prev[id]] };
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => salvar(novo), 700);
      return novo;
    });
  };

  async function loadFriends() {
    if (!user) return; setLoadingF(true);
    const fl = await sg(K.friends(user.uid)) || [];
    setFriends(fl);
    const profiles = {};
    await Promise.all(fl.map(async uid => { const p = await sg(K.profile(uid)); if (p) profiles[uid] = p; }));
    setFriendProfiles(profiles); setLoadingF(false);
  }
  async function loadInvites() { if (!user) return; const inv = await sg(K.invites(user.uid)) || []; setInvites(inv); }

  async function sendRequest() {
    setAddMsg(null);
    const em = addEmail.trim().toLowerCase();
    if (!em) return;
    if (em === user.email) { setAddMsg({ t:"err", m:"Esse é o seu próprio email! 😄" }); return; }
    const users = await sg(K.users()) || {};
    const target = users[em];
    if (!target) { setAddMsg({ t:"err", m:"Usuário não encontrado." }); return; }
    if (friends.includes(target.uid)) { setAddMsg({ t:"err", m:"Vocês já são amigos!" }); return; }
    const invs = await sg(K.invites(target.uid)) || [];
    if (invs.some(i => i.fromUid === user.uid)) { setAddMsg({ t:"err", m:"Pedido já enviado." }); return; }
    invs.push({ fromUid:user.uid, fromNome:user.nome, fromEmail:user.email, ts:Date.now() });
    await ss(K.invites(target.uid), invs);
    setAddMsg({ t:"ok", m:`Pedido enviado para ${target.nome}! ✔` }); setAddEmail("");
  }
  async function acceptInvite(inv) {
    const myF = await sg(K.friends(user.uid)) || [];
    if (!myF.includes(inv.fromUid)) myF.push(inv.fromUid);
    await ss(K.friends(user.uid), myF);
    const theirF = await sg(K.friends(inv.fromUid)) || [];
    if (!theirF.includes(user.uid)) theirF.push(user.uid);
    await ss(K.friends(inv.fromUid), theirF);
    const remaining = invites.filter(i => i.fromUid !== inv.fromUid);
    await ss(K.invites(user.uid), remaining); setInvites(remaining); await loadFriends();
  }
  async function declineInvite(inv) { const r = invites.filter(i => i.fromUid !== inv.fromUid); await ss(K.invites(user.uid), r); setInvites(r); }
  async function removeFriend(uid) {
    const myF = friends.filter(f => f !== uid); await ss(K.friends(user.uid), myF);
    const theirF = (await sg(K.friends(uid)) || []).filter(f => f !== user.uid); await ss(K.friends(uid), theirF);
    setFriends(myF); const np = { ...friendProfiles }; delete np[uid]; setFriendProfiles(np);
  }

  const stats = useMemo(() => calcStats(figs), [figs]);
  const statsGrupo = useMemo(() => {
    const ids = (GRUPOS[grupo] || []).flatMap(t => Array.from({ length: FIGS }, (_, i) => `${t}-${i + 1}`));
    const tenho = ids.filter(id => figs[id] === ST.T).length;
    const rep   = ids.filter(id => figs[id] === ST.R).length;
    return { total: ids.length, tenho, rep, pct: Math.round(((tenho + rep) / ids.length) * 100) };
  }, [figs, grupo]);

  const trocas = useMemo(() => {
    const faltando = Object.entries(figs).filter(([, v]) => v === ST.F).map(([k]) => k);
    return Object.entries(friendProfiles).map(([uid, p]) => {
      const matches = (p.repetidas || []).filter(f => faltando.includes(f));
      return matches.length ? { uid, nome: p.nome, figs: matches } : null;
    }).filter(Boolean);
  }, [figs, friendProfiles]);

  const minhasRep = Object.entries(figs).filter(([, v]) => v === ST.R).map(([k]) => k);
  const rankAmigos = Object.entries(friendProfiles).map(([uid, p]) => ({ uid, ...p }))
    .concat([{ uid: user?.uid, nome: user?.nome, ...stats }]).sort((a, b) => b.pct - a.pct);

  const linhas = [["A","B","C","D"],["E","F","G","H"],["I","J","K","L"]];
  const syncInfo = { idle:{c:"#25254a",l:"✓ Salvo"}, saving:{c:"#92400e",l:"↑ Salvando"}, ok:{c:"#15803d",l:"✔ Salvo"}, err:{c:"#991b1b",l:"✕ Erro"} };
  const medal = (i) => i===0?"🥇":i===1?"🥈":i===2?"🥉":"";

  if (!user) return <AuthScreen onLogin={setUser}/>;

  return (
    <div style={{ minHeight:"100vh", background:"#07070e", color:"#d8daf0", fontFamily:"'Trebuchet MS',sans-serif", paddingBottom:70 }}>

      {/* HEADER */}
      <div style={{ background:"#0b0b1a", borderBottom:"1px solid #16163a", padding:"11px 16px", position:"sticky", top:0, zIndex:20 }}>
        <div style={{ maxWidth:940, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:9 }}>
            <span style={{ fontSize:20 }}>⚽</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:15, fontWeight:900, color:"#eef0ff" }}>Álbum Copa 2026</div>
              <div style={{ fontSize:9, color:"#25254a", letterSpacing:1 }}>Olá, {user.nome.split(" ")[0]}! · {friends.length} amigo{friends.length!==1?"s":""}</div>
            </div>
            {invites.length > 0 && (
              <div onClick={() => setAba("amigos")} style={{ background:"#4f46e522", border:"1px solid #4f46e5", borderRadius:99, padding:"3px 9px", fontSize:10, color:"#818cf8", cursor:"pointer" }}>🔔 {invites.length}</div>
            )}
            <div style={{ fontSize:9, padding:"3px 8px", borderRadius:99, background:syncInfo[syncSt].c+"22", border:`1px solid ${syncInfo[syncSt].c}44`, color:syncInfo[syncSt].c, fontFamily:"monospace" }}>{syncInfo[syncSt].l}</div>
            <button onClick={() => setUser(null)} style={{ padding:"4px 10px", borderRadius:6, border:"1px solid #1e1e3a", background:"transparent", color:"#3a3a6a", fontSize:10, cursor:"pointer" }}>Sair</button>
          </div>
          <div style={{ display:"flex", gap:7, alignItems:"center", flexWrap:"wrap" }}>
            {[{l:"Tenho",v:stats.tenho,c:"#4ade80"},{l:"Repetidas",v:stats.rep,c:"#fbbf24"},{l:"Faltam",v:stats.falta,c:"#f87171"}].map(s => (
              <div key={s.l} style={{ background:"#0d0d1e", border:"1px solid #16163a", borderRadius:7, padding:"4px 10px", textAlign:"center" }}>
                <div style={{ fontSize:14, fontWeight:800, color:s.c, lineHeight:1 }}>{s.v}</div>
                <div style={{ fontSize:8, color:"#252545" }}>{s.l}</div>
              </div>
            ))}
            <div style={{ flex:1, minWidth:120, display:"flex", alignItems:"center", gap:7 }}>
              <div style={{ flex:1, height:5, background:"#16163a", borderRadius:99, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${stats.pct}%`, background:"linear-gradient(90deg,#4f46e5,#4ade80)", borderRadius:99, transition:"width 0.5s" }}/>
              </div>
              <span style={{ fontSize:12, fontWeight:800, color:"#818cf8" }}>{stats.pct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ABAS */}
      <div style={{ background:"#09091a", borderBottom:"1px solid #16163a", overflowX:"auto" }}>
        <div style={{ maxWidth:940, margin:"0 auto", display:"flex", minWidth:"max-content" }}>
          {[
            { k:"album",      l:"📋 Álbum" },
            { k:"stats",      l:"📊 Estatísticas" },
            { k:"amigos",     l:`👥 Amigos${invites.length?` (${invites.length})` :""}` },
            { k:"ranking",    l:"🏆 Ranking" },
            { k:"trocas",     l:`🔄 Trocas${trocas.length?` (${trocas.length})` :""}` },
          ].map(a => (
            <button key={a.k} onClick={() => { setAba(a.k); if(a.k==="ranking"||a.k==="trocas") loadFriends(); }} style={{
              padding:"10px 16px", border:"none",
              borderBottom:`2px solid ${aba===a.k?"#4f46e5":"transparent"}`,
              background:"transparent", color:aba===a.k?"#818cf8":"#2e2e5a",
              fontSize:12, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap",
            }}>{a.l}</button>
          ))}
        </div>
      </div>

      {/* ANÚNCIO INLINE */}
      <div style={{ maxWidth:940, margin:"12px auto 0", padding:"0 10px" }}>
        <AdBanner slot={ADSENSE_SLOT_INLINE} style={{ height:80, borderRadius:8 }} format="horizontal"/>
      </div>

      <div style={{ maxWidth:940, margin:"0 auto", padding:"12px 10px" }}>

        {/* ══ ÁLBUM ══ */}
        {aba === "album" && <>
          <div style={{ background:"#0b0b1a", borderRadius:10, border:"1px solid #16163a", padding:9, marginBottom:11 }}>
            {linhas.map((linha, li) => (
              <div key={li} style={{ display:"flex", gap:5, marginBottom:li<2?5:0 }}>
                {linha.map(g => {
                  const ativo=grupo===g, br=g==="C";
                  const temFig = GRUPOS[g].some(t => Array.from({length:FIGS},(_,i)=>figs[`${t}-${i+1}`]).some(s=>s!==ST.F));
                  return (
                    <button key={g} onClick={() => setGrupo(g)} style={{ flex:1, padding:"5px 2px", borderRadius:6, cursor:"pointer", border:`1px solid ${ativo?(br?"#15803d":"#4f46e5"):"#16163a"}`, background:ativo?(br?"#061510":"#0f0e2a"):"#090916", color:ativo?(br?"#4ade80":"#818cf8"):"#25254a", fontSize:10, fontWeight:800, position:"relative" }}>
                      GRP {g}{br?" 🇧🇷":""}
                      {temFig&&!ativo&&<span style={{position:"absolute",top:2,right:3,width:4,height:4,borderRadius:"50%",background:"#4ade80"}}/>}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:5, marginBottom:11, flexWrap:"wrap", alignItems:"center" }}>
            {[{k:"todos",l:"Todas"},{k:ST.F,l:"Faltam"},{k:ST.T,l:"Tenho"},{k:ST.R,l:"Repetidas"}].map(f => (
              <button key={f.k} onClick={() => setFiltro(f.k)} style={{ padding:"4px 11px", borderRadius:99, cursor:"pointer", border:`1px solid ${filtro===f.k?"#4f46e5":"#16163a"}`, background:filtro===f.k?"#4f46e5":"transparent", color:filtro===f.k?"#c7d2fe":"#252545", fontSize:10, fontWeight:700 }}>{f.l}</button>
            ))}
            <span style={{ marginLeft:"auto", fontSize:10, color:"#1c1c38" }}>{statsGrupo.tenho+statsGrupo.rep}/{statsGrupo.total} · {statsGrupo.pct}%</span>
            <input placeholder="🔍 Buscar time..." value={busca} onChange={e => setBusca(e.target.value)} style={{ padding:"4px 9px", borderRadius:99, border:"1px solid #16163a", background:"#0b0b1a", color:"#d8daf0", fontSize:10, outline:"none" }}/>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))", gap:9 }}>
            {(GRUPOS[grupo]||[]).filter(t => t.toLowerCase().includes(busca.toLowerCase())).map(time => {
              const ids = Array.from({length:FIGS},(_,i)=>`${time}-${i+1}`);
              const tenho=ids.filter(id=>figs[id]===ST.T).length, rep=ids.filter(id=>figs[id]===ST.R).length;
              const pct=Math.round(((tenho+rep)/FIGS)*100), ok=tenho+rep===FIGS;
              return (
                <div key={time} style={{ background:"#0b0b1a", borderRadius:11, border:`1px solid ${ok?"#15803d55":"#16163a"}`, padding:11, boxShadow:ok?"0 0 14px #15803d1a":"none" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:7 }}>
                    <span style={{ fontSize:22 }}>{BANDEIRAS[time]||"🏳️"}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:11, fontWeight:700, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis", color:ok?"#4ade80":"#c0c3e0" }}>{time}</div>
                      <div style={{ fontSize:8, color:"#1c1c38" }}>{tenho+rep}/{FIGS} fig.</div>
                    </div>
                    {ok&&<span>✅</span>}
                  </div>
                  <div style={{ height:2, background:"#16163a", borderRadius:99, overflow:"hidden", marginBottom:7 }}>
                    <div style={{ height:"100%", width:`${pct}%`, background:ok?"#15803d":"linear-gradient(90deg,#4f46e5,#818cf8)", borderRadius:99, transition:"width 0.4s" }}/>
                  </div>
                  <div style={{ display:"flex", gap:4 }}>
                    {ids.map((id, idx) => {
                      const st=figs[id]; if(filtro!=="todos"&&st!==filtro) return null;
                      const c=COR[st];
                      return <button key={id} onClick={() => ciclar(id)} style={{ flex:1, height:42, borderRadius:5, border:`1.5px solid ${c.border}`, background:c.bg, color:c.text, fontSize:10, fontWeight:900, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:1 }} onMouseDown={e=>e.currentTarget.style.transform="scale(0.88)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}><span style={{fontSize:7}}>{c.icon}</span>{idx+1}</button>;
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop:14, padding:"9px 12px", background:"#0b0b1a", borderRadius:9, border:"1px solid #16163a", display:"flex", gap:14, flexWrap:"wrap", alignItems:"center" }}>
            <span style={{ fontSize:10, color:"#1c1c38", fontWeight:700 }}>Clique para alternar:</span>
            {Object.entries(COR).map(([st,c]) => <div key={st} style={{ display:"flex", alignItems:"center", gap:4 }}><span style={{color:c.text,fontWeight:900}}>{c.icon}</span><span style={{fontSize:10,color:"#2e2e5a"}}>{st==="falta"?"Falta":st==="tenho"?"Tenho":"Repetida"}</span></div>)}
          </div>
        </>}

        {/* ══ ESTATÍSTICAS ══ */}
        {aba === "stats" && <AbaEstatisticas figs={figs}/>}

        {/* ══ AMIGOS ══ */}
        {aba === "amigos" && (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {invites.length > 0 && (
              <div style={{ background:"#0f0e2a", border:"1px solid #4f46e5aa", borderRadius:12, padding:16 }}>
                <div style={{ fontSize:13, fontWeight:800, color:"#818cf8", marginBottom:10 }}>🔔 Pedidos de amizade</div>
                {invites.map(inv => (
                  <div key={inv.fromUid} style={{ display:"flex", alignItems:"center", gap:10, background:"#0b0b1a", borderRadius:9, padding:"10px 12px", marginBottom:6 }}>
                    <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:700, color:"#c0c3e0" }}>{inv.fromNome}</div><div style={{ fontSize:10, color:"#25254a" }}>{inv.fromEmail}</div></div>
                    <button onClick={() => acceptInvite(inv)} style={{ padding:"6px 12px", borderRadius:7, border:"1px solid #15803d", background:"#061510", color:"#4ade80", fontSize:11, fontWeight:700, cursor:"pointer" }}>Aceitar ✔</button>
                    <button onClick={() => declineInvite(inv)} style={{ padding:"6px 10px", borderRadius:7, border:"1px solid #2a1010", background:"transparent", color:"#5a2020", fontSize:11, cursor:"pointer" }}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ background:"#0b0b1a", border:"1px solid #16163a", borderRadius:12, padding:16 }}>
              <div style={{ fontSize:13, fontWeight:800, color:"#c0c3e0", marginBottom:4 }}>➕ Adicionar amigo</div>
              <div style={{ fontSize:11, color:"#25254a", marginBottom:12 }}>Digite o email de quem você quer adicionar.</div>
              <div style={{ display:"flex", gap:7 }}>
                <input placeholder="email do amigo..." value={addEmail} onChange={e => setAddEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendRequest()} style={{ flex:1, padding:"9px 12px", borderRadius:8, border:"1px solid #1e1e3a", background:"#0a0a18", color:"#dde0ff", fontSize:12, outline:"none" }}/>
                <button onClick={sendRequest} style={{ padding:"9px 16px", borderRadius:8, border:"none", background:"linear-gradient(135deg,#4f46e5,#7c3aed)", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>Enviar</button>
              </div>
              {addMsg && <div style={{ marginTop:8, padding:"7px 10px", borderRadius:7, fontSize:11, fontWeight:600, background:addMsg.t==="ok"?"#061510":"#1a0808", border:`1px solid ${addMsg.t==="ok"?"#15803d":"#7f1d1d"}`, color:addMsg.t==="ok"?"#4ade80":"#fca5a5" }}>{addMsg.m}</div>}
            </div>
            <div style={{ background:"#0b0b1a", border:"1px solid #16163a", borderRadius:12, padding:16 }}>
              <div style={{ fontSize:13, fontWeight:800, color:"#c0c3e0", marginBottom:10 }}>👥 Meus amigos {friends.length>0&&<span style={{color:"#4f46e5"}}>({friends.length})</span>}</div>
              {loadingF ? <div style={{textAlign:"center",padding:20,color:"#25254a",fontSize:12}}>Carregando...</div>
                : friends.length===0 ? <div style={{textAlign:"center",padding:20,color:"#25254a",fontSize:12}}>Adicione amigos pelo email acima!</div>
                : friends.map(uid => {
                  const p=friendProfiles[uid]; if(!p) return null;
                  return (
                    <div key={uid} style={{ display:"flex", alignItems:"center", gap:10, background:"#0d0d1e", borderRadius:9, padding:"10px 12px", marginBottom:6 }}>
                      <div style={{ width:36, height:36, borderRadius:"50%", background:"linear-gradient(135deg,#1e1e40,#2a2a60)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:900, color:"#818cf8" }}>{p.nome?.[0]?.toUpperCase()||"?"}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:"#c0c3e0" }}>{p.nome}</div>
                        <div style={{ display:"flex", alignItems:"center", gap:7, marginTop:3 }}>
                          <div style={{ width:80, height:4, background:"#16163a", borderRadius:99, overflow:"hidden" }}><div style={{ height:"100%", width:`${p.pct||0}%`, background:"linear-gradient(90deg,#4f46e5,#4ade80)", borderRadius:99 }}/></div>
                          <span style={{ fontSize:10, color:"#4ade80", fontWeight:700 }}>{p.pct||0}%</span>
                          <span style={{ fontSize:9, color:"#25254a" }}>★ {p.rep||0}</span>
                        </div>
                      </div>
                      <button onClick={() => removeFriend(uid)} style={{ padding:"4px 8px", borderRadius:6, border:"1px solid #1e1e3a", background:"transparent", color:"#3a2020", fontSize:10, cursor:"pointer" }}>Remover</button>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ══ RANKING ══ */}
        {aba === "ranking" && (
          <div>
            <div style={{ marginBottom:14, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div><h2 style={{margin:0,fontSize:17,fontWeight:900,color:"#eef0ff"}}>🏆 Ranking dos Amigos</h2><p style={{margin:"2px 0 0",fontSize:11,color:"#25254a"}}>Só você e seus amigos aparecem aqui</p></div>
              <button onClick={loadFriends} style={{ padding:"5px 11px", borderRadius:7, border:"1px solid #1e1e3a", background:"transparent", color:"#4f46e5", fontSize:11, cursor:"pointer" }}>⟳ Atualizar</button>
            </div>
            {friends.length===0 ? (
              <div style={{ background:"#0b0b1a", border:"1px solid #16163a", borderRadius:12, padding:32, textAlign:"center" }}><div style={{fontSize:32,marginBottom:8}}>👥</div><div style={{fontSize:13,color:"#25254a"}}>Adicione amigos para ver o ranking!</div></div>
            ) : rankAmigos.map((u, i) => {
              const isMe=u.uid===user.uid;
              return (
                <div key={u.uid} style={{ background:isMe?"#0f0e2a":"#0b0b1a", border:`1px solid ${isMe?"#4f46e5aa":"#16163a"}`, borderRadius:12, padding:"12px 16px", display:"flex", alignItems:"center", gap:12, marginBottom:7 }}>
                  <div style={{ fontSize:22, minWidth:30, textAlign:"center" }}>{medal(i)||<span style={{fontSize:13,color:"#25254a",fontWeight:800}}>#{i+1}</span>}</div>
                  <div style={{ width:34, height:34, borderRadius:"50%", background:isMe?"linear-gradient(135deg,#4f46e5,#7c3aed)":"linear-gradient(135deg,#1e1e40,#2a2a60)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:900, color:isMe?"#fff":"#818cf8" }}>{u.nome?.[0]?.toUpperCase()||"?"}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:800, color:isMe?"#a5b4fc":"#c0c3e0", marginBottom:4 }}>{u.nome} {isMe&&<span style={{fontSize:10,color:"#4f46e5"}}>(você)</span>}</div>
                    <div style={{ height:5, background:"#16163a", borderRadius:99, overflow:"hidden" }}><div style={{ height:"100%", width:`${u.pct||0}%`, background:isMe?"linear-gradient(90deg,#4f46e5,#818cf8)":"linear-gradient(90deg,#15803d,#4ade80)", borderRadius:99, transition:"width 0.5s" }}/></div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:18, fontWeight:900, color:isMe?"#818cf8":"#4ade80" }}>{u.pct||0}%</div>
                    <div style={{ fontSize:9, color:"#25254a" }}>✔{u.tenho||0} ★{u.rep||0} ·{u.falta??0}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══ TROCAS ══ */}
        {aba === "trocas" && (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div><h2 style={{margin:"0 0 2px",fontSize:17,fontWeight:900,color:"#eef0ff"}}>🔄 Central de Trocas</h2><p style={{margin:0,fontSize:11,color:"#25254a"}}>Só entre você e seus amigos</p></div>
            {friends.length===0 ? (
              <div style={{ background:"#0b0b1a", border:"1px solid #16163a", borderRadius:12, padding:32, textAlign:"center" }}><div style={{fontSize:32,marginBottom:8}}>🤝</div><div style={{fontSize:13,color:"#25254a"}}>Adicione amigos para ver oportunidades de troca!</div></div>
            ) : <>
              <div style={{ background:"#0b0b1a", border:"1px solid #15803d44", borderRadius:12, padding:16 }}>
                <div style={{ fontSize:12, fontWeight:800, color:"#4ade80", marginBottom:10 }}>✔ Amigos têm repetidas que você precisa</div>
                {trocas.length===0 ? <div style={{fontSize:11,color:"#25254a"}}>Nenhuma oportunidade no momento.</div>
                  : trocas.map(t => (
                    <div key={t.uid} style={{ background:"#0d0d1e", borderRadius:9, padding:"10px 12px", marginBottom:7 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:"#c0c3e0", marginBottom:6 }}>👤 {t.nome} tem {t.figs.length} que você precisa:</div>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>{t.figs.map(f=>{const[tm,n]=f.split("-");return(<div key={f} style={{background:"#061510",border:"1px solid #15803d",borderRadius:6,padding:"4px 9px",fontSize:11,color:"#4ade80"}}>{BANDEIRAS[tm]||"🏳️"} {tm} #{n}</div>);})}</div>
                      <div style={{ marginTop:6, fontSize:10, color:"#15803d" }}>💬 Fale com {t.nome.split(" ")[0]} para combinar!</div>
                    </div>
                  ))}
              </div>
              <div style={{ background:"#0b0b1a", border:"1px solid #b4530944", borderRadius:12, padding:16 }}>
                <div style={{ fontSize:12, fontWeight:800, color:"#fbbf24", marginBottom:10 }}>★ Suas repetidas ({minhasRep.length})</div>
                {minhasRep.length===0 ? <div style={{fontSize:11,color:"#25254a"}}>Você ainda não tem figurinhas repetidas.</div>
                  : <div style={{display:"flex",flexWrap:"wrap",gap:5}}>{minhasRep.map(f=>{const[tm,n]=f.split("-");return(<div key={f} style={{background:"#160e00",border:"1px solid #b45309",borderRadius:6,padding:"4px 9px",fontSize:11,color:"#fbbf24"}}>{BANDEIRAS[tm]||"🏳️"} {tm} #{n}</div>);})}</div>}
              </div>
            </>}
          </div>
        )}
      </div>

      {/* BANNER FIXO RODAPÉ */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:30, background:"#0b0b1a", borderTop:"1px solid #16163a" }}>
        <div style={{ maxWidth:940, margin:"0 auto" }}>
          <AdBanner slot={ADSENSE_SLOT_BANNER} style={{ height:60 }} format="horizontal"/>
        </div>
      </div>
    </div>
  );
}
