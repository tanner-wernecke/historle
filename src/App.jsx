import { useState, useEffect, useCallback, useRef } from "react";

// ── Puzzle loading ──────────────────────────────────────────────────────────
// Puzzles are pre-generated nightly by the GitHub Action and stored as
// public/puzzles/YYYY-MM-DD.json. The frontend just fetches today's file.

function getTodayDateString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Fallback puzzle shown if today's generated file isn't available yet
// (e.g. first deploy before the Action has run)
const FALLBACK_PUZZLES = [
  {
    chronicle: { events: [
      { id: 1, text: "Qin Shi Huang unifies China, becomes first emperor", year: -221 },
      { id: 2, text: "Roman Colosseum completed under Emperor Titus", year: 80 },
      { id: 3, text: "Genghis Khan unites Mongol tribes and begins conquest", year: 1206 },
      { id: 4, text: "Gutenberg prints first Bible with movable type", year: 1455 },
      { id: 5, text: "American Declaration of Independence signed", year: 1776 },
    ]},
    eracle: { clues: ["A great wall was begun by a dynasty to repel northern invaders","It stretches across a vast frontier in East Asia","The Ming dynasty greatly expanded and fortified this structure"], answer_year: 1368, event_name: "Ming Dynasty begins Great Wall expansion", explanation: "The Ming Dynasty, beginning in 1368, undertook the most ambitious construction of the Great Wall, transforming it into the iconic brick-and-stone structure known today." },
    borderle: {
      empire_name: "Mongol Empire", time_period: "at its peak in 1279 AD", year_label: "1279 AD",
      fun_fact: "At its peak, the Mongol Empire covered over 24 million square kilometers and ruled roughly a quarter of the world's population.",
      options: ["Mongol Empire","Ottoman Empire","Tang Dynasty","Timurid Empire","Khwarazmian Empire","Yuan Dynasty"],
      geojson: { type:"Feature", properties:{}, geometry:{ type:"Polygon", coordinates:[[
        [135,53],[128,48],[121,42],[116,38],[108,32],[100,28],[94,24],[88,26],[80,30],[72,32],[64,36],[56,38],[48,40],[42,44],[36,46],[30,48],[26,50],[24,54],[28,58],[36,58],[44,54],[52,52],[60,50],[68,46],[76,44],[84,42],[92,46],[100,50],[108,52],[116,54],[124,54],[130,52],[135,53]
      ]]}}
    },
    figurle: {
      name: "Genghis Khan", birth_year: 1162, death_year: 1227,
      clues: [
        "A ruler born on the steppes of Central Asia in the 12th century",
        "He united warring nomadic tribes through a combination of military genius and political cunning",
        "His conquests created the largest contiguous land empire in history"
      ],
      fun_fact: "Genghis Khan's descendants ruled vast swaths of Eurasia for generations, and genetic studies suggest roughly 0.5% of the world's male population today descends from him.",
      options: ["Genghis Khan","Timur","Attila the Hun","Kublai Khan","Ögedei Khan","Subutai"]
    },
    duelle: { pairs: [
      { id:1, a:{ text:"Julius Caesar assassinated in Rome", year:-44 }, b:{ text:"Muhammad's first revelation in Mecca", year:610 } },
      { id:2, a:{ text:"Fall of Constantinople to Ottomans", year:1453 }, b:{ text:"Columbus reaches the Americas", year:1492 } },
      { id:3, a:{ text:"Great Wall of China construction begins", year:-221 }, b:{ text:"Construction of the Colosseum starts", year:72 } },
      { id:4, a:{ text:"Black Death arrives in Europe", year:1347 }, b:{ text:"Martin Luther posts his 95 Theses", year:1517 } },
      { id:5, a:{ text:"American Declaration of Independence", year:1776 }, b:{ text:"French Revolution begins", year:1789 } },
    ]}
  },
  {
    chronicle: { events: [
      { id: 1, text: "Alexander the Great defeats Persia at Gaugamela", year: -331 },
      { id: 2, text: "Muhammad receives first revelation in Mecca", year: 610 },
      { id: 3, text: "Black Death reaches Europe via Crimean ports", year: 1347 },
      { id: 4, text: "Columbus makes first contact with the Americas", year: 1492 },
      { id: 5, text: "French Revolution begins with storming of Bastille", year: 1789 },
    ]},
    eracle: { clues: ["A monumental structure was built to honor the dead in a desert land","Workers numbering in the tens of thousands toiled for decades","It remains one of the Seven Wonders of the Ancient World"], answer_year: -2560, event_name: "Great Pyramid of Giza completed", explanation: "The Great Pyramid of Giza, built for Pharaoh Khufu around 2560 BCE, stood as the world's tallest man-made structure for over 3,800 years." },
    borderle: {
      empire_name: "Roman Empire", time_period: "at its peak under Trajan in 117 AD", year_label: "117 AD",
      fun_fact: "At its height, the Roman Empire had a population of approximately 70 million people — about 21% of the world's total population at the time.",
      options: ["Roman Empire","Byzantine Empire","Carthaginian Empire","Macedonian Empire","Parthian Empire","Sassanid Empire"],
      geojson: { type:"Feature", properties:{}, geometry:{ type:"Polygon", coordinates:[[
        [-5,36],[2,37],[8,37],[12,44],[14,48],[16,48],[20,46],[24,44],[28,42],[34,38],[38,36],[40,32],[38,28],[34,24],[30,22],[28,20],[32,24],[36,30],[40,36],[42,38],[44,36],[42,34],[38,30],[36,26],[34,22],[30,18],[26,14],[22,10],[18,8],[14,12],[10,16],[6,20],[2,24],[-2,28],[-4,32],[-5,36]
      ]]}}
    },
    figurle: {
      name: "Cleopatra VII", birth_year: -69, death_year: -30,
      clues: [
        "A ruler of a North African kingdom in the 1st century BCE",
        "She was the last active ruler of her dynasty and famously fluent in many languages",
        "She formed powerful alliances with two of Rome's most famous generals"
      ],
      fun_fact: "Despite her Egyptian associations, Cleopatra was actually of Macedonian Greek descent and was the first ruler of her dynasty to learn the Egyptian language.",
      options: ["Cleopatra VII","Nefertiti","Hatshepsut","Boudicca","Zenobia of Palmyra","Queen of Sheba"]
    },
    duelle: { pairs: [
      { id:1, a:{ text:"Alexander the Great conquers Persia", year:-330 }, b:{ text:"Roman Empire reaches its greatest extent", year:117 } },
      { id:2, a:{ text:"Magna Carta signed by King John", year:1215 }, b:{ text:"Black Death devastates Europe", year:1347 } },
      { id:3, a:{ text:"Aztec Empire founded at Tenochtitlan", year:1325 }, b:{ text:"Spanish conquest of the Aztecs", year:1521 } },
      { id:4, a:{ text:"Battle of Waterloo ends Napoleonic Wars", year:1815 }, b:{ text:"American Civil War ends", year:1865 } },
      { id:5, a:{ text:"World War I armistice signed", year:1918 }, b:{ text:"United Nations founded", year:1945 } },
    ]}
  },
  {
    chronicle: { events: [
      { id: 1, text: "Ashoka converts to Buddhism after Kalinga War", year: -260 },
      { id: 2, text: "Viking Leif Eriksson reaches North America", year: 1000 },
      { id: 3, text: "Ottoman Turks conquer Constantinople", year: 1453 },
      { id: 4, text: "Galileo publishes support for Copernican heliocentrism", year: 1632 },
      { id: 5, text: "Wright Brothers achieve first powered flight at Kitty Hawk", year: 1903 },
    ]},
    eracle: { clues: ["An island nation's powerful navy defeated a much larger fleet","The battle took place in Asian waters in the early 20th century","It was the first time an Asian power defeated a European one in modern warfare"], answer_year: 1905, event_name: "Battle of Tsushima — Japan defeats Russia", explanation: "Japan's decisive naval victory over Russia at Tsushima in 1905 shocked the world and signaled the rise of Japan as a major world power." },
    borderle: {
      empire_name: "Ottoman Empire", time_period: "at its peak in the 16th century", year_label: "1566 AD",
      fun_fact: "The Ottoman Empire lasted from 1299 to 1922, making it one of the longest-lasting empires in history at over 600 years.",
      options: ["Ottoman Empire","Safavid Empire","Mamluk Sultanate","Byzantine Empire","Timurid Empire","Mughal Empire"],
      geojson: { type:"Feature", properties:{}, geometry:{ type:"Polygon", coordinates:[[
        [14,46],[18,44],[22,42],[26,40],[30,38],[34,36],[38,34],[40,32],[42,30],[44,28],[46,24],[44,20],[40,18],[36,16],[32,14],[28,12],[24,14],[20,16],[16,18],[12,20],[10,24],[8,28],[6,32],[8,36],[10,40],[12,44],[14,46]
      ]]}}
    },
    figurle: {
      name: "Suleiman the Magnificent", birth_year: 1494, death_year: 1566,
      clues: [
        "A ruler who presided over the golden age of a great empire in the 16th century",
        "He personally led military campaigns into Europe and oversaw a flourishing of art and architecture",
        "Known in the West as 'Magnificent' and in the East as 'the Lawgiver'"
      ],
      fun_fact: "Suleiman's reign saw the Ottoman Empire reach its apex — he expanded its territory, reformed its legal system, and his court became the most splendid in the world.",
      options: ["Suleiman the Magnificent","Mehmed II","Saladin","Harun al-Rashid","Akbar the Great","Shah Abbas I"]
    },
    duelle: { pairs: [
      { id:1, a:{ text:"Fall of Rome to Odoacer", year:476 }, b:{ text:"Muhammad's hijra to Medina", year:622 } },
      { id:2, a:{ text:"Magna Carta signed", year:1215 }, b:{ text:"Gutenberg prints the first Bible", year:1455 } },
      { id:3, a:{ text:"Vasco da Gama reaches India by sea", year:1498 }, b:{ text:"Magellan's expedition departs Spain", year:1519 } },
      { id:4, a:{ text:"Napoleon crowns himself Emperor", year:1804 }, b:{ text:"US Civil War begins", year:1861 } },
      { id:5, a:{ text:"Russian Revolution overthrows Tsar", year:1917 }, b:{ text:"World War II ends in Europe", year:1945 } },
    ]}
  },
];

