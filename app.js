(function () {
'use strict';
const D = ECHO, C = D.characters, I = D.incidents, R = D.riskLevels, F = D.factions;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const view = $('#view');
const byId = id => C.find(c => c.id === id);
const pad = n => String(n).padStart(3, '0');
const sum = (a, k) => a.reduce((s, x) => s + (x[k] || 0), 0);
const fdate = d => d.replace(/-/g, '.');

/* ---------------- 이미지 로딩 (jpg → png → webp → jpeg 순서로 자동 탐색) ---------------- */
const EXTS = ['jpg', 'png', 'webp', 'jpeg'];
const imgSrc = (id, i = 0) => `images/${id}.${EXTS[i]}`;
window.imgFail = function (el) {
  let i = (+el.dataset.i || 0) + 1;
  if (i < EXTS.length) { el.dataset.i = i; el.src = imgSrc(el.dataset.id, i); return; }
  const p = document.createElement('div');
  p.className = 'img-ph';
  p.innerHTML = `<span>NO IMAGE</span><small>images/${el.dataset.id}.jpg</small>`;
  el.replaceWith(p);
};
const img = (c, cls = '') =>
  `<img class="${cls}" data-id="${c.id}" data-i="0" src="${imgSrc(c.id)}" alt="${c.name} (${c.animal})" loading="lazy" onerror="imgFail(this)">`;

/* 배경 이미지 탐색 */
(function () {
  let i = 0;
  const t = () => {
    if (i >= EXTS.length) return;
    const im = new Image();
    im.onload = () => document.documentElement.style.setProperty('--bg-img', `url(images/bg.${EXTS[i]})`);
    im.onerror = () => { i++; t(); };
    im.src = `images/bg.${EXTS[i]}`;
  };
  t();
})();

/* ---------------- 공통 조각 ---------------- */
const totals = () => ({
  chars: C.length, deaths: sum(C, 'deaths'), missing: sum(C, 'missing'), incidents: I.length
});
const rc = k => R[k].color;
const bar = (label, val, color, text) =>
  `<div class="bar"><div class="t"><span>${label}</span><b>${text ?? val + '%'}</b></div><div class="b"><i data-w="${val}" style="--c:${color}"></i></div></div>`;

function card(c) {
  return `<a class="card rv" href="#echoid-${c.id}" style="--rc:${rc(c.risk)}">
    <div class="frame">${img(c)}<span class="rbadge">${c.risk}</span><span class="fbadge ${c.faction}">${F[c.faction].label}</span></div>
    <div class="cbody"><div class="cno">ECH-${pad(c.no)}</div>
    <h3>${c.name}<em>${c.nameEn}</em></h3><p>${c.animal}</p>
    <div class="mini"><span>☠ <b>${c.deaths}</b></span><span>✕ <b>${c.missing}</b></span></div></div></a>`;
}
function lockedCards(n, start) {
  let h = '';
  for (let i = 0; i < n; i++) {
    h += `<div class="card locked rv"><div class="frame"><span class="lockmark">?</span></div>
      <div class="cbody"><div class="cno">ECH-${pad(start + i)}</div><h3><span class="redact"></span></h3>
      <p>미확정 · 기록 대기 중</p><div class="mini"><span>CLASSIFIED</span></div></div></div>`;
  }
  return h;
}
function incidentItem(inc, open) {
  const chars = inc.characters.map(id => byId(id)).filter(Boolean);
  return `<div class="inc-i rv ${open ? 'open' : ''}" data-id="${inc.id}" style="--rc:${rc(inc.level)}">
    <div class="inc-card">
      <div class="inc-top"><span class="d">${fdate(inc.date)}</span><span class="lvl">${inc.level}</span>
        <h3>${inc.title}</h3><span class="id">${inc.id}</span><span class="ar">▶</span></div>
      <div class="inc-body"><div>
        <div class="inc-meta"><span>장소 <b>${inc.location}</b></span><span class="dg">사망 <b>${inc.deaths}</b></span>
          <span class="dg">실종 <b>${inc.missing}</b></span><span>상태 <b>${inc.status}</b></span></div>
        <p>${inc.summary}</p>
        <div class="inc-links">${chars.map(c => `<a href="#echoid-${c.id}">${c.name} · ${c.nameEn}</a>`).join('')}
          <a href="#map-${inc.id}">지도에서 보기</a>${DOCS.filter(x => x.incident === inc.id).map(x => `<a class="dl" href="#doc-${x.id}">문서 ${x.id}</a>`).join('')}</div>
      </div></div>
    </div></div>`;
}
function eventItem(e) {
  return `<div class="inc-i ev rv"><div class="inc-card"><div class="inc-top" style="cursor:default">
    <span class="d">${fdate(e.date)}</span><h3>${e.title}</h3><span class="id">WORLD EVENT</span></div>
    <div style="padding:0 20px 16px;color:#b9d6e6;font-size:14.5px">${e.text}</div></div></div>`;
}
const pageHead = (eyebrow, title, desc) =>
  `<div class="page-head rv"><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${desc}</p></div>`;

/* ---------------- HOME ---------------- */
function home() {
  const t = totals();
  const recent = [...I].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const fc = k => C.filter(c => c.faction === k).length;
  return {
    html: `
    <section class="hero">
      <div class="tag rv">TOP SECRET · UN-ECRA ARCHIVE · 2030</div>
      <h1 class="rv"><span>PROJECT</span>ECHO</h1>
      <p class="lead rv">사라져 가는 종의 마지막 목소리가 사람의 모습으로 돌아왔다.<br>
      환경오염과 무분별한 개발 끝에 멸종 직전의 동물들이 <b>에코이드(Echoid)</b>로 변이했다. 그리고 일부는 복수를 선택했다.</p>
      <div class="cta rv"><a class="btn" href="#database">에코이드 데이터베이스 열람 ▸</a><a class="btn red" href="#threat">위험도 지수 확인</a></div>
      <div class="stats rv">
        <div class="stat"><b data-count="${t.chars}">0</b><span>REGISTERED ECHOIDS</span></div>
        <div class="stat red"><b data-count="${t.deaths}">0</b><span>CONFIRMED HUMAN DEATHS</span></div>
        <div class="stat red"><b data-count="${t.missing}">0</b><span>MISSING PERSONS</span></div>
        <div class="stat"><b data-count="${t.incidents}">0</b><span>INCIDENT FILES</span></div>
      </div>
    </section>

    <section class="sec"><h2 class="rv">ECHOID DATABASE <small>등록 ${t.chars}</small></h2>
      <div class="grid">${C.map(card).join('')}${lockedCards(D.meta.pendingSlots, C.length + 1)}</div>
      <p class="rv" style="margin-top:20px"><a class="btn" href="#database">전체 목록 · 검색 ▸</a></p></section>

    <section class="sec"><h2 class="rv">ECHOID 분류 <small>FACTIONS</small></h2>
      <div class="cols c3">${Object.entries(F).map(([k, f]) => `
        <div class="panel fac rv" style="--fc:${f.color}"><h3>${f.label} · ${f.en}</h3><p>${f.desc}</p>
        <div class="cnt">${fc(k)}<small> / ${C.length} REGISTERED</small></div></div>`).join('')}</div></section>

    <section class="sec"><h2 class="rv">LATEST INCIDENTS <small>최근 사건</small></h2>
      <div class="tl">${recent.map(i => incidentItem(i, false)).join('')}</div>
      <p class="rv"><a class="btn" href="#incidents">사건 기록 전체 ▸</a></p></section>

    <section class="sec"><h2 class="rv">CLASSIFIED DOCUMENTS <small>최근 기밀 문서</small></h2>
      <div class="doc-grid">${[...DOCS].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3).map(docCard).join('')}</div>
      <p class="rv" style="margin-top:20px"><a class="btn" href="#documents">기밀 문서 보관소 ▸</a></p></section>`
  };
}

/* ---------------- WORLD ---------------- */
function world() {
  const fc = k => C.filter(c => c.faction === k);
  const events = [...I.map(i => ({ kind: 'i', d: i.date, i })), ...D.timeline.map(e => ({ kind: 'e', d: e.date, e }))]
    .sort((a, b) => a.d.localeCompare(b.d));
  return {
    html: pageHead('WORLD // 세계관', '에코이드 — 마지막 목소리',
      '2030년. 인간의 환경오염과 개발이 쌓아 올린 멸종의 임계점에서, 세계는 새로운 종류의 존재와 마주했다.') + `
    <section class="sec lore">
      <p class="big rv">종의 개체수가 한계 이하로 떨어지는 순간, 서식지에 쌓인 오염과 상실의 기록이 하나의 신호로 공명한다.
      그 공명 속에서 눈을 뜬 것이 <b>에코이드(Echoid)</b>다.</p>
      <p class="rv">에코이드는 멸종위기 동물이 인간형 존재로 변이한 개체다. 초자연적인 능력을 얻으며, 각자의 자연 서식지에서 활동한다.
      그들은 종의 ‘마지막 목소리(Echo)’이자 기억의 보관자이기도 하다. 일부는 분노했고, 일부는 침묵했으며, 일부는 대화를 택했다.</p>
      <p class="rv">UN-ECRA의 현재 가설에 따르면 에코이드는 자신의 서식지에서 가장 강하며, 서식지를 벗어날수록 능력이 감쇄한다.
      따라서 인간과의 충돌 대부분은 개발·벌목·조업 등 서식지 침범과 겹쳐 발생한다.</p>
    </section>

    <section class="sec"><h2 class="rv">에코이드 3분류 <small>FACTIONS</small></h2>
      <div class="cols c3">${Object.entries(F).map(([k, f]) => `
        <div class="panel fac rv" style="--fc:${f.color}"><h3>${f.label}</h3><p>${f.desc}</p>
        <div class="cnt">${fc(k).length}<small> REGISTERED</small></div>
        <p style="font-size:13px;color:var(--mute);margin-top:8px">${fc(k).map(c => c.name).join(' · ') || '—'}</p></div>`).join('')}</div>
</section>

    <section class="sec"><h2 class="rv">핵심 주제 <small>THEMES</small></h2>
      <div class="cols c3">
        <div class="panel rv"><h3>환경오염</h3><p>해양 소음, 서식지 파편화, 벌채와 간척. 에코이드는 인간이 남긴 흔적이 형상을 얻은 존재다.</p></div>
        <div class="panel rv"><h3>멸종위기</h3><p>모든 에코이드는 실제 멸종위기종에서 비롯된다. 그들의 변이는 곧 종의 마지막 신호다.</p></div>
        <div class="panel rv"><h3>인간과의 갈등</h3><p>복수, 불가침, 공존. 같은 상처에서 서로 다른 선택을 한 존재들이 인간 앞에 서 있다.</p></div>
      </div></section>

    <section class="sec"><h2 class="rv">연표 <small>TIMELINE 2024 — 2030</small></h2>
      <div class="tl">${events.map(x => x.kind === 'i' ? incidentItem(x.i, false) : eventItem(x.e)).join('')}</div></section>`
  };
}

/* ---------------- UN-ECRA ---------------- */
function ecra() {
  const ST = D.staff || [];
  const depts = [
    ['보호연구국', 'Protection & Research', '에코이드의 생태·능력·변이 조건을 연구하고 보호 대상을 지정한다.'],
    ['생태복원국', 'Ecosystem Restoration', '서식지 복원과 개발 제한 구역 설정을 주관. 충돌의 근본 원인을 줄이는 부서.'],
    ['충돌방지국', 'Conflict Prevention', '벌목·건설·조업 현장과 에코이드 서식지의 겹침을 사전에 차단한다.'],
    ['대응작전국 (ECOR)', 'Ecoid Operations & Response', '적대 에코이드에 대한 현장 대응, 시민 대피, 위험 구역 통제.'],
    ['공존협상국', 'Coexistence Affairs', '에코이드와의 대화 채널을 운영하며 연락관(루루 등)을 통해 협력 방안을 모색한다.']
  ];
  return {
    html: pageHead('UN-ECRA // 조직', 'UN-ECRA',
      'United Nations Ecological Crisis Response Agency — 국제연합 생태위기대응기구') + `
    <section class="sec lore"><p class="big rv">보호하되, 막아야 할 때는 막는다.<br>UN-ECRA는 인간과 에코이드가 서로를 완전히 잃기 전에 마지막 선을 긋기 위해 만들어졌다.</p></section>

    <section class="sec"><h2 class="rv">주요 임무 <small>MISSION</small></h2>
      <ol class="mission">
        <li class="rv">에코이드 보호 및 연구</li><li class="rv">생태계 복원</li>
        <li class="rv">인간과 에코이드의 충돌 방지</li><li class="rv">적대적 에코이드 대응</li>
        <li class="rv">인간과 에코이드의 공존 모색</li></ol></section>

    <section class="sec"><h2 class="rv">본부 <small>HEADQUARTERS</small></h2>
      <div class="hq">
        <div class="panel rv"><h3>제네바 본부 · ARK-01 <span class="cl">RESTRICTED</span></h3>
          <dl class="kv">
            <dt>설립</dt><dd>2029년 1월 (UN 긴급총회 결의 이후)</dd>
            <dt>본부</dt><dd>스위스 제네바 — 지하 격리 연구 시설 ‘ARK-01’</dd>
            <dt>지역 사무소</dt><dd>동남아 · 남아시아 · 극동 · 중남미 · 오세아니아 · 아프리카</dd>
            <dt>등급 체계</dt><dd>위험도 S–A–B–C–D</dd>
            <dt>원칙</dt><dd>비살상 우선 · 시민 보호 최우선 · 서식지 복원 병행</dd>
          </dl></div>
        <div class="panel rv"><h3>열람 안내</h3>
          <p>이 아카이브는 ACCESS LEVEL 3 이상의 직원만 열람할 수 있습니다. 위험도 S 등급 개체의 위치 정보와 대응 교리는 별도 보안 등급으로 관리됩니다.</p>
          <p style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap"><a class="btn" href="#database">에코이드 DB 열람 ▸</a><a class="btn" href="#documents">기밀 문서 ▸</a></p></div>
      </div></section>

    ${ST.length ? `<section class="sec"><h2 class="rv">소속 직원 <small>PERSONNEL</small></h2>
      <div class="grid staff-grid">${ST.map(staffCard).join('')}</div></section>` : ''}

    <section class="sec"><h2 class="rv">조직 구성 <small>DEPARTMENTS</small></h2>
      <div class="cols c2">${depts.map((d, i) => `
        <div class="panel rv dept"><div class="n">0${i + 1}</div><div><h3>${d[0]}</h3>${(() => { const m = ST.filter(p => d[0].startsWith(p.deptName.split(' ')[0])); return m.length ? `<div class="dept-staff">${m.map(p => `<a href="#staff-${p.id}">${p.name}</a>`).join('')}</div>` : ''; })()}
        <div class="mono" style="font-size:11px;color:var(--mute);margin-bottom:6px">${d[1].toUpperCase()}</div><p>${d[2]}</p></div></div>`).join('')}</div></section>`
  };
}

/* ---------------- DATABASE ---------------- */
let st = { q: '', f: 'all', r: 'all', s: 'risk' };
function filtered() {
  const q = st.q.trim().toLowerCase();
  const a = C.filter(c => {
    if (st.f !== 'all' && c.faction !== st.f) return false;
    if (st.r !== 'all' && c.risk !== st.r) return false;
    if (q) {
      if (/^[sabcd]$/.test(q)) return c.risk === q.toUpperCase();
      const hay = [c.name, c.nameEn, c.animal, c.sci, c.mbti, c.habitat.name, c.state, c.personality, c.appearance,
        F[c.faction].label, R[c.risk].label].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  const sorts = {
    risk: (a, b) => R[b.risk].rank - R[a.risk].rank || b.deaths - a.deaths,
    deaths: (a, b) => b.deaths - a.deaths,
    name: (a, b) => a.name.localeCompare(b.name, 'ko'),
    no: (a, b) => a.no - b.no
  };
  return a.sort(sorts[st.s]);
}
function database() {
  const chip = (g, v, l, extra = '') => `<button class="chip ${extra} ${st[g] === v ? 'on' : ''}" data-g="${g}" data-v="${v}" ${extra ? `style="--rc:${rc(v)}"` : ''}>${l}</button>`;
  return {
    html: pageHead('ECHOID DATABASE // 에코이드 목록', '에코이드 데이터베이스',
      '등록된 에코이드의 프로필과 위험도를 열람합니다. 이름·동물·서식지·MBTI로 검색할 수 있습니다.') + `
    ${D.meta.finalRoster && C.length < D.meta.finalRoster ? `<div class="notice rv">⚠ 명단 미확정 — 현재 ${C.length}명 등록 / 최종 ${D.meta.finalRoster}명 확정 전까지 임시 관리 중</div>` : ''}
    <div class="toolbar rv">
      <div class="search"><input id="q" type="search" placeholder="검색: 이름, 동물, 학명, 서식지, MBTI, 위험도(S~D)" value="${st.q}"></div>
      <select id="sort"><option value="risk">정렬: 위험도순</option><option value="deaths">정렬: 사망자순</option><option value="name">정렬: 이름순</option><option value="no">정렬: 등록순</option></select>
    </div>
    <div class="toolbar rv">
      <div class="chips"><span class="lbl">FACTION</span>${chip('f', 'all', '전체')}${Object.entries(F).map(([k, f]) => chip('f', k, f.label)).join('')}</div>
      <div class="chips"><span class="lbl">RISK</span>${chip('r', 'all', '전체')}${Object.keys(R).map(k => chip('r', k, k, 'r')).join('')}</div>
    </div>
    <div class="count" id="count"></div>
    <div class="grid" id="grid"></div>`,
    init() {
      $('#sort').value = st.s;
      const draw = () => {
        const a = filtered();
        const clean = !st.q && st.f === 'all' && st.r === 'all';
        $('#count').innerHTML = `<b>${a.length}</b> / ${C.length} RECORDS FOUND`;
        $('#grid').innerHTML = a.length
          ? a.map(card).join('') + (clean ? lockedCards(D.meta.pendingSlots, C.length + 1) : '')
          : `<div class="empty" style="grid-column:1/-1">NO MATCHING RECORD — 검색 조건에 맞는 기록이 없습니다.</div>`;
        reveal();
      };
      $('#q').addEventListener('input', e => { st.q = e.target.value; draw(); });
      $('#sort').addEventListener('change', e => { st.s = e.target.value; draw(); });
      $$('.chip').forEach(b => b.addEventListener('click', () => {
        st[b.dataset.g] = b.dataset.v;
        $$(`.chip[data-g="${b.dataset.g}"]`).forEach(x => x.classList.toggle('on', x === b));
        draw();
      }));
      draw();
    }
  };
}

/* ---------------- ECHOID DETAIL ---------------- */
function echoid(id) {
  const c = byId(id);
  if (!c) return database();
  const idx = C.indexOf(c), prev = C[(idx - 1 + C.length) % C.length], next = C[(idx + 1) % C.length];
  const ctrlLabel = c.control >= 70 ? '높음' : c.control >= 40 ? '보통' : c.control >= 15 ? '낮음' : '사실상 불가';
  const related = I.filter(i => i.characters.includes(c.id));
  const col = rc(c.risk);
  return {
    html: `
    <div class="detail">
      <div class="portrait rv" id="portrait" style="--rc:${col}"><div class="frame">${img(c)}</div></div>
      <div>
        <div class="dhead rv">
          <div class="no">FILE No. ECH-${pad(c.no)} <span class="cl">CONFIDENTIAL</span></div>
          <h1>${c.name}<small>${c.nameEn}</small></h1>
          <div class="sci">${c.animal} · ${c.sci} · IUCN ${c.iucn}</div>
          <div class="tags" style="--rc:${col}"><span class="tag-b risk">위험도 ${c.risk} · ${R[c.risk].label}</span>
            <span class="tag-b ${c.faction}">${F[c.faction].label}</span><span class="tag-b">${c.mbti}</span></div>
        </div>
        <div class="facts rv">
          <div><span>신장</span><b>${c.height} cm</b></div><div><span>외견 나이</span><b>${c.age}세</b></div>
          <div><span>MBTI</span><b>${c.mbti}</b></div><div class="danger"><span>인간 사망자</span><b>${c.deaths}</b></div>
          <div class="danger"><span>실종자</span><b>${c.missing}</b></div><div><span>통제 가능성</span><b>${ctrlLabel}</b></div>
        </div>
        <div class="rv">${bar('인간 적대성', c.hostility, c.hostility > 70 ? 'var(--red)' : c.hostility > 30 ? 'var(--amber)' : 'var(--green)')}
          ${bar('통제 가능성', c.control, 'var(--cyan)')}</div>
        <div class="facts rv" style="grid-template-columns:1fr 1fr">
          <div><span>현재 상태</span><b style="font-size:14px;font-family:var(--font-b)">${c.state}</b></div>
          <div><span>서식지</span><b style="font-size:14px;font-family:var(--font-b)">${c.habitat.name}</b>
            <a href="#map-${c.id}" class="mono" style="color:var(--cyan);font-size:12px">▸ 지도에서 보기</a></div></div>

        <div class="dsec rv"><h2>APPEARANCE · 외형</h2><p>${c.appearance}</p></div>
        <div class="dsec rv"><h2>PERSONALITY · 성격</h2><p>${c.personality}</p></div>
        <div class="dsec rv"><h2>ABILITIES · 능력</h2><ul>${c.abilities.map(a => `<li>${a}</li>`).join('')}</ul></div>
        <div class="dsec weak rv"><h2>WEAKNESSES · 약점</h2><ul>${c.weaknesses.map(a => `<li>${a}</li>`).join('')}</ul></div>
        <div class="dsec rv"><h2>HISTORY · 과거사</h2><p>${c.history}</p></div>
        <div class="dsec rv"><h2>RELATIONSHIPS · 인간관계</h2>
          ${c.relations.map(r => { const o = byId(r.id); return o ? `
            <a class="rel" href="#echoid-${o.id}"><div class="av">${img(o)}</div>
            <div><b>${o.name}</b><em>${r.type}</em><p>${r.note}</p></div></a>` : ''; }).join('')}</div>
        ${related.length ? `<div class="dsec rv"><h2>RELATED INCIDENTS · 관련 사건</h2><div class="tl">${related.map(i => incidentItem(i, false)).join('')}</div></div>` : ''}
        ${docsFor(c.id).length ? `<div class="dsec rv"><h2>CLASSIFIED DOCUMENTS · 관련 문서</h2><div class="doc-grid one">${docsFor(c.id).map(docCard).join('')}</div></div>` : ''}
        <div class="pager rv"><a class="btn" href="#echoid-${prev.id}">◂ ${prev.name}</a>
          <a class="btn" href="#database">목록</a><a class="btn" href="#echoid-${next.id}">${next.name} ▸</a></div>
      </div>
    </div>`,
    init() {
      $('#portrait').addEventListener('click', () => {
        const im = $('#portrait img'); if (!im) return;
        const lb = $('#lightbox'); $('img', lb).src = im.src; lb.hidden = false;
      });
    }
  };
}

/* ---------------- THREAT INDEX ---------------- */
let tsort = { k: 'risk', d: -1 };
function threat() {
  const t = totals();
  const maxD = Math.max(...C.map(c => c.deaths), 1);
  const byDeaths = [...C].sort((a, b) => b.deaths - a.deaths);
  const fac = Object.keys(F).map(k => ({ k, n: C.filter(c => c.faction === k).length }));
  return {
    html: pageHead('THREAT INDEX // 위험도 지수', '위험도 및 인명 피해 기록',
      '등록된 에코이드의 위험도 등급, 인간 사망자·실종자 수, 통제 가능성을 종합 집계합니다.') + `
    <div class="stats rv" style="margin-top:0">
      <div class="stat red"><b data-count="${t.deaths}">0</b><span>TOTAL HUMAN DEATHS</span></div>
      <div class="stat red"><b data-count="${t.missing}">0</b><span>TOTAL MISSING</span></div>
      <div class="stat"><b data-count="${C.filter(c => R[c.risk].rank >= 4).length}">0</b><span>HIGH-RISK (A·S)</span></div>
      <div class="stat"><b data-count="${t.incidents}">0</b><span>INCIDENTS</span></div></div>

    <section class="sec"><h2 class="rv">위험도 등급 <small>RISK LEVELS</small></h2>
      <div class="legend">${['S', 'A', 'B', 'C', 'D'].map(k => `
        <div class="lg rv" style="--rc:${rc(k)}"><b>${k}</b><h4>${R[k].label}</h4><p>${R[k].desc}</p>
        <div class="n">${C.filter(c => c.risk === k).length} REGISTERED${C.filter(c => c.risk === k).length ? ' · ' + C.filter(c => c.risk === k).map(c => c.name).join(', ') : ''}</div></div>`).join('')}</div></section>

    <section class="sec"><h2 class="rv">인간 사망자 수 <small>HUMAN DEATHS BY ECHOID</small></h2>
      <div class="chart panel rv">${byDeaths.map(c => `
        <a class="crow" href="#echoid-${c.id}" style="--rc:${rc(c.risk)}"><div class="nm"><i>${c.risk}</i>${c.name}</div>
        <div class="tr"><i data-w="${c.deaths / maxD * 100}"></i></div><div class="v">${c.deaths}</div></a>`).join('')}</div></section>

    <section class="sec"><h2 class="rv">진영 비율 <small>FACTION RATIO</small></h2>
      <div class="stack rv">${fac.map(f => `<i style="flex:${f.n};background:${F[f.k].color}">${f.n ? F[f.k].label + ' ' + f.n : ''}</i>`).join('')}</div></section>

    <section class="sec"><h2 class="rv">개체별 기록표 <small>CLICK HEADER TO SORT</small></h2>
      <div class="tbl-wrap rv"><table><thead><tr>
        ${[['name', '이름'], ['risk', '위험도'], ['faction', '진영'], ['deaths', '사망'], ['missing', '실종'], ['control', '통제 가능성'], ['state', '현재 상태']]
          .map(([k, l]) => `<th data-k="${k}">${l} ↕</th>`).join('')}</tr></thead><tbody id="tb"></tbody></table></div></section>`,
    init() {
      const drawRows = () => {
        const { k, d } = tsort;
        const val = c => k === 'risk' ? R[c.risk].rank : k === 'faction' ? F[c.faction].label : c[k];
        const rows = [...C].sort((a, b) => {
          const x = val(a), y = val(b);
          return (typeof x === 'number' ? x - y : String(x).localeCompare(String(y), 'ko')) * d;
        });
        $('#tb').innerHTML = rows.map(c => `<tr class="row" data-id="${c.id}" style="--rc:${rc(c.risk)}">
          <td><b>${c.name}</b> <span class="mono" style="color:var(--mute);font-size:11px">${c.nameEn}</span></td>
          <td><span class="rt">${c.risk}</span>${R[c.risk].label}</td><td>${F[c.faction].label}</td>
          <td style="color:var(--red)">${c.deaths}</td><td style="color:var(--red)">${c.missing}</td>
          <td>${c.control}%</td><td style="font-size:13px;color:var(--mute)">${c.state}</td></tr>`).join('');
        $$('#tb tr').forEach(tr => tr.addEventListener('click', () => location.hash = '#echoid-' + tr.dataset.id));
      };
      $$('th').forEach(th => th.addEventListener('click', () => {
        tsort = { k: th.dataset.k, d: tsort.k === th.dataset.k ? -tsort.d : -1 };
        drawRows();
      }));
      drawRows();
    }
  };
}

/* ---------------- WORLD MAP ---------------- */
const MW = 1000, MH = 500;
const px = (lng, lat) => [(lng + 180) / 360 * MW, (90 - lat) / 180 * MH];
const LAND = [
  [[-168,66],[-160,71],[-140,70],[-120,70],[-95,72],[-82,69],[-78,62],[-65,60],[-56,52],[-66,44],[-70,42],[-76,36],[-81,31],[-80,25],[-84,30],[-90,29],[-97,27],[-97,21],[-90,21],[-87,21],[-88,16],[-83,15],[-83,9],[-78,8],[-85,10],[-92,15],[-105,20],[-109,25],[-113,31],[-117,33],[-124,40],[-124,48],[-130,55],[-140,60],[-150,61],[-158,57],[-165,60]],
  [[-117,32],[-115,30],[-110,23],[-112,25],[-114,28]],
  [[-55,60],[-45,60],[-20,70],[-20,82],[-60,82],[-70,76],[-55,68]],
  [[-78,8],[-72,12],[-62,10],[-52,5],[-50,0],[-35,-6],[-39,-15],[-48,-25],[-58,-35],[-65,-42],[-68,-52],[-72,-54],[-74,-45],[-72,-30],[-70,-18],[-76,-14],[-81,-5],[-80,0],[-77,4]],
  [[-10,36],[-9,43],[-2,44],[-4,48],[2,51],[8,54],[10,58],[5,62],[15,69],[30,71],[45,68],[60,70],[80,73],[100,77],[120,73],[140,72],[160,70],[180,68],[180,65],[170,60],[162,58],[156,51],[142,53],[140,48],[135,43],[130,42],[129,35],[126,37],[125,40],[121,40],[122,37],[119,35],[122,31],[121,26],[117,23],[110,20],[108,16],[109,12],[105,9],[100,13],[99,8],[103,1],[98,8],[98,16],[94,17],[91,22],[87,21],[80,15],[78,8],[73,17],[72,21],[67,25],[58,25],[57,27],[52,28],[48,30],[50,26],[56,26],[58,23],[53,17],[43,13],[39,21],[35,28],[34,31],[36,36],[27,37],[26,40],[23,38],[22,36],[19,40],[13,45],[18,40],[16,38],[12,42],[8,44],[3,43],[-1,38]],
  [[-17,21],[-10,30],[-6,36],[10,37],[11,33],[20,31],[32,31],[34,28],[38,20],[43,12],[51,12],[42,-2],[40,-15],[35,-25],[27,-34],[20,-35],[15,-27],[12,-15],[13,-5],[9,4],[-8,4],[-15,10]],
  [[114,-22],[122,-18],[130,-12],[137,-12],[142,-11],[146,-19],[153,-26],[150,-37],[140,-38],[131,-31],[116,-35],[114,-26]],
  [[172,-34],[178,-38],[175,-41],[172,-41]],
  [[172,-41],[174,-42],[170,-46],[167,-46],[168,-44]],
  [[120,18],[122,18],[124,13],[126,8],[126,6],[122,7],[121,14]],
  [[109,2],[117,7],[119,1],[116,-4],[110,-3]],
  [[95,5],[98,4],[106,-6],[102,-4]],
  [[130,31],[132,34],[136,36],[140,41],[142,45],[145,43],[141,38],[140,35],[136,34]],
  [[44,-25],[47,-25],[50,-15],[49,-12],[44,-17]],
  [[-5,50],[1,51],[-2,57],[-5,58],[-6,55]]
];
const landPath = pts => 'M' + pts.map(p => px(p[0], p[1]).map(v => v.toFixed(1)).join(',')).join('L') + 'Z';
const LBL = { lulu: [0, -13, 'middle'], taira: [0, 22, 'middle'], amur: [12, 0, 'start'], yeohwa: [12, 9, 'start'] };

function map(arg) {
  const grid = [];
  for (let lng = -150; lng <= 150; lng += 30) { const [x] = px(lng, 0); grid.push(`<line class="gl" x1="${x}" y1="0" x2="${x}" y2="${MH}"/>`); }
  for (let lat = -60; lat <= 60; lat += 30) { const [, y] = px(0, lat); grid.push(`<line class="gl" x1="0" y1="${y}" x2="${MW}" y2="${y}"/><text class="glt" x="4" y="${y - 3}">${lat}°</text>`); }
  const [ex, ey] = px(0, 0);
  const habs = C.map(c => {
    const [x, y] = px(c.habitat.lng, c.habitat.lat), l = LBL[c.id] || [12, 4, 'start'];
    return `<g class="mk" data-id="${c.id}" style="--mc:${F[c.faction].color}"><circle class="ring" cx="${x}" cy="${y}" r="5"/>
      <circle class="core" cx="${x}" cy="${y}" r="5"/><text x="${x + l[0]}" y="${y + l[1]}" text-anchor="${l[2]}">${c.nameEn}</text></g>`;
  }).join('');
  const incs = I.map(i => {
    const [x, y] = px(i.lng, i.lat);
    return `<g class="inc" data-inc="${i.id}" style="--mc:${rc(i.level)}"><rect class="d" x="${x - 3.5}" y="${y - 3.5}" width="7" height="7"><title>${i.id} · ${i.title}</title></rect></g>`;
  }).join('');
  return {
    html: pageHead('WORLD MAP // 서식지 지도', '에코이드 서식지 지도',
      '에코이드는 각자의 서식지에서 가장 강하다. 마커를 선택하면 프로필과 관련 사건을 볼 수 있습니다.') + `
    <div class="mapwrap rv">
      <div class="mapbox"><svg id="msvg" viewBox="0 0 ${MW} ${MH}" role="img" aria-label="에코이드 서식지 세계 지도">
        <g>${grid.join('')}<line class="gl" x1="${ex}" y1="0" x2="${ex}" y2="${MH}" style="stroke:rgba(34,211,238,.2)"/>
        ${LAND.map(p => `<path class="land" d="${landPath(p)}"/>`).join('')}</g>
        <g id="gInc">${incs}</g><g id="gHab">${habs}</g></svg>
        <div class="mapctl"><button id="zi" aria-label="확대">+</button><button id="zo" aria-label="축소">−</button><button id="zr" aria-label="초기화">⟲</button></div>
        <div class="maplegend">
          <label><i style="background:var(--red)"></i>적대</label><label><i style="background:var(--amber)"></i>중립</label><label><i style="background:var(--green)"></i>우호</label>
          <label><input type="checkbox" id="tInc" checked> ◆ 사건 위치</label></div></div>
      <aside class="sidep panel" id="side"></aside></div>`,
    init() {
      const svg = $('#msvg'), side = $('#side');
      let vb = { x: 0, y: 0, w: MW, h: MH };
      const apply = () => {
        vb.w = Math.min(MW, Math.max(120, vb.w)); vb.h = vb.w / 2;
        vb.x = Math.min(MW - vb.w, Math.max(0, vb.x)); vb.y = Math.min(MH - vb.h, Math.max(0, vb.y));
        svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
      };
      const zoom = (f, cx = vb.x + vb.w / 2, cy = vb.y + vb.h / 2) => {
        const nw = Math.min(MW, Math.max(120, vb.w * f)), r = nw / vb.w;
        vb.x = cx - (cx - vb.x) * r; vb.y = cy - (cy - vb.y) * r; vb.w = nw; apply();
      };
      $('#zi').onclick = () => zoom(.6); $('#zo').onclick = () => zoom(1.6);
      $('#zr').onclick = () => { vb = { x: 0, y: 0, w: MW, h: MH }; apply(); };
      let drag = null, moved = false;
      svg.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, vx: vb.x, vy: vb.y }; moved = false; });
      window.addEventListener('pointermove', e => {
        if (!drag) return;
        const k = vb.w / svg.clientWidth, dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
        vb.x = drag.vx - dx * k; vb.y = drag.vy - dy * k; apply();
      });
      window.addEventListener('pointerup', () => drag = null);
      $('#tInc').addEventListener('change', e => $('#gInc').style.display = e.target.checked ? '' : 'none');

      const list = () => `<h3>HABITAT INDEX</h3><p style="font-size:13.5px;color:var(--mute)">서식지 마커 또는 목록을 선택하세요.</p>
        <div class="hab-list">${C.map(c => `<div class="hab" data-id="${c.id}" style="--mc:${F[c.faction].color}"><span class="dot"></span>
        <span style="flex:1"><b>${c.name}</b><small>${c.habitat.name}</small></span><span class="rt" style="--rc:${rc(c.risk)};margin:0">${c.risk}</span></div>`).join('')}</div>`;
      const bindList = () => $$('.hab', side).forEach(h => h.onclick = () => showChar(h.dataset.id));
      const mark = id => { $$('.mk').forEach(m => m.classList.toggle('sel', m.dataset.id === id)); };
      function showChar(id) {
        const c = byId(id); if (!c) return;
        mark(id);
        const rel = I.filter(i => i.characters.includes(id));
        side.innerHTML = `<div class="mini-card" style="--rc:${rc(c.risk)}"><div class="frame">${img(c)}</div>
          <div><div class="cno mono" style="color:var(--cyan);font-size:11px">ECH-${pad(c.no)}</div><h3>${c.name}</h3>
          <div class="tags" style="margin:6px 0 0"><span class="tag-b risk">${c.risk}</span><span class="tag-b ${c.faction}">${F[c.faction].label}</span></div></div></div>
          <dl class="kv" style="grid-template-columns:76px 1fr"><dt>동물</dt><dd>${c.animal}</dd><dt>서식지</dt><dd>${c.habitat.name}</dd>
          <dt>사망/실종</dt><dd style="color:var(--red)">${c.deaths} / ${c.missing}</dd><dt>상태</dt><dd>${c.state}</dd></dl>
          ${rel.length ? `<p class="mono" style="margin-top:12px;font-size:12px;color:var(--cyan)">관련 사건: ${rel.map(i => i.id).join(', ')}</p>` : ''}
          <p style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap"><a class="btn" href="#echoid-${c.id}">프로필 ▸</a><button class="btn" id="back">목록</button></p>`;
        $('#back').onclick = () => { mark(null); side.innerHTML = list(); bindList(); };
        const [x, y] = px(c.habitat.lng, c.habitat.lat);
        vb.w = 360; vb.h = 180; vb.x = x - 180; vb.y = y - 90; apply();
      }
      function showInc(id) {
        const i = I.find(z => z.id === id); if (!i) return;
        mark(null);
        side.innerHTML = `<div class="mono" style="color:var(--cyan);font-size:12px">${i.id} · ${fdate(i.date)}</div>
          <h3 style="font-size:19px;color:var(--ice);margin:6px 0 10px">${i.title}</h3>
          <div class="inc-meta"><span>위험 <b>${i.level}</b></span><span class="dg">사망 <b>${i.deaths}</b></span><span class="dg">실종 <b>${i.missing}</b></span></div>
          <p style="font-size:14px">${i.summary}</p>
          <p style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap"><a class="btn" href="#incidents">사건 기록 ▸</a><button class="btn" id="back">목록</button></p>`;
        $('#back').onclick = () => { side.innerHTML = list(); bindList(); };
        const [x, y] = px(i.lng, i.lat); vb.w = 360; vb.h = 180; vb.x = x - 180; vb.y = y - 90; apply();
      }
      $$('.mk').forEach(m => m.addEventListener('click', () => { if (!moved) showChar(m.dataset.id); }));
      $$('.inc').forEach(m => m.addEventListener('click', () => { if (!moved) showInc(m.dataset.inc); }));
      side.innerHTML = list(); bindList();
      if (arg) { byId(arg) ? showChar(arg) : showInc(arg); }
    }
  };
}

/* ---------------- INCIDENT ARCHIVE ---------------- */
let ist = { q: '', lv: 'all', ch: 'all' };
function incidents() {
  return {
    html: pageHead('INCIDENT ARCHIVE // 사건 기록', '주요 사건 기록',
      '2028년 첫 사건부터 현재까지의 주요 사건 파일입니다. 항목을 눌러 상세 기록을 열람하세요.') + `
    <div class="toolbar rv"><div class="search"><input id="iq" type="search" placeholder="검색: 사건명, 장소, 캐릭터, 사건번호" value="${ist.q}"></div>
      <select id="ich"><option value="all">전체 에코이드</option>${C.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select></div>
    <div class="toolbar rv"><div class="chips"><span class="lbl">LEVEL</span>
      <button class="chip ${ist.lv === 'all' ? 'on' : ''}" data-v="all">전체</button>
      ${Object.keys(R).map(k => `<button class="chip r ${ist.lv === k ? 'on' : ''}" data-v="${k}" style="--rc:${rc(k)}">${k}</button>`).join('')}</div></div>
    <div class="count" id="icount"></div><div class="tl" id="itl"></div>`,
    init() {
      $('#ich').value = ist.ch;
      const draw = () => {
        const q = ist.q.trim().toLowerCase();
        const items = I.filter(i => {
          if (ist.lv !== 'all' && i.level !== ist.lv) return false;
          if (ist.ch !== 'all' && !i.characters.includes(ist.ch)) return false;
          if (q) {
            const hay = [i.id, i.title, i.location, i.summary, i.status, ...i.characters.map(id => (byId(id) || {}).name)].join(' ').toLowerCase();
            if (!hay.includes(q)) return false;
          }
          return true;
        });
        const plain = !q && ist.lv === 'all' && ist.ch === 'all';
        const all = [...items.map(i => ({ k: 'i', d: i.date, i })), ...(plain ? D.timeline.map(e => ({ k: 'e', d: e.date, e })) : [])]
          .sort((a, b) => b.d.localeCompare(a.d));
        $('#icount').innerHTML = `<b>${items.length}</b> / ${I.length} INCIDENT FILES`;
        $('#itl').innerHTML = all.length ? all.map(x => x.k === 'i' ? incidentItem(x.i, false) : eventItem(x.e)).join('')
          : `<div class="empty">NO MATCHING FILE — 조건에 맞는 사건이 없습니다.</div>`;
        reveal();
      };
      $('#iq').addEventListener('input', e => { ist.q = e.target.value; draw(); });
      $('#ich').addEventListener('change', e => { ist.ch = e.target.value; draw(); });
      $$('.chip').forEach(b => b.addEventListener('click', () => {
        ist.lv = b.dataset.v; $$('.chip').forEach(x => x.classList.toggle('on', x === b)); draw();
      }));
      draw();
    }
  };
}



/* ---------------- UN-ECRA 소속 직원 ---------------- */
const staffImg = p => img({ id: 'staff-' + p.id, name: p.name, animal: p.role });
function staffCard(p) {
  return `<a class="card staff-card rv" href="#staff-${p.id}">
    <div class="frame">${staffImg(p)}<span class="sbadge">UN-ECRA STAFF</span></div>
    <div class="cbody"><div class="cno">${p.code}</div>
    <h3>${p.name}<em>${p.nameEn}</em></h3><p>${p.deptName} · ${p.role}</p>
    <div class="mini"><span>${p.nation}</span><span>${p.age}세</span><span>${p.mbti}</span></div></div></a>`;
}
function staff(id) {
  const ST = D.staff || [], p = ST.find(x => x.id === id);
  if (!p) return ecra();
  const i = ST.indexOf(p), prev = ST[(i - 1 + ST.length) % ST.length], next = ST[(i + 1) % ST.length];
  return {
    html: `
    <div class="detail">
      <div class="portrait rv" id="portrait"><div class="frame">${staffImg(p)}</div></div>
      <div>
        <div class="dhead rv">
          <div class="no">PERSONNEL FILE · ${p.code} <span class="cl">INTERNAL</span></div>
          <h1>${p.name}<small>${p.nameEn}</small></h1>
          <div class="sci" style="font-style:normal">${p.deptName} · ${p.role}</div>
          <div class="tags"><span class="tag-b staff">UN-ECRA 소속 직원</span><span class="tag-b">${p.nation}</span><span class="tag-b">${p.mbti}</span></div>
        </div>
        <div class="facts rv">
          <div><span>국적</span><b style="font-family:var(--font-b)">${p.nation}</b></div><div><span>나이</span><b>${p.age}세</b></div>
          <div><span>MBTI</span><b>${p.mbti}</b></div><div><span>소속</span><b style="font-size:14px;font-family:var(--font-b)">${p.deptName}</b></div>
          <div><span>직책</span><b style="font-size:14px;font-family:var(--font-b)">${p.role}</b></div><div><span>언어</span><b style="font-size:14px;font-family:var(--font-b)">${p.languages.join(' · ')}</b></div>
        </div>
        <div class="dsec rv"><h2>APPEARANCE · 외형</h2><p>${p.appearance}</p></div>
        <div class="dsec rv"><h2>PERSONALITY · 성격</h2><p>${p.personality}</p></div>
        <div class="dsec rv"><h2>EXPERTISE · 전문 분야</h2><ul>${p.expertise.map(x => `<li>${x}</li>`).join('')}</ul></div>
        <div class="dsec rv"><h2>NOTE · 특징</h2><p>${p.trait}</p></div>
        <div class="pager rv"><a class="btn" href="#staff-${prev.id}">◂ ${prev.name}</a>
          <a class="btn" href="#ecra">UN-ECRA</a><a class="btn" href="#staff-${next.id}">${next.name} ▸</a></div>
      </div>
    </div>`,
    init() {
      $('#portrait').addEventListener('click', () => {
        const im = $('#portrait img'); if (!im) return;
        const lb = $('#lightbox'); $('img', lb).src = im.src; lb.hidden = false;
      });
    }
  };
}

/* ---------------- CLASSIFIED DOCUMENTS ---------------- */
const DOCS = D.documents || [];
const DT = {
  research:   { label: '연구 보고서', color: '#22d3ee' },
  witness:    { label: '목격자 진술', color: '#ffc233' },
  government: { label: '정부 보고서', color: '#9fc3ff' },
  transcript: { label: '녹취록',     color: '#4de0b0' },
  memo:       { label: '내부 메모',   color: '#b9a4ff' },
  journal:    { label: '연구원 일지', color: '#ff9ad5' },
  intel:      { label: '정보 분석',   color: '#ff5c74' }
};
const rich = t => t.replace(/\[\[(.+?)\]\]/g, '<span class="rd" role="button" tabindex="0" title="삭제된 내용 — 탭하여 열람">$1</span>');
function docBody(lines) {
  return lines.map(l => {
    if (l.startsWith('#')) return `<h4>${rich(l.slice(1))}</h4>`;
    if (l.startsWith('- ')) return `<p class="li">${rich(l.slice(2))}</p>`;
    if (l.startsWith('@')) { const k = l.indexOf('|'); return `<div class="ln"><span class="who">${l.slice(1, k)}</span><span>${rich(l.slice(k + 1))}</span></div>`; }
    if (l.startsWith('(')) return `<p class="note">${rich(l)}</p>`;
    return `<p>${rich(l)}</p>`;
  }).join('');
}
const docsFor = id => DOCS.filter(d => d.chars.includes(id));
function docCard(d) {
  const t = DT[d.type] || DT.memo;
  return `<a class="doc-card rv" href="#doc-${d.id}" style="--dc:${t.color}">
    <div class="doc-top"><span class="dt">${t.label}</span><span class="mono">${d.id}</span></div>
    <h3>${d.title}</h3><p>${d.summary}</p>
    <div class="doc-meta mono"><span>${fdate(d.date)}</span><span>${d.cls}</span></div></a>`;
}
let dst = { q: '', t: 'all', ch: 'all' };
function documents() {
  return {
    html: pageHead('CLASSIFIED DOCUMENTS // 기밀 문서', '기밀 문서 보관소',
      'UN-ECRA 연구원 보고서, 목격자 진술, 각국 정부 보고서, 녹취록, 연구원 일지를 열람합니다. 검은 줄은 열람 등급 미달로 삭제된 부분입니다.') + `
    <div class="toolbar rv"><div class="search"><input id="dq" type="search" placeholder="검색: 제목, 작성자, 내용, 문서번호" value="${dst.q}"></div>
      <select id="dch"><option value="all">전체 에코이드</option>${C.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select></div>
    <div class="toolbar rv"><div class="chips"><span class="lbl">TYPE</span>
      <button class="chip ${dst.t === 'all' ? 'on' : ''}" data-v="all">전체</button>
      ${Object.entries(DT).map(([k, t]) => `<button class="chip ${dst.t === k ? 'on' : ''}" data-v="${k}">${t.label}</button>`).join('')}</div></div>
    <div class="count" id="dcount"></div><div class="doc-grid" id="dgrid"></div>`,
    init() {
      $('#dch').value = dst.ch;
      const draw = () => {
        const q = dst.q.trim().toLowerCase();
        const a = DOCS.filter(d => {
          if (dst.t !== 'all' && d.type !== dst.t) return false;
          if (dst.ch !== 'all' && !d.chars.includes(dst.ch)) return false;
          if (q) {
            const hay = [d.id, d.title, d.author, d.org, d.summary, ...d.body, ...d.chars.map(id => (byId(id) || {}).name)].join(' ').toLowerCase();
            if (!hay.includes(q)) return false;
          }
          return true;
        }).sort((x, y) => y.date.localeCompare(x.date));
        $('#dcount').innerHTML = `<b>${a.length}</b> / ${DOCS.length} DOCUMENTS`;
        $('#dgrid').innerHTML = a.length ? a.map(docCard).join('')
          : `<div class="empty" style="grid-column:1/-1">NO MATCHING DOCUMENT — 조건에 맞는 문서가 없습니다.</div>`;
        reveal();
      };
      $('#dq').addEventListener('input', e => { dst.q = e.target.value; draw(); });
      $('#dch').addEventListener('change', e => { dst.ch = e.target.value; draw(); });
      $$('.chip').forEach(b => b.addEventListener('click', () => {
        dst.t = b.dataset.v; $$('.chip').forEach(x => x.classList.toggle('on', x === b)); draw();
      }));
      draw();
    }
  };
}
function doc(id) {
  const d = DOCS.find(x => x.id === id);
  if (!d) return documents();
  const t = DT[d.type] || DT.memo, i = DOCS.indexOf(d);
  const prev = DOCS[(i - 1 + DOCS.length) % DOCS.length], next = DOCS[(i + 1) % DOCS.length];
  const inc = d.incident && I.find(x => x.id === d.incident);
  const chars = d.chars.map(x => byId(x)).filter(Boolean);
  return {
    html: `
    <div class="page-head rv" style="margin-bottom:20px"><div class="eyebrow">CLASSIFIED DOCUMENT // ${d.id}</div></div>
    <article class="paper rv" style="--dc:${t.color}">
      <div class="stamp">${d.cls.split('·')[0].trim()}</div>
      <span class="dt">${t.label}</span>
      <h1>${d.title}</h1>
      <dl class="doc-head">
        <dt>문서번호</dt><dd class="mono">${d.id}</dd><dt>작성일</dt><dd class="mono">${fdate(d.date)}</dd>
        <dt>작성자</dt><dd>${d.author}</dd><dt>소속</dt><dd>${d.org}</dd><dt>보안 등급</dt><dd>${d.cls}</dd>
        ${chars.length ? `<dt>관련 개체</dt><dd>${chars.map(c => `<a href="#echoid-${c.id}">${c.name}</a>`).join(' · ')}</dd>` : ''}
        ${inc ? `<dt>관련 사건</dt><dd><a href="#map-${inc.id}">${inc.id} · ${inc.title}</a></dd>` : ''}
      </dl>
      ${d.body.some(l => l.includes('[[')) ? `<p class="rd-hint">삭제 처리된 부분<b></b>은 탭(클릭)하면 열람할 수 있습니다.</p>` : ''}
      <div class="doc-body">${docBody(d.body)}</div>
      <div class="doc-end mono">— END OF DOCUMENT · UN-ECRA ARCHIVE —</div>
    </article>
    <div class="pager rv"><a class="btn" href="#doc-${prev.id}">◂ ${prev.id}</a><a class="btn" href="#documents">목록</a><a class="btn" href="#doc-${next.id}">${next.id} ▸</a></div>`
  };
}

/* 삭제 처리(검은 줄) 탭/클릭 열람 */
view.addEventListener('click', e => { const r = e.target.closest('.rd'); if (r) r.classList.toggle('open'); });
view.addEventListener('keydown', e => { const r = e.target.closest && e.target.closest('.rd'); if (r && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); r.classList.toggle('open'); } });

/* ---------------- 공통: 인시던트 토글(이벤트 위임) ---------------- */
view.addEventListener('click', e => {
  const top = e.target.closest('.inc-top');
  if (!top || top.style.cursor === 'default') return;
  const item = top.closest('.inc-i'), body = $('.inc-body', item);
  if (!body) return;
  const open = item.classList.toggle('open');
  body.style.maxHeight = open ? body.scrollHeight + 'px' : '0';
});

/* ---------------- 라우터 ---------------- */
const routes = { home, world, ecra, database, echoid, threat, map, incidents, documents, doc, staff };
let io;
function reveal() {
  io = io || new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  }), { threshold: .08 });
  $$('.rv:not(.in)').forEach((el, i) => { el.style.transitionDelay = Math.min(i % 8, 7) * 50 + 'ms'; io.observe(el); });
}
function countUp() {
  $$('[data-count]').forEach(el => {
    const to = +el.dataset.count, t0 = performance.now(), dur = 1300;
    const step = t => { const p = Math.min(1, (t - t0) / dur); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
}
function render() {
  const h = (location.hash.replace(/^#\/?/, '') || 'home').replace('/', '-'), k = h.indexOf('-');
  const name = k < 0 ? h : h.slice(0, k), arg = k < 0 ? undefined : h.slice(k + 1);
  const r = (routes[name] || home)(arg);
  const key = routes[name] ? name : 'home';
  view.innerHTML = r.html;
  $$('#nav a').forEach(a => a.classList.toggle('active', a.dataset.r.split(',').includes(key)));
  $('#nav').classList.remove('open');
  r.init && r.init();
  reveal(); countUp();
  window.scrollTo(0, 0);
  setTimeout(() => $$('[data-w]').forEach(el => el.style.width = el.dataset.w + '%'), 250);
  document.title = (key === 'home' ? '' : key.toUpperCase() + ' — ') + 'PROJECT: ECHO — UN-ECRA';
}
window.addEventListener('hashchange', render);
$('#burger').addEventListener('click', () => $('#nav').classList.toggle('open'));
$('#lightbox').addEventListener('click', () => $('#lightbox').hidden = true);
document.addEventListener('keydown', e => { if (e.key === 'Escape') $('#lightbox').hidden = true; });

/* 시계 */
const clock = () => {
  const n = new Date(), p = v => String(v).padStart(2, '0');
  $('#clock').textContent = `2030-${p(n.getMonth() + 1)}-${p(n.getDate())} ${p(n.getHours())}:${p(n.getMinutes())}:${p(n.getSeconds())}`;
};
clock(); setInterval(clock, 1000);

/* 부팅 시퀀스: 기밀 문서 보관소 접속 */
(function boot() {
  const el = $('#boot');
  let seen = false; try { seen = sessionStorage.getItem('echo-boot'); } catch (e) {}
  render();
  const finish = () => {
    if (el.classList.contains('done')) return;
    el.classList.add('done');
    try { sessionStorage.setItem('echo-boot', '1'); } catch (e) {}
  };
  if (seen) { el.classList.add('done'); return; }
  let skipped = false;
  $('#bootSkip').addEventListener('click', () => { skipped = true; finish(); });
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const fast = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const box = $('#bootLines'), fill = $('#bootFill'), pct = $('#bootPct');
  const steps = [
    ['UN-ECRA 보안 노드 연결', 'OK'],
    ['사용자 인증 · ECRA-STAFF-0347', 'OK'],
    ['보안 등급 확인 · LEVEL 3', '승인'],
    ['기밀 문서 보관소 복호화', null],
    ['열람 기록 저장', 'OK']
  ];
  (async () => {
    await sleep(80); el.classList.add('on');
    await sleep(fast ? 200 : 1200);
    for (const [txt, res] of steps) {
      if (skipped) return;
      const d = document.createElement('div'); d.className = 'bl';
      d.innerHTML = `<span>${txt}</span><b></b>`; box.appendChild(d);
      if (res === null) {
        for (let p = 0; p <= 100; p += 5) {
          if (skipped) return;
          fill.style.width = p + '%'; pct.textContent = p + '%';
          await sleep(fast ? 5 : 32);
        }
        d.querySelector('b').textContent = '완료';
      } else {
        await sleep(fast ? 60 : 380); d.querySelector('b').textContent = res;
      }
      d.classList.add('ok');
      await sleep(fast ? 30 : 150);
    }
    if (skipped) return;
    el.classList.add('granted');
    await sleep(fast ? 400 : 1200);
    finish();
  })();
})();
})();
