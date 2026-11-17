/* Eventos de intenção na landing page. Compras reais devem vir da Kiwify. */
const cfg = {
  pixelId: '967550679424125',
  productId: 'pequenos_genios_200',
  productName: 'Pequenos Gênios — 200 Atividades',
  currency: 'BRL',
  price: 19.90,
  checkoutUrl: 'https://pay.kiwify.com.br/qGfiEhh',
  appendUtmToCheckout: true,
  ...(window.PG_TRACKING_CONFIG || {})
};
const TRACK_KEY = 'pg_track_session';
const utmKeys = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'];
const params = new URLSearchParams(location.search);
const tracking = {};
for (const key of utmKeys) if (params.get(key)) tracking[key] = params.get(key).slice(0,180);
// Persistência de atribuição na mesma aba (não armazena dados pessoais).
try { const previous = JSON.parse(sessionStorage.getItem(TRACK_KEY) || '{}'); Object.assign(tracking, {...previous,...tracking}); sessionStorage.setItem(TRACK_KEY, JSON.stringify(tracking)); } catch(e) {}
const base = {content_ids:[cfg.productId || 'pequenos_genios_200'],content_name:cfg.productName || 'Pequenos Gênios — 200 Atividades',content_type:'product',currency:'BRL',value:19.90};
function emit(name,data={},custom=false){
  if (typeof window.fbq === 'function') window.fbq(custom ? 'trackCustom':'track',name,{...data,...tracking});
  // dataLayer disponível para futuras integrações de analytics.
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({event:name,...data,...tracking});
}
function initPixel(){
  if (!/^\d{8,20}$/.test(String(cfg.pixelId || ''))) return;
  if(window.fbq) return;
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  fbq('init',String(cfg.pixelId));fbq('track','PageView');fbq('track','ViewContent',base);
}
initPixel();
function checkoutLink(){
  if(!/^https:\/\/[^\s]+$/i.test(cfg.checkoutUrl || '')) return null;
  const url=new URL(cfg.checkoutUrl);
  if(cfg.appendUtmToCheckout) for(const [key,val] of Object.entries(tracking)) if(!url.searchParams.has(key)) url.searchParams.set(key,val);
  return url.toString();
}
// Links reais no HTML garantem checkout mesmo sem JS ou com cache antigo.
// Eventos de intenção não bloqueiam a navegação.
document.querySelectorAll('a.buy-button').forEach((link)=>{
  link.addEventListener('click',()=>{
    try { emit('InitiateCheckout',base); } catch(e) {}
    try {
      const url = new URL(link.href);
      if(cfg.appendUtmToCheckout){
        for(const [key,val] of Object.entries(tracking)) if(!url.searchParams.has(key)) url.searchParams.set(key,val);
        link.href=url.toString();
      }
    } catch(e) {}
  });
});
const modal=document.getElementById('preview-modal');
const modalImage=document.getElementById('modal-image');
const modalTitle=document.getElementById('modal-title');
document.querySelectorAll('.preview-open').forEach((button)=>button.addEventListener('click',()=>{
  modalImage.src=button.dataset.image;modalImage.alt='Atividade ampliada: '+button.dataset.title;modalTitle.textContent=button.dataset.title;
  emit('PreviewActivity',{activity_name:button.dataset.title},true);
  if(typeof modal.showModal==='function')modal.showModal();else modal.setAttribute('open','');
}));
document.getElementById('close-modal').addEventListener('click',()=>modal.close());
modal.addEventListener('click',(event)=>{if(event.target===modal)modal.close()});
document.querySelectorAll('a[href$="amostra-gratis-6-atividades.pdf"]').forEach(a=>a.addEventListener('click',()=>emit('ViewSample',{sample_count:6},true)));
if('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}}),{threshold:.12});
 document.querySelectorAll('.topic-card,.age-card,.preview-card,.routine-card,.audience-card').forEach(e=>{e.classList.add('reveal');observer.observe(e)});
}

// Carrossel contínuo: duplica os cinco relatos e anima a distância exata.
(function(){
 const viewport=document.querySelector('.voices-section .voice-carousel');
 const track=viewport && viewport.querySelector('.voice-grid');
 if(!viewport||!track)return;
 const originals=Array.from(track.children);
 if(!originals.length)return;
 originals.forEach(card=>{const copy=card.cloneNode(true);copy.setAttribute('aria-hidden','true');track.appendChild(copy)});
 const measure=()=>{
   const distance=track.children[originals.length].offsetLeft-track.children[0].offsetLeft;
   if(distance>0){track.style.setProperty('--pg-loop-distance',distance+'px');track.style.setProperty('--pg-loop-duration',Math.max(32,distance/32)+'s')}
 };
 measure();window.addEventListener('resize',measure,{passive:true});
 const move=(direction)=>{
   const width=originals[0].getBoundingClientRect().width+15;
   // Retoma a animação já deslocada, sem perder o loop.
   const computed=getComputedStyle(track).transform;
   let current=0;try{current=new DOMMatrixReadOnly(computed).m41}catch(e){}
   const distance=track.children[originals.length].offsetLeft-track.children[0].offsetLeft;
   const next=(((-current+direction*width)%distance)+distance)%distance;
   const duration=parseFloat(getComputedStyle(track).animationDuration)*1000||48000;
   track.style.animationDelay=(-next/distance*duration)+'ms';
 };
 document.querySelector('.voice-prev')?.addEventListener('click',()=>move(-1));
 document.querySelector('.voice-next')?.addEventListener('click',()=>move(1));
})();

// Entrada suave de seções ao rolar. Não modifica o carrossel de depoimentos.
(function(){
 const targets=document.querySelectorAll('.trust-item,.early-proof-card,.early-inclusion-inner,.section-heading,.inclusive-shell,.research-grid,.offer-box,.faq-list,.mid-offer');
 if(!('IntersectionObserver' in window)||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('pg-visible');observer.unobserve(entry.target)}})},{threshold:.08,rootMargin:'0px 0px 40px 0px'});
 targets.forEach(el=>{el.classList.add('pg-scroll-reveal');observer.observe(el)});
})();

// Dinamismo leve: barra de leitura e entrada escalonada. Não toca no carrossel de depoimentos.
(function(){
 const bar=document.querySelector('.pg-read-progress');
 if(bar){let ticking=false;const update=()=>{const max=document.documentElement.scrollHeight-innerHeight;const value=max>0?Math.min(1,Math.max(0,scrollY/max)):0;bar.style.transform='scaleX('+value+')';ticking=false};addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(update)}},{passive:true});addEventListener('resize',update,{passive:true});update()}
 if(!('IntersectionObserver' in window)||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const cards=document.querySelectorAll('.trust-item,.audience-card,.topic-card,.age-card,.preview-card,.routine-card');
 const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){entry.target.classList.add('pg-visible');observer.unobserve(entry.target)}}},{threshold:.07,rootMargin:'0px 0px -12px 0px'});
 cards.forEach((el,i)=>{el.style.setProperty('--pg-stagger',((i%4)*85)+'ms');observer.observe(el)});
})();
