
(async function(){
  const P='xdtj605l', D='production';
  const BASE=`https://${P}.api.sanity.io/v2024-01-01/data/query/${D}?query=`;
  async function groq(q){const r=await fetch(BASE+encodeURIComponent(q));const j=await r.json();return j.result;}
  function img(ref,w){const r=typeof ref==='string'?ref:(ref&&ref.asset&&ref.asset._ref)||'';if(!r)return'';
    const id=r.replace(/^image-/,'').replace(/-([a-z0-9]+)$/,'.$1');return `https://cdn.sanity.io/images/${P}/${D}/${id}?w=${w||1400}&auto=format`;}
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const L=(o,a)=>{ // bilingual span from localeString/Text
    if(!o)return''; const en=o.en||'', ar=o.ar||'';
    if(!en&&!ar)return'';
    return `<span class="en-only">${esc(en||ar)}</span><span class="ar-only ar" dir="rtl">${esc(ar||en)}</span>`;};
  const paras=(o)=>{ if(!o)return''; const f=t=>(t||'').split(/\n\n+/).map(x=>x.trim()).filter(Boolean).map(x=>`<p>${esc(x).replace(/\n/g,'<br>')}</p>`).join('');
    const en=f(o.en), ar=f(o.ar); if(!en&&!ar)return'';
    return `<div class="en-only">${en||ar}</div><div class="ar-only ar" dir="rtl">${ar||en}</div>`;};
  const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function fmtDay(iso){ if(!iso)return''; const m=String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/); return m?`${+m[3]} ${MON[+m[2]-1]} ${m[1]}`:''; }
  function fmtRange(a,b,y){ if(a&&b)return `${fmtDay(a)} – ${fmtDay(b)}`; if(a)return fmtDay(a); return y?String(y):''; }
  const root=document.getElementById('pjRoot');
  const page=document.body.dataset.page;

  document.querySelectorAll('[data-lang-btn]').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('[data-lang-btn]').forEach(b=>b.setAttribute('aria-pressed','false'));
    btn.setAttribute('aria-pressed','true');document.documentElement.setAttribute('data-lang',btn.dataset.langBtn);
    try{localStorage.setItem('twc-lang',btn.dataset.langBtn);}catch(e){}}));
  try{const s=localStorage.getItem('twc-lang');if(s){document.documentElement.setAttribute('data-lang',s);
    document.querySelectorAll('[data-lang-btn]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.langBtn===s)));}}catch(e){}

  try{
  if(page==='index'){
    const ps=await groq(`*[_type=="project"]|order(year desc){title,subtitle,"slug":slug.current,type,status,year,wonderCabinetRole,coverImage,
      "editions":count(*[_type=="residency"&&project._ref==^._id]),"events":count(*[_type=="event"&&relatedProject._ref==^._id])}`)||[];
    root.innerHTML=`<h1><span class="en-only">Projects</span><span class="ar-only ar" dir="rtl">مشاريع</span></h1>
      <p class="pj-sub"><span class="en-only">Performances, artworks, residencies and games produced, co-produced or presented by The Wonder Cabinet.</span><span class="ar-only ar" dir="rtl">عروض وأعمال فنية وإقامات وألعاب ينتجها مجلس العجب أو يشارك في إنتاجها أو يقدّمها.</span></p>
      <div class="pj-grid">${ps.filter(p=>p.slug).map(p=>`<a class="pj-card" href="project.html?id=${encodeURIComponent(p.slug)}">
        ${p.coverImage?`<img loading="lazy" alt="" src="${img(p.coverImage,800)}">`:''}
        <span class="pj-k">${esc([p.type,p.year].filter(Boolean).join(' · '))}</span>
        <h3>${L(p.title)}</h3>
        <p>${L(p.subtitle)}</p>
        ${(p.editions||p.events)?`<p style="margin-top:10px;font-size:12px">${p.editions?`${p.editions} ${p.editions>1?'editions':'edition'}`:''}${p.editions&&p.events?' · ':''}${p.events?`${p.events} ${p.events>1?'performances':'performance'}`:''}</p>`:''}
      </a>`).join('')||'<p>No projects yet.</p>'}</div>`;
    return;
  }
  const id=new URLSearchParams(location.search).get('id')||'';
  const p=await groq(`*[_type=="project"&&slug.current==${JSON.stringify(id)}][0]{title,subtitle,description,type,status,year,wonderCabinetRole,funders,partners,coverImage,
    blocks,
    "parent":parentProject->{title,"slug":slug.current},
    "children":*[_type=="project"&&parentProject._ref==^._id]{title,subtitle,"slug":slug.current,year,type},
    "editions":*[_type=="residency"&&project._ref==^._id]|order(year desc, startDate desc){title,subtitle,"slug":slug.current,year,status,location,startDate,endDate,type,description,coverImage,
      "artists":artists[]->{"n":name,"slug":slug.current},"artworks":artworks[]->{title,"slug":slug.current}},
    "events":*[_type=="event"&&relatedProject._ref==^._id]|order(startDateTime desc){title,subtitle,"slug":slug.current,startDateTime,eventType,location,shortDescription},
    "artworks":artworks[]->{title,"slug":slug.current,year,description,documentation,"artists":artist[]->{"n":name,"slug":slug.current}},
    "artists":artists[]->{"n":name,"slug":slug.current}}`);
  if(!p){root.innerHTML=`<h1>Project not found.</h1><p><a href="projects.html">← All projects</a></p>`;return;}
  const tEn=(p.title&&(p.title.en||p.title.ar))||'Project';
  document.title=`${tEn} · The Wonder Cabinet`;
  const m=(k,v)=>v?`<span><b>${k}</b>${esc(v)}</span>`:'';
  const names=a=>(a||[]).filter(Boolean).map(x=>x.slug?`<a href="artist.html?id=${encodeURIComponent(x.slug)}">${L(x.n)}</a>`:L(x.n)).join(', ');
  const block=b=>{
    if(b._type==='contentText'){const en=(b.en||[]).map(t=>`<p>${esc(t)}</p>`).join(''),ar=(b.ar||[]).map(t=>`<p>${esc(t)}</p>`).join('');
      return `<div class="pj-text"><div class="en-only">${en||ar}</div><div class="ar-only ar" dir="rtl">${ar||en}</div></div>`;}
    if(b._type==='contentTwoColumn'){const i=b.image?`<img loading="lazy" alt="" src="${img(b.image,900)}">`:'';
      return `<div class="pj-two">${b.imagePosition==='left'?i:''}<div class="pj-text">${paras(b.text)}</div>${b.imagePosition!=='left'?i:''}</div>`;}
    if(b._type==='contentImage'||b._type==='contentFullBleedPhoto'||b._type==='contentPoster'){
      if(!b.image)return b.captionEn?`<p class="pj-text" style="opacity:.7;font-size:13px">${esc(b.captionEn)}</p>`:'';
      const cap=b.captionEn||(b.caption&&b.caption.en)||'';
      return `<figure class="pj-fig"><img loading="lazy" alt="" src="${img(b.image,1800)}">${cap?`<figcaption>${esc(cap)}</figcaption>`:''}</figure>`;}
    if(b._type==='contentGallery'){return (b.images||[]).map(i=>`<figure class="pj-fig"><img loading="lazy" alt="" src="${img(i,1400)}"></figure>`).join('');}
    return '';};
  const blocks=(p.blocks||[]).map(block).join('');
  const evHtml=(p.events||[]).map(e=>`<a class="pj-row" href="event.html?id=${encodeURIComponent(e.slug)}">
      <span class="d">${fmtDay(e.startDateTime)}</span>
      <span class="t">${L(e.title)}<span class="s">${[e.subtitle&&(e.subtitle.en||''),e.location].filter(Boolean).map(esc).join(' · ')}</span></span>
      <span class="a">→</span></a>`).join('');
  const edHtml=(p.editions||[]).map(r=>`<details class="pj-ed"><summary>
      <span class="d" style="font-size:13px;font-weight:700">${esc(fmtRange(r.startDate,r.endDate,r.year))}</span>
      <span class="t" style="font-size:clamp(17px,1.8vw,22px)">${L(r.title)}${r.subtitle?`<span class="s" style="display:block;font-size:13px;opacity:.7">${L(r.subtitle)}</span>`:''}</span>
      <span class="pj-tag">${esc(r.status||r.type||'')}</span></summary>
      <div class="body">
        ${r.location?`<p style="font-size:13px;margin:0 0 12px"><b>Location</b> ${esc(r.location)}</p>`:''}
        <div class="pj-text">${paras(r.description)}</div>
        ${(r.artists||[]).filter(Boolean).length?`<p class="pj-names" style="font-size:14px;margin-top:16px"><b>Artists</b> ${names((r.artists||[]).filter(Boolean))}</p>`:''}
        ${(r.artworks||[]).filter(Boolean).length?`<p style="font-size:14px"><b>Works</b> ${(r.artworks||[]).filter(Boolean).map(a=>L(a.title)).join(', ')}</p>`:''}
      </div></details>`).join('');
  const awHtml=(p.artworks||[]).filter(Boolean).map(a=>`<div class="pj-art"><h3>${L(a.title)}</h3>
      <div style="font-size:13px;opacity:.75" class="pj-names">${names(a.artists)}${a.year?` · ${a.year}`:''}</div>${a.description?`<div class="pj-text" style="font-size:14px">${paras(a.description)}</div>`:''}${a.documentation?`<p style="margin-top:12px"><a href="${esc(a.documentation)}" target="_blank" rel="noopener" style="color:inherit;font-weight:700"><span class="en-only">Listen / buy →</span><span class="ar-only ar" dir="rtl">← استمع / اشترِ</span></a></p>`:''}</div>`).join('');
  const kids=(p.children||[]).map(c=>`<a class="pj-row" href="project.html?id=${encodeURIComponent(c.slug)}"><span class="d">${c.year||''}</span><span class="t">${L(c.title)}</span><span class="a">→</span></a>`).join('');
  root.innerHTML=`
    <p style="font-size:13px;margin:0 0 20px"><a href="projects.html" style="color:inherit">← <span class="en-only">All projects</span><span class="ar-only ar">كل المشاريع</span></a>${p.parent?` · <a style="color:inherit" href="project.html?id=${encodeURIComponent(p.parent.slug)}">${L(p.parent.title)}</a>`:''}</p>
    <h1>${L(p.title)}</h1>
    ${p.subtitle?`<p class="pj-sub">${L(p.subtitle)}</p>`:''}
    <div class="pj-meta">${m('Type ',p.type)}${m('Year ',p.year)}${m('Status ',p.status)}${m('Wonder Cabinet ',p.wonderCabinetRole)}${(p.funders||[]).length?m('Supported by ',p.funders.join(', ')):''}${(p.partners||[]).length?m('Partners ',p.partners.join(', ')):''}</div>
    ${p.coverImage?`<figure class="pj-fig"><img alt="" src="${img(p.coverImage,1800)}"></figure>`:''}
    <div class="pj-text">${paras(p.description)}</div>
    ${edHtml?`<section class="pj-sec"><h2><span class="en-only">Editions &amp; residencies</span><span class="ar-only ar" dir="rtl">النسخ والإقامات</span></h2>${edHtml}</section>`:''}
    ${evHtml?`<section class="pj-sec"><h2><span class="en-only">Performances</span><span class="ar-only ar" dir="rtl">العروض</span></h2>${evHtml}</section>`:''}
    ${kids?`<section class="pj-sec"><h2><span class="en-only">Related projects</span><span class="ar-only ar" dir="rtl">مشاريع مرتبطة</span></h2>${kids}</section>`:''}
    ${blocks?`<section class="pj-sec">${blocks}</section>`:''}
    ${awHtml?`<section class="pj-sec"><h2><span class="en-only">Artworks</span><span class="ar-only ar" dir="rtl">الأعمال</span></h2>${awHtml}</section>`:''}`;
  }catch(err){console.warn('[WC] projects',err);root.innerHTML='<p>Could not load projects right now.</p>';}
})();