function seededRandom(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}

function getTodaySeed() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function getFallbackPuzzle() {
  const d = new Date();
  const dayOfYear = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
  return FALLBACK_PUZZLES[(d.getFullYear() * 1000 + dayOfYear) % FALLBACK_PUZZLES.length];
}

function todayString() {
  return new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function fmtYear(y) { return y < 0 ? `${Math.abs(y)} BCE` : String(y); }

// Chronicle: 200 pts per correctly placed event + 200 bonus if all correct first try
function chronicleScore(items, attempts) {
  const sorted = [...items].sort((a,b) => a.year - b.year);
  const correctCount = items.filter((x,i) => x.id === sorted[i].id).length;
  const allCorrect = correctCount === items.length;
  const bonus = (allCorrect && attempts === 1) ? 200 : 0;
  return Math.min(1000, correctCount * 160 + bonus);
}

// Eracle: 1000 minus 100 per wrong guess. If never correct, score by closest guess proximity.
function eracleScoreCorrect(guessNumber) {
  return Math.max(500, 1000 - (guessNumber - 1) * 100);
}
function eracleScoreWrong(closestDiff) {
  if (closestDiff <= 5)   return 400;
  if (closestDiff <= 10)  return 300;
  if (closestDiff <= 25)  return 200;
  if (closestDiff <= 50)  return 150;
  if (closestDiff <= 100) return 100;
  return 50;
}

// Borderle: 1000 minus 150 per wrong guess. Wrong = 50.
function borderleScore(attempts, win) {
  if (!win) return 50;
  return Math.max(250, 1000 - (attempts - 1) * 150);
}

// Figurle: 1000 / 600 / 300 for guesses 1-3. Wrong = 50.
function figurleScore(attempts, win) {
  if (!win) return 50;
  return [1000, 600, 300][Math.min(attempts - 1, 2)];
}

function ShareModal({ scores, onClose }) {
  const [copied, setCopied] = useState(false);
  const total = scores.reduce((a,b)=>a+b,0);
  const medal = total>=4200?"🥇":total>=3000?"🥈":total>=1800?"🥉":"📜";
  const label = total>=4200?"Historian Supreme":total>=3000?"Accomplished Scholar":total>=1800?"Apprentice Archivist":"Curious Student";
  const bar = s => "█".repeat(Math.round(s/200)) + "░".repeat(5-Math.round(s/200));
  const text = `📜 Historle — ${todayString()}\n${medal} ${label} — ${total}/5000\n\n📅 Chronicle  ${bar(scores[0])} ${scores[0]}\n🎯 Eracle     ${bar(scores[1])} ${scores[1]}\n🗺️ Borderle   ${bar(scores[2])} ${scores[2]}\n👤 Figurle    ${bar(scores[3])} ${scores[3]}\n⚔️ Duelle     ${bar(scores[4])} ${scores[4]}\n\nPlay at historle.game`;
  const copy = async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-title">Share your result</div>
        <pre className="share-pre">{text}</pre>
        <button className="copy-btn" onClick={copy}>{copied?"✓ Copied!":"Copy to clipboard"}</button>
      </div>
    </div>
  );
}

