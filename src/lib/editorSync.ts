// Shared helpers for the split-editor "scroll sync" and "selection linking"
// features. Kept free of any CodeMirror/DOM imports so it is safe to import from
// server-rendered client components; all CodeMirror access lives in CodeEditor.

/**
 * Script injected into the HTML preview iframe. Because that iframe is sandboxed
 * WITHOUT `allow-same-origin`, the parent cannot touch its DOM directly — so this
 * relay uses postMessage (which works across the sandbox boundary) to:
 *   - report scroll position (as a 0..1 ratio) on scroll,
 *   - accept `scrollTo` commands from the parent,
 *   - report selected text on mouseup.
 * A local lock prevents programmatic scrolls from echoing back as user scrolls.
 */
export const IFRAME_BRIDGE = `<script>(function(){
var lock=false,tick=false;
function se(){return document.scrollingElement||document.documentElement||document.body;}
function ratio(){var e=se();var max=e.scrollHeight-e.clientHeight;return max>0?e.scrollTop/max:0;}
addEventListener('scroll',function(){if(lock||tick)return;tick=true;requestAnimationFrame(function(){tick=false;try{parent.postMessage({mv:'scroll',ratio:ratio()},'*');}catch(e){}});},{passive:true});
addEventListener('message',function(ev){var m=ev.data;if(!m||m.mv!=='scrollTo')return;lock=true;var e=se();var max=e.scrollHeight-e.clientHeight;e.scrollTop=max*m.ratio;setTimeout(function(){lock=false;},120);});
document.addEventListener('mouseup',function(){var s=window.getSelection&&window.getSelection();var t=s?(''+s).trim():'';if(t.length>1){try{parent.postMessage({mv:'select',text:t},'*');}catch(e){}}});
})();<\/script>`;

/** Append the bridge script to an HTML document string (before </body> if present). */
export function injectBridge(html: string): string {
  return /<\/body>/i.test(html)
    ? html.replace(/<\/body>/i, IFRAME_BRIDGE + "</body>")
    : html + IFRAME_BRIDGE;
}

/**
 * Pick search needles from a preview text selection, best-effort, ordered from
 * most to least specific. Used to locate the selection back in the source code.
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
