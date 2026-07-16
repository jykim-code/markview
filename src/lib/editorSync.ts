// Shared helpers for the split-editor "scroll sync" and "selection linking"
// features. Kept free of any CodeMirror imports so it is safe to import from
// server-rendered client components; all CodeMirror access lives in CodeEditor.
// (DOM APIs are only touched inside function bodies, i.e. at call time on the
// client, never at import time.)

/**
 * Script injected into the HTML preview iframe. Because that iframe is sandboxed
 * WITHOUT `allow-same-origin`, the parent cannot touch its DOM directly — so this
 * relay uses postMessage (which works across the sandbox boundary) to:
 *   - report scroll position (0..1 ratio) on scroll,
 *   - accept `scrollTo` commands (scroll sync),
 *   - accept `locate` commands (scroll to + flash text selected in the code),
 *   - report selected text on mouseup (preview → code linking).
 * A local lock prevents programmatic scrolls from echoing back as user scrolls.
 */
export const IFRAME_BRIDGE = `<script>(function(){
var lock=false,tick=false;
function se(){return document.scrollingElement||document.documentElement||document.body;}
function ratio(){var e=se();var max=e.scrollHeight-e.clientHeight;return max>0?e.scrollTop/max:0;}
function flash(el){try{var o=el.style.outline,of=el.style.outlineOffset,bg=el.style.backgroundColor,tr=el.style.transition;el.style.transition='background-color .2s';el.style.outline='2px solid rgba(10,18,42,.5)';el.style.outlineOffset='2px';el.style.backgroundColor='rgba(255,214,71,.35)';setTimeout(function(){el.style.outline=o;el.style.outlineOffset=of;el.style.backgroundColor=bg;el.style.transition=tr;},1200);}catch(e){}}
function needles(text){var t=(''+text).replace(/\\s+/g,' ').trim();var a=[];if(t)a.push(t.slice(0,80));var w=t.split(' ').filter(function(x){return x.length>=5;}).sort(function(x,y){return y.length-x.length;})[0];if(w)a.push(w);return a;}
function locate(text){var ns=needles(text);for(var k=0;k<ns.length;k++){var nd=ns[k];var wk=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,null);var node;while(node=wk.nextNode()){if(node.textContent&&node.textContent.indexOf(nd)>=0){var el=node.parentElement;if(el){lock=true;el.scrollIntoView({block:'center'});flash(el);setTimeout(function(){lock=false;},200);return;}}}}}
addEventListener('scroll',function(){if(lock||tick)return;tick=true;requestAnimationFrame(function(){tick=false;try{parent.postMessage({mv:'scroll',ratio:ratio()},'*');}catch(e){}});},{passive:true});
addEventListener('message',function(ev){var m=ev.data;if(!m)return;if(m.mv==='scrollTo'){lock=true;var e=se();var max=e.scrollHeight-e.clientHeight;e.scrollTop=max*m.ratio;setTimeout(function(){lock=false;},120);}else if(m.mv==='locate'){locate(m.text);}});
document.addEventListener('mouseup',function(){var s=window.getSelection&&window.getSelection();var t=s?(''+s).trim():'';if(t.length>1){try{parent.postMessage({mv:'select',text:t},'*');}catch(e){}}});
})();<\/script>`;

/** Append the bridge script to an HTML document string (before </body> if present). */
export function injectBridge(html: string): string {
  return /<\/body>/i.test(html)
    ? html.replace(/<\/body>/i, IFRAME_BRIDGE + "</body>")
    : html + IFRAME_BRIDGE;
}

/**
 * Pick search needles from a text selection, best-effort, ordered from most to
 * least specific. Used to locate a selection in the source or in the preview.
 */
export function selectionNeedles(raw: string): string[] {
  const t = raw.replace(/\s+/g, " ").trim();
  const needles: string[] = [];
  if (t) needles.push(t.slice(0, 120));
  const firstLine = raw.split(/\n/)[0].trim();
  if (firstLine.length >= 4 && firstLine !== needles[0]) needles.push(firstLine.slice(0, 80));
  const longest = t
    .split(/\s+/)
    .filter((w) => w.length >= 5)
    .sort((a, b) => b.length - a.length)[0];
  if (longest) needles.push(longest);
  return needles;
}

/** Briefly highlight an element so the user can see where the jump landed. */
export function flashElement(el: HTMLElement): void {
  const prev = {
    outline: el.style.outline,
    offset: el.style.outlineOffset,
    bg: el.style.backgroundColor,
    tr: el.style.transition,
  };
  el.style.transition = "background-color .2s";
  el.style.outline = "2px solid color-mix(in srgb, var(--color-navy) 50%, transparent)";
  el.style.outlineOffset = "2px";
  el.style.backgroundColor = "rgba(255,214,71,.35)";
  setTimeout(() => {
    el.style.outline = prev.outline;
    el.style.outlineOffset = prev.offset;
    el.style.backgroundColor = prev.bg;
    el.style.transition = prev.tr;
  }, 1200);
}

/**
 * Find `text` within a same-origin container and scroll it into view + flash it.
 * Best-effort text search (same limitations as selectionNeedles). Returns found.
 */
export function locateInElement(container: HTMLElement, text: string): boolean {
  for (const needle of selectionNeedles(text)) {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      if (node.textContent && node.textContent.indexOf(needle) >= 0) {
        const el = node.parentElement;
        if (el) {
          el.scrollIntoView({ block: "center" });
          flashElement(el);
          return true;
        }
      }
    }
  }
  return false;
}