function ChronicleRound({ data, onComplete }) {
  const [items, setItems] = useState([]);
  const [attempts, setAttempts] = useState(0);
  const [result, setResult] = useState(null);
  const [dragIdx, setDragIdx] = useState(null);
  const [shake, setShake] = useState(false);
  const submitted = !!result;

  // Refs for touch drag state — we use refs so touch handlers
  // always see current values without needing re-renders mid-drag
  const touchDragIdx = useRef(null);
  const touchTargetIdx = useRef(null);
  const itemsRef = useRef(items);
  useEffect(() => { itemsRef.current = items; }, [items]);

  useEffect(() => {
    const rng = seededRandom(getTodaySeed()+1);
    setItems([...data.events].sort(()=>rng()-0.5));
  }, [data]);

  const check = () => {
    const sorted=[...items].sort((a,b)=>a.year-b.year);
    const ok=items.every((x,i)=>x.id===sorted[i].id);
    const na=attempts+1; setAttempts(na);
    const correctMask=items.map((x,i)=>x.id===sorted[i].id);
    if(ok){setResult({win:true,score:chronicleScore(items,na),correctMask});}
    else if(na>=3){setResult({win:false,score:chronicleScore(items,na),correct:sorted,correctMask});}
    else{setResult(r=>({...r,correctMask,partial:true}));setShake(true);setTimeout(()=>setShake(false),600);}
  };

  // ── Touch handlers ──────────────────────────────────────────
  const handleTouchStart = (e, i) => {
    touchDragIdx.current = i;
    touchTargetIdx.current = i;
    setDragIdx(i);
  };

  const handleTouchMove = (e) => {
    e.preventDefault(); // prevent scroll while dragging
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!el) return;
    const row = el.closest('[data-sortidx]');
    if (!row) return;
    const targetIdx = parseInt(row.dataset.sortidx, 10);
    if (isNaN(targetIdx) || targetIdx === touchTargetIdx.current) return;
    touchTargetIdx.current = targetIdx;
    const from = touchDragIdx.current;
    const next = [...itemsRef.current];
    const [moved] = next.splice(from, 1);
    next.splice(targetIdx, 0, moved);
    touchDragIdx.current = targetIdx;
    setItems(next);
    setDragIdx(targetIdx);
  };

  const handleTouchEnd = () => {
    touchDragIdx.current = null;
    touchTargetIdx.current = null;
    setDragIdx(null);
  };

  // ── Mouse drag handlers (desktop fallback) ──────────────────
  const handleDragOver = (e, i) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === i) return;
    const next = [...items];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(i, 0, moved);
    setItems(next);
    setDragIdx(i);
  };

  if(!items.length)return null;
  return (
    <div className="round-wrap">
      <div className="rh"><span className="rbadge">01</span><div><h2 className="rtitle">Chronicle</h2><p className="rsub">Drag events into chronological order</p></div></div>
      <div className={`clist ${shake?"shake":""}`}>
        {items.map((item,i)=>{
          const isCorrect = result?.correctMask?.[i];
          const showMask = result?.correctMask && !result.win;
          return (
            <div
              key={item.id}
              data-sortidx={i}
              className={`citem ${dragIdx===i?"dragging":""} ${showMask?(isCorrect?"citem-correct":"citem-wrong"):""}`}
              draggable={!result || !!result.partial}
              onDragStart={()=>setDragIdx(i)}
              onDragOver={e=>handleDragOver(e,i)}
              onDrop={()=>setDragIdx(null)}
              onTouchStart={e=>handleTouchStart(e,i)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {showMask && <span className="citem-indicator">{isCorrect?"✓":"✗"}</span>}
              {!showMask && <span className="dhandle">⠿</span>}
              <span className="etext">{item.text}</span>
              {result&&!result.partial&&<span className="eyear">{fmtYear(item.year)}</span>}
            </div>
          );
        })}
      </div>
      {(!result||result.partial)&&<div className="arow"><span className="aleft">{3-attempts} attempt{3-attempts!==1?"s":""} left</span><button className="btnp" onClick={check}>Check Order</button></div>}
      {result&&!result.partial&&(
        <div className={`rcard ${result.win?"win":"lose"}`}>
          <div className="ricon">{result.win?"🏆":"📜"}</div>
          <p className="rtext">{result.win?`Correct! Solved in ${attempts} attempt${attempts!==1?"s":""}.`:"The correct order was:"}</p>
          {!result.win&&result.correct&&<div className="clist2">{result.correct.map(e=><div key={e.id} className="ci2"><span>{fmtYear(e.year)}</span> — {e.text}</div>)}</div>}
          <p className="rscore">+{result.score} pts</p>
          <button className="btnn" onClick={()=>onComplete(result.score)}>Next Round →</button>
        </div>
      )}
    </div>
  );
}

