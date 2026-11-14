import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { animate, hover, press } from 'motion';

gsap.registerPlugin(ScrollTrigger);
// Stacked sections stick in place; ScrollTrigger must measure their natural layout.
ScrollTrigger.addEventListener('refreshInit',()=>document.documentElement.classList.add('stack-measure'));
ScrollTrigger.addEventListener('refresh',()=>document.documentElement.classList.remove('stack-measure'));

function mountExperience() {
  const root=document.documentElement;
  const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
  let media=null,disposed=false;

  function configure() {
    media?.revert(); media=null;
    root.classList.toggle('motion-static',motionPreference.matches);
    if(disposed || motionPreference.matches) { root.dataset.motionExperience='static'; return; }
    media=gsap.matchMedia();
    media.add({desktop:'(min-width: 1101px)',mobile:'(max-width: 1100px)'},context=>{
      const desktop=context.conditions.desktop;
      const stopGestures=[],controls=new Map(),revealTweens=[];
      const animated=new Set();
      const spring={type:'spring',stiffness:290,damping:25,mass:.6};
      root.classList.add('motion-enhanced');root.dataset.motionExperience='active';

      function react(element,keyframes,options=spring) {
        controls.get(element)?.stop();
        const animation=animate(element,keyframes,options);
        controls.set(element,animation);animated.add(element);
        return animation;
      }
      stopGestures.push(hover('.hero-actions .btn, .landing-header .nav-cta, .module-tour-link',element=>{
        react(element,{scale:1.025});
        const arrow=element.querySelector('.arr, [aria-hidden="true"]');
        if(arrow)react(arrow,{x:3,y:-1});
        return ()=>{react(element,{scale:1});if(arrow)react(arrow,{x:0,y:0});};
      }));
      stopGestures.push(press('.btn, .product-tab, .sb-btn, .nav-toggle',element=>{
        react(element,{scale:.97});
        return ()=>react(element,{scale:1});
      }));
      stopGestures.push(hover('.module-shortcut, .control-card, .delivery-card',element=>{
        const symbol=element.querySelector('[data-module-symbol], .feature-icon, .delivery-icon');
        if(symbol)react(symbol,{scale:1.075,rotate:-3});
        return ()=>{if(symbol)react(symbol,{scale:1,rotate:0});};
      }));

      if(scrollY<120 && performance.now()<1800) {
        gsap.timeline({defaults:{ease:'power3.out',duration:.72}})
          .from('.hero-eyebrow',{opacity:.45,y:12})
          .from('.hero-title',{opacity:.7,y:22,duration:.9},.08)
          .from('.hero-lead',{opacity:.45,y:16},.2)
          .from('.hero-actions',{opacity:.6,y:14},.28)
          .from('.hero-reassurance, .hero-stats > div',{opacity:.5,y:10,stagger:.05},.38)
          .from('.hero-node',{opacity:.4,y:8,stagger:.045},.45);
      }

      const candidates=[...document.querySelectorAll('.sec-head, .benefit-heading, .benefit-panel, .benefit-example, .choice-heading, .module-shortcut, .mod-copy, .mod > .viz, .control-card, .delivery-card, .bento .cell, .steps > li, .receipt-wrap, .faq details, .industry-choice')];
      const reveal=candidates.filter(element=>element.getBoundingClientRect().top>innerHeight*.88);
      const initialX=element=>{
        if(!desktop)return 0;
        const module=element.closest('.mod');
        if(!module)return 0;
        const even=[...module.parentElement.children].indexOf(module)%2===1;
        return element.classList.contains('mod-copy')?(even?26:-26):(even?-26:26);
      };
      reveal.forEach(element=>gsap.set(element,{opacity:0,x:initialX(element),y:initialX(element)?0:22}));
      ScrollTrigger.batch(reveal,{
        start:'top 91%',once:false,interval:.08,batchMax:5,
        onEnterBack:batch=>{gsap.fromTo(batch,{opacity:.65,y:14},{opacity:1,x:0,y:0,duration:.65,ease:'power3.out',stagger:.04,overwrite:'auto',onComplete:()=>gsap.set(batch,{clearProps:'transform,opacity'})});},
        onEnter:batch=>{
          const tween=gsap.to(batch,{opacity:1,x:0,y:0,duration:.72,ease:'power3.out',stagger:.065,overwrite:'auto',onComplete:()=>gsap.set(batch,{clearProps:'transform,opacity'})});
          revealTweens.push(tween);
        }
      });

      // Ambient GSAP motion continues between interactions, not just on first paint.
      // Keep it on decorative nodes so module tables and reading text stay steady.
      const ambient=gsap.timeline({repeat:-1,yoyo:true,defaults:{ease:'sine.inOut'}})
        .to('.hero-node',{y:-4,duration:2.8,stagger:.25},0)
        .to('.event-summary-icon',{y:-3,scale:1.035,duration:3.2},0)
        .to('.delivery-icon .icon, .feature-icon .icon',{y:-4,rotation:3,duration:3.6,stagger:.18},0)
        .to('.hero-eyebrow > span',{opacity:.35,scale:.75,duration:2.4},0);
      const refreshVisibility=()=>ambient.paused(document.hidden);
      document.addEventListener('visibilitychange',refreshVisibility);
      refreshVisibility();

      const onMenu=event=>{
        if(!event.detail.open) {
          document.querySelectorAll('#nav > a').forEach(element=>{controls.get(element)?.stop();element.style.removeProperty('transform');element.style.removeProperty('opacity');});
          return;
        }
        document.querySelectorAll('#nav > a').forEach((element,i)=>react(element,{opacity:[.45,1],y:[10,0]},{duration:.32,delay:i*.035,ease:[.22,1,.36,1]}));
      };
      window.addEventListener('flowcore:nav',onMenu);
      const refresh=()=>ScrollTrigger.refresh();
      window.addEventListener('flowcore:layout',refresh);
      const details=[...document.querySelectorAll('details')];
      details.forEach(element=>element.addEventListener('toggle',refresh));
      // Font readiness and native disclosures can change section positions.
      // ScrollTrigger refreshes on window load by itself; fonts that settle later move
      // section positions, so refresh once more only when they finish after load.
      if(document.readyState==='complete')ScrollTrigger.refresh();
      else document.fonts?.ready.then(()=>{if(document.readyState==='complete' && !disposed && root.classList.contains('motion-enhanced'))ScrollTrigger.refresh();});

      return ()=>{
        ambient.kill();
        document.removeEventListener('visibilitychange',refreshVisibility);
        stopGestures.forEach(stop=>stop());
        controls.forEach(animation=>animation.stop());
        revealTweens.forEach(tween=>tween.kill());
        animated.forEach(element=>{element.style.removeProperty('transform');element.style.removeProperty('opacity');});
        gsap.set(reveal,{clearProps:'transform,opacity'});
        window.removeEventListener('flowcore:nav',onMenu);
        window.removeEventListener('flowcore:layout',refresh);
        details.forEach(element=>element.removeEventListener('toggle',refresh));
        root.classList.remove('motion-enhanced');
      };
    });
  }
  motionPreference.addEventListener('change',configure);
  const onPageShow=()=>ScrollTrigger.refresh();
  window.addEventListener('pageshow',onPageShow);
  const onPageHide=event=>{
    if(event.persisted)return;
    disposed=true;media?.revert();
    motionPreference.removeEventListener('change',configure);
    window.removeEventListener('pageshow',onPageShow);window.removeEventListener('pagehide',onPageHide);
  };
  window.addEventListener('pagehide',onPageHide);
  configure();
}

// This layer loads on the first interaction. Creating scroll triggers refreshes them and
// restores the scroll position, which would cancel a running smooth anchor jump, so
// mounting waits until scrolling has settled.
function whenScrollSettles(callback) {
  let timer=0;
  const wait=()=>{clearTimeout(timer);timer=setTimeout(()=>{removeEventListener('scroll',wait);callback();},180);};
  addEventListener('scroll',wait,{passive:true});wait();
}
const start=()=>whenScrollSettles(()=>{
  mountExperience();
  // Resume an anchor jump that the first ScrollTrigger refresh interrupted.
  const top=window.flowcoreStack?.takePendingJump?.();
  if(top!=null&&Math.abs(scrollY-top)>4)requestAnimationFrame(()=>scrollTo({top,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}));
});
if(document.documentElement.classList.contains('js'))start();
else document.addEventListener('flowcore:ready',start,{once:true});