function EracleRound({ data, onComplete }) {
  const [guess, setGuess] = useState("");
  const [guesses, setGuesses] = useState([]);
  const [clueIdx, setClueIdx] = useState(0);
  const [result, setResult] = useState(null);
  const submitted = !!result;

  const submit = () => {
    const yr=parseInt(guess,10); if(isNaN(yr))return;
    const diff=Math.abs(yr-data.answer_year);
    const ng=[...guesses,{year:yr,diff}]; setGuesses(ng); setGuess("");
    if(diff===0){
      setResult({win:true, score:eracleScoreCorrect(ng.length)});
    } else if(ng.length>=6){
      const closestDiff=Math.min(...ng.map(g=>g.diff));
      setResult({win:false, score:eracleScoreWrong(closestDiff), closestDiff});
    } else {
      if(ng.length===2||ng.length===4){setClueIdx(Math.min(clueIdx+1,data.clues.length-1));}
    }
  };
  const heat=d=>d===0?"🎯":d<=5?"🔥":d<=25?"♨️":d<=100?"🌡️":"🧊";
  const dir=g=>g.year<data.answer_year?"↑ Later":"↓ Earlier";

  return (
    <div className="round-wrap">
      <div className="rh"><span className="rbadge">02</span><div><h2 className="rtitle">Eracle</h2><p className="rsub">Guess the year of this historical event</p></div></div>
      <div className="clues">
        {data.clues.slice(0,submitted?data.clues.length:clueIdx+1).map((c,i)=>(
          <div key={i} className={`clue ${i===clueIdx&&!submitted?"clue-active":""}`}>
            <span className="cnum">Clue {i+1}</span><span>{c}</span>
          </div>
        ))}
      </div>
      {guesses.length>0&&<div className="ghist">{guesses.map((g,i)=><div key={i} className="grow"><span className="gyear">{fmtYear(g.year)}</span><span className="gdiff">{heat(g.diff)} {g.diff===0?"Exact!":dir(g)}</span></div>)}</div>}
      {!submitted&&<>
        <div className="arow" style={{marginBottom:'0.4rem'}}>
          <span className="aleft">{6 - guesses.length} guess{6 - guesses.length !== 1 ? "es" : ""} left</span>
        </div>
        <div className="eracle-row"><input type="number" className="yinput" placeholder="e.g. 1453 or -44 for BCE" value={guess} onChange={e=>setGuess(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/><button className="btnp" onClick={submit}>Guess</button></div>
      </>}
      {submitted&&result&&(
        <div className={`rcard ${result.win?"win":"lose"}`}>
          <div className="ricon">{result.win?"🎯":"📅"}</div>
          <p className="rtext">{result.win?"Perfect!":"The answer was "+fmtYear(data.answer_year)+". Your closest guess was "+result.closestDiff+" year"+(result.closestDiff!==1?"s":"")+" off."}</p>
          <p className="ereveal">{data.event_name}</p>
          <p className="eexp">{data.explanation}</p>
          <p className="rscore">+{result.score} pts</p>
          <button className="btnn" onClick={()=>onComplete(result.score)}>Next Round →</button>
        </div>
      )}
    </div>
  );
}

function BorderleMap({ geojson }) {
  const svgRef = useRef(null);
  const [worldPaths, setWorldPaths] = useState(null);
  const [error, setError] = useState(false);

  // Load D3 + topojson + world data from CDN once
  useEffect(() => {
    if (worldPaths) return;

    const loadScript = (src) => new Promise((res, rej) => {
      if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
      const s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });

    Promise.all([
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js'),
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/topojson/3.0.2/topojson.min.js'),
    ])
    .then(() => fetch('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json'))
    .then(r => r.json())
    .then(world => {
      const { d3, topojson } = window;
      const land = topojson.feature(world, world.objects.land);
      const countries = topojson.feature(world, world.objects.countries);
      setWorldPaths({ land, countries });
    })
    .catch(() => setError(true));
  }, []);

  // Draw map whenever world data or geojson changes
  useEffect(() => {
    if (!svgRef.current || !worldPaths || !geojson) return;
    const { d3 } = window;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const W = svgRef.current.clientWidth || 600;
    const H = svgRef.current.clientHeight || 320;

    // Extract empire rings to compute bounds
    function getRings(g) {
      if (!g) return [];
      if (g.type === 'Feature') return getRings(g.geometry);
      if (g.geometry) return getRings(g.geometry);
      if (g.type === 'Polygon') return g.coordinates;
      if (g.type === 'MultiPolygon') return g.coordinates.flat(1);
      return [];
    }
    const rings = getRings(geojson);
    const allPts = rings.flat();
    if (!allPts.length) return;

    const lngs = allPts.map(p => p[0]);
    const lats = allPts.map(p => p[1]);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const pad = 0.45;
    const lngSpan = (maxLng - minLng) || 20;
    const latSpan = (maxLat - minLat) || 20;

    // Fit projection to empire bounds with generous padding
    const projection = d3.geoMercator()
      .fitExtent(
        [[W * 0.04, H * 0.04], [W * 0.96, H * 0.96]],
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [minLng - lngSpan * pad, minLat - latSpan * pad],
              [maxLng + lngSpan * pad, minLat - latSpan * pad],
              [maxLng + lngSpan * pad, maxLat + latSpan * pad],
              [minLng - lngSpan * pad, maxLat + latSpan * pad],
              [minLng - lngSpan * pad, minLat - latSpan * pad],
            ]]
          }
        }
      );

    const path = d3.geoPath().projection(projection);

    // Zoom + pan behavior
    const zoomGroup = svg.append('g').attr('class', 'zoom-group');
    svg.call(
      d3.zoom()
        .scaleExtent([0.5, 12])
        .on('zoom', (event) => {
          zoomGroup.attr('transform', event.transform);
        })
    );

    // Ocean background (outside zoom group so it always fills)
    svg.append('rect').attr('width', W).attr('height', H).attr('fill', '#c8dff0').lower();

    // Land
    zoomGroup.append('path')
      .datum(worldPaths.land)
      .attr('d', path)
      .attr('fill', '#e8e0cc')
      .attr('stroke', '#b8a880')
      .attr('stroke-width', 0.4);

    // Country borders
    zoomGroup.append('path')
      .datum(worldPaths.countries)
      .attr('d', path)
      .attr('fill', 'none')
      .attr('stroke', '#ccc')
      .attr('stroke-width', 0.3);

    // Empire highlight
    const empireFeature = (geojson.type === 'Feature') ? geojson : { type: 'Feature', geometry: geojson };
    zoomGroup.append('path')
      .datum(empireFeature)
      .attr('d', path)
      .attr('fill', '#c9942a')
      .attr('fill-opacity', 0.6)
      .attr('stroke', '#9b3a1a')
      .attr('stroke-width', 1.8)
      .attr('stroke-linejoin', 'round');

  }, [worldPaths, geojson]);

  if (error) return (
    <div className="bmap" style={{display:'flex',alignItems:'center',justifyContent:'center',color:'var(--sep)',fontStyle:'italic',fontSize:'0.9rem'}}>
      Map unavailable
    </div>
  );

  if (!worldPaths) return (
    <div className="bmap" style={{display:'flex',alignItems:'center',justifyContent:'center',color:'var(--sep)',fontStyle:'italic',fontSize:'0.9rem'}}>
      Loading map…
    </div>
  );

  return <svg ref={svgRef} className="bmap" style={{display:'block',cursor:'grab'}} />;
}


function BorderleRound({ data, onComplete }) {
  const [attempts, setAttempts] = useState(0);
  const [guessed, setGuessed] = useState([]);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const submitted = !!result;
  const [shuffled] = useState(() => {
    const rng = seededRandom(getTodaySeed() + 99);
    return [...data.options].sort(() => rng() - 0.5);
  });

  const go = () => {
    if (!selected) return;
    const ok = selected === data.empire_name;
    const na = attempts + 1;
    setAttempts(na);
    setGuessed(g => [...g, selected]);
    setSelected(null);
    if (ok || na >= 5) setResult({ win: ok, score: borderleScore(na, ok) });
  };

  const avail = shuffled.filter(o => !guessed.includes(o));

  return (
    <div className="round-wrap">
      <div className="rh">
        <span className="rbadge">03</span>
        <div>
          <h2 className="rtitle">Borderle</h2>
          <p className="rsub">Which empire held these borders?</p>
        </div>
      </div>

      <div className="bperiod">
        <span className="plabel">Time Period</span>
        <span className="pval">{data.year_label || data.time_period}</span>
      </div>

      <BorderleMap geojson={data.geojson} />

      {guessed.length > 0 && (
        <div className="wguesses">
          {guessed.map((g, i) => (
            <span key={i} className={`wbadge ${g === data.empire_name ? "cbadge" : ""}`}>{g}</span>
          ))}
        </div>
      )}

      {!submitted && (
        <>
          <div className="ogrid">
            {avail.map(o => (
              <button key={o} className={`obtn ${selected === o ? "sel" : ""}`}
                onClick={() => setSelected(o === selected ? null : o)}>{o}</button>
            ))}
          </div>
          <div className="arow">
            <span className="aleft">{5 - attempts} guess{5 - attempts !== 1 ? "es" : ""} left</span>
            <button className="btnp" onClick={go} disabled={!selected}>Confirm Guess</button>
          </div>
        </>
      )}

      {submitted && result && (
        <div className={`rcard ${result.win ? "win" : "lose"}`}>
          <div className="ricon">{result.win ? "🗺️" : "🏚️"}</div>
          <p className="rtext">{result.win ? "Correct!" : `It was the ${data.empire_name}.`}</p>
          <p className="ereveal">{data.empire_name}</p>
          <p className="eexp">{data.fun_fact}</p>
          <p className="rscore">+{result.score} pts</p>
          <button className="btnn" onClick={() => onComplete(result.score)}>Next Round →</button>
        </div>
      )}
    </div>
  );
}

function duelleScore(correct) { return correct * 200; }

function FigurleRound({ data, onComplete }) {
  const [attempts, setAttempts] = useState(0);
  const [guessed, setGuessed] = useState([]);
  const [selected, setSelected] = useState(null);
  const [clueIdx, setClueIdx] = useState(0);
  const [result, setResult] = useState(null);
  const submitted = !!result;
  const [shuffled] = useState(() => {
    const rng = seededRandom(getTodaySeed() + 77);
    return [...data.options].sort(() => rng() - 0.5);
  });

  const go = () => {
    if (!selected) return;
    const ok = selected === data.name;
    const na = attempts + 1;
    setAttempts(na);
    setGuessed(g => [...g, selected]);
    setSelected(null);
    if (ok || na >= 3) {
      setResult({ win: ok, score: figurleScore(na, ok) });
    } else {
      setClueIdx(Math.min(clueIdx + 1, data.clues.length - 1));
    }
  };

  const avail = shuffled.filter(o => !guessed.includes(o));
  const lifespan = data.birth_year && data.death_year
    ? `${fmtYear(data.birth_year)} – ${fmtYear(data.death_year)}`
    : null;

  return (
    <div className="round-wrap">
      <div className="rh">
        <span className="rbadge">04</span>
        <div><h2 className="rtitle">Figurle</h2><p className="rsub">Who is this historical figure?</p></div>
      </div>
      <div className="clues">
        {data.clues.slice(0, submitted ? data.clues.length : clueIdx + 1).map((c, i) => (
          <div key={i} className={`clue ${i === clueIdx && !submitted ? "clue-active" : ""}`}>
            <span className="cnum">Clue {i + 1}</span><span>{c}</span>
          </div>
        ))}
      </div>
      {guessed.length > 0 && (
        <div className="wguesses">
          {guessed.map((g, i) => (
            <span key={i} className={`wbadge ${g === data.name ? "cbadge" : ""}`}>{g}</span>
          ))}
        </div>
      )}
      {!submitted && (
        <>
          <div className="ogrid">
            {avail.map(o => (
              <button key={o} className={`obtn ${selected === o ? "sel" : ""}`}
                onClick={() => setSelected(o === selected ? null : o)}>{o}</button>
            ))}
          </div>
          <div className="arow">
            <span className="aleft">{3 - attempts} attempt{3 - attempts !== 1 ? "s" : ""} left</span>
            <button className="btnp" onClick={go} disabled={!selected}>Confirm Guess</button>
          </div>
        </>
      )}
      {submitted && result && (
        <div className={`rcard ${result.win ? "win" : "lose"}`}>
          <div className="ricon">{result.win ? "🧠" : "👤"}</div>
          <p className="rtext">{result.win ? "Correct!" : `It was ${data.name}.`}</p>
          <p className="ereveal">{data.name}</p>
          {lifespan && <p className="eexp" style={{marginBottom:'0.3rem'}}>{lifespan}</p>}
          <p className="eexp">{data.fun_fact}</p>
          <p className="rscore">+{result.score} pts</p>
          <button className="btnn" onClick={() => onComplete(result.score)}>Next Round →</button>
        </div>
      )}
    </div>
  );
}

function DuelleRound({ data, onComplete }) {
  const [current, setCurrent] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [chosen, setChosen] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [done, setDone] = useState(false);
  const [totalCorrect, setTotalCorrect] = useState(0);

  const pairs = data.pairs;
  const pair = pairs[current];
  const earlier = pair.a.year <= pair.b.year ? 'a' : 'b';

  const pick = (choice) => {
    if (chosen) return;
    const isRight = choice === earlier;
    setChosen(choice);
    setShowResult(true);
    const newCorrect = correct + (isRight ? 1 : 0);
    setTimeout(() => {
      if (current + 1 >= pairs.length) {
        setTotalCorrect(newCorrect);
        setDone(true);
      } else {
        setCurrent(c => c + 1);
        setChosen(null);
        setShowResult(false);
        setCorrect(newCorrect);
      }
    }, 1100);
  };

  if (done) {
    const score = duelleScore(totalCorrect);
    return (
      <div className="round-wrap">
        <div className="rh">
          <span className="rbadge">05</span>
          <div><h2 className="rtitle">Duelle</h2><p className="rsub">Which came first?</p></div>
        </div>
        <div className="rcard win">
          <div className="ricon">⚔️</div>
          <p className="rtext">You got <strong>{totalCorrect} of {pairs.length}</strong> correct!</p>
          <p className="rscore">+{score} pts</p>
          <button className="btnn" onClick={() => onComplete(score)}>Next Round →</button>
        </div>
      </div>
    );
  }

  const getStyle = (side) => {
    if (!showResult) return '';
    if (side === earlier) return 'duel-correct';
    if (side === chosen) return 'duel-wrong';
    return '';
  };

  return (
    <div className="round-wrap">
      <div className="rh">
        <span className="rbadge">05</span>
        <div><h2 className="rtitle">Duelle</h2><p className="rsub">Tap which event came first</p></div>
      </div>
      <div className="duel-progress">
        {pairs.map((_, i) => (
          <div key={i} className={`duel-pip ${i < current ? "done" : i === current ? "active" : ""}`} />
        ))}
      </div>
      <div className="duel-arena">
        <button className={`duel-card ${getStyle('a')}`} onClick={() => pick('a')} disabled={!!chosen}>
          <span className="duel-text">{pair.a.text}</span>
          {showResult && <span className="duel-year">{fmtYear(pair.a.year)}</span>}
        </button>
        <div className="duel-vs">VS</div>
        <button className={`duel-card ${getStyle('b')}`} onClick={() => pick('b')} disabled={!!chosen}>
          <span className="duel-text">{pair.b.text}</span>
          {showResult && <span className="duel-year">{fmtYear(pair.b.year)}</span>}
        </button>
      </div>
      <p className="duel-score-running">{correct} / {current} correct so far</p>
    </div>
  );
}

function FinalScore({ scores, onShare }) {
  const total = scores.reduce((a, b) => a + b, 0);
  const max = 5000;
  const medal = total >= 4200 ? "🥇" : total >= 3000 ? "🥈" : total >= 1800 ? "🥉" : "📜";
  const label = total >= 4200 ? "Historian Supreme" : total >= 3000 ? "Accomplished Scholar" : total >= 1800 ? "Apprentice Archivist" : "Curious Student";
  useEffect(() => {
    setTimeout(() => {
      document.querySelectorAll(".sbar").forEach((b, i) => {
        setTimeout(() => { b.style.width = `${(scores[i] / 1000) * 100}%`; }, i * 150);
      });
    }, 100);
  }, []);
  return (
    <div className="final">
      <div className="fmedal">{medal}</div>
      <h2 className="ftitle">{label}</h2>
      <p className="fdate">{todayString()}</p>
      <div className="fscore"><span className="ftotal">{total}</span><span className="fmax"> / {max}</span></div>
      <div className="sbreakdown">
        {["Chronicle","Eracle","Borderle","Figurle","Duelle"].map((n, i) => (
          <div key={n} className="srow">
            <span className="slabel">{n}</span>
            <div className="sbarwrap"><div className="sbar" style={{ width: 0 }} /></div>
            <span className="spts">{scores[i]}</span>
          </div>
        ))}
      </div>
      <button className="sharebtn" onClick={onShare}>Share Result 📤</button>
      <p className="comeback">Come back tomorrow for a new puzzle!</p>
    </div>
  );
}

export default function Historle() {
  const [round, setRound] = useState(0);
  const [scores, setScores] = useState([]);
  const [showShare, setShowShare] = useState(false);
  const [puzzle, setPuzzle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dateStr = getTodayDateString();
    fetch(`/puzzles/${dateStr}.json`)
      .then(r => { if (!r.ok) throw new Error('No puzzle'); return r.json(); })
      .then(data => { setPuzzle(data); setLoading(false); })
      .catch(() => { setPuzzle(getFallbackPuzzle()); setLoading(false); });
  }, []);

  const complete = useCallback(s => { setScores(p => [...p, s]); setRound(r => r + 1); }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        :root{--ink:#1a1209;--parch:#f5edd8;--pd:#e8d9b8;--sep:#8b6914;--sepl:#c4952a;--rust:#9b3a1a;--sage:#3d5c3a;--gold:#c9942a;--sh:rgba(26,18,9,0.15);}
        body{background:var(--parch);}
        .app{min-height:100vh;background:var(--parch);color:var(--ink);font-family:'Crimson Pro',Georgia,serif;background-image:radial-gradient(ellipse at 20% 20%,rgba(139,105,20,0.08) 0%,transparent 60%),radial-gradient(ellipse at 80% 80%,rgba(155,58,26,0.06) 0%,transparent 60%);}
        .mast{text-align:center;padding:1.8rem 1rem 1.1rem;border-bottom:2px solid var(--sep);}
        .mast::before{content:'◆ ◆ ◆';display:block;font-size:0.6rem;letter-spacing:0.5em;color:var(--sepl);margin-bottom:0.35rem;}
        .mtitle{font-family:'Playfair Display',serif;font-size:clamp(2.4rem,7vw,3.8rem);font-weight:900;letter-spacing:-0.02em;line-height:1;}
        .mtitle span{color:var(--rust);}
        .msub{font-size:0.82rem;color:var(--sep);letter-spacing:0.15em;text-transform:uppercase;margin-top:0.25rem;font-style:italic;}
        .mdate{font-size:0.73rem;color:var(--sepl);margin-top:0.25rem;}
        .prog{display:flex;justify-content:center;gap:0.4rem;padding:0.7rem;border-bottom:1px solid var(--pd);}
        .pip{width:1.6rem;height:4px;border-radius:2px;background:var(--pd);transition:background 0.3s;}
        .pip.active{background:var(--gold);}
        .pip.done{background:var(--sage);}
        .main{max-width:640px;margin:0 auto;padding:1.8rem 1.1rem 4rem;}
        .round-wrap{animation:fs 0.4s ease;}
        @keyframes fs{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .rh{display:flex;align-items:flex-start;gap:0.9rem;margin-bottom:1.3rem;padding-bottom:0.9rem;border-bottom:1px solid var(--pd);}
        .rbadge{font-family:'Playfair Display',serif;font-size:2rem;font-weight:900;color:var(--pd);line-height:1;flex-shrink:0;}
        .rtitle{font-family:'Playfair Display',serif;font-size:1.6rem;font-weight:700;line-height:1.1;}
        .rsub{color:var(--sep);font-style:italic;font-size:0.88rem;margin-top:0.15rem;}
        .clist{display:flex;flex-direction:column;gap:0.45rem;margin-bottom:1.3rem;}
        .citem{display:flex;align-items:center;gap:0.75rem;padding:0.75rem 0.9rem;background:white;border:1.5px solid var(--pd);border-radius:4px;cursor:grab;user-select:none;touch-action:none;transition:transform 0.15s,box-shadow 0.15s,border-color 0.15s;}
        .citem:hover{border-color:var(--sepl);box-shadow:0 2px 6px var(--sh);}
        .citem-correct{border-color:var(--sage)!important;background:rgba(61,92,58,0.07)!important;}
        .citem-wrong{border-color:var(--rust)!important;background:rgba(155,58,26,0.06)!important;}
        .citem-indicator{font-size:0.9rem;font-weight:700;flex-shrink:0;width:1.1rem;text-align:center;}
        .citem-correct .citem-indicator{color:var(--sage);}
        .citem-wrong .citem-indicator{color:var(--rust);}
        .citem.dragging{opacity:0.5;transform:scale(0.97);}
        .dhandle{color:var(--pd);font-size:1rem;flex-shrink:0;}
        .etext{flex:1;font-size:0.94rem;line-height:1.4;}
        .eyear{font-family:'Playfair Display',serif;font-weight:700;color:var(--sep);font-size:0.87rem;white-space:nowrap;}
        .shake{animation:shk 0.5s;}
        @keyframes shk{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
        .clues{display:flex;flex-direction:column;gap:0.45rem;margin-bottom:1.1rem;}
        .clue{display:flex;gap:0.75rem;padding:0.65rem 0.9rem;background:rgba(139,105,20,0.05);border-left:3px solid var(--pd);border-radius:0 4px 4px 0;font-size:0.93rem;animation:fi 0.3s ease;}
        @keyframes fi{from{opacity:0}to{opacity:1}}
        .clue.clue-active{border-left-color:var(--gold);background:rgba(201,148,42,0.08);}
        .cnum{font-size:0.68rem;font-weight:600;letter-spacing:0.05em;color:var(--sepl);text-transform:uppercase;flex-shrink:0;padding-top:0.12rem;min-width:3.3rem;}
        .ghist{display:flex;flex-direction:column;gap:0.32rem;margin-bottom:0.9rem;}
        .grow{display:flex;align-items:center;gap:0.9rem;padding:0.4rem 0.75rem;background:var(--pd);border-radius:4px;}
        .gyear{font-family:'Playfair Display',serif;font-weight:700;font-size:0.97rem;min-width:4rem;}
        .gdiff{font-size:0.86rem;}
        .eracle-row{display:flex;gap:0.55rem;margin-bottom:0.9rem;}
        .yinput{flex:1;padding:0.65rem 0.9rem;font-family:'Crimson Pro',serif;font-size:1rem;border:1.5px solid var(--pd);border-radius:4px;background:white;color:var(--ink);outline:none;transition:border-color 0.2s;}
        .yinput:focus{border-color:var(--gold);}
        .bperiod{display:flex;align-items:center;gap:0.75rem;padding:0.6rem 0.9rem;background:var(--ink);color:var(--parch);border-radius:4px;margin-bottom:0.9rem;}
        .bmap{width:100%;height:300px;border-radius:6px;border:2px solid var(--pd);margin-bottom:1rem;background:#c8dff0;overflow:hidden;display:block;}
        .plabel{font-size:0.63rem;text-transform:uppercase;letter-spacing:0.12em;opacity:0.6;}
        .pval{font-family:'Playfair Display',serif;font-weight:700;font-size:0.92rem;}
        .wguesses{display:flex;flex-wrap:wrap;gap:0.35rem;margin-bottom:0.9rem;}
        .wbadge{padding:0.18rem 0.6rem;background:rgba(155,58,26,0.1);border:1px solid var(--rust);color:var(--rust);border-radius:20px;font-size:0.8rem;text-decoration:line-through;}
        .cbadge{background:rgba(61,92,58,0.1);border-color:var(--sage);color:var(--sage);text-decoration:none;}
        .ogrid{display:grid;grid-template-columns:1fr 1fr;gap:0.45rem;margin-bottom:1.1rem;}
        .obtn{padding:0.65rem 0.75rem;background:white;border:1.5px solid var(--pd);border-radius:4px;font-family:'Crimson Pro',serif;font-size:0.9rem;cursor:pointer;text-align:left;transition:all 0.15s;color:var(--ink);}
        .obtn:hover{border-color:var(--sepl);background:rgba(139,105,20,0.05);}
        .obtn.sel{border-color:var(--gold);background:rgba(201,148,42,0.1);font-weight:600;}
        .arow{display:flex;justify-content:space-between;align-items:center;margin-bottom:0.9rem;}
        .aleft{font-style:italic;color:var(--sep);font-size:0.86rem;}
        .btnp{padding:0.62rem 1.3rem;background:var(--ink);color:var(--parch);border:none;border-radius:4px;font-family:'Crimson Pro',serif;font-size:0.95rem;font-weight:600;cursor:pointer;transition:background 0.2s;}
        .btnp:hover{background:#2d1f0e;}
        .btnp:disabled{background:var(--pd);color:var(--sep);cursor:not-allowed;}
        .btnn{padding:0.62rem 1.2rem;background:var(--sage);color:white;border:none;border-radius:4px;font-family:'Crimson Pro',serif;font-size:0.95rem;font-weight:600;cursor:pointer;margin-top:0.9rem;transition:background 0.2s;}
        .btnn:hover{background:#2d4a2a;}
        .rcard{padding:1.3rem;border-radius:6px;border:2px solid;text-align:center;margin-top:0.9rem;animation:fs 0.35s ease;}
        .rcard.win{border-color:var(--sage);background:rgba(61,92,58,0.06);}
        .rcard.lose{border-color:var(--rust);background:rgba(155,58,26,0.05);}
        .ricon{font-size:2rem;margin-bottom:0.35rem;}
        .rtext{font-size:0.97rem;margin-bottom:0.25rem;}
        .ereveal{font-family:'Playfair Display',serif;font-size:1.05rem;font-weight:700;margin:0.35rem 0 0.25rem;}
        .eexp{font-size:0.9rem;color:var(--sep);font-style:italic;line-height:1.5;}
        .rscore{font-family:'Playfair Display',serif;font-size:1.6rem;font-weight:900;color:var(--gold);margin-top:0.55rem;}
        .clist2{text-align:left;margin:0.45rem 0;}
        .ci2{padding:0.25rem 0;font-size:0.86rem;border-bottom:1px solid var(--pd);}
        .ci2 span{font-family:'Playfair Display',serif;font-weight:700;color:var(--sep);margin-right:0.35rem;}
        .duel-progress{display:flex;gap:0.4rem;margin-bottom:1.2rem;}
        .duel-pip{flex:1;height:4px;border-radius:2px;background:var(--pd);transition:background 0.3s;}
        .duel-pip.active{background:var(--gold);}
        .duel-pip.done{background:var(--sage);}
        .duel-arena{display:flex;flex-direction:column;gap:0.6rem;margin-bottom:0.8rem;}
        .duel-card{width:100%;padding:1.1rem;background:white;border:2px solid var(--pd);border-radius:8px;cursor:pointer;font-family:'Crimson Pro',serif;font-size:1rem;text-align:left;transition:all 0.15s;color:var(--ink);display:flex;flex-direction:column;gap:0.3rem;}
        .duel-card:hover:not(:disabled){border-color:var(--sepl);background:rgba(139,105,20,0.04);transform:translateY(-1px);}
        .duel-card:disabled{cursor:default;}
        .duel-card.duel-correct{border-color:var(--sage);background:rgba(61,92,58,0.08);}
        .duel-card.duel-wrong{border-color:var(--rust);background:rgba(155,58,26,0.08);}
        .duel-text{font-size:0.97rem;line-height:1.4;}
        .duel-year{font-family:'Playfair Display',serif;font-weight:700;font-size:0.85rem;color:var(--sep);}
        .duel-vs{text-align:center;font-family:'Playfair Display',serif;font-weight:900;font-size:1rem;color:var(--pd);letter-spacing:0.1em;}
        .duel-score-running{text-align:center;font-style:italic;color:var(--sep);font-size:0.85rem;}
        .final{text-align:center;padding:0.8rem 0 2rem;animation:fs 0.5s ease;}
        .fmedal{font-size:4rem;margin-bottom:0.35rem;}
        .ftitle{font-family:'Playfair Display',serif;font-size:1.7rem;font-weight:900;margin-bottom:0.2rem;}
        .fdate{color:var(--sep);font-style:italic;margin-bottom:1.1rem;}
        .fscore{margin-bottom:1.6rem;}
        .ftotal{font-family:'Playfair Display',serif;font-size:3.2rem;font-weight:900;}
        .fmax{font-size:1.2rem;color:var(--sep);}
        .sbreakdown{display:flex;flex-direction:column;gap:0.65rem;margin-bottom:1.6rem;text-align:left;}
        .srow{display:flex;align-items:center;gap:0.75rem;}
        .slabel{width:5.2rem;font-size:0.86rem;font-weight:600;flex-shrink:0;}
        .sbarwrap{flex:1;height:8px;background:var(--pd);border-radius:4px;overflow:hidden;}
        .sbar{height:100%;background:var(--gold);border-radius:4px;transition:width 0.9s ease;}
        .spts{font-family:'Playfair Display',serif;font-weight:700;font-size:0.94rem;width:2.8rem;text-align:right;}
        .sharebtn{padding:0.7rem 1.9rem;background:var(--ink);color:var(--parch);border:none;border-radius:4px;font-family:'Playfair Display',serif;font-size:1rem;font-weight:700;cursor:pointer;margin-bottom:1.1rem;transition:all 0.2s;letter-spacing:0.03em;}
        .sharebtn:hover{background:var(--rust);transform:translateY(-1px);}
        .comeback{font-style:italic;color:var(--sep);font-size:0.88rem;}
        .intro{text-align:center;padding:1.3rem 0;}
        .iorn{font-size:2.2rem;margin-bottom:0.7rem;}
        .ih{font-family:'Playfair Display',serif;font-size:1.7rem;font-weight:700;margin-bottom:0.5rem;}
        .ip{color:var(--sep);font-size:0.97rem;line-height:1.6;margin-bottom:0.4rem;}
        .rprev{display:flex;flex-direction:column;gap:0.5rem;margin:1.3rem 0;text-align:left;}
        .rpi{display:flex;align-items:center;gap:0.9rem;padding:0.7rem 0.9rem;background:rgba(139,105,20,0.06);border:1px solid var(--pd);border-radius:4px;}
        .rpin{font-family:'Playfair Display',serif;font-size:1.3rem;font-weight:900;color:var(--sepl);width:1.8rem;flex-shrink:0;}
        .rpii strong{display:block;font-weight:600;font-size:0.97rem;}
        .rpii small{color:var(--sep);font-style:italic;font-size:0.85rem;}
        .startbtn{padding:0.8rem 2rem;background:var(--ink);color:var(--parch);border:none;border-radius:4px;font-family:'Playfair Display',serif;font-size:1.05rem;font-weight:700;cursor:pointer;letter-spacing:0.05em;transition:all 0.2s;margin-top:0.7rem;}
        .startbtn:hover{background:var(--rust);transform:translateY(-1px);}
        .overlay{position:fixed;inset:0;background:rgba(26,18,9,0.65);display:flex;align-items:center;justify-content:center;z-index:100;animation:fi 0.2s ease;padding:1rem;}
        .modal{background:var(--parch);border:2px solid var(--sep);border-radius:8px;padding:1.6rem;max-width:400px;width:100%;position:relative;animation:fs 0.25s ease;}
        .modal-close{position:absolute;top:0.7rem;right:0.7rem;background:none;border:none;font-size:1rem;cursor:pointer;color:var(--sep);padding:0.2rem 0.4rem;}
        .modal-title{font-family:'Playfair Display',serif;font-size:1.2rem;font-weight:700;margin-bottom:0.9rem;}
        .share-pre{font-family:'Crimson Pro',monospace;font-size:0.88rem;line-height:1.7;background:white;border:1px solid var(--pd);border-radius:4px;padding:0.9rem;margin-bottom:0.9rem;white-space:pre-wrap;color:var(--ink);}
        .copy-btn{width:100%;padding:0.7rem;background:var(--ink);color:var(--parch);border:none;border-radius:4px;font-family:'Playfair Display',serif;font-size:0.97rem;font-weight:700;cursor:pointer;transition:background 0.2s;}
        .copy-btn:hover{background:var(--sage);}
      `}</style>

      <div className="app">
        <header className="mast">
          <h1 className="mtitle">Hist<span>o</span>rle</h1>
          <p className="msub">The Daily History Puzzle</p>
          <p className="mdate">{todayString()}</p>
        </header>

        {round > 0 && round < 6 && (
          <div className="prog">
            {[1,2,3,4,5].map(n => (
              <div key={n} className={`pip ${round === n ? "active" : round > n ? "done" : ""}`} />
            ))}
          </div>
        )}

        <main className="main">
          {loading && (
            <div style={{textAlign:'center',padding:'4rem 0',color:'var(--sep)',fontStyle:'italic'}}>
              Consulting the archives…
            </div>
          )}
          {!loading && round === 0 && (
            <div className="intro">
              <div className="iorn">📜</div>
              <h2 className="ih">Today's Puzzle Awaits</h2>
              <p className="ip">Five rounds of world history. Max 5,000 points.</p>
              <div className="rprev">
                {[
                  {n:"I",   name:"Chronicle", desc:"Arrange 5 events in chronological order"},
                  {n:"II",  name:"Eracle",    desc:"Guess the year of a historical event"},
                  {n:"III", name:"Borderle",  desc:"Identify an empire from its map borders"},
                  {n:"IV",  name:"Figurle",   desc:"Identify a historical figure from clues"},
                  {n:"V",   name:"Duelle",    desc:"Pick which of two events came first"},
                ].map(r => (
                  <div key={r.n} className="rpi">
                    <span className="rpin">{r.n}</span>
                    <div className="rpii"><strong>{r.name}</strong><small>{r.desc}</small></div>
                  </div>
                ))}
              </div>
              <button className="startbtn" onClick={() => setRound(1)}>Begin →</button>
            </div>
          )}
          {!loading && round === 1 && <ChronicleRound data={puzzle.chronicle} onComplete={complete} />}
          {!loading && round === 2 && <EracleRound    data={puzzle.eracle}    onComplete={complete} />}
          {!loading && round === 3 && <BorderleRound  data={puzzle.borderle}  onComplete={complete} />}
          {!loading && round === 4 && <FigurleRound   data={puzzle.figurle}   onComplete={complete} />}
          {!loading && round === 5 && <DuelleRound    data={puzzle.duelle}    onComplete={complete} />}
          {!loading && round === 6 && <FinalScore scores={scores} onShare={() => setShowShare(true)} />}
        </main>

        {showShare && <ShareModal scores={scores} onClose={() => setShowShare(false)} />}
      </div>
    </>
  );
}
