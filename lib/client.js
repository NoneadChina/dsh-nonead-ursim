window.__ModuleLoader__.load({ id: "dsh-nonead-ursim", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
var lc=Object.defineProperty;var ig=Object.getOwnPropertyDescriptor;var sg=Object.getOwnPropertyNames;var rg=Object.prototype.hasOwnProperty;var og=(i,e)=>{for(var t in e)lc(i,t,{get:e[t],enumerable:!0})},ag=(i,e,t,n)=>{if(e&&typeof e=="object"||typeof e=="function")for(let s of sg(e))!rg.call(i,s)&&s!==t&&lc(i,s,{get:()=>e[s],enumerable:!(n=ig(e,s))||n.enumerable});return i};var lg=i=>ag(lc({},"__esModule",{value:!0}),i);var HM={};og(HM,{SIM_IP:()=>Im,apply:()=>kM,name:()=>zM,resolveRobotIp:()=>Pm});module.exports=lg(HM);var Ts="/nonead-ursim/twin/state",td="/nonead-ursim/twin/asset";var nd="/nonead-ursim/twin/stream",Ho="/nonead-ursim/twin/sim",id="/nonead-ursim/twin/jog";var cg="frame-error",ug="stale";function hg(i,e=1e3,t=3e4){let n=Number.isFinite(e)&&e>=0?e:1e3,s=Number.isFinite(t)&&t>0?t:3e4,r=Number.isFinite(i)&&i>0?Math.floor(i):1,o=n*2**Math.min(r-1,40);return Math.min(s,Math.max(n,Number.isFinite(o)?o:s))}function sd(i={}){let e=i.EventSourceImpl??globalThis.EventSource,t=Number.isFinite(i.retryMs)&&i.retryMs>=0?i.retryMs:1e3,n=Number.isFinite(i.maxRetryMs)&&i.maxRetryMs>0?i.maxRetryMs:3e4,s=typeof i.setTimeoutImpl=="function"?i.setTimeoutImpl:globalThis.setTimeout,r=typeof i.clearTimeoutImpl=="function"?i.clearTimeoutImpl:globalThis.clearTimeout,o=new Set,a=null,c=null,l=0,u="idle",h=null,d=!0,f=0,g=0,x=0,m=(E={kind:"status"})=>{for(let A of o)try{A(h,E)}catch{}},p=()=>{c!==null&&(r(c),c=null);let E=a;a=null;try{E?.close?.()}catch{}},w=()=>{if(d)return;if(typeof e!="function"){u="unsupported",m({kind:"status"});return}u=l===0?"connecting":"retrying";let E;try{E=new e(i.url)}catch{T();return}a=E,E.addEventListener?.("open",()=>{u="open",m({kind:"status"})}),E.addEventListener?.("state",A=>{let R;try{R=JSON.parse(A?.data??"null")}catch{return}h=R,f+=1,l=0,u="open",m({kind:"state"})}),E.addEventListener?.(ug,A=>{x+=1,m({kind:"stale",...v(A)})}),E.addEventListener?.(cg,A=>{g+=1,m({kind:"frame-error",...v(A)})}),E.onerror=A=>{if(!d){if(typeof A?.data=="string"){g+=1,m({kind:"frame-error",...v(A)});return}p(),T()}}},T=()=>{if(d)return;l+=1;let E=hg(l,t,n);u="retrying",m({kind:"status"}),c!==null&&(r(c),c=null),c=s(()=>{c=null,w()},E)};function v(E){try{let A=JSON.parse(E?.data??"null");return A!==null&&typeof A=="object"?A:{}}catch{return{}}}return{subscribe(E){return o.add(E),()=>o.delete(E)},start(){d&&(d=!1,l=0,w())},stop(){d=!0,p(),u="idle"},poke(E=!1){return d||a!==null&&E!==!0?!1:(c!==null&&(r(c),c=null),p(),w(),!0)},getSnapshot:()=>h,getStatus:()=>u,getFrames:()=>f,getFrameErrors:()=>g,getStaleCount:()=>x}}function rd(i,e){let t=typeof i=="string"&&i!==""?i:"/nonead-ursim/twin/stream",n=typeof e=="string"?e.trim():"";return n===""?t:`${t}?ip=${encodeURIComponent(n)}`}function dg(i,e,t,n){return e?t:Math.min(n,Math.max(t,i*2))}function fg(i){return`${i}${i.includes("?")?"&":"?"}detail=1`}function od({fetchImpl:i=globalThis.fetch,ip:e,baseMs:t=100,maxMs:n=2e3,detailMs:s=2e3,now:r=()=>Date.now(),stream:o=!1,streamFactory:a}={}){let c=typeof e=="string"&&e.trim()!==""?e.trim():"",l=_=>_===""?Ts:`${Ts}?ip=${encodeURIComponent(_)}`,u=l(c),h=-1/0,d={connected:!1,model:"",q:[],tcp:[],ts:0,error:null,code:null,ips:[],ip:null,degraded:!1,detail:null,simulated:!1,pendingMotion:null,feedStale:!1,feedPendingMs:null},f=new Set,g=null,x=t,m=!0,p=0,w=null,T=null,v=null;function E(){v!==null&&(v(),v=null),T?.stop?.(),T=null}function A(){E(),T=(typeof a=="function"?a:sd)({url:rd(nd,c)}),v=T.subscribe((C,F)=>{if(!m){if(F?.kind==="stale"||F?.kind==="frame-error"){d={...d,feedStale:!0,feedPendingMs:Number.isFinite(F?.pendingMs)?F.pendingMs:d.feedPendingMs},R();return}if(F?.kind==="status"){R();return}C!=null&&(L(C),R())}}),m||T.start()}let R=()=>{for(let _ of f)try{_(d)}catch{}};function L(_){let C=_?.connected===!0;return d=C?{connected:!0,model:_.model,q:_.q,tcp:_.tcp,ts:_.ts,error:null,code:null,ips:[],ip:_.ip??null,degraded:_.degraded===!0,simulated:_.simulated===!0,detail:_.detail??d.detail??null,pendingMotion:_.pending_motion??null,feedStale:_.stale===!0,feedPendingMs:Number.isFinite(_.stale_ms)?_.stale_ms:null}:{...d,connected:!1,error:_?.reason??_?.error??"not connected",code:_?.code??null,ips:Array.isArray(_?.ips)?_.ips:[],ip:_?.ip??d.ip??null,degraded:!1,simulated:!1,pendingMotion:null,feedStale:!1,feedPendingMs:null},C}async function b(_){let C=!1,F=d.connected===!0&&r()-h>=Math.max(0,s);F&&(h=r());try{let q=typeof AbortController=="function"?new AbortController:null;w=q;let W=await(await i(F?fg(u):u,q?{cache:"no-store",signal:q.signal}:void 0)).json();C=L(W)}catch(q){if(q instanceof Error&&q.name==="AbortError")return;d={...d,connected:!1,error:q instanceof Error?q.message:String(q),code:null,degraded:!1},C=!1}finally{w=null}if(m||_!==p)return;R(),x=dg(x,C,t,n);let X=typeof document<"u"&&document.hidden===!0;g=setTimeout(()=>b(_),X?n:x)}return{subscribe(_){return f.add(_),()=>f.delete(_)},getSnapshot:()=>d,setIp(_){let C=typeof _=="string"?_.trim():"";if(C!==c){if(c=C,u=l(C),d={...d,connected:!1,model:"",q:[],tcp:[],ts:0,error:null,code:null,ips:[],ip:C===""?null:C,degraded:!1,detail:null,pendingMotion:null},R(),o){m||A();return}try{w?.abort?.()}catch{}w=null,m||b(++p)}},getIp:()=>c,getStreamHealth(){let _=T;return{mode:o?"stream":"poll",status:o?typeof _?.getStatus=="function"?_.getStatus():"idle":"polling",frames:typeof _?.getFrames=="function"?_.getFrames():0,frameErrors:typeof _?.getFrameErrors=="function"?_.getFrameErrors():0,stale:typeof _?.getStaleCount=="function"?_.getStaleCount():0,connected:d.connected===!0}},retryNow(_=!1){if(m)return!1;if(o)return T?.poke?.(_)===!0;g&&(clearTimeout(g),g=null);try{w?.abort?.()}catch{}return w=null,b(++p),!0},start(){if(m){if(m=!1,o){A();return}b(++p)}},stop(){if(m=!0,p++,o){E();return}g&&(clearTimeout(g),g=null);try{w?.abort?.()}catch{}w=null}}}var Vo="__DSH_URSIM_TWIN_MUTATION_HUB__";function ws(){return typeof globalThis>"u"?void 0:globalThis}function pg(i,e){if(typeof e=="function")return e;let t=i?.defaultView?.MutationObserver;if(typeof t=="function")return t;let n=ws()?.MutationObserver;return typeof n=="function"?n:void 0}function mg(i,e){if(typeof e=="function")return e;let t=i?.defaultView;if(t&&typeof t.requestAnimationFrame=="function")return s=>t.requestAnimationFrame(s);let n=ws()?.requestAnimationFrame;return typeof n=="function"?s=>n(s):void 0}function gg(i,e){if(typeof e=="function")return e;let t=i?.defaultView;if(t&&typeof t.cancelAnimationFrame=="function")return s=>t.cancelAnimationFrame(s);let n=ws()?.cancelAnimationFrame;return typeof n=="function"?s=>n(s):void 0}var Go;function _g(){let i=ws();return i?i[Vo]:Go}function xg(i){let e=ws();e?e[Vo]=i:Go=i}function yg(i){let e=ws();e?e[Vo]===i&&delete e[Vo]:Go===i&&(Go=void 0)}function vg({doc:i,options:e}){let t=pg(i,e.MutationObserver),n=mg(i,e.raf),s=gg(i,e.caf),r=new Set,o={subscribers:r,pending:[],scheduled:!1,frame:void 0,observer:void 0,raf:n,caf:s},a=()=>{o.frame=void 0,o.scheduled=!1;let u=o.pending;o.pending=[];for(let h of[...r])if(r.has(h))try{h(u)}catch{}},c=()=>{if(!o.scheduled){if(o.scheduled=!0,typeof n=="function")try{o.frame=n(a);return}catch{}a()}},l=i?i.body??i.documentElement:void 0;if(typeof t=="function"&&l)try{o.observer=new t(u=>{for(let h of u)o.pending.push(h);c()}),o.observer.observe(l,{childList:!0,subtree:!0})}catch{o.observer=void 0}return o}function ad(i,e,t){let n=_g();n===void 0&&(n=vg({doc:i,options:e}),n.observer&&xg(n)),n.subscribers.add(t);let s=!0;return()=>{if(s&&(s=!1,n.subscribers.delete(t),!(n.subscribers.size>0))){try{n.observer?.disconnect?.()}catch{}if(n.frame!==void 0&&typeof n.caf=="function")try{n.caf(n.frame)}catch{}n.frame=void 0,n.scheduled=!1,n.pending=[],yg(n)}}}var bg={statusDisconnected:"\u672A\u8FDE\u63A5\u673A\u5668\u4EBA",statusLoading:"\u5DF2\u8FDE\u63A5 \xB7 \u6B63\u5728\u52A0\u8F7D\u6A21\u578B\u2026",statusConnected:"\u5DF2\u8FDE\u63A5",statusFallbackSuffix:"\uFF08\u65E0\u5185\u7F6E\u6A21\u578B\uFF0C\u4F7F\u7528\u8FD1\u4F3C\u51E0\u4F55\u4F53\uFF09",statusErrorPrefix:"\u6E32\u67D3\u5F02\u5E38\uFF1A",statusLoadFailed:"\u6A21\u578B\u52A0\u8F7D\u5931\u8D25\uFF1A",statusLoadRetrying:"\uFF08\u6B63\u5728\u91CD\u8BD5\uFF09",statusSwitchingModel:i=>`\u5207\u6362\u578B\u53F7 ${i}\u2026`,statusNoWebgl:"\u5F53\u524D\u73AF\u5883\u4E0D\u652F\u6301 WebGL\uFF1A\u5DF2\u5207\u6362\u4E3A\u7EAF\u6570\u503C\u6A21\u5F0F\uFF08\u5173\u8282\u89D2\u4E0E TCP \u4ECD\u4F1A\u66F4\u65B0\uFF09",statusIncomplete:"\u673A\u5668\u4EBA\u672A\u8FD4\u56DE\u5B8C\u6574\u7684\u5173\u8282\u89D2",statusContextLost:"3D \u4E0A\u4E0B\u6587\u4E22\u5931\uFF08GPU \u91CD\u7F6E\uFF09\u2014\u2014 \u6536\u8D77\u5E76\u91CD\u65B0\u5C55\u5F00\u9762\u677F\u53EF\u6062\u590D",statusSafetyHint:"\u673A\u5668\u4EBA\u53EF\u80FD\u5DF2\u505C\u6B62\uFF0C\u8BF7\u68C0\u67E5\u793A\u6559\u5668",disconnectNeverConnected:"\u672A\u8FDE\u63A5\u673A\u5668\u4EBA\uFF1A\u8FD8\u6CA1\u6709\u6210\u529F\u6267\u884C\u8FC7 ursim_connect",disconnectReason:i=>`\u673A\u5668\u4EBA\u672A\u8FDE\u63A5${i?`\uFF1A${i}`:""}`,disconnectAmbiguous:i=>`\u68C0\u6D4B\u5230\u591A\u53F0\u5DF2\u8FDE\u63A5\u673A\u5668\u4EBA\uFF0C\u8BF7\u6307\u5B9A\u673A\u5668\u4EBA IP${i}`,disconnectCandidates:i=>Array.isArray(i)&&i.length>0?`\uFF08\u5019\u9009\uFF1A${i.join("\u3001")}\uFF09`:"",disconnectWorkerDown:i=>`UR \u63A7\u5236\u8FDB\u7A0B\u4E0D\u53EF\u7528${i?`\uFF1A${i}`:""}\uFF08\u53EF\u8FD0\u884C ursim_ping \u81EA\u68C0 Python \u4F9D\u8D56\uFF09`,disconnectReadFailed:i=>`\u8BFB\u53D6\u673A\u5668\u4EBA\u72B6\u6001\u5931\u8D25${i?`\uFF1A${i}`:""}`,jointsPrefix:"\u5173\u8282\u89D2 (\xB0)",tcpPrefix:"TCP(\u7C73/\u8F74\u89D2\u5F27\u5EA6)",queryFailed:"\u67E5\u8BE2\u5931\u8D25",detailStatusFailed:i=>`\u72B6\u6001\u67E5\u8BE2\u5931\u8D25\uFF1A${i}`,detailSafety:i=>`\u5B89\u5168 ${i}`,detailRobotMode:i=>`\u6A21\u5F0F ${i}`,detailProgram:i=>`\u7A0B\u5E8F ${i}`,detailSpeed:i=>`\u901F\u5EA6 ${i}`,detailRunning:"\u8FD0\u884C\u4E2D",detailTempsPrefix:"\u6E29\u5EA6(\xB0C)",detailTemps:i=>`\u6E29\u5EA6(\xB0C)  ${i}`,detailBus:(i,e)=>`\u6BCD\u7EBF ${i} V  ${e} A`,overLimit:i=>`\u26A0 \u8D85\u9650 ${i}`,safetyMode:{NORMAL:"\u6B63\u5E38",REDUCED:"\u7F29\u51CF\u6A21\u5F0F",PROTECTIVE_STOP:"\u4FDD\u62A4\u6027\u505C\u6B62",SAFEGUARD_STOP:"\u5B89\u5168\u505C\u6B62",EMERGENCY_STOP:"\u6025\u505C",SYSTEM_EMERGENCY_STOP:"\u7CFB\u7EDF\u6025\u505C",ROBOT_EMERGENCY_STOP:"\u673A\u5668\u4EBA\u6025\u505C",RECOVERY:"\u6062\u590D\u4E2D",VIOLATION:"\u8FDD\u53CD\u5B89\u5168\u9650\u5236",FAULT:"\u6545\u969C",AUTOMATIC_MODE_SAFEGUARD_STOP:"\u81EA\u52A8\u6A21\u5F0F\u5B89\u5168\u505C\u6B62",SYSTEM_THREE_POSITION_ENABLING_STOP:"\u4E09\u4F4D\u4F7F\u80FD\u505C\u6B62"},robotMode:{POWER_OFF:"\u5DF2\u4E0B\u7535",POWER_ON:"\u5DF2\u4E0A\u7535",IDLE:"\u7A7A\u95F2",BACKDRIVE:"\u62D6\u52A8",RUNNING:"\u8FD0\u884C\u4E2D",BOOTING:"\u542F\u52A8\u4E2D",CONFIRM_SAFETY:"\u5F85\u786E\u8BA4\u5B89\u5168",DISCONNECTED:"\u672A\u8FDE\u63A5",NO_CONTROLLER:"\u65E0\u63A7\u5236\u5668"},programState:{STOPPED:"\u5DF2\u505C\u6B62",PLAYING:"\u8FD0\u884C\u4E2D",PAUSED:"\u5DF2\u6682\u505C"},viewReset:"\u91CD\u7F6E\u89C6\u89D2",viewIso:"\u7B49\u8F74\u6D4B",viewFront:"\u524D\u89C6",viewSide:"\u4FA7\u89C6",viewTop:"\u4FEF\u89C6",identity:(i,e)=>`\u673A\u5668\u4EBA  ${[i,e].filter(Boolean).join("  \xB7  ")}`,pendingPrefix:"\u5F85\u5BA1\u6279",canvasLabel:"\u673A\u5668\u4EBA\u6570\u5B57\u4EFF\u771F 3D \u89C6\u56FE\uFF1B\u53EF\u7528\u65B9\u5411\u952E\u5207\u6362\u89C6\u89D2",hudLabel:"\u673A\u5668\u4EBA\u5B9E\u65F6\u8BFB\u6570",layerReach:"\u53EF\u8FBE\u8303\u56F4",layerBase:"\u57FA\u5EA7\u7CFB",layerForce:"\u53D7\u529B",layerGhost:"\u76EE\u6807\u59FF\u6001",screenshot:"\u622A\u56FE",screenshotLabel:"\u5BFC\u51FA\u5E26\u6C34\u5370\u7684\u622A\u56FE",trajectoryClear:"\u6E05\u8F68\u8FF9",trajectoryPause:"\u6682\u505C\u8F68\u8FF9",trajectoryResume:"\u7EE7\u7EED\u8BB0\u5F55",trajectoryExport:"\u5BFC\u51FA\u8F68\u8FF9",dockLabel:"NoneadURSim",dockDescription:"\u673A\u5668\u4EBA\u5B9E\u65F6\u4EFF\u771F\u89C6\u56FE",dockCollapse:"\u6536\u8D77",simTitle:"\u79BB\u7EBF\u4EFF\u771F",simToggleOn:"\u5F00\u542F\u4EFF\u771F",simToggleOff:"\u5173\u95ED\u4EFF\u771F",simUses:"\u5F00\u542F\u540E\u7531 AI \u76F4\u63A5\u9A71\u52A8\u8FD9\u91CC\u7684\u6A21\u578B\uFF1A\u8FD0\u52A8\u7C7B\u5DE5\u5177\u4F1A\u52A8\u8FD9\u53F0\u865A\u62DF\u673A\u5668\u4EBA\uFF0C\u771F\u673A\u4E0D\u53D7\u5F71\u54CD\u3002",simModelLabel:"\u578B\u53F7",simPresetLabel:"\u8D77\u59CB\u59FF\u6001",simSpeedLabel:"\u8D77\u59CB\u500D\u7387",simPresetZero:"\u5168\u96F6\u4F4D",simPresetUpright:"\u7AD6\u76F4\u6536\u62E2",simPresetReach:"\u4FA7\u4F38",simBadge:"\u4EFF\u771F",simBadgeTitle:"\u79BB\u7EBF\u4EFF\u771F\u4E2D\u7684\u865A\u62DF\u673A\u5668\u4EBA \u2014\u2014 \u4E0D\u662F\u771F\u673A\u8BFB\u6570\uFF0C\u4E0D\u4F1A\u6709\u771F\u673A\u52A8\u4F5C",modeBadgeIdle:"\u672A\u8FDE\u63A5",modeBadgeIdleTitle:"\u65E2\u6CA1\u6709\u8FD0\u884C\u4EFF\u771F\uFF0C\u4E5F\u6CA1\u6709\u8FDE\u63A5\u673A\u5668\u4EBA \u2014\u2014 \u5F53\u524D\u6CA1\u6709\u4EFB\u4F55\u4E1C\u897F\u4F1A\u88AB\u9A71\u52A8",realModeBadge:i=>`\u771F\u673A\u6A21\u5F0F \xB7 \u5141\u8BB8 ${i}`,realModeBadgeEmpty:"\u771F\u673A\u6A21\u5F0F \xB7 \u767D\u540D\u5355\u4E3A\u7A7A\uFF08\u5168\u90E8\u62D2\u7EDD\uFF09",realModeBadgeTitle:"\u771F\u673A\u6A21\u5F0F\uFF08motionMode: real\uFF09\uFF1A\u6307\u4EE4\u4F1A\u53D1\u5F80\u767D\u540D\u5355\u91CC\u7684\u771F\u63A7\u5236\u5668 \u2014\u2014 \u8FD9\u4E0D\u662F\u4EFF\u771F",detailCurrentsPrefix:"\u7535\u6D41(A)",detailTcpSpeed:i=>`TCP \u901F\u5EA6 ${i} m/s`,detailEstimatedSuffix:"\uFF08\u4F30\u7B97\uFF09",simCapsSummary:"\u4EFF\u771F\u80FD\u505A\u4EC0\u4E48 / \u4E0D\u80FD\u505A\u4EC0\u4E48",simCapsBucket:(i,e)=>`${i} ${e} \u9879`,simCapsCannot:i=>`\u4E0D\u652F\u6301 ${i} \u7C7B`,simCapsMotion:"\u8FD0\u52A8",simCapsRead:"\u8BFB\u56DE",simCapsIo:"I/O \u4E0E\u5BC4\u5B58\u5668",simCapsTelemetry:"\u9065\u6D4B",simRestoreFailed:i=>`\u4E0A\u6B21\u7684\u4EFF\u771F\u672A\u80FD\u6062\u590D\uFF1A${i}\uFF08\u53EF\u5728\u8FD9\u91CC\u91CD\u65B0\u5F00\u542F\uFF09`,riskOk:"\u6B63\u5E38",riskNear:"\u26A0 \u63A5\u8FD1\u5947\u5F02\u70B9",riskAt:"\u26A0 \u5947\u5F02\u70B9",riskWrist:i=>`\u8155 ${i}\xB0`,riskManip:i=>`\u53EF\u64CD\u4F5C\u5EA6 ${i}`,riskLimit:(i,e)=>`J${i} \u8DDD\u9650\u4F4D ${e}\xB0`,riskTitle:"\u5947\u5F02\u70B9\u5224\u636E\uFF1A\u7B2C 5 \u5173\u8282\u89D2\uFF08\u8155\u90E8\u5171\u7EBF\u65F6\u8D8B 0\uFF09+ \u5F52\u4E00\u5316\u53EF\u64CD\u4F5C\u5EA6 |det J|/\u81C2\u5C55\xB3 + \u79BB\u5173\u8282\u9650\u4F4D\u7684\u4F59\u91CF",ioSummary:"I/O \u4E0E\u5BC4\u5B58\u5668",ioDigitalOut:i=>`\u6570\u5B57\u8F93\u51FA  ${i}`,ioDigitalIn:i=>`\u6570\u5B57\u8F93\u5165  ${i}`,ioAnalogIn:(i,e)=>`\u6A21\u62DF\u8F93\u5165  ${i} / ${e} V`,ioRegisters:(i,e,t)=>`${i} \u5BC4\u5B58\u5668 [${e}\u2026]  ${t}`,ioReading:"\u8BFB\u53D6\u4E2D\u2026",ioFailed:i=>`\u8BFB\u53D6\u5931\u8D25\uFF1A${i}`,ioSimInputNote:"\u4EFF\u771F\u6CA1\u6709\u8F93\u5165\u4FE1\u53F7\u6E90\uFF1A\u8F93\u5165\u6052\u4E3A 0\uFF0C\u5BC4\u5B58\u5668\u6052\u4E3A\u521D\u503C\u3002",simApplying:"\u6B63\u5728\u5207\u6362\u4EFF\u771F\u2026",simFailed:i=>`\u4EFF\u771F\u5F00\u5173\u5931\u8D25\uFF1A${i}`,simUnsupported:"\u4EFF\u771F\u53EA\u5B9E\u73B0\u8FD0\u52A8\u5B66\uFF08\u8FD0\u52A8\u7C7B\u5DE5\u5177 + \u4F4D\u59FF\u8BFB\u56DE\uFF09\uFF1B\u5176\u4F59\u6307\u4EE4\u4F1A\u660E\u786E\u56DE\u62A5\u300C\u65E0\u4EFF\u771F\u8BED\u4E49\u300D\u3002",simCollapseStops:"\u6536\u8D77\u9762\u677F\u4F1A\u505C\u6B62\u8FD9\u53F0\u4EFF\u771F\u3002",simActiveStatus:i=>`\u79BB\u7EBF\u4EFF\u771F \xB7 ${i}`,simWatermark:"\u79BB\u7EBF\u4EFF\u771F\uFF08\u975E\u771F\u673A\uFF09",controlsTcpPosition:"TCP \u4F4D\u7F6E\uFF08mm\uFF09",controlsTcpOrientation:"TCP \u65B9\u5411\uFF08\xB0\uFF09",controlsHome:"\u56DE\u96F6",controlsHomeTitle:"\u56DE\u96F6\uFF1A\u516D\u5173\u8282\u5230 [0\xB0, -90\xB0, 0\xB0, -90\xB0, -180\xB0, 0\xB0]",controlsStepMm:"\u6B65\u957F mm",controlsStepDeg:"\u6B65\u957F \xB0",controlsStepMmOptionTitle:i=>`\u6B65\u957F ${i} mm`,controlsStepDegOptionTitle:i=>`\u6B65\u957F ${i}\xB0`,controlsFrame:"\u53C2\u8003\u7CFB",controlsFrameTitle:"\u5750\u6807\u7CFB",controlsFrameTool:"\u5DE5\u5177\u7CFB",controlsFrameBase:"\u57FA\u5EA7\u7CFB",controlsFrameOptionTitle:i=>`\u5207\u6362\u5230${i}\u70B9\u52A8`,controlsJogPositionTitle:(i,e,t,n)=>`\u6CBF${i} ${e} \u8F74${t>0?"\u6B63":"\u8D1F"}\u65B9\u5411\u79FB\u52A8 ${n} mm`,controlsJogRotateTitle:(i,e,t,n)=>`\u7ED5${i} ${e} \u8F74${t>0?"\u6B63":"\u8D1F"}\u65B9\u5411\u65CB\u8F6C ${n}\xB0`,controlsDisabledDisconnected:"\u672A\u8FDE\u63A5\u673A\u5668\u4EBA\uFF1A\u70B9\u52A8\u63A7\u4EF6\u4E0D\u53EF\u7528",controlsDisabledSimOnly:"\u4EC5\u79BB\u7EBF\u4EFF\u771F\u53EF\u70B9\u52A8\uFF1A\u771F\u673A\u8BF7\u7528\u5DE5\u5177\u8C03\u7528\uFF08\u53D7\u5BA1\u6279\u95E8\u7981\u4FDD\u62A4\uFF09",controlsDisabledStale:"\u6570\u636E\u901A\u9053\u505C\u6EDE\uFF1A\u63A7\u4EF6\u5DF2\u6682\u505C\uFF0C\u6062\u590D\u540E\u81EA\u52A8\u89E3\u7981",controlsCommandFailed:i=>`\u70B9\u52A8\u5931\u8D25\uFF1A${i}`,controlsToolPosition:"TCP \u4F4D\u59FF",controlsToolPositionTitle:"TCP \u4F4D\u59FF\uFF1AX/Y/Z \u5355\u4F4D mm\uFF0CRX/RY/RZ \u5355\u4F4D rad\uFF1B\u56DE\u8F66\u6216\u5931\u7126\u4E0B\u53D1\u4E00\u6761 pose",controlsSummary:(i,e,t)=>`TCP: ${i}, ${e}, ${t} m`,controlsSummaryTitle:"\u673A\u5668\u4EBA\u5F53\u524D TCP \u4F4D\u7F6E\uFF08\u7C73\uFF09",controlsJoints:"\u5173\u8282",controlsJointsTitle:"\u62D6\u52A8\u6ED1\u5757\u53EA\u5728\u672C\u5730\u9884\u89C8\uFF08\u4E0D\u53D1\u547D\u4EE4\uFF09\uFF0C\u677E\u624B\u624D\u4E0B\u53D1\u4E00\u6761 movej\uFF1B\u25C0 \u25B6 \u6BCF\u6B21 1\xB0",controlsJointStepTitle:(i,e)=>`${i} \u5173\u8282${e>0?"\u6B63\u5411":"\u8D1F\u5411"}\u5FAE\u8C03 1\xB0`,controlsJointBase:"\u673A\u5EA7",controlsJointShoulder:"\u80A9\u90E8",controlsJointElbow:"\u8098\u90E8",controlsJointWrist1:"\u624B\u8155 1",controlsJointWrist2:"\u624B\u8155 2",controlsJointWrist3:"\u624B\u8155 3",controlsJointValue:i=>`${i.toFixed(1)}\xB0`,controlsInvalidRollback:"\u6570\u503C\u65E0\u6548\uFF1A\u5DF2\u56DE\u6EDA\u5230\u6700\u65B0\u4E00\u5E27",controlsRejectedCommand:"\u5BBF\u4E3B\u62D2\u7EDD\u4E86\u8FD9\u6B21\u547D\u4EE4",controlsNoPoseData:"\u5C1A\u65E0\u4F4D\u59FF\u6570\u636E",controlsBusyRetry:"\u4E0A\u4E00\u6761\u547D\u4EE4\u8FD8\u5728\u98DE\u884C\u4E2D\uFF1A\u8FD9\u6B21\u6CA1\u6709\u4E0B\u53D1\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5",controlsStopFailed:i=>`\u505C\u6B62\u6307\u4EE4\u53D1\u9001\u5931\u8D25\uFF1A${i}`},Sg={statusDisconnected:"Robot not connected",statusLoading:"Connected \xB7 loading model\u2026",statusConnected:"Connected",statusFallbackSuffix:" (no built-in model, using approximate geometry)",statusErrorPrefix:"Render error: ",statusLoadFailed:"Model failed to load: ",statusLoadRetrying:" (retrying)",statusSwitchingModel:i=>`switching to ${i}\u2026`,statusNoWebgl:"WebGL is unavailable here: switched to numeric-only mode (joint angles and TCP keep updating)",statusIncomplete:"The robot did not return a full set of joint angles",statusContextLost:"3D context lost (GPU reset) \u2014 collapse and reopen the panel to recover",statusSafetyHint:"The robot may have stopped; check the teach pendant",disconnectNeverConnected:"Robot not connected: ursim_connect has never succeeded",disconnectReason:i=>`Robot not connected${i?`: ${i}`:""}`,disconnectAmbiguous:i=>`More than one robot is connected; specify the robot IP${i}`,disconnectCandidates:i=>Array.isArray(i)&&i.length>0?` (candidates: ${i.join(", ")})`:"",disconnectWorkerDown:i=>`The UR control process is unavailable${i?`: ${i}`:""} (run ursim_ping to check the Python dependencies)`,disconnectReadFailed:i=>`Failed to read the robot state${i?`: ${i}`:""}`,jointsPrefix:"Joint angles (\xB0)",tcpPrefix:"TCP (m / axis-angle rad)",queryFailed:"query failed",detailStatusFailed:i=>`Status query failed: ${i}`,detailSafety:i=>`Safety ${i}`,detailRobotMode:i=>`Mode ${i}`,detailProgram:i=>`Program ${i}`,detailSpeed:i=>`Speed ${i}`,detailRunning:"Running",detailTempsPrefix:"Temp (\xB0C)",detailTemps:i=>`Temp (\xB0C)  ${i}`,detailBus:(i,e)=>`Bus ${i} V  ${e} A`,overLimit:i=>`\u26A0 over limit ${i}`,safetyMode:{NORMAL:"Normal",REDUCED:"Reduced",PROTECTIVE_STOP:"Protective stop",SAFEGUARD_STOP:"Safeguard stop",EMERGENCY_STOP:"Emergency stop",SYSTEM_EMERGENCY_STOP:"System emergency stop",ROBOT_EMERGENCY_STOP:"Robot emergency stop",RECOVERY:"Recovery",VIOLATION:"Safety violation",FAULT:"Fault",AUTOMATIC_MODE_SAFEGUARD_STOP:"Automatic-mode safeguard stop",SYSTEM_THREE_POSITION_ENABLING_STOP:"Three-position enabling stop"},robotMode:{POWER_OFF:"Power off",POWER_ON:"Power on",IDLE:"Idle",BACKDRIVE:"Backdrive",RUNNING:"Running",BOOTING:"Booting",CONFIRM_SAFETY:"Confirm safety",DISCONNECTED:"Disconnected",NO_CONTROLLER:"No controller"},programState:{STOPPED:"Stopped",PLAYING:"Playing",PAUSED:"Paused"},viewReset:"Reset view",viewIso:"Isometric",viewFront:"Front",viewSide:"Side",viewTop:"Top",identity:(i,e)=>`Robot  ${[i,e].filter(Boolean).join("  \xB7  ")}`,pendingPrefix:"Pending approval",canvasLabel:"Robot simulation 3D view; arrow keys switch the view",hudLabel:"Live robot readouts",layerReach:"Reach",layerBase:"Base frame",layerForce:"Force",layerGhost:"Target pose",screenshot:"Screenshot",screenshotLabel:"Export a watermarked screenshot",trajectoryClear:"Clear path",trajectoryPause:"Pause path",trajectoryResume:"Resume path",trajectoryExport:"Export path",dockLabel:"NoneadURSim",dockDescription:"Live robot simulation view",dockCollapse:"Collapse",simTitle:"Offline simulation",simToggleOn:"Start simulation",simToggleOff:"Stop simulation",simUses:"While on, the AI drives the model right here: motion tools move this virtual robot and no real robot is affected.",simModelLabel:"Model",simPresetLabel:"Start pose",simSpeedLabel:"Start speed scaling",simPresetZero:"Zero pose",simPresetUpright:"Upright",simPresetReach:"Reach",simBadge:"SIMULATION",simBadgeTitle:"Virtual robot in offline simulation \u2014 not a real robot reading, no real motion",modeBadgeIdle:"NOT CONNECTED",modeBadgeIdleTitle:"No simulation is running and no robot is connected \u2014 nothing is being driven",realModeBadge:i=>`REAL MODE \xB7 ${i}`,realModeBadgeEmpty:"REAL MODE \xB7 allow-list empty (everything refused)",realModeBadgeTitle:"Real-robot mode (motionMode: real): commands go to the controllers in the allow-list \u2014 this is not a simulation",detailCurrentsPrefix:"Current (A)",detailTcpSpeed:i=>`TCP speed ${i} m/s`,detailEstimatedSuffix:" (estimated)",simCapsSummary:"What the simulation can and cannot do",simCapsBucket:(i,e)=>`${i}: ${e}`,simCapsCannot:i=>`not simulated: ${i}`,simCapsMotion:"Motion",simCapsRead:"Readback",simCapsIo:"I/O & registers",simCapsTelemetry:"Telemetry",simRestoreFailed:i=>`The previous simulation could not be restored: ${i} (switch it on here to retry)`,riskOk:"OK",riskNear:"\u26A0 near singularity",riskAt:"\u26A0 at singularity",riskWrist:i=>`wrist ${i}\xB0`,riskManip:i=>`manipulability ${i}`,riskLimit:(i,e)=>`J${i} is ${e}\xB0 from its limit`,riskTitle:"Singularity criteria: joint 5 angle (goes to 0 when the wrist axes line up) + normalised manipulability |det J|/reach\xB3 + distance to the joint limits",ioSummary:"I/O & registers",ioDigitalOut:i=>`Digital out  ${i}`,ioDigitalIn:i=>`Digital in   ${i}`,ioAnalogIn:(i,e)=>`Analog in    ${i} / ${e} V`,ioRegisters:(i,e,t)=>`${i} registers [${e}\u2026]  ${t}`,ioReading:"reading\u2026",ioFailed:i=>`read failed: ${i}`,ioSimInputNote:"The simulation has no input source: inputs stay 0 and registers stay at their initial values.",simApplying:"Switching simulation\u2026",simFailed:i=>`Simulation switch failed: ${i}`,simUnsupported:'The simulation implements kinematics only (motion tools + pose readback); every other command reports "no simulation semantics".',simCollapseStops:"Collapsing the panel stops this simulation.",simActiveStatus:i=>`Offline simulation \xB7 ${i}`,simWatermark:"Offline simulation (not a real robot)",controlsTcpPosition:"TCP position (mm)",controlsTcpOrientation:"TCP orientation (\xB0)",controlsHome:"Home",controlsHomeTitle:"Home: all six joints to [0\xB0, -90\xB0, 0\xB0, -90\xB0, -180\xB0, 0\xB0]",controlsStepMm:"Step mm",controlsStepDeg:"Step \xB0",controlsStepMmOptionTitle:i=>`Step ${i} mm`,controlsStepDegOptionTitle:i=>`Step ${i}\xB0`,controlsFrame:"Frame",controlsFrameTitle:"Frame",controlsFrameTool:"Tool",controlsFrameBase:"Base",controlsFrameOptionTitle:i=>`Jog in the ${i} frame`,controlsJogPositionTitle:(i,e,t,n)=>`Move ${n} mm along the ${i} ${e} axis (${t>0?"positive":"negative"} direction)`,controlsJogRotateTitle:(i,e,t,n)=>`Rotate ${n}\xB0 about the ${i} ${e} axis (${t>0?"positive":"negative"} direction)`,controlsDisabledDisconnected:"Robot not connected: jog controls are unavailable",controlsDisabledSimOnly:"Jogging works in the offline simulation only: use the tools for a real robot (guarded by approval)",controlsDisabledStale:"The data feed stalled: controls are paused and re-enable automatically",controlsCommandFailed:i=>`Jog failed: ${i}`,controlsToolPosition:"TCP pose",controlsToolPositionTitle:"TCP pose: X/Y/Z in mm, RX/RY/RZ in rad; press Enter or blur to send one pose command",controlsSummary:(i,e,t)=>`TCP: ${i}, ${e}, ${t} m`,controlsSummaryTitle:"Current TCP position (m)",controlsJoints:"Joints",controlsJointsTitle:"Dragging a slider previews locally only (no command); release sends one movej; \u25C0 \u25B6 step by 1\xB0",controlsJointStepTitle:(i,e)=>`${i} joint: ${e>0?"+1\xB0":"\u22121\xB0"}`,controlsJointBase:"Base",controlsJointShoulder:"Shoulder",controlsJointElbow:"Elbow",controlsJointWrist1:"Wrist 1",controlsJointWrist2:"Wrist 2",controlsJointWrist3:"Wrist 3",controlsJointValue:i=>`${i.toFixed(1)}\xB0`,controlsInvalidRollback:"Invalid value: rolled back to the latest frame",controlsRejectedCommand:"The host rejected this command",controlsNoPoseData:"No pose data yet",controlsBusyRetry:"The previous command is still in flight: nothing was sent, please retry",controlsStopFailed:i=>`Failed to send the stop command: ${i}`},Mg=Object.freeze(["zh","en"]),ld="zh";function Tg(i){if(typeof i!="string"||i.trim()==="")return ld;let e=i.trim().toLowerCase().split(/[-_]/u)[0];return Mg.includes(e)?e:ld}function wg(i){return Tg(i)==="en"?Sg:bg}function Es(i){let e=i??globalThis.navigator;return wg(e?.language)}var Eg='[data-sidebar-right-guide="true"]',cc="[data-sidebar-right-guide-entry]",Ag="[data-sidebar-right-tab]",ud="data-dsh-ursim-twin-right-entry",ZM=`[${ud}]`,Rg="data-dsh-ursim-twin-right-view",Cg="data-dsh-ursim-twin-right-close",Ig="data-dsh-ursim-twin-right-panel",Er=Es(),Wo=Er.dockLabel,hd=Er.dockDescription,Pg=Er.dockLabel,dd='<svg width="26" height="26" viewBox="0 0 16 16" fill="none" stroke="#539CFA" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.6 13.4h8.8"/><path d="M5.4 13.4V9.9l4.9-3.2v3"/><path d="M9.5 9.7v1.5M11.1 9.7v1.5"/><circle cx="5.4" cy="9.9" r=".85"/><circle cx="10.3" cy="6.7" r=".85"/></svg>',Lg={boxSizing:"border-box",display:"flex",alignItems:"center",gap:"14px",width:"100%",padding:"14px 20px",border:"0.8px solid var(--dsw-alias-border-l3, rgba(0, 0, 0, 0.12))",borderRadius:"20px",background:"var(--dsw-alias-bg-layer-1, #ffffff)",color:"var(--dsw-alias-label-primary, #0f1115)",cursor:"pointer",font:"inherit",textAlign:"left"},Dg={display:"inline-flex",alignItems:"center",justifyContent:"center",flex:"none"},Ng={display:"flex",flexDirection:"column",gap:"2px",minWidth:"0"},Ug={fontSize:"14px",fontWeight:"500",lineHeight:"20px"},Fg={fontSize:"12px",lineHeight:"18px",color:"var(--dsw-alias-label-tertiary, #6b7280)"},Og={boxSizing:"border-box",position:"relative",flex:"1 1 auto",minWidth:"0",minHeight:"0",display:"flex",flexDirection:"column",overflow:"hidden",background:"var(--dsw-alias-bg-base, #0d1117)"},Bg={boxSizing:"border-box",display:"flex",alignItems:"center",gap:"8px",flex:"0 0 auto",padding:"8px 12px",borderBottom:"1px solid var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.24))",color:"var(--dsw-alias-label-primary, #e6edf3)",fontSize:"13px",fontWeight:"600"},zg={flex:"1 1 auto",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},kg={flex:"none",display:"inline-flex",alignItems:"center",justifyContent:"center",width:"22px",height:"22px",padding:"0",border:"none",borderRadius:"6px",background:"transparent",color:"inherit",cursor:"pointer",font:"inherit",fontSize:"13px",lineHeight:"1"},Hg={position:"relative",flex:"1 1 auto",minHeight:"0",overflow:"hidden"},Vg={boxShadow:"inset 0 0 0 1.5px var(--dsw-alias-brand-primary, #539CFA)"};function Gg(){return typeof globalThis>"u"?void 0:globalThis}function pn(i,e){if(!(!i||!i.style))for(let t of Object.keys(e))i.style[t]=e[t]}function cd(i){return i?typeof i.isConnected=="boolean"?i.isConnected:i.parentElement!==null&&i.parentElement!==void 0:!1}function Wg(i){let e=i.querySelector(cc);if(!e||typeof e.cloneNode!="function")return;let t;try{t=e.cloneNode(!0)}catch{return}if(!t||typeof t.querySelector!="function")return;for(let o of[...t.children??[]]){let a=String(o?.className??"");if(!/entryIcon|entryText/.test(a))try{o.remove?.()}catch{}}let n=t.querySelector('[class*="entryIcon"]');n&&(n.innerHTML=dd);let s=t.querySelector('[class*="entryTitle"]');s&&(s.textContent=Wo);let r=t.querySelector('[class*="entryDescription"]');return r&&(r.textContent=hd),t.removeAttribute?.("data-sidebar-right-guide-entry"),t.removeAttribute?.("aria-keyshortcuts"),typeof t.className=="string"&&!t.className.includes("entry")&&(t.className="dsh-ursim-twin-right-entry"),t}function Xg(i){let e=i.createElement("button");e.setAttribute("type","button"),typeof e.className=="string"&&(e.className="dsh-ursim-twin-right-entry"),pn(e,Lg);let t=i.createElement("span");t.setAttribute("aria-hidden","true"),t.innerHTML=dd,pn(t,Dg);let n=i.createElement("span");pn(n,Ng);let s=i.createElement("span");s.textContent=Wo,pn(s,Ug);let r=i.createElement("span");return r.textContent=hd,pn(r,Fg),n.appendChild(s),n.appendChild(r),e.appendChild(t),e.appendChild(n),e}function Yg(i){let e=Wg(i),t=e??Xg(i);return t.setAttribute(ud,""),t.setAttribute("data-dsh-plugin","ur-digital-twin"),t.setAttribute("aria-label",Wo),t.setAttribute("title",Wo),t.setAttribute("aria-pressed","false"),{element:t,cloned:e!==void 0}}function fd({doc:i=Gg()?.document,onToggle:e,mountPanel:t,MutationObserver:n,raf:s,caf:r}={}){if(!i||typeof i.createElement!="function"||typeof i.querySelector!="function")return{dispose(){},isActive:()=>!1,toggle(){},setActive(){}};let o={MutationObserver:n,raf:s,caf:r},a=!1,c=!1,l,u=!1,h,d,f,g,x,m=()=>{},p=()=>i.querySelector(Eg),w=()=>{if(a)return;let W=p();if(!W||typeof W.appendChild!="function")return;let Z=i.querySelector(cc),$=Z!==null&&typeof Z.cloneNode=="function",ne=l!==void 0&&!u&&$;if(!(l!==void 0&&cd(l)&&!ne)){if(ne){try{l.removeEventListener?.("click",F)}catch{}try{l.remove?.()}catch{}l=void 0}if(l===void 0){let ce=Yg(i);l=ce.element,u=ce.cloned,l.addEventListener("click",F)}b(),W.appendChild(l)}},T=()=>{let W=p();!W||g===W||(v(),g=W,x=W.style?.display??"",pn(W,{display:"none"}))},v=()=>{g&&(pn(g,{display:x??""}),g=void 0,x=void 0)},E=()=>{let W=p();if(!W||typeof W.closest!="function")return;let Z;try{Z=W.closest(Ag)}catch{return}return Z&&typeof Z.appendChild=="function"?Z:void 0},A=()=>{let W=i.createElement("div");W.setAttribute(Rg,""),W.setAttribute("data-dsh-plugin","ur-digital-twin"),pn(W,Og);let Z=i.createElement("div");pn(Z,Bg);let $=i.createElement("span");$.textContent=Pg,pn($,zg);let ne=i.createElement("button");ne.setAttribute("type","button"),ne.setAttribute(Cg,""),ne.setAttribute("aria-label",Er.dockCollapse),ne.setAttribute("title",Er.dockCollapse),ne.textContent="\u2715",pn(ne,kg),ne.addEventListener("click",X),Z.appendChild($),Z.appendChild(ne);let ce=i.createElement("div");return ce.setAttribute(Ig,""),pn(ce,Hg),W.appendChild(Z),W.appendChild(ce),d=ce,W},R=()=>{if(f){try{f.dispose?.()}catch{}f=void 0}if(h){try{h.remove?.()}catch{}h=void 0}d=void 0,v()},L=()=>{if(!(a||!c)){if(h&&!cd(h)&&R(),!h){let W=E();if(!W)return;h=A(),W.appendChild(h),T()}if(T(),!(f||typeof t!="function"||!d))try{f=t(d)??void 0}catch{f=void 0}}},b=()=>{l&&(l.setAttribute("aria-pressed",c?"true":"false"),c?l.setAttribute("data-active",""):l.removeAttribute("data-active"),pn(l,c?Vg:{boxShadow:""}))},_=W=>{if(a)return;let Z=W===!0;if(Z===c){Z&&L();return}if(c=Z,b(),c?L():R(),typeof e=="function")try{e(c)}catch{}},C=()=>_(!c);function F(W){W?.preventDefault?.(),C()}function X(W){W?.preventDefault?.(),_(!1)}let q=W=>{if(a||!c)return;let Z=W?.target;if(!Z||typeof Z.closest!="function"||Z===l||l?.contains?.(Z))return;let $=null;try{$=Z.closest(cc)}catch{$=null}$&&_(!1)},J=()=>{a||(w(),c&&(p()===null||p()===void 0?_(!1):L()))};return i.addEventListener?.("click",q,!0),m=ad(i,o,J),w(),{isActive:()=>c,toggle:C,setActive:_,dispose(){if(!a){a=!0;try{m()}catch{}m=()=>{};try{i.removeEventListener?.("click",q,!0)}catch{}try{l?.removeEventListener?.("click",F)}catch{}R();try{l?.remove?.()}catch{}l=void 0,c=!1}}}}var Oi={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},Bi={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},Qd=0,Jc=1,ef=2;var Kc=1,tf=2,ti=3,On=0,Ot=1,tn=2,vi=0,Ji=1,Zc=2,Qc=3,eu=4,nf=5,Li=100,sf=101,rf=102,of=103,af=104,lf=200,cf=201,uf=202,hf=203,va=204,ba=205,df=206,ff=207,pf=208,mf=209,gf=210,_f=211,xf=212,yf=213,vf=214,Ha=0,Va=1,Ga=2,Ki=3,Wa=4,Xa=5,Ya=6,qa=7,$a=0,bf=1,Sf=2,bi=0,Mf=1,Tf=2,wf=3,ja=4,Ef=5,Af=6,Rf=7,zc="attached",Cf="detached",tu=300,us=301,hs=302,Ja=303,Ka=304,xo=306,Di=1e3,Yn=1001,Ys=1002,qt=1003,Za=1004;var ds=1005;var on=1006,sr=1007;var kn=1008;var Hn=1009,nu=1010,iu=1011,rr=1012,Qa=1013,zi=1014,En=1015,or=1016,el=1017,tl=1018,ar=1020,su=35902,ru=35899,ou=1021,au=1022,_n=1023,qs=1026,lr=1027,nl=1028,il=1029,lu=1030,sl=1031;var rl=1033,yo=33776,vo=33777,bo=33778,So=33779,ol=35840,al=35841,ll=35842,cl=35843,ul=36196,hl=37492,dl=37496,fl=37808,pl=37809,ml=37810,gl=37811,_l=37812,xl=37813,yl=37814,vl=37815,bl=37816,Sl=37817,Ml=37818,Tl=37819,wl=37820,El=37821,Al=36492,Rl=36494,Cl=36495,Il=36283,Pl=36284,Ll=36285,Dl=36286;var Zi=2300,Qi=2301,ya=2302,kc=2400,Hc=2401,Vc=2402,If=2500;var cu=0,Mo=1,cr=2,Pf=3200,Lf=3201;var Nl=0,Df=1,Si="",Ut="srgb",$t="srgb-linear",kr="linear",vt="srgb";var ji=7680;var Gc=519,Nf=512,Uf=513,Ff=514,uu=515,Of=516,Bf=517,zf=518,kf=519,Sa=35044,Ul=35048;var hu="300 es",Un=2e3,Hr=2001;var $n=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){let n=this._listeners;return n===void 0?!1:n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){let n=this._listeners;if(n===void 0)return;let s=n[e];if(s!==void 0){let r=s.indexOf(t);r!==-1&&s.splice(r,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let n=t[e.type];if(n!==void 0){e.target=this;let s=n.slice(0);for(let r=0,o=s.length;r<o;r++)s[r].call(this,e);e.target=null}}},Jt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],pd=1234567,Br=Math.PI/180,es=180/Math.PI;function Fn(){let i=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Jt[i&255]+Jt[i>>8&255]+Jt[i>>16&255]+Jt[i>>24&255]+"-"+Jt[e&255]+Jt[e>>8&255]+"-"+Jt[e>>16&15|64]+Jt[e>>24&255]+"-"+Jt[t&63|128]+Jt[t>>8&255]+"-"+Jt[t>>16&255]+Jt[t>>24&255]+Jt[n&255]+Jt[n>>8&255]+Jt[n>>16&255]+Jt[n>>24&255]).toLowerCase()}function Qe(i,e,t){return Math.max(e,Math.min(t,i))}function du(i,e){return(i%e+e)%e}function qg(i,e,t,n,s){return n+(i-e)*(s-n)/(t-e)}function $g(i,e,t){return i!==e?(t-i)/(e-i):0}function zr(i,e,t){return(1-t)*i+t*e}function jg(i,e,t,n){return zr(i,e,1-Math.exp(-t*n))}function Jg(i,e=1){return e-Math.abs(du(i,e*2)-e)}function Kg(i,e,t){return i<=e?0:i>=t?1:(i=(i-e)/(t-e),i*i*(3-2*i))}function Zg(i,e,t){return i<=e?0:i>=t?1:(i=(i-e)/(t-e),i*i*i*(i*(i*6-15)+10))}function Qg(i,e){return i+Math.floor(Math.random()*(e-i+1))}function e0(i,e){return i+Math.random()*(e-i)}function t0(i){return i*(.5-Math.random())}function n0(i){i!==void 0&&(pd=i);let e=pd+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function i0(i){return i*Br}function s0(i){return i*es}function r0(i){return(i&i-1)===0&&i!==0}function o0(i){return Math.pow(2,Math.ceil(Math.log(i)/Math.LN2))}function a0(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function l0(i,e,t,n,s){let r=Math.cos,o=Math.sin,a=r(t/2),c=o(t/2),l=r((e+n)/2),u=o((e+n)/2),h=r((e-n)/2),d=o((e-n)/2),f=r((n-e)/2),g=o((n-e)/2);switch(s){case"XYX":i.set(a*u,c*h,c*d,a*l);break;case"YZY":i.set(c*d,a*u,c*h,a*l);break;case"ZXZ":i.set(c*h,c*d,a*u,a*l);break;case"XZX":i.set(a*u,c*g,c*f,a*l);break;case"YXY":i.set(c*f,a*u,c*g,a*l);break;case"ZYZ":i.set(c*g,c*f,a*u,a*l);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+s)}}function Nn(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function yt(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}var To={DEG2RAD:Br,RAD2DEG:es,generateUUID:Fn,clamp:Qe,euclideanModulo:du,mapLinear:qg,inverseLerp:$g,lerp:zr,damp:jg,pingpong:Jg,smoothstep:Kg,smootherstep:Zg,randInt:Qg,randFloat:e0,randFloatSpread:t0,seededRandom:n0,degToRad:i0,radToDeg:s0,isPowerOfTwo:r0,ceilPowerOfTwo:o0,floorPowerOfTwo:a0,setQuaternionFromProperEuler:l0,normalize:yt,denormalize:Nn},De=class i{constructor(e=0,t=0){i.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,s=e.elements;return this.x=s[0]*t+s[3]*n+s[6],this.y=s[1]*t+s[4]*n+s[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Qe(this.x,e.x,t.x),this.y=Qe(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=Qe(this.x,e,t),this.y=Qe(this.y,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Qe(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(Qe(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),s=Math.sin(t),r=this.x-e.x,o=this.y-e.y;return this.x=r*n-o*s+e.x,this.y=r*s+o*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},an=class{constructor(e=0,t=0,n=0,s=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=s}static slerpFlat(e,t,n,s,r,o,a){let c=n[s+0],l=n[s+1],u=n[s+2],h=n[s+3],d=r[o+0],f=r[o+1],g=r[o+2],x=r[o+3];if(a===0){e[t+0]=c,e[t+1]=l,e[t+2]=u,e[t+3]=h;return}if(a===1){e[t+0]=d,e[t+1]=f,e[t+2]=g,e[t+3]=x;return}if(h!==x||c!==d||l!==f||u!==g){let m=1-a,p=c*d+l*f+u*g+h*x,w=p>=0?1:-1,T=1-p*p;if(T>Number.EPSILON){let E=Math.sqrt(T),A=Math.atan2(E,p*w);m=Math.sin(m*A)/E,a=Math.sin(a*A)/E}let v=a*w;if(c=c*m+d*v,l=l*m+f*v,u=u*m+g*v,h=h*m+x*v,m===1-a){let E=1/Math.sqrt(c*c+l*l+u*u+h*h);c*=E,l*=E,u*=E,h*=E}}e[t]=c,e[t+1]=l,e[t+2]=u,e[t+3]=h}static multiplyQuaternionsFlat(e,t,n,s,r,o){let a=n[s],c=n[s+1],l=n[s+2],u=n[s+3],h=r[o],d=r[o+1],f=r[o+2],g=r[o+3];return e[t]=a*g+u*h+c*f-l*d,e[t+1]=c*g+u*d+l*h-a*f,e[t+2]=l*g+u*f+a*d-c*h,e[t+3]=u*g-a*h-c*d-l*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,s){return this._x=e,this._y=t,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,s=e._y,r=e._z,o=e._order,a=Math.cos,c=Math.sin,l=a(n/2),u=a(s/2),h=a(r/2),d=c(n/2),f=c(s/2),g=c(r/2);switch(o){case"XYZ":this._x=d*u*h+l*f*g,this._y=l*f*h-d*u*g,this._z=l*u*g+d*f*h,this._w=l*u*h-d*f*g;break;case"YXZ":this._x=d*u*h+l*f*g,this._y=l*f*h-d*u*g,this._z=l*u*g-d*f*h,this._w=l*u*h+d*f*g;break;case"ZXY":this._x=d*u*h-l*f*g,this._y=l*f*h+d*u*g,this._z=l*u*g+d*f*h,this._w=l*u*h-d*f*g;break;case"ZYX":this._x=d*u*h-l*f*g,this._y=l*f*h+d*u*g,this._z=l*u*g-d*f*h,this._w=l*u*h+d*f*g;break;case"YZX":this._x=d*u*h+l*f*g,this._y=l*f*h+d*u*g,this._z=l*u*g-d*f*h,this._w=l*u*h-d*f*g;break;case"XZY":this._x=d*u*h-l*f*g,this._y=l*f*h-d*u*g,this._z=l*u*g+d*f*h,this._w=l*u*h+d*f*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,s=Math.sin(n);return this._x=e.x*s,this._y=e.y*s,this._z=e.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],s=t[4],r=t[8],o=t[1],a=t[5],c=t[9],l=t[2],u=t[6],h=t[10],d=n+a+h;if(d>0){let f=.5/Math.sqrt(d+1);this._w=.25/f,this._x=(u-c)*f,this._y=(r-l)*f,this._z=(o-s)*f}else if(n>a&&n>h){let f=2*Math.sqrt(1+n-a-h);this._w=(u-c)/f,this._x=.25*f,this._y=(s+o)/f,this._z=(r+l)/f}else if(a>h){let f=2*Math.sqrt(1+a-n-h);this._w=(r-l)/f,this._x=(s+o)/f,this._y=.25*f,this._z=(c+u)/f}else{let f=2*Math.sqrt(1+h-n-a);this._w=(o-s)/f,this._x=(r+l)/f,this._y=(c+u)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Qe(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let s=Math.min(1,t/n);return this.slerp(e,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,s=e._y,r=e._z,o=e._w,a=t._x,c=t._y,l=t._z,u=t._w;return this._x=n*u+o*a+s*l-r*c,this._y=s*u+o*c+r*a-n*l,this._z=r*u+o*l+n*c-s*a,this._w=o*u-n*a-s*c-r*l,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);let n=this._x,s=this._y,r=this._z,o=this._w,a=o*e._w+n*e._x+s*e._y+r*e._z;if(a<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,a=-a):this.copy(e),a>=1)return this._w=o,this._x=n,this._y=s,this._z=r,this;let c=1-a*a;if(c<=Number.EPSILON){let f=1-t;return this._w=f*o+t*this._w,this._x=f*n+t*this._x,this._y=f*s+t*this._y,this._z=f*r+t*this._z,this.normalize(),this}let l=Math.sqrt(c),u=Math.atan2(l,a),h=Math.sin((1-t)*u)/l,d=Math.sin(t*u)/l;return this._w=o*h+this._w*d,this._x=n*h+this._x*d,this._y=s*h+this._y*d,this._z=r*h+this._z*d,this._onChangeCallback(),this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(e),s*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},D=class i{constructor(e=0,t=0,n=0){i.prototype.isVector3=!0,this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(md.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(md.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6]*s,this.y=r[1]*t+r[4]*n+r[7]*s,this.z=r[2]*t+r[5]*n+r[8]*s,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,s=this.z,r=e.elements,o=1/(r[3]*t+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*t+r[4]*n+r[8]*s+r[12])*o,this.y=(r[1]*t+r[5]*n+r[9]*s+r[13])*o,this.z=(r[2]*t+r[6]*n+r[10]*s+r[14])*o,this}applyQuaternion(e){let t=this.x,n=this.y,s=this.z,r=e.x,o=e.y,a=e.z,c=e.w,l=2*(o*s-a*n),u=2*(a*t-r*s),h=2*(r*n-o*t);return this.x=t+c*l+o*h-a*u,this.y=n+c*u+a*l-r*h,this.z=s+c*h+r*u-o*l,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[4]*n+r[8]*s,this.y=r[1]*t+r[5]*n+r[9]*s,this.z=r[2]*t+r[6]*n+r[10]*s,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Qe(this.x,e.x,t.x),this.y=Qe(this.y,e.y,t.y),this.z=Qe(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=Qe(this.x,e,t),this.y=Qe(this.y,e,t),this.z=Qe(this.z,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Qe(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,s=e.y,r=e.z,o=t.x,a=t.y,c=t.z;return this.x=s*c-r*a,this.y=r*o-n*c,this.z=n*a-s*o,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return uc.copy(this).projectOnVector(e),this.sub(uc)}reflect(e){return this.sub(uc.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(Qe(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,s=this.z-e.z;return t*t+n*n+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let s=Math.sin(t)*e;return this.x=s*Math.sin(n),this.y=Math.cos(t)*e,this.z=s*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),s=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=s,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},uc=new D,md=new an,Je=class i{constructor(e,t,n,s,r,o,a,c,l){i.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,o,a,c,l)}set(e,t,n,s,r,o,a,c,l){let u=this.elements;return u[0]=e,u[1]=s,u[2]=a,u[3]=t,u[4]=r,u[5]=c,u[6]=n,u[7]=o,u[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,s=t.elements,r=this.elements,o=n[0],a=n[3],c=n[6],l=n[1],u=n[4],h=n[7],d=n[2],f=n[5],g=n[8],x=s[0],m=s[3],p=s[6],w=s[1],T=s[4],v=s[7],E=s[2],A=s[5],R=s[8];return r[0]=o*x+a*w+c*E,r[3]=o*m+a*T+c*A,r[6]=o*p+a*v+c*R,r[1]=l*x+u*w+h*E,r[4]=l*m+u*T+h*A,r[7]=l*p+u*v+h*R,r[2]=d*x+f*w+g*E,r[5]=d*m+f*T+g*A,r[8]=d*p+f*v+g*R,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],o=e[4],a=e[5],c=e[6],l=e[7],u=e[8];return t*o*u-t*a*l-n*r*u+n*a*c+s*r*l-s*o*c}invert(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],o=e[4],a=e[5],c=e[6],l=e[7],u=e[8],h=u*o-a*l,d=a*c-u*r,f=l*r-o*c,g=t*h+n*d+s*f;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);let x=1/g;return e[0]=h*x,e[1]=(s*l-u*n)*x,e[2]=(a*n-s*o)*x,e[3]=d*x,e[4]=(u*t-s*c)*x,e[5]=(s*r-a*t)*x,e[6]=f*x,e[7]=(n*c-l*t)*x,e[8]=(o*t-n*r)*x,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,s,r,o,a){let c=Math.cos(r),l=Math.sin(r);return this.set(n*c,n*l,-n*(c*o+l*a)+o+e,-s*l,s*c,-s*(-l*o+c*a)+a+t,0,0,1),this}scale(e,t){return this.premultiply(hc.makeScale(e,t)),this}rotate(e){return this.premultiply(hc.makeRotation(-e)),this}translate(e,t){return this.premultiply(hc.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let s=0;s<9;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},hc=new Je;function fu(i){for(let e=i.length-1;e>=0;--e)if(i[e]>=65535)return!0;return!1}function $s(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function Hf(){let i=$s("canvas");return i.style.display="block",i}var gd={};function js(i){i in gd||(gd[i]=!0,console.warn(i))}function Vf(i,e,t){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(e,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:n()}}setTimeout(r,t)})}var _d=new Je().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),xd=new Je().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function c0(){let i={enabled:!0,workingColorSpace:$t,spaces:{},convert:function(s,r,o){return this.enabled===!1||r===o||!r||!o||(this.spaces[r].transfer===vt&&(s.r=pi(s.r),s.g=pi(s.g),s.b=pi(s.b)),this.spaces[r].primaries!==this.spaces[o].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[o].fromXYZ)),this.spaces[o].transfer===vt&&(s.r=Xs(s.r),s.g=Xs(s.g),s.b=Xs(s.b))),s},workingToColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},colorSpaceToWorking:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===Si?kr:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,o){return s.copy(this.spaces[r].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(s,r){return js("THREE.ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),i.workingToColorSpace(s,r)},toWorkingColorSpace:function(s,r){return js("THREE.ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),i.colorSpaceToWorking(s,r)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[$t]:{primaries:e,whitePoint:n,transfer:kr,toXYZ:_d,fromXYZ:xd,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:Ut},outputColorSpaceConfig:{drawingBufferColorSpace:Ut}},[Ut]:{primaries:e,whitePoint:n,transfer:vt,toXYZ:_d,fromXYZ:xd,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:Ut}}}),i}var ct=c0();function pi(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Xs(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}var As,Ma=class{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{As===void 0&&(As=$s("canvas")),As.width=e.width,As.height=e.height;let s=As.getContext("2d");e instanceof ImageData?s.putImageData(e,0,0):s.drawImage(e,0,0,e.width,e.height),n=As}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=$s("canvas");t.width=e.width,t.height=e.height;let n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);let s=n.getImageData(0,0,e.width,e.height),r=s.data;for(let o=0;o<r.length;o++)r[o]=pi(r[o]/255)*255;return n.putImageData(s,0,0),t}else if(e.data){let t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(pi(t[n]/255)*255):t[n]=pi(t[n]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},u0=0,Js=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:u0++}),this.uuid=Fn(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):t instanceof VideoFrame?e.set(t.displayHeight,t.displayWidth,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let o=0,a=s.length;o<a;o++)s[o].isDataTexture?r.push(dc(s[o].image)):r.push(dc(s[o]))}else r=dc(s);n.url=r}return t||(e.images[this.uuid]=n),n}};function dc(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?Ma.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}var h0=0,fc=new D,Ft=class i extends $n{constructor(e=i.DEFAULT_IMAGE,t=i.DEFAULT_MAPPING,n=Yn,s=Yn,r=on,o=kn,a=_n,c=Hn,l=i.DEFAULT_ANISOTROPY,u=Si){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:h0++}),this.uuid=Fn(),this.name="",this.source=new Js(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=o,this.anisotropy=l,this.format=a,this.internalFormat=null,this.type=c,this.offset=new De(0,0),this.repeat=new De(1,1),this.center=new De(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Je,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0}get width(){return this.source.getSize(fc).x}get height(){return this.source.getSize(fc).y}get depth(){return this.source.getSize(fc).z}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let n=e[t];if(n===void 0){console.warn(`THREE.Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){console.warn(`THREE.Texture.setValues(): property '${t}' does not exist.`);continue}s&&n&&s.isVector2&&n.isVector2||s&&n&&s.isVector3&&n.isVector3||s&&n&&s.isMatrix3&&n.isMatrix3?s.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==tu)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Di:e.x=e.x-Math.floor(e.x);break;case Yn:e.x=e.x<0?0:1;break;case Ys:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case Di:e.y=e.y-Math.floor(e.y);break;case Yn:e.y=e.y<0?0:1;break;case Ys:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};Ft.DEFAULT_IMAGE=null;Ft.DEFAULT_MAPPING=tu;Ft.DEFAULT_ANISOTROPY=1;var dt=class i{constructor(e=0,t=0,n=0,s=1){i.prototype.isVector4=!0,this.x=e,this.y=t,this.z=n,this.w=s}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,s){return this.x=e,this.y=t,this.z=n,this.w=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,s=this.z,r=this.w,o=e.elements;return this.x=o[0]*t+o[4]*n+o[8]*s+o[12]*r,this.y=o[1]*t+o[5]*n+o[9]*s+o[13]*r,this.z=o[2]*t+o[6]*n+o[10]*s+o[14]*r,this.w=o[3]*t+o[7]*n+o[11]*s+o[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,s,r,c=e.elements,l=c[0],u=c[4],h=c[8],d=c[1],f=c[5],g=c[9],x=c[2],m=c[6],p=c[10];if(Math.abs(u-d)<.01&&Math.abs(h-x)<.01&&Math.abs(g-m)<.01){if(Math.abs(u+d)<.1&&Math.abs(h+x)<.1&&Math.abs(g+m)<.1&&Math.abs(l+f+p-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let T=(l+1)/2,v=(f+1)/2,E=(p+1)/2,A=(u+d)/4,R=(h+x)/4,L=(g+m)/4;return T>v&&T>E?T<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(T),s=A/n,r=R/n):v>E?v<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(v),n=A/s,r=L/s):E<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(E),n=R/r,s=L/r),this.set(n,s,r,t),this}let w=Math.sqrt((m-g)*(m-g)+(h-x)*(h-x)+(d-u)*(d-u));return Math.abs(w)<.001&&(w=1),this.x=(m-g)/w,this.y=(h-x)/w,this.z=(d-u)/w,this.w=Math.acos((l+f+p-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Qe(this.x,e.x,t.x),this.y=Qe(this.y,e.y,t.y),this.z=Qe(this.z,e.z,t.z),this.w=Qe(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=Qe(this.x,e,t),this.y=Qe(this.y,e,t),this.z=Qe(this.z,e,t),this.w=Qe(this.w,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Qe(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Ta=class extends $n{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:on,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new dt(0,0,e,t),this.scissorTest=!1,this.viewport=new dt(0,0,e,t);let s={width:e,height:t,depth:n.depth},r=new Ft(s);this.textures=[];let o=n.count;for(let a=0;a<o;a++)this.textures[a]=r.clone(),this.textures[a].isRenderTargetTexture=!0,this.textures[a].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview}_setTextureOptions(e={}){let t={minFilter:on,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),e!==null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=e,this.textures[s].image.height=t,this.textures[s].image.depth=n,this.textures[s].isArrayTexture=this.textures[s].image.depth>1;this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let s=Object.assign({},e.textures[t].image);this.textures[t].source=new Js(s)}return this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},jn=class extends Ta{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},Vr=class extends Ft{constructor(e=null,t=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=qt,this.minFilter=qt,this.wrapR=Yn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var wa=class extends Ft{constructor(e=null,t=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=qt,this.minFilter=qt,this.wrapR=Yn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var ln=class{constructor(e=new D(1/0,1/0,1/0),t=new D(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(Pn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(Pn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=Pn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let o=0,a=r.count;o<a;o++)e.isMesh===!0?e.getVertexPosition(o,Pn):Pn.fromBufferAttribute(r,o),Pn.applyMatrix4(e.matrixWorld),this.expandByPoint(Pn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Xo.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Xo.copy(n.boundingBox)),Xo.applyMatrix4(e.matrixWorld),this.union(Xo)}let s=e.children;for(let r=0,o=s.length;r<o;r++)this.expandByObject(s[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Pn),Pn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Ar),Yo.subVectors(this.max,Ar),Rs.subVectors(e.a,Ar),Cs.subVectors(e.b,Ar),Is.subVectors(e.c,Ar),Ei.subVectors(Cs,Rs),Ai.subVectors(Is,Cs),Xi.subVectors(Rs,Is);let t=[0,-Ei.z,Ei.y,0,-Ai.z,Ai.y,0,-Xi.z,Xi.y,Ei.z,0,-Ei.x,Ai.z,0,-Ai.x,Xi.z,0,-Xi.x,-Ei.y,Ei.x,0,-Ai.y,Ai.x,0,-Xi.y,Xi.x,0];return!pc(t,Rs,Cs,Is,Yo)||(t=[1,0,0,0,1,0,0,0,1],!pc(t,Rs,Cs,Is,Yo))?!1:(qo.crossVectors(Ei,Ai),t=[qo.x,qo.y,qo.z],pc(t,Rs,Cs,Is,Yo))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Pn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Pn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(ai[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),ai[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),ai[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),ai[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),ai[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),ai[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),ai[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),ai[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(ai),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},ai=[new D,new D,new D,new D,new D,new D,new D,new D],Pn=new D,Xo=new ln,Rs=new D,Cs=new D,Is=new D,Ei=new D,Ai=new D,Xi=new D,Ar=new D,Yo=new D,qo=new D,Yi=new D;function pc(i,e,t,n,s){for(let r=0,o=i.length-3;r<=o;r+=3){Yi.fromArray(i,r);let a=s.x*Math.abs(Yi.x)+s.y*Math.abs(Yi.y)+s.z*Math.abs(Yi.z),c=e.dot(Yi),l=t.dot(Yi),u=n.dot(Yi);if(Math.max(-Math.max(c,l,u),Math.min(c,l,u))>a)return!1}return!0}var d0=new ln,Rr=new D,mc=new D,Zt=class{constructor(e=new D,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t!==void 0?n.copy(t):d0.setFromPoints(e).getCenter(n);let s=0;for(let r=0,o=e.length;r<o;r++)s=Math.max(s,n.distanceToSquared(e[r]));return this.radius=Math.sqrt(s),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Rr.subVectors(e,this.center);let t=Rr.lengthSq();if(t>this.radius*this.radius){let n=Math.sqrt(t),s=(n-this.radius)*.5;this.center.addScaledVector(Rr,s/n),this.radius+=s}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(mc.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Rr.copy(e.center).add(mc)),this.expandByPoint(Rr.copy(e.center).sub(mc))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},li=new D,gc=new D,$o=new D,Ri=new D,_c=new D,jo=new D,xc=new D,mi=class{constructor(e=new D,t=new D(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,li)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=li.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(li.copy(this.origin).addScaledVector(this.direction,t),li.distanceToSquared(e))}distanceSqToSegment(e,t,n,s){gc.copy(e).add(t).multiplyScalar(.5),$o.copy(t).sub(e).normalize(),Ri.copy(this.origin).sub(gc);let r=e.distanceTo(t)*.5,o=-this.direction.dot($o),a=Ri.dot(this.direction),c=-Ri.dot($o),l=Ri.lengthSq(),u=Math.abs(1-o*o),h,d,f,g;if(u>0)if(h=o*c-a,d=o*a-c,g=r*u,h>=0)if(d>=-g)if(d<=g){let x=1/u;h*=x,d*=x,f=h*(h+o*d+2*a)+d*(o*h+d+2*c)+l}else d=r,h=Math.max(0,-(o*d+a)),f=-h*h+d*(d+2*c)+l;else d=-r,h=Math.max(0,-(o*d+a)),f=-h*h+d*(d+2*c)+l;else d<=-g?(h=Math.max(0,-(-o*r+a)),d=h>0?-r:Math.min(Math.max(-r,-c),r),f=-h*h+d*(d+2*c)+l):d<=g?(h=0,d=Math.min(Math.max(-r,-c),r),f=d*(d+2*c)+l):(h=Math.max(0,-(o*r+a)),d=h>0?r:Math.min(Math.max(-r,-c),r),f=-h*h+d*(d+2*c)+l);else d=o>0?-r:r,h=Math.max(0,-(o*d+a)),f=-h*h+d*(d+2*c)+l;return n&&n.copy(this.origin).addScaledVector(this.direction,h),s&&s.copy(gc).addScaledVector($o,d),f}intersectSphere(e,t){li.subVectors(e.center,this.origin);let n=li.dot(this.direction),s=li.dot(li)-n*n,r=e.radius*e.radius;if(s>r)return null;let o=Math.sqrt(r-s),a=n-o,c=n+o;return c<0?null:a<0?this.at(c,t):this.at(a,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,s,r,o,a,c,l=1/this.direction.x,u=1/this.direction.y,h=1/this.direction.z,d=this.origin;return l>=0?(n=(e.min.x-d.x)*l,s=(e.max.x-d.x)*l):(n=(e.max.x-d.x)*l,s=(e.min.x-d.x)*l),u>=0?(r=(e.min.y-d.y)*u,o=(e.max.y-d.y)*u):(r=(e.max.y-d.y)*u,o=(e.min.y-d.y)*u),n>o||r>s||((r>n||isNaN(n))&&(n=r),(o<s||isNaN(s))&&(s=o),h>=0?(a=(e.min.z-d.z)*h,c=(e.max.z-d.z)*h):(a=(e.max.z-d.z)*h,c=(e.min.z-d.z)*h),n>c||a>s)||((a>n||n!==n)&&(n=a),(c<s||s!==s)&&(s=c),s<0)?null:this.at(n>=0?n:s,t)}intersectsBox(e){return this.intersectBox(e,li)!==null}intersectTriangle(e,t,n,s,r){_c.subVectors(t,e),jo.subVectors(n,e),xc.crossVectors(_c,jo);let o=this.direction.dot(xc),a;if(o>0){if(s)return null;a=1}else if(o<0)a=-1,o=-o;else return null;Ri.subVectors(this.origin,e);let c=a*this.direction.dot(jo.crossVectors(Ri,jo));if(c<0)return null;let l=a*this.direction.dot(_c.cross(Ri));if(l<0||c+l>o)return null;let u=-a*Ri.dot(xc);return u<0?null:this.at(u/o,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},je=class i{constructor(e,t,n,s,r,o,a,c,l,u,h,d,f,g,x,m){i.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,o,a,c,l,u,h,d,f,g,x,m)}set(e,t,n,s,r,o,a,c,l,u,h,d,f,g,x,m){let p=this.elements;return p[0]=e,p[4]=t,p[8]=n,p[12]=s,p[1]=r,p[5]=o,p[9]=a,p[13]=c,p[2]=l,p[6]=u,p[10]=h,p[14]=d,p[3]=f,p[7]=g,p[11]=x,p[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new i().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){let t=this.elements,n=e.elements,s=1/Ps.setFromMatrixColumn(e,0).length(),r=1/Ps.setFromMatrixColumn(e,1).length(),o=1/Ps.setFromMatrixColumn(e,2).length();return t[0]=n[0]*s,t[1]=n[1]*s,t[2]=n[2]*s,t[3]=0,t[4]=n[4]*r,t[5]=n[5]*r,t[6]=n[6]*r,t[7]=0,t[8]=n[8]*o,t[9]=n[9]*o,t[10]=n[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,s=e.y,r=e.z,o=Math.cos(n),a=Math.sin(n),c=Math.cos(s),l=Math.sin(s),u=Math.cos(r),h=Math.sin(r);if(e.order==="XYZ"){let d=o*u,f=o*h,g=a*u,x=a*h;t[0]=c*u,t[4]=-c*h,t[8]=l,t[1]=f+g*l,t[5]=d-x*l,t[9]=-a*c,t[2]=x-d*l,t[6]=g+f*l,t[10]=o*c}else if(e.order==="YXZ"){let d=c*u,f=c*h,g=l*u,x=l*h;t[0]=d+x*a,t[4]=g*a-f,t[8]=o*l,t[1]=o*h,t[5]=o*u,t[9]=-a,t[2]=f*a-g,t[6]=x+d*a,t[10]=o*c}else if(e.order==="ZXY"){let d=c*u,f=c*h,g=l*u,x=l*h;t[0]=d-x*a,t[4]=-o*h,t[8]=g+f*a,t[1]=f+g*a,t[5]=o*u,t[9]=x-d*a,t[2]=-o*l,t[6]=a,t[10]=o*c}else if(e.order==="ZYX"){let d=o*u,f=o*h,g=a*u,x=a*h;t[0]=c*u,t[4]=g*l-f,t[8]=d*l+x,t[1]=c*h,t[5]=x*l+d,t[9]=f*l-g,t[2]=-l,t[6]=a*c,t[10]=o*c}else if(e.order==="YZX"){let d=o*c,f=o*l,g=a*c,x=a*l;t[0]=c*u,t[4]=x-d*h,t[8]=g*h+f,t[1]=h,t[5]=o*u,t[9]=-a*u,t[2]=-l*u,t[6]=f*h+g,t[10]=d-x*h}else if(e.order==="XZY"){let d=o*c,f=o*l,g=a*c,x=a*l;t[0]=c*u,t[4]=-h,t[8]=l*u,t[1]=d*h+x,t[5]=o*u,t[9]=f*h-g,t[2]=g*h-f,t[6]=a*u,t[10]=x*h+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(f0,e,p0)}lookAt(e,t,n){let s=this.elements;return mn.subVectors(e,t),mn.lengthSq()===0&&(mn.z=1),mn.normalize(),Ci.crossVectors(n,mn),Ci.lengthSq()===0&&(Math.abs(n.z)===1?mn.x+=1e-4:mn.z+=1e-4,mn.normalize(),Ci.crossVectors(n,mn)),Ci.normalize(),Jo.crossVectors(mn,Ci),s[0]=Ci.x,s[4]=Jo.x,s[8]=mn.x,s[1]=Ci.y,s[5]=Jo.y,s[9]=mn.y,s[2]=Ci.z,s[6]=Jo.z,s[10]=mn.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,s=t.elements,r=this.elements,o=n[0],a=n[4],c=n[8],l=n[12],u=n[1],h=n[5],d=n[9],f=n[13],g=n[2],x=n[6],m=n[10],p=n[14],w=n[3],T=n[7],v=n[11],E=n[15],A=s[0],R=s[4],L=s[8],b=s[12],_=s[1],C=s[5],F=s[9],X=s[13],q=s[2],J=s[6],W=s[10],Z=s[14],$=s[3],ne=s[7],ce=s[11],Re=s[15];return r[0]=o*A+a*_+c*q+l*$,r[4]=o*R+a*C+c*J+l*ne,r[8]=o*L+a*F+c*W+l*ce,r[12]=o*b+a*X+c*Z+l*Re,r[1]=u*A+h*_+d*q+f*$,r[5]=u*R+h*C+d*J+f*ne,r[9]=u*L+h*F+d*W+f*ce,r[13]=u*b+h*X+d*Z+f*Re,r[2]=g*A+x*_+m*q+p*$,r[6]=g*R+x*C+m*J+p*ne,r[10]=g*L+x*F+m*W+p*ce,r[14]=g*b+x*X+m*Z+p*Re,r[3]=w*A+T*_+v*q+E*$,r[7]=w*R+T*C+v*J+E*ne,r[11]=w*L+T*F+v*W+E*ce,r[15]=w*b+T*X+v*Z+E*Re,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],s=e[8],r=e[12],o=e[1],a=e[5],c=e[9],l=e[13],u=e[2],h=e[6],d=e[10],f=e[14],g=e[3],x=e[7],m=e[11],p=e[15];return g*(+r*c*h-s*l*h-r*a*d+n*l*d+s*a*f-n*c*f)+x*(+t*c*f-t*l*d+r*o*d-s*o*f+s*l*u-r*c*u)+m*(+t*l*h-t*a*f-r*o*h+n*o*f+r*a*u-n*l*u)+p*(-s*a*u-t*c*h+t*a*d+s*o*h-n*o*d+n*c*u)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let s=this.elements;return e.isVector3?(s[12]=e.x,s[13]=e.y,s[14]=e.z):(s[12]=e,s[13]=t,s[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],o=e[4],a=e[5],c=e[6],l=e[7],u=e[8],h=e[9],d=e[10],f=e[11],g=e[12],x=e[13],m=e[14],p=e[15],w=h*m*l-x*d*l+x*c*f-a*m*f-h*c*p+a*d*p,T=g*d*l-u*m*l-g*c*f+o*m*f+u*c*p-o*d*p,v=u*x*l-g*h*l+g*a*f-o*x*f-u*a*p+o*h*p,E=g*h*c-u*x*c-g*a*d+o*x*d+u*a*m-o*h*m,A=t*w+n*T+s*v+r*E;if(A===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let R=1/A;return e[0]=w*R,e[1]=(x*d*r-h*m*r-x*s*f+n*m*f+h*s*p-n*d*p)*R,e[2]=(a*m*r-x*c*r+x*s*l-n*m*l-a*s*p+n*c*p)*R,e[3]=(h*c*r-a*d*r-h*s*l+n*d*l+a*s*f-n*c*f)*R,e[4]=T*R,e[5]=(u*m*r-g*d*r+g*s*f-t*m*f-u*s*p+t*d*p)*R,e[6]=(g*c*r-o*m*r-g*s*l+t*m*l+o*s*p-t*c*p)*R,e[7]=(o*d*r-u*c*r+u*s*l-t*d*l-o*s*f+t*c*f)*R,e[8]=v*R,e[9]=(g*h*r-u*x*r-g*n*f+t*x*f+u*n*p-t*h*p)*R,e[10]=(o*x*r-g*a*r+g*n*l-t*x*l-o*n*p+t*a*p)*R,e[11]=(u*a*r-o*h*r-u*n*l+t*h*l+o*n*f-t*a*f)*R,e[12]=E*R,e[13]=(u*x*s-g*h*s+g*n*d-t*x*d-u*n*m+t*h*m)*R,e[14]=(g*a*s-o*x*s-g*n*c+t*x*c+o*n*m-t*a*m)*R,e[15]=(o*h*s-u*a*s+u*n*c-t*h*c-o*n*d+t*a*d)*R,this}scale(e){let t=this.elements,n=e.x,s=e.y,r=e.z;return t[0]*=n,t[4]*=s,t[8]*=r,t[1]*=n,t[5]*=s,t[9]*=r,t[2]*=n,t[6]*=s,t[10]*=r,t[3]*=n,t[7]*=s,t[11]*=r,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],s=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,s))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),s=Math.sin(t),r=1-n,o=e.x,a=e.y,c=e.z,l=r*o,u=r*a;return this.set(l*o+n,l*a-s*c,l*c+s*a,0,l*a+s*c,u*a+n,u*c-s*o,0,l*c-s*a,u*c+s*o,r*c*c+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,s,r,o){return this.set(1,n,r,0,e,1,o,0,t,s,1,0,0,0,0,1),this}compose(e,t,n){let s=this.elements,r=t._x,o=t._y,a=t._z,c=t._w,l=r+r,u=o+o,h=a+a,d=r*l,f=r*u,g=r*h,x=o*u,m=o*h,p=a*h,w=c*l,T=c*u,v=c*h,E=n.x,A=n.y,R=n.z;return s[0]=(1-(x+p))*E,s[1]=(f+v)*E,s[2]=(g-T)*E,s[3]=0,s[4]=(f-v)*A,s[5]=(1-(d+p))*A,s[6]=(m+w)*A,s[7]=0,s[8]=(g+T)*R,s[9]=(m-w)*R,s[10]=(1-(d+x))*R,s[11]=0,s[12]=e.x,s[13]=e.y,s[14]=e.z,s[15]=1,this}decompose(e,t,n){let s=this.elements,r=Ps.set(s[0],s[1],s[2]).length(),o=Ps.set(s[4],s[5],s[6]).length(),a=Ps.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),e.x=s[12],e.y=s[13],e.z=s[14],Ln.copy(this);let l=1/r,u=1/o,h=1/a;return Ln.elements[0]*=l,Ln.elements[1]*=l,Ln.elements[2]*=l,Ln.elements[4]*=u,Ln.elements[5]*=u,Ln.elements[6]*=u,Ln.elements[8]*=h,Ln.elements[9]*=h,Ln.elements[10]*=h,t.setFromRotationMatrix(Ln),n.x=r,n.y=o,n.z=a,this}makePerspective(e,t,n,s,r,o,a=Un,c=!1){let l=this.elements,u=2*r/(t-e),h=2*r/(n-s),d=(t+e)/(t-e),f=(n+s)/(n-s),g,x;if(c)g=r/(o-r),x=o*r/(o-r);else if(a===Un)g=-(o+r)/(o-r),x=-2*o*r/(o-r);else if(a===Hr)g=-o/(o-r),x=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return l[0]=u,l[4]=0,l[8]=d,l[12]=0,l[1]=0,l[5]=h,l[9]=f,l[13]=0,l[2]=0,l[6]=0,l[10]=g,l[14]=x,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,n,s,r,o,a=Un,c=!1){let l=this.elements,u=2/(t-e),h=2/(n-s),d=-(t+e)/(t-e),f=-(n+s)/(n-s),g,x;if(c)g=1/(o-r),x=o/(o-r);else if(a===Un)g=-2/(o-r),x=-(o+r)/(o-r);else if(a===Hr)g=-1/(o-r),x=-r/(o-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return l[0]=u,l[4]=0,l[8]=0,l[12]=d,l[1]=0,l[5]=h,l[9]=0,l[13]=f,l[2]=0,l[6]=0,l[10]=g,l[14]=x,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let s=0;s<16;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},Ps=new D,Ln=new je,f0=new D(0,0,0),p0=new D(1,1,1),Ci=new D,Jo=new D,mn=new D,yd=new je,vd=new an,wn=class i{constructor(e=0,t=0,n=0,s=i.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=s}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,s=this._order){return this._x=e,this._y=t,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let s=e.elements,r=s[0],o=s[4],a=s[8],c=s[1],l=s[5],u=s[9],h=s[2],d=s[6],f=s[10];switch(t){case"XYZ":this._y=Math.asin(Qe(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-u,f),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(d,l),this._z=0);break;case"YXZ":this._x=Math.asin(-Qe(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(a,f),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-h,r),this._z=0);break;case"ZXY":this._x=Math.asin(Qe(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-h,f),this._z=Math.atan2(-o,l)):(this._y=0,this._z=Math.atan2(c,r));break;case"ZYX":this._y=Math.asin(-Qe(h,-1,1)),Math.abs(h)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(c,r)):(this._x=0,this._z=Math.atan2(-o,l));break;case"YZX":this._z=Math.asin(Qe(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-u,l),this._y=Math.atan2(-h,r)):(this._x=0,this._y=Math.atan2(a,f));break;case"XZY":this._z=Math.asin(-Qe(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(d,l),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-u,f),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return yd.makeRotationFromQuaternion(e),this.setFromRotationMatrix(yd,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return vd.setFromEuler(this),this.setFromQuaternion(vd,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};wn.DEFAULT_ORDER="XYZ";var Gr=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},m0=0,bd=new D,Ls=new an,ci=new je,Ko=new D,Cr=new D,g0=new D,_0=new an,Sd=new D(1,0,0),Md=new D(0,1,0),Td=new D(0,0,1),wd={type:"added"},x0={type:"removed"},Ds={type:"childadded",child:null},yc={type:"childremoved",child:null},Et=class i extends $n{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:m0++}),this.uuid=Fn(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=i.DEFAULT_UP.clone();let e=new D,t=new wn,n=new an,s=new D(1,1,1);function r(){n.setFromEuler(t,!1)}function o(){t.setFromQuaternion(n,void 0,!1)}t._onChange(r),n._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new je},normalMatrix:{value:new Je}}),this.matrix=new je,this.matrixWorld=new je,this.matrixAutoUpdate=i.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=i.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Gr,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Ls.setFromAxisAngle(e,t),this.quaternion.multiply(Ls),this}rotateOnWorldAxis(e,t){return Ls.setFromAxisAngle(e,t),this.quaternion.premultiply(Ls),this}rotateX(e){return this.rotateOnAxis(Sd,e)}rotateY(e){return this.rotateOnAxis(Md,e)}rotateZ(e){return this.rotateOnAxis(Td,e)}translateOnAxis(e,t){return bd.copy(e).applyQuaternion(this.quaternion),this.position.add(bd.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Sd,e)}translateY(e){return this.translateOnAxis(Md,e)}translateZ(e){return this.translateOnAxis(Td,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(ci.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?Ko.copy(e):Ko.set(e,t,n);let s=this.parent;this.updateWorldMatrix(!0,!1),Cr.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?ci.lookAt(Cr,Ko,this.up):ci.lookAt(Ko,Cr,this.up),this.quaternion.setFromRotationMatrix(ci),s&&(ci.extractRotation(s.matrixWorld),Ls.setFromRotationMatrix(ci),this.quaternion.premultiply(Ls.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(wd),Ds.child=e,this.dispatchEvent(Ds),Ds.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(x0),yc.child=e,this.dispatchEvent(yc),yc.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),ci.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),ci.multiply(e.parent.matrixWorld)),e.applyMatrix4(ci),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(wd),Ds.child=e,this.dispatchEvent(Ds),Ds.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,s=this.children.length;n<s;n++){let o=this.children[n].getObjectByProperty(e,t);if(o!==void 0)return o}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Cr,e,g0),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Cr,_0,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t){let n=this.parent;if(e===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(e){let t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(a=>({...a,boundingBox:a.boundingBox?a.boundingBox.toJSON():void 0,boundingSphere:a.boundingSphere?a.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(a=>({...a})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(e),s.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function r(a,c){return a[c.uuid]===void 0&&(a[c.uuid]=c.toJSON(e)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(e.geometries,this.geometry);let a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){let c=a.shapes;if(Array.isArray(c))for(let l=0,u=c.length;l<u;l++){let h=c[l];r(e.shapes,h)}else r(e.shapes,c)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let a=[];for(let c=0,l=this.material.length;c<l;c++)a.push(r(e.materials,this.material[c]));s.material=a}else s.material=r(e.materials,this.material);if(this.children.length>0){s.children=[];for(let a=0;a<this.children.length;a++)s.children.push(this.children[a].toJSON(e).object)}if(this.animations.length>0){s.animations=[];for(let a=0;a<this.animations.length;a++){let c=this.animations[a];s.animations.push(r(e.animations,c))}}if(t){let a=o(e.geometries),c=o(e.materials),l=o(e.textures),u=o(e.images),h=o(e.shapes),d=o(e.skeletons),f=o(e.animations),g=o(e.nodes);a.length>0&&(n.geometries=a),c.length>0&&(n.materials=c),l.length>0&&(n.textures=l),u.length>0&&(n.images=u),h.length>0&&(n.shapes=h),d.length>0&&(n.skeletons=d),f.length>0&&(n.animations=f),g.length>0&&(n.nodes=g)}return n.object=s,n;function o(a){let c=[];for(let l in a){let u=a[l];delete u.metadata,c.push(u)}return c}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){let s=e.children[n];this.add(s.clone())}return this}};Et.DEFAULT_UP=new D(0,1,0);Et.DEFAULT_MATRIX_AUTO_UPDATE=!0;Et.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Dn=new D,ui=new D,vc=new D,hi=new D,Ns=new D,Us=new D,Ed=new D,bc=new D,Sc=new D,Mc=new D,Tc=new dt,wc=new dt,Ec=new dt,fi=class i{constructor(e=new D,t=new D,n=new D){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,s){s.subVectors(n,t),Dn.subVectors(e,t),s.cross(Dn);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(e,t,n,s,r){Dn.subVectors(s,t),ui.subVectors(n,t),vc.subVectors(e,t);let o=Dn.dot(Dn),a=Dn.dot(ui),c=Dn.dot(vc),l=ui.dot(ui),u=ui.dot(vc),h=o*l-a*a;if(h===0)return r.set(0,0,0),null;let d=1/h,f=(l*c-a*u)*d,g=(o*u-a*c)*d;return r.set(1-f-g,g,f)}static containsPoint(e,t,n,s){return this.getBarycoord(e,t,n,s,hi)===null?!1:hi.x>=0&&hi.y>=0&&hi.x+hi.y<=1}static getInterpolation(e,t,n,s,r,o,a,c){return this.getBarycoord(e,t,n,s,hi)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(r,hi.x),c.addScaledVector(o,hi.y),c.addScaledVector(a,hi.z),c)}static getInterpolatedAttribute(e,t,n,s,r,o){return Tc.setScalar(0),wc.setScalar(0),Ec.setScalar(0),Tc.fromBufferAttribute(e,t),wc.fromBufferAttribute(e,n),Ec.fromBufferAttribute(e,s),o.setScalar(0),o.addScaledVector(Tc,r.x),o.addScaledVector(wc,r.y),o.addScaledVector(Ec,r.z),o}static isFrontFacing(e,t,n,s){return Dn.subVectors(n,t),ui.subVectors(e,t),Dn.cross(ui).dot(s)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,s){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[s]),this}setFromAttributeAndIndices(e,t,n,s){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,s),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Dn.subVectors(this.c,this.b),ui.subVectors(this.a,this.b),Dn.cross(ui).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return i.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return i.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,s,r){return i.getInterpolation(e,this.a,this.b,this.c,t,n,s,r)}containsPoint(e){return i.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return i.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,s=this.b,r=this.c,o,a;Ns.subVectors(s,n),Us.subVectors(r,n),bc.subVectors(e,n);let c=Ns.dot(bc),l=Us.dot(bc);if(c<=0&&l<=0)return t.copy(n);Sc.subVectors(e,s);let u=Ns.dot(Sc),h=Us.dot(Sc);if(u>=0&&h<=u)return t.copy(s);let d=c*h-u*l;if(d<=0&&c>=0&&u<=0)return o=c/(c-u),t.copy(n).addScaledVector(Ns,o);Mc.subVectors(e,r);let f=Ns.dot(Mc),g=Us.dot(Mc);if(g>=0&&f<=g)return t.copy(r);let x=f*l-c*g;if(x<=0&&l>=0&&g<=0)return a=l/(l-g),t.copy(n).addScaledVector(Us,a);let m=u*g-f*h;if(m<=0&&h-u>=0&&f-g>=0)return Ed.subVectors(r,s),a=(h-u)/(h-u+(f-g)),t.copy(s).addScaledVector(Ed,a);let p=1/(m+x+d);return o=x*p,a=d*p,t.copy(n).addScaledVector(Ns,o).addScaledVector(Us,a)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},Gf={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Ii={h:0,s:0,l:0},Zo={h:0,s:0,l:0};function Ac(i,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?i+(e-i)*6*t:t<1/2?e:t<2/3?i+(e-i)*6*(2/3-t):i}var Ne=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let s=e;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Ut){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,ct.colorSpaceToWorking(this,t),this}setRGB(e,t,n,s=ct.workingColorSpace){return this.r=e,this.g=t,this.b=n,ct.colorSpaceToWorking(this,s),this}setHSL(e,t,n,s=ct.workingColorSpace){if(e=du(e,1),t=Qe(t,0,1),n=Qe(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,o=2*n-r;this.r=Ac(o,r,e+1/3),this.g=Ac(o,r,e),this.b=Ac(o,r,e-1/3)}return ct.colorSpaceToWorking(this,s),this}setStyle(e,t=Ut){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(e)){let r,o=s[1],a=s[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(e)){let r=s[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(o===6)return this.setHex(parseInt(r,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Ut){let n=Gf[e.toLowerCase()];return n!==void 0?this.setHex(n,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=pi(e.r),this.g=pi(e.g),this.b=pi(e.b),this}copyLinearToSRGB(e){return this.r=Xs(e.r),this.g=Xs(e.g),this.b=Xs(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Ut){return ct.workingToColorSpace(Kt.copy(this),e),Math.round(Qe(Kt.r*255,0,255))*65536+Math.round(Qe(Kt.g*255,0,255))*256+Math.round(Qe(Kt.b*255,0,255))}getHexString(e=Ut){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=ct.workingColorSpace){ct.workingToColorSpace(Kt.copy(this),t);let n=Kt.r,s=Kt.g,r=Kt.b,o=Math.max(n,s,r),a=Math.min(n,s,r),c,l,u=(a+o)/2;if(a===o)c=0,l=0;else{let h=o-a;switch(l=u<=.5?h/(o+a):h/(2-o-a),o){case n:c=(s-r)/h+(s<r?6:0);break;case s:c=(r-n)/h+2;break;case r:c=(n-s)/h+4;break}c/=6}return e.h=c,e.s=l,e.l=u,e}getRGB(e,t=ct.workingColorSpace){return ct.workingToColorSpace(Kt.copy(this),t),e.r=Kt.r,e.g=Kt.g,e.b=Kt.b,e}getStyle(e=Ut){ct.workingToColorSpace(Kt.copy(this),e);let t=Kt.r,n=Kt.g,s=Kt.b;return e!==Ut?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(e,t,n){return this.getHSL(Ii),this.setHSL(Ii.h+e,Ii.s+t,Ii.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(Ii),e.getHSL(Zo);let n=zr(Ii.h,Zo.h,t),s=zr(Ii.s,Zo.s,t),r=zr(Ii.l,Zo.l,t);return this.setHSL(n,s,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,s=this.b,r=e.elements;return this.r=r[0]*t+r[3]*n+r[6]*s,this.g=r[1]*t+r[4]*n+r[7]*s,this.b=r[2]*t+r[5]*n+r[8]*s,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Kt=new Ne;Ne.NAMES=Gf;var y0=0,Qt=class extends $n{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:y0++}),this.uuid=Fn(),this.name="",this.type="Material",this.blending=Ji,this.side=On,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=va,this.blendDst=ba,this.blendEquation=Li,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Ne(0,0,0),this.blendAlpha=0,this.depthFunc=Ki,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Gc,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=ji,this.stencilZFail=ji,this.stencilZPass=ji,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==Ji&&(n.blending=this.blending),this.side!==On&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==va&&(n.blendSrc=this.blendSrc),this.blendDst!==ba&&(n.blendDst=this.blendDst),this.blendEquation!==Li&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==Ki&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Gc&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==ji&&(n.stencilFail=this.stencilFail),this.stencilZFail!==ji&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==ji&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){let o=[];for(let a in r){let c=r[a];delete c.metadata,o.push(c)}return o}if(t){let r=s(e.textures),o=s(e.images);r.length>0&&(n.textures=r),o.length>0&&(n.images=o)}return n}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let s=t.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}},en=class extends Qt{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Ne(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new wn,this.combine=$a,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}};var It=new D,Qo=new De,v0=0,Dt=class{constructor(e,t,n=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:v0++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=Sa,this.updateRanges=[],this.gpuType=En,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[e+s]=t.array[n+s];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)Qo.fromBufferAttribute(this,t),Qo.applyMatrix3(e),this.setXY(t,Qo.x,Qo.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)It.fromBufferAttribute(this,t),It.applyMatrix3(e),this.setXYZ(t,It.x,It.y,It.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)It.fromBufferAttribute(this,t),It.applyMatrix4(e),this.setXYZ(t,It.x,It.y,It.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)It.fromBufferAttribute(this,t),It.applyNormalMatrix(e),this.setXYZ(t,It.x,It.y,It.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)It.fromBufferAttribute(this,t),It.transformDirection(e),this.setXYZ(t,It.x,It.y,It.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=Nn(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=yt(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Nn(t,this.array)),t}setX(e,t){return this.normalized&&(t=yt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Nn(t,this.array)),t}setY(e,t){return this.normalized&&(t=yt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Nn(t,this.array)),t}setZ(e,t){return this.normalized&&(t=yt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Nn(t,this.array)),t}setW(e,t){return this.normalized&&(t=yt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=yt(t,this.array),n=yt(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,s){return e*=this.itemSize,this.normalized&&(t=yt(t,this.array),n=yt(n,this.array),s=yt(s,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this}setXYZW(e,t,n,s,r){return e*=this.itemSize,this.normalized&&(t=yt(t,this.array),n=yt(n,this.array),s=yt(s,this.array),r=yt(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==Sa&&(e.usage=this.usage),e}};var Wr=class extends Dt{constructor(e,t,n){super(new Uint16Array(e),t,n)}};var Xr=class extends Dt{constructor(e,t,n){super(new Uint32Array(e),t,n)}};var xt=class extends Dt{constructor(e,t,n){super(new Float32Array(e),t,n)}},b0=0,Mn=new je,Rc=new Et,Fs=new D,gn=new ln,Ir=new ln,Gt=new D,Ct=class i extends $n{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:b0++}),this.uuid=Fn(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(fu(e)?Xr:Wr)(e,1):this.index=e,this}setIndirect(e){return this.indirect=e,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new Je().getNormalMatrix(e);n.applyNormalMatrix(r),n.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(e),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return Mn.makeRotationFromQuaternion(e),this.applyMatrix4(Mn),this}rotateX(e){return Mn.makeRotationX(e),this.applyMatrix4(Mn),this}rotateY(e){return Mn.makeRotationY(e),this.applyMatrix4(Mn),this}rotateZ(e){return Mn.makeRotationZ(e),this.applyMatrix4(Mn),this}translate(e,t,n){return Mn.makeTranslation(e,t,n),this.applyMatrix4(Mn),this}scale(e,t,n){return Mn.makeScale(e,t,n),this.applyMatrix4(Mn),this}lookAt(e){return Rc.lookAt(e),Rc.updateMatrix(),this.applyMatrix4(Rc.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Fs).negate(),this.translate(Fs.x,Fs.y,Fs.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let n=[];for(let s=0,r=e.length;s<r;s++){let o=e[s];n.push(o.x,o.y,o.z||0)}this.setAttribute("position",new xt(n,3))}else{let n=Math.min(e.length,t.count);for(let s=0;s<n;s++){let r=e[s];t.setXYZ(s,r.x,r.y,r.z||0)}e.length>t.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new ln);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new D(-1/0,-1/0,-1/0),new D(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,s=t.length;n<s;n++){let r=t[n];gn.setFromBufferAttribute(r),this.morphTargetsRelative?(Gt.addVectors(this.boundingBox.min,gn.min),this.boundingBox.expandByPoint(Gt),Gt.addVectors(this.boundingBox.max,gn.max),this.boundingBox.expandByPoint(Gt)):(this.boundingBox.expandByPoint(gn.min),this.boundingBox.expandByPoint(gn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Zt);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new D,1/0);return}if(e){let n=this.boundingSphere.center;if(gn.setFromBufferAttribute(e),t)for(let r=0,o=t.length;r<o;r++){let a=t[r];Ir.setFromBufferAttribute(a),this.morphTargetsRelative?(Gt.addVectors(gn.min,Ir.min),gn.expandByPoint(Gt),Gt.addVectors(gn.max,Ir.max),gn.expandByPoint(Gt)):(gn.expandByPoint(Ir.min),gn.expandByPoint(Ir.max))}gn.getCenter(n);let s=0;for(let r=0,o=e.count;r<o;r++)Gt.fromBufferAttribute(e,r),s=Math.max(s,n.distanceToSquared(Gt));if(t)for(let r=0,o=t.length;r<o;r++){let a=t[r],c=this.morphTargetsRelative;for(let l=0,u=a.count;l<u;l++)Gt.fromBufferAttribute(a,l),c&&(Fs.fromBufferAttribute(e,l),Gt.add(Fs)),s=Math.max(s,n.distanceToSquared(Gt))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=t.position,s=t.normal,r=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Dt(new Float32Array(4*n.count),4));let o=this.getAttribute("tangent"),a=[],c=[];for(let L=0;L<n.count;L++)a[L]=new D,c[L]=new D;let l=new D,u=new D,h=new D,d=new De,f=new De,g=new De,x=new D,m=new D;function p(L,b,_){l.fromBufferAttribute(n,L),u.fromBufferAttribute(n,b),h.fromBufferAttribute(n,_),d.fromBufferAttribute(r,L),f.fromBufferAttribute(r,b),g.fromBufferAttribute(r,_),u.sub(l),h.sub(l),f.sub(d),g.sub(d);let C=1/(f.x*g.y-g.x*f.y);isFinite(C)&&(x.copy(u).multiplyScalar(g.y).addScaledVector(h,-f.y).multiplyScalar(C),m.copy(h).multiplyScalar(f.x).addScaledVector(u,-g.x).multiplyScalar(C),a[L].add(x),a[b].add(x),a[_].add(x),c[L].add(m),c[b].add(m),c[_].add(m))}let w=this.groups;w.length===0&&(w=[{start:0,count:e.count}]);for(let L=0,b=w.length;L<b;++L){let _=w[L],C=_.start,F=_.count;for(let X=C,q=C+F;X<q;X+=3)p(e.getX(X+0),e.getX(X+1),e.getX(X+2))}let T=new D,v=new D,E=new D,A=new D;function R(L){E.fromBufferAttribute(s,L),A.copy(E);let b=a[L];T.copy(b),T.sub(E.multiplyScalar(E.dot(b))).normalize(),v.crossVectors(A,b);let C=v.dot(c[L])<0?-1:1;o.setXYZW(L,T.x,T.y,T.z,C)}for(let L=0,b=w.length;L<b;++L){let _=w[L],C=_.start,F=_.count;for(let X=C,q=C+F;X<q;X+=3)R(e.getX(X+0)),R(e.getX(X+1)),R(e.getX(X+2))}}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new Dt(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let d=0,f=n.count;d<f;d++)n.setXYZ(d,0,0,0);let s=new D,r=new D,o=new D,a=new D,c=new D,l=new D,u=new D,h=new D;if(e)for(let d=0,f=e.count;d<f;d+=3){let g=e.getX(d+0),x=e.getX(d+1),m=e.getX(d+2);s.fromBufferAttribute(t,g),r.fromBufferAttribute(t,x),o.fromBufferAttribute(t,m),u.subVectors(o,r),h.subVectors(s,r),u.cross(h),a.fromBufferAttribute(n,g),c.fromBufferAttribute(n,x),l.fromBufferAttribute(n,m),a.add(u),c.add(u),l.add(u),n.setXYZ(g,a.x,a.y,a.z),n.setXYZ(x,c.x,c.y,c.z),n.setXYZ(m,l.x,l.y,l.z)}else for(let d=0,f=t.count;d<f;d+=3)s.fromBufferAttribute(t,d+0),r.fromBufferAttribute(t,d+1),o.fromBufferAttribute(t,d+2),u.subVectors(o,r),h.subVectors(s,r),u.cross(h),n.setXYZ(d+0,u.x,u.y,u.z),n.setXYZ(d+1,u.x,u.y,u.z),n.setXYZ(d+2,u.x,u.y,u.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Gt.fromBufferAttribute(e,t),Gt.normalize(),e.setXYZ(t,Gt.x,Gt.y,Gt.z)}toNonIndexed(){function e(a,c){let l=a.array,u=a.itemSize,h=a.normalized,d=new l.constructor(c.length*u),f=0,g=0;for(let x=0,m=c.length;x<m;x++){a.isInterleavedBufferAttribute?f=c[x]*a.data.stride+a.offset:f=c[x]*u;for(let p=0;p<u;p++)d[g++]=l[f++]}return new Dt(d,u,h)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new i,n=this.index.array,s=this.attributes;for(let a in s){let c=s[a],l=e(c,n);t.setAttribute(a,l)}let r=this.morphAttributes;for(let a in r){let c=[],l=r[a];for(let u=0,h=l.length;u<h;u++){let d=l[u],f=e(d,n);c.push(f)}t.morphAttributes[a]=c}t.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let a=0,c=o.length;a<c;a++){let l=o[a];t.addGroup(l.start,l.count,l.materialIndex)}return t}toJSON(){let e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){let c=this.parameters;for(let l in c)c[l]!==void 0&&(e[l]=c[l]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let c in n){let l=n[c];e.data.attributes[c]=l.toJSON(e.data)}let s={},r=!1;for(let c in this.morphAttributes){let l=this.morphAttributes[c],u=[];for(let h=0,d=l.length;h<d;h++){let f=l[h];u.push(f.toJSON(e.data))}u.length>0&&(s[c]=u,r=!0)}r&&(e.data.morphAttributes=s,e.data.morphTargetsRelative=this.morphTargetsRelative);let o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));let a=this.boundingSphere;return a!==null&&(e.data.boundingSphere=a.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone());let s=e.attributes;for(let l in s){let u=s[l];this.setAttribute(l,u.clone(t))}let r=e.morphAttributes;for(let l in r){let u=[],h=r[l];for(let d=0,f=h.length;d<f;d++)u.push(h[d].clone(t));this.morphAttributes[l]=u}this.morphTargetsRelative=e.morphTargetsRelative;let o=e.groups;for(let l=0,u=o.length;l<u;l++){let h=o[l];this.addGroup(h.start,h.count,h.materialIndex)}let a=e.boundingBox;a!==null&&(this.boundingBox=a.clone());let c=e.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},Ad=new je,qi=new mi,ea=new Zt,Rd=new D,ta=new D,na=new D,ia=new D,Cc=new D,sa=new D,Cd=new D,ra=new D,ft=class extends Et{constructor(e=new Ct,t=new en){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(e,t){let n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,o=n.morphTargetsRelative;t.fromBufferAttribute(s,e);let a=this.morphTargetInfluences;if(r&&a){sa.set(0,0,0);for(let c=0,l=r.length;c<l;c++){let u=a[c],h=r[c];u!==0&&(Cc.fromBufferAttribute(h,e),o?sa.addScaledVector(Cc,u):sa.addScaledVector(Cc.sub(t),u))}t.add(sa)}return t}raycast(e,t){let n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),ea.copy(n.boundingSphere),ea.applyMatrix4(r),qi.copy(e.ray).recast(e.near),!(ea.containsPoint(qi.origin)===!1&&(qi.intersectSphere(ea,Rd)===null||qi.origin.distanceToSquared(Rd)>(e.far-e.near)**2))&&(Ad.copy(r).invert(),qi.copy(e.ray).applyMatrix4(Ad),!(n.boundingBox!==null&&qi.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,qi)))}_computeIntersections(e,t,n){let s,r=this.geometry,o=this.material,a=r.index,c=r.attributes.position,l=r.attributes.uv,u=r.attributes.uv1,h=r.attributes.normal,d=r.groups,f=r.drawRange;if(a!==null)if(Array.isArray(o))for(let g=0,x=d.length;g<x;g++){let m=d[g],p=o[m.materialIndex],w=Math.max(m.start,f.start),T=Math.min(a.count,Math.min(m.start+m.count,f.start+f.count));for(let v=w,E=T;v<E;v+=3){let A=a.getX(v),R=a.getX(v+1),L=a.getX(v+2);s=oa(this,p,e,n,l,u,h,A,R,L),s&&(s.faceIndex=Math.floor(v/3),s.face.materialIndex=m.materialIndex,t.push(s))}}else{let g=Math.max(0,f.start),x=Math.min(a.count,f.start+f.count);for(let m=g,p=x;m<p;m+=3){let w=a.getX(m),T=a.getX(m+1),v=a.getX(m+2);s=oa(this,o,e,n,l,u,h,w,T,v),s&&(s.faceIndex=Math.floor(m/3),t.push(s))}}else if(c!==void 0)if(Array.isArray(o))for(let g=0,x=d.length;g<x;g++){let m=d[g],p=o[m.materialIndex],w=Math.max(m.start,f.start),T=Math.min(c.count,Math.min(m.start+m.count,f.start+f.count));for(let v=w,E=T;v<E;v+=3){let A=v,R=v+1,L=v+2;s=oa(this,p,e,n,l,u,h,A,R,L),s&&(s.faceIndex=Math.floor(v/3),s.face.materialIndex=m.materialIndex,t.push(s))}}else{let g=Math.max(0,f.start),x=Math.min(c.count,f.start+f.count);for(let m=g,p=x;m<p;m+=3){let w=m,T=m+1,v=m+2;s=oa(this,o,e,n,l,u,h,w,T,v),s&&(s.faceIndex=Math.floor(m/3),t.push(s))}}}};function S0(i,e,t,n,s,r,o,a){let c;if(e.side===Ot?c=n.intersectTriangle(o,r,s,!0,a):c=n.intersectTriangle(s,r,o,e.side===On,a),c===null)return null;ra.copy(a),ra.applyMatrix4(i.matrixWorld);let l=t.ray.origin.distanceTo(ra);return l<t.near||l>t.far?null:{distance:l,point:ra.clone(),object:i}}function oa(i,e,t,n,s,r,o,a,c,l){i.getVertexPosition(a,ta),i.getVertexPosition(c,na),i.getVertexPosition(l,ia);let u=S0(i,e,t,n,ta,na,ia,Cd);if(u){let h=new D;fi.getBarycoord(Cd,ta,na,ia,h),s&&(u.uv=fi.getInterpolatedAttribute(s,a,c,l,h,new De)),r&&(u.uv1=fi.getInterpolatedAttribute(r,a,c,l,h,new De)),o&&(u.normal=fi.getInterpolatedAttribute(o,a,c,l,h,new D),u.normal.dot(n.direction)>0&&u.normal.multiplyScalar(-1));let d={a,b:c,c:l,normal:new D,materialIndex:0};fi.getNormal(ta,na,ia,d.normal),u.face=d,u.barycoord=h}return u}var Ni=class i extends Ct{constructor(e=1,t=1,n=1,s=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:s,heightSegments:r,depthSegments:o};let a=this;s=Math.floor(s),r=Math.floor(r),o=Math.floor(o);let c=[],l=[],u=[],h=[],d=0,f=0;g("z","y","x",-1,-1,n,t,e,o,r,0),g("z","y","x",1,-1,n,t,-e,o,r,1),g("x","z","y",1,1,e,n,t,s,o,2),g("x","z","y",1,-1,e,n,-t,s,o,3),g("x","y","z",1,-1,e,t,n,s,r,4),g("x","y","z",-1,-1,e,t,-n,s,r,5),this.setIndex(c),this.setAttribute("position",new xt(l,3)),this.setAttribute("normal",new xt(u,3)),this.setAttribute("uv",new xt(h,2));function g(x,m,p,w,T,v,E,A,R,L,b){let _=v/R,C=E/L,F=v/2,X=E/2,q=A/2,J=R+1,W=L+1,Z=0,$=0,ne=new D;for(let ce=0;ce<W;ce++){let Re=ce*C-X;for(let He=0;He<J;He++){let it=He*_-F;ne[x]=it*w,ne[m]=Re*T,ne[p]=q,l.push(ne.x,ne.y,ne.z),ne[x]=0,ne[m]=0,ne[p]=A>0?1:-1,u.push(ne.x,ne.y,ne.z),h.push(He/R),h.push(1-ce/L),Z+=1}}for(let ce=0;ce<L;ce++)for(let Re=0;Re<R;Re++){let He=d+Re+J*ce,it=d+Re+J*(ce+1),et=d+(Re+1)+J*(ce+1),$e=d+(Re+1)+J*ce;c.push(He,it,$e),c.push(it,et,$e),$+=6}a.addGroup(f,$,b),f+=$,d+=Z}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};function fs(i){let e={};for(let t in i){e[t]={};for(let n in i[t]){let s=i[t][n];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=s.clone():Array.isArray(s)?e[t][n]=s.slice():e[t][n]=s}}return e}function nn(i){let e={};for(let t=0;t<i.length;t++){let n=fs(i[t]);for(let s in n)e[s]=n[s]}return e}function M0(i){let e=[];for(let t=0;t<i.length;t++)e.push(i[t].clone());return e}function pu(i){let e=i.getRenderTarget();return e===null?i.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:ct.workingColorSpace}var Wf={clone:fs,merge:nn},T0=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,w0=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,Bn=class extends Qt{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=T0,this.fragmentShader=w0,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=fs(e.uniforms),this.uniformsGroups=M0(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let s in this.uniforms){let o=this.uniforms[s].value;o&&o.isTexture?t.uniforms[s]={type:"t",value:o.toJSON(e).uuid}:o&&o.isColor?t.uniforms[s]={type:"c",value:o.getHex()}:o&&o.isVector2?t.uniforms[s]={type:"v2",value:o.toArray()}:o&&o.isVector3?t.uniforms[s]={type:"v3",value:o.toArray()}:o&&o.isVector4?t.uniforms[s]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?t.uniforms[s]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?t.uniforms[s]={type:"m4",value:o.toArray()}:t.uniforms[s]={value:o}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}},Yr=class extends Et{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new je,this.projectionMatrix=new je,this.projectionMatrixInverse=new je,this.coordinateSystem=Un,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},Pi=new D,Id=new De,Pd=new De,Pt=class extends Yr{constructor(e=50,t=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=es*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(Br*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return es*2*Math.atan(Math.tan(Br*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){Pi.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Pi.x,Pi.y).multiplyScalar(-e/Pi.z),Pi.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Pi.x,Pi.y).multiplyScalar(-e/Pi.z)}getViewSize(e,t){return this.getViewBounds(e,Id,Pd),t.subVectors(Pd,Id)}setViewOffset(e,t,n,s,r,o){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(Br*.5*this.fov)/this.zoom,n=2*t,s=this.aspect*n,r=-.5*s,o=this.view;if(this.view!==null&&this.view.enabled){let c=o.fullWidth,l=o.fullHeight;r+=o.offsetX*s/c,t-=o.offsetY*n/l,s*=o.width/c,n*=o.height/l}let a=this.filmOffset;a!==0&&(r+=e*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},Os=-90,Bs=1,Ea=class extends Et{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new Pt(Os,Bs,e,t);s.layers=this.layers,this.add(s);let r=new Pt(Os,Bs,e,t);r.layers=this.layers,this.add(r);let o=new Pt(Os,Bs,e,t);o.layers=this.layers,this.add(o);let a=new Pt(Os,Bs,e,t);a.layers=this.layers,this.add(a);let c=new Pt(Os,Bs,e,t);c.layers=this.layers,this.add(c);let l=new Pt(Os,Bs,e,t);l.layers=this.layers,this.add(l)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,s,r,o,a,c]=t;for(let l of t)this.remove(l);if(e===Un)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(e===Hr)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let l of t)this.add(l),l.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[r,o,a,c,l,u]=this.children,h=e.getRenderTarget(),d=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;let x=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,e.setRenderTarget(n,0,s),e.render(t,r),e.setRenderTarget(n,1,s),e.render(t,o),e.setRenderTarget(n,2,s),e.render(t,a),e.setRenderTarget(n,3,s),e.render(t,c),e.setRenderTarget(n,4,s),e.render(t,l),n.texture.generateMipmaps=x,e.setRenderTarget(n,5,s),e.render(t,u),e.setRenderTarget(h,d,f),e.xr.enabled=g,n.texture.needsPMREMUpdate=!0}},qr=class extends Ft{constructor(e=[],t=us,n,s,r,o,a,c,l,u){super(e,t,n,s,r,o,a,c,l,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},Aa=class extends jn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},s=[n,n,n,n,n,n];this.texture=new qr(s),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new Ni(5,5,5),r=new Bn({name:"CubemapFromEquirect",uniforms:fs(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Ot,blending:vi});r.uniforms.tEquirect.value=t;let o=new ft(s,r),a=t.minFilter;return t.minFilter===kn&&(t.minFilter=on),new Ea(1,10,this).update(e,o),t.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(e,t=!0,n=!0,s=!0){let r=e.getRenderTarget();for(let o=0;o<6;o++)e.setRenderTarget(this,o),e.clear(t,n,s);e.setRenderTarget(r)}},Lt=class extends Et{constructor(){super(),this.isGroup=!0,this.type="Group"}},E0={type:"move"},Ks=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Lt,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Lt,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new D,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new D),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Lt,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new D,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new D),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let s=null,r=null,o=null,a=this._targetRay,c=this._grip,l=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(l&&e.hand){o=!0;for(let x of e.hand.values()){let m=t.getJointPose(x,n),p=this._getHandJoint(l,x);m!==null&&(p.matrix.fromArray(m.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=m.radius),p.visible=m!==null}let u=l.joints["index-finger-tip"],h=l.joints["thumb-tip"],d=u.position.distanceTo(h.position),f=.02,g=.005;l.inputState.pinching&&d>f+g?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!l.inputState.pinching&&d<=f-g&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else c!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,n),r!==null&&(c.matrix.fromArray(r.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,r.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(r.linearVelocity)):c.hasLinearVelocity=!1,r.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(r.angularVelocity)):c.hasAngularVelocity=!1));a!==null&&(s=t.getPose(e.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(a.matrix.fromArray(s.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,s.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(s.linearVelocity)):a.hasLinearVelocity=!1,s.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(s.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(E0)))}return a!==null&&(a.visible=s!==null),c!==null&&(c.visible=r!==null),l!==null&&(l.visible=o!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new Lt;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}};var ts=class extends Et{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new wn,this.environmentIntensity=1,this.environmentRotation=new wn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}},ns=class{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e!==void 0?e.length/t:0,this.usage=Sa,this.updateRanges=[],this.version=0,this.uuid=Fn()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,n){e*=this.stride,n*=t.stride;for(let s=0,r=this.stride;s<r;s++)this.array[e+s]=t.array[n+s];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Fn()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);let t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),n=new this.constructor(t,this.stride);return n.setUsage(this.usage),n}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){return e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Fn()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}},rn=new D,Ui=class i{constructor(e,t,n,s=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=e,this.itemSize=t,this.offset=n,this.normalized=s}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,n=this.data.count;t<n;t++)rn.fromBufferAttribute(this,t),rn.applyMatrix4(e),this.setXYZ(t,rn.x,rn.y,rn.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)rn.fromBufferAttribute(this,t),rn.applyNormalMatrix(e),this.setXYZ(t,rn.x,rn.y,rn.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)rn.fromBufferAttribute(this,t),rn.transformDirection(e),this.setXYZ(t,rn.x,rn.y,rn.z);return this}getComponent(e,t){let n=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(n=Nn(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=yt(n,this.array)),this.data.array[e*this.data.stride+this.offset+t]=n,this}setX(e,t){return this.normalized&&(t=yt(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=yt(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=yt(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=yt(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=Nn(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=Nn(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=Nn(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=Nn(t,this.array)),t}setXY(e,t,n){return e=e*this.data.stride+this.offset,this.normalized&&(t=yt(t,this.array),n=yt(n,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this}setXYZ(e,t,n,s){return e=e*this.data.stride+this.offset,this.normalized&&(t=yt(t,this.array),n=yt(n,this.array),s=yt(s,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=s,this}setXYZW(e,t,n,s,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=yt(t,this.array),n=yt(n,this.array),s=yt(s,this.array),r=yt(r,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=s,this.data.array[e+3]=r,this}clone(e){if(e===void 0){console.log("THREE.InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let n=0;n<this.count;n++){let s=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[s+r])}return new Dt(new this.array.constructor(t),this.itemSize,this.normalized)}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.clone(e)),new i(e.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){console.log("THREE.InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let n=0;n<this.count;n++){let s=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[s+r])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:t,normalized:this.normalized}}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}},Zs=class extends Qt{constructor(e){super(),this.isSpriteMaterial=!0,this.type="SpriteMaterial",this.color=new Ne(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.rotation=e.rotation,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},zs,Pr=new D,ks=new D,Hs=new D,Vs=new De,Lr=new De,Xf=new je,aa=new D,Dr=new D,la=new D,Ld=new De,Ic=new De,Dd=new De,$r=class extends Et{constructor(e=new Zs){if(super(),this.isSprite=!0,this.type="Sprite",zs===void 0){zs=new Ct;let t=new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),n=new ns(t,5);zs.setIndex([0,1,2,0,2,3]),zs.setAttribute("position",new Ui(n,3,0,!1)),zs.setAttribute("uv",new Ui(n,2,3,!1))}this.geometry=zs,this.material=e,this.center=new De(.5,.5),this.count=1}raycast(e,t){e.camera===null&&console.error('THREE.Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.'),ks.setFromMatrixScale(this.matrixWorld),Xf.copy(e.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(e.camera.matrixWorldInverse,this.matrixWorld),Hs.setFromMatrixPosition(this.modelViewMatrix),e.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&ks.multiplyScalar(-Hs.z);let n=this.material.rotation,s,r;n!==0&&(r=Math.cos(n),s=Math.sin(n));let o=this.center;ca(aa.set(-.5,-.5,0),Hs,o,ks,s,r),ca(Dr.set(.5,-.5,0),Hs,o,ks,s,r),ca(la.set(.5,.5,0),Hs,o,ks,s,r),Ld.set(0,0),Ic.set(1,0),Dd.set(1,1);let a=e.ray.intersectTriangle(aa,Dr,la,!1,Pr);if(a===null&&(ca(Dr.set(-.5,.5,0),Hs,o,ks,s,r),Ic.set(0,1),a=e.ray.intersectTriangle(aa,la,Dr,!1,Pr),a===null))return;let c=e.ray.origin.distanceTo(Pr);c<e.near||c>e.far||t.push({distance:c,point:Pr.clone(),uv:fi.getInterpolation(Pr,aa,Dr,la,Ld,Ic,Dd,new De),face:null,object:this})}copy(e,t){return super.copy(e,t),e.center!==void 0&&this.center.copy(e.center),this.material=e.material,this}};function ca(i,e,t,n,s,r){Vs.subVectors(i,t).addScalar(.5).multiply(n),s!==void 0?(Lr.x=r*Vs.x-s*Vs.y,Lr.y=s*Vs.x+r*Vs.y):Lr.copy(Vs),i.copy(e),i.x+=Lr.x,i.y+=Lr.y,i.applyMatrix4(Xf)}var Nd=new D,Ud=new dt,Fd=new dt,A0=new D,Od=new je,ua=new D,Pc=new Zt,Bd=new je,Lc=new mi,jr=class extends ft{constructor(e,t){super(e,t),this.isSkinnedMesh=!0,this.type="SkinnedMesh",this.bindMode=zc,this.bindMatrix=new je,this.bindMatrixInverse=new je,this.boundingBox=null,this.boundingSphere=null}computeBoundingBox(){let e=this.geometry;this.boundingBox===null&&(this.boundingBox=new ln),this.boundingBox.makeEmpty();let t=e.getAttribute("position");for(let n=0;n<t.count;n++)this.getVertexPosition(n,ua),this.boundingBox.expandByPoint(ua)}computeBoundingSphere(){let e=this.geometry;this.boundingSphere===null&&(this.boundingSphere=new Zt),this.boundingSphere.makeEmpty();let t=e.getAttribute("position");for(let n=0;n<t.count;n++)this.getVertexPosition(n,ua),this.boundingSphere.expandByPoint(ua)}copy(e,t){return super.copy(e,t),this.bindMode=e.bindMode,this.bindMatrix.copy(e.bindMatrix),this.bindMatrixInverse.copy(e.bindMatrixInverse),this.skeleton=e.skeleton,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}raycast(e,t){let n=this.material,s=this.matrixWorld;n!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Pc.copy(this.boundingSphere),Pc.applyMatrix4(s),e.ray.intersectsSphere(Pc)!==!1&&(Bd.copy(s).invert(),Lc.copy(e.ray).applyMatrix4(Bd),!(this.boundingBox!==null&&Lc.intersectsBox(this.boundingBox)===!1)&&this._computeIntersections(e,t,Lc)))}getVertexPosition(e,t){return super.getVertexPosition(e,t),this.applyBoneTransform(e,t),t}bind(e,t){this.skeleton=e,t===void 0&&(this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),t=this.matrixWorld),this.bindMatrix.copy(t),this.bindMatrixInverse.copy(t).invert()}pose(){this.skeleton.pose()}normalizeSkinWeights(){let e=new dt,t=this.geometry.attributes.skinWeight;for(let n=0,s=t.count;n<s;n++){e.fromBufferAttribute(t,n);let r=1/e.manhattanLength();r!==1/0?e.multiplyScalar(r):e.set(1,0,0,0),t.setXYZW(n,e.x,e.y,e.z,e.w)}}updateMatrixWorld(e){super.updateMatrixWorld(e),this.bindMode===zc?this.bindMatrixInverse.copy(this.matrixWorld).invert():this.bindMode===Cf?this.bindMatrixInverse.copy(this.bindMatrix).invert():console.warn("THREE.SkinnedMesh: Unrecognized bindMode: "+this.bindMode)}applyBoneTransform(e,t){let n=this.skeleton,s=this.geometry;Ud.fromBufferAttribute(s.attributes.skinIndex,e),Fd.fromBufferAttribute(s.attributes.skinWeight,e),Nd.copy(t).applyMatrix4(this.bindMatrix),t.set(0,0,0);for(let r=0;r<4;r++){let o=Fd.getComponent(r);if(o!==0){let a=Ud.getComponent(r);Od.multiplyMatrices(n.bones[a].matrixWorld,n.boneInverses[a]),t.addScaledVector(A0.copy(Nd).applyMatrix4(Od),o)}}return t.applyMatrix4(this.bindMatrixInverse)}},Qs=class extends Et{constructor(){super(),this.isBone=!0,this.type="Bone"}},Jr=class extends Ft{constructor(e=null,t=1,n=1,s,r,o,a,c,l=qt,u=qt,h,d){super(null,o,a,c,l,u,s,r,h,d),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},zd=new je,R0=new je,Kr=class i{constructor(e=[],t=[]){this.uuid=Fn(),this.bones=e.slice(0),this.boneInverses=t,this.boneMatrices=null,this.boneTexture=null,this.init()}init(){let e=this.bones,t=this.boneInverses;if(this.boneMatrices=new Float32Array(e.length*16),t.length===0)this.calculateInverses();else if(e.length!==t.length){console.warn("THREE.Skeleton: Number of inverse bone matrices does not match amount of bones."),this.boneInverses=[];for(let n=0,s=this.bones.length;n<s;n++)this.boneInverses.push(new je)}}calculateInverses(){this.boneInverses.length=0;for(let e=0,t=this.bones.length;e<t;e++){let n=new je;this.bones[e]&&n.copy(this.bones[e].matrixWorld).invert(),this.boneInverses.push(n)}}pose(){for(let e=0,t=this.bones.length;e<t;e++){let n=this.bones[e];n&&n.matrixWorld.copy(this.boneInverses[e]).invert()}for(let e=0,t=this.bones.length;e<t;e++){let n=this.bones[e];n&&(n.parent&&n.parent.isBone?(n.matrix.copy(n.parent.matrixWorld).invert(),n.matrix.multiply(n.matrixWorld)):n.matrix.copy(n.matrixWorld),n.matrix.decompose(n.position,n.quaternion,n.scale))}}update(){let e=this.bones,t=this.boneInverses,n=this.boneMatrices,s=this.boneTexture;for(let r=0,o=e.length;r<o;r++){let a=e[r]?e[r].matrixWorld:R0;zd.multiplyMatrices(a,t[r]),zd.toArray(n,r*16)}s!==null&&(s.needsUpdate=!0)}clone(){return new i(this.bones,this.boneInverses)}computeBoneTexture(){let e=Math.sqrt(this.bones.length*4);e=Math.ceil(e/4)*4,e=Math.max(e,4);let t=new Float32Array(e*e*4);t.set(this.boneMatrices);let n=new Jr(t,e,e,_n,En);return n.needsUpdate=!0,this.boneMatrices=t,this.boneTexture=n,this}getBoneByName(e){for(let t=0,n=this.bones.length;t<n;t++){let s=this.bones[t];if(s.name===e)return s}}dispose(){this.boneTexture!==null&&(this.boneTexture.dispose(),this.boneTexture=null)}fromJSON(e,t){this.uuid=e.uuid;for(let n=0,s=e.bones.length;n<s;n++){let r=e.bones[n],o=t[r];o===void 0&&(console.warn("THREE.Skeleton: No bone found with UUID:",r),o=new Qs),this.bones.push(o),this.boneInverses.push(new je().fromArray(e.boneInverses[n]))}return this.init(),this}toJSON(){let e={metadata:{version:4.7,type:"Skeleton",generator:"Skeleton.toJSON"},bones:[],boneInverses:[]};e.uuid=this.uuid;let t=this.bones,n=this.boneInverses;for(let s=0,r=t.length;s<r;s++){let o=t[s];e.bones.push(o.uuid);let a=n[s];e.boneInverses.push(a.toArray())}return e}},Fi=class extends Dt{constructor(e,t,n,s=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},Gs=new je,kd=new je,ha=[],Hd=new ln,C0=new je,Nr=new ft,Ur=new Zt,is=class extends ft{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new Fi(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let s=0;s<n;s++)this.setMatrixAt(s,C0)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new ln),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Gs),Hd.copy(e.boundingBox).applyMatrix4(Gs),this.boundingBox.union(Hd)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new Zt),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Gs),Ur.copy(e.boundingSphere).applyMatrix4(Gs),this.boundingSphere.union(Ur)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let n=t.morphTargetInfluences,s=this.morphTexture.source.data.data,r=n.length+1,o=e*r+1;for(let a=0;a<n.length;a++)n[a]=s[o+a]}raycast(e,t){let n=this.matrixWorld,s=this.count;if(Nr.geometry=this.geometry,Nr.material=this.material,Nr.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Ur.copy(this.boundingSphere),Ur.applyMatrix4(n),e.ray.intersectsSphere(Ur)!==!1))for(let r=0;r<s;r++){this.getMatrixAt(r,Gs),kd.multiplyMatrices(n,Gs),Nr.matrixWorld=kd,Nr.raycast(e,ha);for(let o=0,a=ha.length;o<a;o++){let c=ha[o];c.instanceId=r,c.object=this,t.push(c)}ha.length=0}}setColorAt(e,t){this.instanceColor===null&&(this.instanceColor=new Fi(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3)}setMatrixAt(e,t){t.toArray(this.instanceMatrix.array,e*16)}setMorphAt(e,t){let n=t.morphTargetInfluences,s=n.length+1;this.morphTexture===null&&(this.morphTexture=new Jr(new Float32Array(s*this.count),s,this.count,nl,En));let r=this.morphTexture.source.data.data,o=0;for(let l=0;l<n.length;l++)o+=n[l];let a=this.geometry.morphTargetsRelative?1:1-o,c=s*e;r[c]=a,r.set(n,c+1)}updateMorphTargets(){}dispose(){this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}},Dc=new D,I0=new D,P0=new Je,Tn=class{constructor(e=new D(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,s){return this.normal.set(e,t,n),this.constant=s,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let s=Dc.subVectors(n,t).cross(I0.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(s,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){let n=e.delta(Dc),s=this.normal.dot(n);if(s===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let r=-(e.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:t.copy(e.start).addScaledVector(n,r)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||P0.getNormalMatrix(e),s=this.coplanarPoint(Dc).applyMatrix4(e),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}},$i=new Zt,L0=new De(.5,.5),da=new D,er=class{constructor(e=new Tn,t=new Tn,n=new Tn,s=new Tn,r=new Tn,o=new Tn){this.planes=[e,t,n,s,r,o]}set(e,t,n,s,r,o){let a=this.planes;return a[0].copy(e),a[1].copy(t),a[2].copy(n),a[3].copy(s),a[4].copy(r),a[5].copy(o),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=Un,n=!1){let s=this.planes,r=e.elements,o=r[0],a=r[1],c=r[2],l=r[3],u=r[4],h=r[5],d=r[6],f=r[7],g=r[8],x=r[9],m=r[10],p=r[11],w=r[12],T=r[13],v=r[14],E=r[15];if(s[0].setComponents(l-o,f-u,p-g,E-w).normalize(),s[1].setComponents(l+o,f+u,p+g,E+w).normalize(),s[2].setComponents(l+a,f+h,p+x,E+T).normalize(),s[3].setComponents(l-a,f-h,p-x,E-T).normalize(),n)s[4].setComponents(c,d,m,v).normalize(),s[5].setComponents(l-c,f-d,p-m,E-v).normalize();else if(s[4].setComponents(l-c,f-d,p-m,E-v).normalize(),t===Un)s[5].setComponents(l+c,f+d,p+m,E+v).normalize();else if(t===Hr)s[5].setComponents(c,d,m,v).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),$i.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),$i.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere($i)}intersectsSprite(e){$i.center.set(0,0,0);let t=L0.distanceTo(e.center);return $i.radius=.7071067811865476+t,$i.applyMatrix4(e.matrixWorld),this.intersectsSphere($i)}intersectsSphere(e){let t=this.planes,n=e.center,s=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let s=t[n];if(da.x=s.normal.x>0?e.max.x:e.min.x,da.y=s.normal.y>0?e.max.y:e.min.y,da.z=s.normal.z>0?e.max.z:e.min.z,s.distanceToPoint(da)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var zn=class extends Qt{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Ne(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}},Ra=new D,Ca=new D,Vd=new je,Fr=new mi,fa=new Zt,Nc=new D,Gd=new D,Jn=class extends Et{constructor(e=new Ct,t=new zn){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[0];for(let s=1,r=t.count;s<r;s++)Ra.fromBufferAttribute(t,s-1),Ca.fromBufferAttribute(t,s),n[s]=n[s-1],n[s]+=Ra.distanceTo(Ca);e.setAttribute("lineDistance",new xt(n,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){let n=this.geometry,s=this.matrixWorld,r=e.params.Line.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),fa.copy(n.boundingSphere),fa.applyMatrix4(s),fa.radius+=r,e.ray.intersectsSphere(fa)===!1)return;Vd.copy(s).invert(),Fr.copy(e.ray).applyMatrix4(Vd);let a=r/((this.scale.x+this.scale.y+this.scale.z)/3),c=a*a,l=this.isLineSegments?2:1,u=n.index,d=n.attributes.position;if(u!==null){let f=Math.max(0,o.start),g=Math.min(u.count,o.start+o.count);for(let x=f,m=g-1;x<m;x+=l){let p=u.getX(x),w=u.getX(x+1),T=pa(this,e,Fr,c,p,w,x);T&&t.push(T)}if(this.isLineLoop){let x=u.getX(g-1),m=u.getX(f),p=pa(this,e,Fr,c,x,m,g-1);p&&t.push(p)}}else{let f=Math.max(0,o.start),g=Math.min(d.count,o.start+o.count);for(let x=f,m=g-1;x<m;x+=l){let p=pa(this,e,Fr,c,x,x+1,x);p&&t.push(p)}if(this.isLineLoop){let x=pa(this,e,Fr,c,g-1,f,g-1);x&&t.push(x)}}}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}};function pa(i,e,t,n,s,r,o){let a=i.geometry.attributes.position;if(Ra.fromBufferAttribute(a,s),Ca.fromBufferAttribute(a,r),t.distanceSqToSegment(Ra,Ca,Nc,Gd)>n)return;Nc.applyMatrix4(i.matrixWorld);let l=e.ray.origin.distanceTo(Nc);if(!(l<e.near||l>e.far))return{distance:l,point:Gd.clone().applyMatrix4(i.matrixWorld),index:o,face:null,faceIndex:null,barycoord:null,object:i}}var Wd=new D,Xd=new D,ss=class extends Jn{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[];for(let s=0,r=t.count;s<r;s+=2)Wd.fromBufferAttribute(t,s),Xd.fromBufferAttribute(t,s+1),n[s]=s===0?0:n[s-1],n[s+1]=n[s]+Wd.distanceTo(Xd);e.setAttribute("lineDistance",new xt(n,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}},Zr=class extends Jn{constructor(e,t){super(e,t),this.isLineLoop=!0,this.type="LineLoop"}},tr=class extends Qt{constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new Ne(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},Yd=new je,Wc=new mi,ma=new Zt,ga=new D,Qr=class extends Et{constructor(e=new Ct,t=new tr){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,t){let n=this.geometry,s=this.matrixWorld,r=e.params.Points.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),ma.copy(n.boundingSphere),ma.applyMatrix4(s),ma.radius+=r,e.ray.intersectsSphere(ma)===!1)return;Yd.copy(s).invert(),Wc.copy(e.ray).applyMatrix4(Yd);let a=r/((this.scale.x+this.scale.y+this.scale.z)/3),c=a*a,l=n.index,h=n.attributes.position;if(l!==null){let d=Math.max(0,o.start),f=Math.min(l.count,o.start+o.count);for(let g=d,x=f;g<x;g++){let m=l.getX(g);ga.fromBufferAttribute(h,m),qd(ga,m,c,s,e,t,this)}}else{let d=Math.max(0,o.start),f=Math.min(h.count,o.start+o.count);for(let g=d,x=f;g<x;g++)ga.fromBufferAttribute(h,g),qd(ga,g,c,s,e,t,this)}}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}};function qd(i,e,t,n,s,r,o){let a=Wc.distanceSqToPoint(i);if(a<t){let c=new D;Wc.closestPointToPoint(i,c),c.applyMatrix4(n);let l=s.ray.origin.distanceTo(c);if(l<s.near||l>s.far)return;r.push({distance:l,distanceToRay:Math.sqrt(a),point:c,index:e,face:null,faceIndex:null,barycoord:null,object:o})}}var eo=class extends Ft{constructor(e,t,n,s,r,o,a,c,l){super(e,t,n,s,r,o,a,c,l),this.isCanvasTexture=!0,this.needsUpdate=!0}},to=class extends Ft{constructor(e,t,n=zi,s,r,o,a=qt,c=qt,l,u=qs,h=1){if(u!==qs&&u!==lr)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let d={width:e,height:t,depth:h};super(d,s,r,o,a,c,u,n,l),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Js(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}},no=class extends Ft{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}},io=class i extends Ct{constructor(e=1,t=1,n=4,s=8,r=1){super(),this.type="CapsuleGeometry",this.parameters={radius:e,height:t,capSegments:n,radialSegments:s,heightSegments:r},t=Math.max(0,t),n=Math.max(1,Math.floor(n)),s=Math.max(3,Math.floor(s)),r=Math.max(1,Math.floor(r));let o=[],a=[],c=[],l=[],u=t/2,h=Math.PI/2*e,d=t,f=2*h+d,g=n*2+r,x=s+1,m=new D,p=new D;for(let w=0;w<=g;w++){let T=0,v=0,E=0,A=0;if(w<=n){let b=w/n,_=b*Math.PI/2;v=-u-e*Math.cos(_),E=e*Math.sin(_),A=-e*Math.cos(_),T=b*h}else if(w<=n+r){let b=(w-n)/r;v=-u+b*t,E=e,A=0,T=h+b*d}else{let b=(w-n-r)/n,_=b*Math.PI/2;v=u+e*Math.sin(_),E=e*Math.cos(_),A=e*Math.sin(_),T=h+d+b*h}let R=Math.max(0,Math.min(1,T/f)),L=0;w===0?L=.5/s:w===g&&(L=-.5/s);for(let b=0;b<=s;b++){let _=b/s,C=_*Math.PI*2,F=Math.sin(C),X=Math.cos(C);p.x=-E*X,p.y=v,p.z=E*F,a.push(p.x,p.y,p.z),m.set(-E*X,A,E*F),m.normalize(),c.push(m.x,m.y,m.z),l.push(_+L,R)}if(w>0){let b=(w-1)*x;for(let _=0;_<s;_++){let C=b+_,F=b+_+1,X=w*x+_,q=w*x+_+1;o.push(C,F,X),o.push(F,q,X)}}}this.setIndex(o),this.setAttribute("position",new xt(a,3)),this.setAttribute("normal",new xt(c,3)),this.setAttribute("uv",new xt(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radius,e.height,e.capSegments,e.radialSegments,e.heightSegments)}};var Ia=class i extends Ct{constructor(e=1,t=1,n=1,s=32,r=1,o=!1,a=0,c=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:s,heightSegments:r,openEnded:o,thetaStart:a,thetaLength:c};let l=this;s=Math.floor(s),r=Math.floor(r);let u=[],h=[],d=[],f=[],g=0,x=[],m=n/2,p=0;w(),o===!1&&(e>0&&T(!0),t>0&&T(!1)),this.setIndex(u),this.setAttribute("position",new xt(h,3)),this.setAttribute("normal",new xt(d,3)),this.setAttribute("uv",new xt(f,2));function w(){let v=new D,E=new D,A=0,R=(t-e)/n;for(let L=0;L<=r;L++){let b=[],_=L/r,C=_*(t-e)+e;for(let F=0;F<=s;F++){let X=F/s,q=X*c+a,J=Math.sin(q),W=Math.cos(q);E.x=C*J,E.y=-_*n+m,E.z=C*W,h.push(E.x,E.y,E.z),v.set(J,R,W).normalize(),d.push(v.x,v.y,v.z),f.push(X,1-_),b.push(g++)}x.push(b)}for(let L=0;L<s;L++)for(let b=0;b<r;b++){let _=x[b][L],C=x[b+1][L],F=x[b+1][L+1],X=x[b][L+1];(e>0||b!==0)&&(u.push(_,C,X),A+=3),(t>0||b!==r-1)&&(u.push(C,F,X),A+=3)}l.addGroup(p,A,0),p+=A}function T(v){let E=g,A=new De,R=new D,L=0,b=v===!0?e:t,_=v===!0?1:-1;for(let F=1;F<=s;F++)h.push(0,m*_,0),d.push(0,_,0),f.push(.5,.5),g++;let C=g;for(let F=0;F<=s;F++){let q=F/s*c+a,J=Math.cos(q),W=Math.sin(q);R.x=b*W,R.y=m*_,R.z=b*J,h.push(R.x,R.y,R.z),d.push(0,_,0),A.x=J*.5+.5,A.y=W*.5*_+.5,f.push(A.x,A.y),g++}for(let F=0;F<s;F++){let X=E+F,q=C+F;v===!0?u.push(q,q+1,X):u.push(q+1,q,X),L+=3}l.addGroup(p,L,v===!0?1:2),p+=L}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},Pa=class i extends Ia{constructor(e=1,t=1,n=32,s=1,r=!1,o=0,a=Math.PI*2){super(0,e,t,n,s,r,o,a),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:n,heightSegments:s,openEnded:r,thetaStart:o,thetaLength:a}}static fromJSON(e){return new i(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}};var so=class i extends Ct{constructor(e=1,t=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:s};let r=e/2,o=t/2,a=Math.floor(n),c=Math.floor(s),l=a+1,u=c+1,h=e/a,d=t/c,f=[],g=[],x=[],m=[];for(let p=0;p<u;p++){let w=p*d-o;for(let T=0;T<l;T++){let v=T*h-r;g.push(v,-w,0),x.push(0,0,1),m.push(T/a),m.push(1-p/c)}}for(let p=0;p<c;p++)for(let w=0;w<a;w++){let T=w+l*p,v=w+l*(p+1),E=w+1+l*(p+1),A=w+1+l*p;f.push(T,v,A),f.push(v,E,A)}this.setIndex(f),this.setAttribute("position",new xt(g,3)),this.setAttribute("normal",new xt(x,3)),this.setAttribute("uv",new xt(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.width,e.height,e.widthSegments,e.heightSegments)}};var rs=class i extends Ct{constructor(e=1,t=32,n=16,s=0,r=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:s,phiLength:r,thetaStart:o,thetaLength:a},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));let c=Math.min(o+a,Math.PI),l=0,u=[],h=new D,d=new D,f=[],g=[],x=[],m=[];for(let p=0;p<=n;p++){let w=[],T=p/n,v=0;p===0&&o===0?v=.5/t:p===n&&c===Math.PI&&(v=-.5/t);for(let E=0;E<=t;E++){let A=E/t;h.x=-e*Math.cos(s+A*r)*Math.sin(o+T*a),h.y=e*Math.cos(o+T*a),h.z=e*Math.sin(s+A*r)*Math.sin(o+T*a),g.push(h.x,h.y,h.z),d.copy(h).normalize(),x.push(d.x,d.y,d.z),m.push(A+v,1-T),w.push(l++)}u.push(w)}for(let p=0;p<n;p++)for(let w=0;w<t;w++){let T=u[p][w+1],v=u[p][w],E=u[p+1][w],A=u[p+1][w+1];(p!==0||o>0)&&f.push(T,v,A),(p!==n-1||c<Math.PI)&&f.push(v,E,A)}this.setIndex(f),this.setAttribute("position",new xt(g,3)),this.setAttribute("normal",new xt(x,3)),this.setAttribute("uv",new xt(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}};var un=class extends Qt{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new Ne(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Ne(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Nl,this.normalScale=new De(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new wn,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},hn=class extends un{constructor(e){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new De(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return Qe(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(t){this.ior=(1+.4*t)/(1-.4*t)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new Ne(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new Ne(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new Ne(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._sheen=0,this._transmission=0,this.setValues(e)}get anisotropy(){return this._anisotropy}set anisotropy(e){this._anisotropy>0!=e>0&&this.version++,this._anisotropy=e}get clearcoat(){return this._clearcoat}set clearcoat(e){this._clearcoat>0!=e>0&&this.version++,this._clearcoat=e}get iridescence(){return this._iridescence}set iridescence(e){this._iridescence>0!=e>0&&this.version++,this._iridescence=e}get dispersion(){return this._dispersion}set dispersion(e){this._dispersion>0!=e>0&&this.version++,this._dispersion=e}get sheen(){return this._sheen}set sheen(e){this._sheen>0!=e>0&&this.version++,this._sheen=e}get transmission(){return this._transmission}set transmission(e){this._transmission>0!=e>0&&this.version++,this._transmission=e}copy(e){return super.copy(e),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=e.anisotropy,this.anisotropyRotation=e.anisotropyRotation,this.anisotropyMap=e.anisotropyMap,this.clearcoat=e.clearcoat,this.clearcoatMap=e.clearcoatMap,this.clearcoatRoughness=e.clearcoatRoughness,this.clearcoatRoughnessMap=e.clearcoatRoughnessMap,this.clearcoatNormalMap=e.clearcoatNormalMap,this.clearcoatNormalScale.copy(e.clearcoatNormalScale),this.dispersion=e.dispersion,this.ior=e.ior,this.iridescence=e.iridescence,this.iridescenceMap=e.iridescenceMap,this.iridescenceIOR=e.iridescenceIOR,this.iridescenceThicknessRange=[...e.iridescenceThicknessRange],this.iridescenceThicknessMap=e.iridescenceThicknessMap,this.sheen=e.sheen,this.sheenColor.copy(e.sheenColor),this.sheenColorMap=e.sheenColorMap,this.sheenRoughness=e.sheenRoughness,this.sheenRoughnessMap=e.sheenRoughnessMap,this.transmission=e.transmission,this.transmissionMap=e.transmissionMap,this.thickness=e.thickness,this.thicknessMap=e.thicknessMap,this.attenuationDistance=e.attenuationDistance,this.attenuationColor.copy(e.attenuationColor),this.specularIntensity=e.specularIntensity,this.specularIntensityMap=e.specularIntensityMap,this.specularColor.copy(e.specularColor),this.specularColorMap=e.specularColorMap,this}};var ro=class extends Qt{constructor(e){super(),this.isMeshLambertMaterial=!0,this.type="MeshLambertMaterial",this.color=new Ne(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Ne(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Nl,this.normalScale=new De(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new wn,this.combine=$a,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},La=class extends Qt{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Pf,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},Da=class extends Qt{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function _a(i,e){return!i||i.constructor===e?i:typeof e.BYTES_PER_ELEMENT=="number"?new e(i):Array.prototype.slice.call(i)}function D0(i){return ArrayBuffer.isView(i)&&!(i instanceof DataView)}function N0(i){function e(s,r){return i[s]-i[r]}let t=i.length,n=new Array(t);for(let s=0;s!==t;++s)n[s]=s;return n.sort(e),n}function $d(i,e,t){let n=i.length,s=new i.constructor(n);for(let r=0,o=0;o!==n;++r){let a=t[r]*e;for(let c=0;c!==e;++c)s[o++]=i[a+c]}return s}function Yf(i,e,t,n){let s=1,r=i[0];for(;r!==void 0&&r[n]===void 0;)r=i[s++];if(r===void 0)return;let o=r[n];if(o!==void 0)if(Array.isArray(o))do o=r[n],o!==void 0&&(e.push(r.time),t.push(...o)),r=i[s++];while(r!==void 0);else if(o.toArray!==void 0)do o=r[n],o!==void 0&&(e.push(r.time),o.toArray(t,t.length)),r=i[s++];while(r!==void 0);else do o=r[n],o!==void 0&&(e.push(r.time),t.push(o)),r=i[s++];while(r!==void 0)}var gi=class{constructor(e,t,n,s){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new t.constructor(n),this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,s=t[n],r=t[n-1];n:{e:{let o;t:{i:if(!(e<s)){for(let a=n+2;;){if(s===void 0){if(e<r)break i;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===a)break;if(r=s,s=t[++n],e<s)break e}o=t.length;break t}if(!(e>=r)){let a=t[1];e<a&&(n=2,r=a);for(let c=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===c)break;if(s=r,r=t[--n-1],e>=r)break e}o=n,n=0;break t}break n}for(;n<o;){let a=n+o>>>1;e<t[a]?o=a:n=a+1}if(s=t[n],r=t[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,s)}return this.interpolate_(n,r,e,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=e*s;for(let o=0;o!==s;++o)t[o]=n[r+o];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},Na=class extends gi{constructor(e,t,n,s){super(e,t,n,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:kc,endingEnd:kc}}intervalChanged_(e,t,n){let s=this.parameterPositions,r=e-2,o=e+1,a=s[r],c=s[o];if(a===void 0)switch(this.getSettings_().endingStart){case Hc:r=e,a=2*t-n;break;case Vc:r=s.length-2,a=t+s[r]-s[r+1];break;default:r=e,a=n}if(c===void 0)switch(this.getSettings_().endingEnd){case Hc:o=e,c=2*n-t;break;case Vc:o=1,c=n+s[1]-s[0];break;default:o=e-1,c=t}let l=(n-t)*.5,u=this.valueSize;this._weightPrev=l/(t-a),this._weightNext=l/(c-n),this._offsetPrev=r*u,this._offsetNext=o*u}interpolate_(e,t,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=e*a,l=c-a,u=this._offsetPrev,h=this._offsetNext,d=this._weightPrev,f=this._weightNext,g=(n-t)/(s-t),x=g*g,m=x*g,p=-d*m+2*d*x-d*g,w=(1+d)*m+(-1.5-2*d)*x+(-.5+d)*g+1,T=(-1-f)*m+(1.5+f)*x+.5*g,v=f*m-f*x;for(let E=0;E!==a;++E)r[E]=p*o[u+E]+w*o[l+E]+T*o[c+E]+v*o[h+E];return r}},Ua=class extends gi{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e,t,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=e*a,l=c-a,u=(n-t)/(s-t),h=1-u;for(let d=0;d!==a;++d)r[d]=o[l+d]*h+o[c+d]*u;return r}},Fa=class extends gi{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e){return this.copySampleValue_(e-1)}},dn=class{constructor(e,t,n,s){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=_a(t,this.TimeBufferType),this.values=_a(n,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:_a(e.times,Array),values:_a(e.values,Array)};let s=e.getInterpolation();s!==e.DefaultInterpolation&&(n.interpolation=s)}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new Fa(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new Ua(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new Na(this.times,this.values,this.getValueSize(),e)}setInterpolation(e){let t;switch(e){case Zi:t=this.InterpolantFactoryMethodDiscrete;break;case Qi:t=this.InterpolantFactoryMethodLinear;break;case ya:t=this.InterpolantFactoryMethodSmooth;break}if(t===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return console.warn("THREE.KeyframeTrack:",n),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Zi;case this.InterpolantFactoryMethodLinear:return Qi;case this.InterpolantFactoryMethodSmooth:return ya}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,s=t.length;n!==s;++n)t[n]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,s=t.length;n!==s;++n)t[n]*=e}return this}trim(e,t){let n=this.times,s=n.length,r=0,o=s-1;for(;r!==s&&n[r]<e;)++r;for(;o!==-1&&n[o]>t;)--o;if(++o,r!==0||o!==s){r>=o&&(o=Math.max(o,1),r=o-1);let a=this.getValueSize();this.times=n.slice(r,o),this.values=this.values.slice(r*a,o*a)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),e=!1);let n=this.times,s=this.values,r=n.length;r===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),e=!1);let o=null;for(let a=0;a!==r;a++){let c=n[a];if(typeof c=="number"&&isNaN(c)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,a,c),e=!1;break}if(o!==null&&o>c){console.error("THREE.KeyframeTrack: Out of order keys.",this,a,c,o),e=!1;break}o=c}if(s!==void 0&&D0(s))for(let a=0,c=s.length;a!==c;++a){let l=s[a];if(isNaN(l)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,a,l),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),s=this.getInterpolation()===ya,r=e.length-1,o=1;for(let a=1;a<r;++a){let c=!1,l=e[a],u=e[a+1];if(l!==u&&(a!==1||l!==e[0]))if(s)c=!0;else{let h=a*n,d=h-n,f=h+n;for(let g=0;g!==n;++g){let x=t[h+g];if(x!==t[d+g]||x!==t[f+g]){c=!0;break}}}if(c){if(a!==o){e[o]=e[a];let h=a*n,d=o*n;for(let f=0;f!==n;++f)t[d+f]=t[h+f]}++o}}if(r>0){e[o]=e[r];for(let a=r*n,c=o*n,l=0;l!==n;++l)t[c+l]=t[a+l];++o}return o!==e.length?(this.times=e.slice(0,o),this.values=t.slice(0,o*n)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,s=new n(this.name,e,t);return s.createInterpolant=this.createInterpolant,s}};dn.prototype.ValueTypeName="";dn.prototype.TimeBufferType=Float32Array;dn.prototype.ValueBufferType=Float32Array;dn.prototype.DefaultInterpolation=Qi;var _i=class extends dn{constructor(e,t,n){super(e,t,n)}};_i.prototype.ValueTypeName="bool";_i.prototype.ValueBufferType=Array;_i.prototype.DefaultInterpolation=Zi;_i.prototype.InterpolantFactoryMethodLinear=void 0;_i.prototype.InterpolantFactoryMethodSmooth=void 0;var oo=class extends dn{constructor(e,t,n,s){super(e,t,n,s)}};oo.prototype.ValueTypeName="color";var Kn=class extends dn{constructor(e,t,n,s){super(e,t,n,s)}};Kn.prototype.ValueTypeName="number";var Oa=class extends gi{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e,t,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=(n-t)/(s-t),l=e*a;for(let u=l+a;l!==u;l+=4)an.slerpFlat(r,0,o,l-a,o,l,c);return r}},Zn=class extends dn{constructor(e,t,n,s){super(e,t,n,s)}InterpolantFactoryMethodLinear(e){return new Oa(this.times,this.values,this.getValueSize(),e)}};Zn.prototype.ValueTypeName="quaternion";Zn.prototype.InterpolantFactoryMethodSmooth=void 0;var xi=class extends dn{constructor(e,t,n){super(e,t,n)}};xi.prototype.ValueTypeName="string";xi.prototype.ValueBufferType=Array;xi.prototype.DefaultInterpolation=Zi;xi.prototype.InterpolantFactoryMethodLinear=void 0;xi.prototype.InterpolantFactoryMethodSmooth=void 0;var Qn=class extends dn{constructor(e,t,n,s){super(e,t,n,s)}};Qn.prototype.ValueTypeName="vector";var ao=class{constructor(e="",t=-1,n=[],s=If){this.name=e,this.tracks=n,this.duration=t,this.blendMode=s,this.uuid=Fn(),this.userData={},this.duration<0&&this.resetDuration()}static parse(e){let t=[],n=e.tracks,s=1/(e.fps||1);for(let o=0,a=n.length;o!==a;++o)t.push(F0(n[o]).scale(s));let r=new this(e.name,e.duration,t,e.blendMode);return r.uuid=e.uuid,r.userData=JSON.parse(e.userData||"{}"),r}static toJSON(e){let t=[],n=e.tracks,s={name:e.name,duration:e.duration,tracks:t,uuid:e.uuid,blendMode:e.blendMode,userData:JSON.stringify(e.userData)};for(let r=0,o=n.length;r!==o;++r)t.push(dn.toJSON(n[r]));return s}static CreateFromMorphTargetSequence(e,t,n,s){let r=t.length,o=[];for(let a=0;a<r;a++){let c=[],l=[];c.push((a+r-1)%r,a,(a+1)%r),l.push(0,1,0);let u=N0(c);c=$d(c,1,u),l=$d(l,1,u),!s&&c[0]===0&&(c.push(r),l.push(l[0])),o.push(new Kn(".morphTargetInfluences["+t[a].name+"]",c,l).scale(1/n))}return new this(e,-1,o)}static findByName(e,t){let n=e;if(!Array.isArray(e)){let s=e;n=s.geometry&&s.geometry.animations||s.animations}for(let s=0;s<n.length;s++)if(n[s].name===t)return n[s];return null}static CreateClipsFromMorphTargetSequences(e,t,n){let s={},r=/^([\w-]*?)([\d]+)$/;for(let a=0,c=e.length;a<c;a++){let l=e[a],u=l.name.match(r);if(u&&u.length>1){let h=u[1],d=s[h];d||(s[h]=d=[]),d.push(l)}}let o=[];for(let a in s)o.push(this.CreateFromMorphTargetSequence(a,s[a],t,n));return o}static parseAnimation(e,t){if(console.warn("THREE.AnimationClip: parseAnimation() is deprecated and will be removed with r185"),!e)return console.error("THREE.AnimationClip: No animation in JSONLoader data."),null;let n=function(h,d,f,g,x){if(f.length!==0){let m=[],p=[];Yf(f,m,p,g),m.length!==0&&x.push(new h(d,m,p))}},s=[],r=e.name||"default",o=e.fps||30,a=e.blendMode,c=e.length||-1,l=e.hierarchy||[];for(let h=0;h<l.length;h++){let d=l[h].keys;if(!(!d||d.length===0))if(d[0].morphTargets){let f={},g;for(g=0;g<d.length;g++)if(d[g].morphTargets)for(let x=0;x<d[g].morphTargets.length;x++)f[d[g].morphTargets[x]]=-1;for(let x in f){let m=[],p=[];for(let w=0;w!==d[g].morphTargets.length;++w){let T=d[g];m.push(T.time),p.push(T.morphTarget===x?1:0)}s.push(new Kn(".morphTargetInfluence["+x+"]",m,p))}c=f.length*o}else{let f=".bones["+t[h].name+"]";n(Qn,f+".position",d,"pos",s),n(Zn,f+".quaternion",d,"rot",s),n(Qn,f+".scale",d,"scl",s)}}return s.length===0?null:new this(r,c,s,a)}resetDuration(){let e=this.tracks,t=0;for(let n=0,s=e.length;n!==s;++n){let r=this.tracks[n];t=Math.max(t,r.times[r.times.length-1])}return this.duration=t,this}trim(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].trim(0,this.duration);return this}validate(){let e=!0;for(let t=0;t<this.tracks.length;t++)e=e&&this.tracks[t].validate();return e}optimize(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].optimize();return this}clone(){let e=[];for(let n=0;n<this.tracks.length;n++)e.push(this.tracks[n].clone());let t=new this.constructor(this.name,this.duration,e,this.blendMode);return t.userData=JSON.parse(JSON.stringify(this.userData)),t}toJSON(){return this.constructor.toJSON(this)}};function U0(i){switch(i.toLowerCase()){case"scalar":case"double":case"float":case"number":case"integer":return Kn;case"vector":case"vector2":case"vector3":case"vector4":return Qn;case"color":return oo;case"quaternion":return Zn;case"bool":case"boolean":return _i;case"string":return xi}throw new Error("THREE.KeyframeTrack: Unsupported typeName: "+i)}function F0(i){if(i.type===void 0)throw new Error("THREE.KeyframeTrack: track type undefined, can not parse");let e=U0(i.type);if(i.times===void 0){let t=[],n=[];Yf(i.keys,t,n,"value"),i.times=t,i.values=n}return e.parse!==void 0?e.parse(i):new e(i.name,i.times,i.values,i.interpolation)}var qn={enabled:!1,files:{},add:function(i,e){this.enabled!==!1&&(this.files[i]=e)},get:function(i){if(this.enabled!==!1)return this.files[i]},remove:function(i){delete this.files[i]},clear:function(){this.files={}}},Ba=class{constructor(e,t,n){let s=this,r=!1,o=0,a=0,c,l=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this.abortController=new AbortController,this.itemStart=function(u){a++,r===!1&&s.onStart!==void 0&&s.onStart(u,o,a),r=!0},this.itemEnd=function(u){o++,s.onProgress!==void 0&&s.onProgress(u,o,a),o===a&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(u){s.onError!==void 0&&s.onError(u)},this.resolveURL=function(u){return c?c(u):u},this.setURLModifier=function(u){return c=u,this},this.addHandler=function(u,h){return l.push(u,h),this},this.removeHandler=function(u){let h=l.indexOf(u);return h!==-1&&l.splice(h,2),this},this.getHandler=function(u){for(let h=0,d=l.length;h<d;h+=2){let f=l[h],g=l[h+1];if(f.global&&(f.lastIndex=0),f.test(u))return g}return null},this.abort=function(){return this.abortController.abort(),this.abortController=new AbortController,this}}},qf=new Ba,ei=class{constructor(e){this.manager=e!==void 0?e:qf,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){let n=this;return new Promise(function(s,r){n.load(e,s,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}};ei.DEFAULT_MATERIAL_NAME="__DEFAULT";var di={},Xc=class extends Error{constructor(e,t){super(e),this.response=t}},nr=class extends ei{constructor(e){super(e),this.mimeType="",this.responseType="",this._abortController=new AbortController}load(e,t,n,s){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let r=qn.get(`file:${e}`);if(r!==void 0)return this.manager.itemStart(e),setTimeout(()=>{t&&t(r),this.manager.itemEnd(e)},0),r;if(di[e]!==void 0){di[e].push({onLoad:t,onProgress:n,onError:s});return}di[e]=[],di[e].push({onLoad:t,onProgress:n,onError:s});let o=new Request(e,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin",signal:typeof AbortSignal.any=="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal}),a=this.mimeType,c=this.responseType;fetch(o).then(l=>{if(l.status===200||l.status===0){if(l.status===0&&console.warn("THREE.FileLoader: HTTP Status 0 received."),typeof ReadableStream>"u"||l.body===void 0||l.body.getReader===void 0)return l;let u=di[e],h=l.body.getReader(),d=l.headers.get("X-File-Size")||l.headers.get("Content-Length"),f=d?parseInt(d):0,g=f!==0,x=0,m=new ReadableStream({start(p){w();function w(){h.read().then(({done:T,value:v})=>{if(T)p.close();else{x+=v.byteLength;let E=new ProgressEvent("progress",{lengthComputable:g,loaded:x,total:f});for(let A=0,R=u.length;A<R;A++){let L=u[A];L.onProgress&&L.onProgress(E)}p.enqueue(v),w()}},T=>{p.error(T)})}}});return new Response(m)}else throw new Xc(`fetch for "${l.url}" responded with ${l.status}: ${l.statusText}`,l)}).then(l=>{switch(c){case"arraybuffer":return l.arrayBuffer();case"blob":return l.blob();case"document":return l.text().then(u=>new DOMParser().parseFromString(u,a));case"json":return l.json();default:if(a==="")return l.text();{let h=/charset="?([^;"\s]*)"?/i.exec(a),d=h&&h[1]?h[1].toLowerCase():void 0,f=new TextDecoder(d);return l.arrayBuffer().then(g=>f.decode(g))}}}).then(l=>{qn.add(`file:${e}`,l);let u=di[e];delete di[e];for(let h=0,d=u.length;h<d;h++){let f=u[h];f.onLoad&&f.onLoad(l)}}).catch(l=>{let u=di[e];if(u===void 0)throw this.manager.itemError(e),l;delete di[e];for(let h=0,d=u.length;h<d;h++){let f=u[h];f.onError&&f.onError(l)}this.manager.itemError(e)}).finally(()=>{this.manager.itemEnd(e)}),this.manager.itemStart(e)}setResponseType(e){return this.responseType=e,this}setMimeType(e){return this.mimeType=e,this}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}};var Ws=new WeakMap,za=class extends ei{constructor(e){super(e)}load(e,t,n,s){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let r=this,o=qn.get(`image:${e}`);if(o!==void 0){if(o.complete===!0)r.manager.itemStart(e),setTimeout(function(){t&&t(o),r.manager.itemEnd(e)},0);else{let h=Ws.get(o);h===void 0&&(h=[],Ws.set(o,h)),h.push({onLoad:t,onError:s})}return o}let a=$s("img");function c(){u(),t&&t(this);let h=Ws.get(this)||[];for(let d=0;d<h.length;d++){let f=h[d];f.onLoad&&f.onLoad(this)}Ws.delete(this),r.manager.itemEnd(e)}function l(h){u(),s&&s(h),qn.remove(`image:${e}`);let d=Ws.get(this)||[];for(let f=0;f<d.length;f++){let g=d[f];g.onError&&g.onError(h)}Ws.delete(this),r.manager.itemError(e),r.manager.itemEnd(e)}function u(){a.removeEventListener("load",c,!1),a.removeEventListener("error",l,!1)}return a.addEventListener("load",c,!1),a.addEventListener("error",l,!1),e.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(a.crossOrigin=this.crossOrigin),qn.add(`image:${e}`,a),r.manager.itemStart(e),a.src=e,a}};var lo=class extends ei{constructor(e){super(e)}load(e,t,n,s){let r=new Ft,o=new za(this.manager);return o.setCrossOrigin(this.crossOrigin),o.setPath(this.path),o.load(e,function(a){r.image=a,r.needsUpdate=!0,t!==void 0&&t(r)},n,s),r}},os=class extends Et{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new Ne(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(t.object.target=this.target.uuid),t}};var Uc=new je,jd=new D,Jd=new D,co=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new De(512,512),this.mapType=Hn,this.map=null,this.mapPass=null,this.matrix=new je,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new er,this._frameExtents=new De(1,1),this._viewportCount=1,this._viewports=[new dt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera,n=this.matrix;jd.setFromMatrixPosition(e.matrixWorld),t.position.copy(jd),Jd.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Jd),t.updateMatrixWorld(),Uc.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Uc,t.coordinateSystem,t.reversedDepth),t.reversedDepth?n.set(.5,0,0,.5,0,.5,0,.5,0,0,1,0,0,0,0,1):n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(Uc)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},Yc=class extends co{constructor(){super(new Pt(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1,this.aspect=1}updateMatrices(e){let t=this.camera,n=es*2*e.angle*this.focus,s=this.mapSize.width/this.mapSize.height*this.aspect,r=e.distance||t.far;(n!==t.fov||s!==t.aspect||r!==t.far)&&(t.fov=n,t.aspect=s,t.far=r,t.updateProjectionMatrix()),super.updateMatrices(e)}copy(e){return super.copy(e),this.focus=e.focus,this}},uo=class extends os{constructor(e,t,n=0,s=Math.PI/3,r=0,o=2){super(e,t),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(Et.DEFAULT_UP),this.updateMatrix(),this.target=new Et,this.distance=n,this.angle=s,this.penumbra=r,this.decay=o,this.map=null,this.shadow=new Yc}get power(){return this.intensity*Math.PI}set power(e){this.intensity=e/Math.PI}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.angle=e.angle,this.penumbra=e.penumbra,this.decay=e.decay,this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}},Kd=new je,Or=new D,Fc=new D,qc=class extends co{constructor(){super(new Pt(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new De(4,2),this._viewportCount=6,this._viewports=[new dt(2,1,1,1),new dt(0,1,1,1),new dt(3,1,1,1),new dt(1,1,1,1),new dt(3,0,1,1),new dt(1,0,1,1)],this._cubeDirections=[new D(1,0,0),new D(-1,0,0),new D(0,0,1),new D(0,0,-1),new D(0,1,0),new D(0,-1,0)],this._cubeUps=[new D(0,1,0),new D(0,1,0),new D(0,1,0),new D(0,1,0),new D(0,0,1),new D(0,0,-1)]}updateMatrices(e,t=0){let n=this.camera,s=this.matrix,r=e.distance||n.far;r!==n.far&&(n.far=r,n.updateProjectionMatrix()),Or.setFromMatrixPosition(e.matrixWorld),n.position.copy(Or),Fc.copy(n.position),Fc.add(this._cubeDirections[t]),n.up.copy(this._cubeUps[t]),n.lookAt(Fc),n.updateMatrixWorld(),s.makeTranslation(-Or.x,-Or.y,-Or.z),Kd.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Kd,n.coordinateSystem,n.reversedDepth)}},as=class extends os{constructor(e,t,n=0,s=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=s,this.shadow=new qc}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}},ls=class extends Yr{constructor(e=-1,t=1,n=1,s=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=s,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,s,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=n-e,o=n+e,a=s+t,c=s-t;if(this.view!==null&&this.view.enabled){let l=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=l*this.view.offsetX,o=r+l*this.view.width,a-=u*this.view.offsetY,c=a-u*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,c,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},$c=class extends co{constructor(){super(new ls(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},cs=class extends os{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Et.DEFAULT_UP),this.updateMatrix(),this.target=new Et,this.shadow=new $c}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}},ho=class extends os{constructor(e,t){super(e,t),this.isAmbientLight=!0,this.type="AmbientLight"}};var yi=class{static extractUrlBase(e){let t=e.lastIndexOf("/");return t===-1?"./":e.slice(0,t+1)}static resolveURL(e,t){return typeof e!="string"||e===""?"":(/^https?:\/\//i.test(t)&&/^\//.test(e)&&(t=t.replace(/(^https?:\/\/[^\/]+).*/i,"$1")),/^(https?:)?\/\//i.test(e)||/^data:.*,.*$/i.test(e)||/^blob:.*$/i.test(e)?e:t+e)}};var Oc=new WeakMap,fo=class extends ei{constructor(e){super(e),this.isImageBitmapLoader=!0,typeof createImageBitmap>"u"&&console.warn("THREE.ImageBitmapLoader: createImageBitmap() not supported."),typeof fetch>"u"&&console.warn("THREE.ImageBitmapLoader: fetch() not supported."),this.options={premultiplyAlpha:"none"},this._abortController=new AbortController}setOptions(e){return this.options=e,this}load(e,t,n,s){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let r=this,o=qn.get(`image-bitmap:${e}`);if(o!==void 0){if(r.manager.itemStart(e),o.then){o.then(l=>{if(Oc.has(o)===!0)s&&s(Oc.get(o)),r.manager.itemError(e),r.manager.itemEnd(e);else return t&&t(l),r.manager.itemEnd(e),l});return}return setTimeout(function(){t&&t(o),r.manager.itemEnd(e)},0),o}let a={};a.credentials=this.crossOrigin==="anonymous"?"same-origin":"include",a.headers=this.requestHeader,a.signal=typeof AbortSignal.any=="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal;let c=fetch(e,a).then(function(l){return l.blob()}).then(function(l){return createImageBitmap(l,Object.assign(r.options,{colorSpaceConversion:"none"}))}).then(function(l){return qn.add(`image-bitmap:${e}`,l),t&&t(l),r.manager.itemEnd(e),l}).catch(function(l){s&&s(l),Oc.set(c,l),qn.remove(`image-bitmap:${e}`),r.manager.itemError(e),r.manager.itemEnd(e)});qn.add(`image-bitmap:${e}`,c),r.manager.itemStart(e)}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}};var ka=class extends Pt{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}};var mu="\\[\\]\\.:\\/",O0=new RegExp("["+mu+"]","g"),gu="[^"+mu+"]",B0="[^"+mu.replace("\\.","")+"]",z0=/((?:WC+[\/:])*)/.source.replace("WC",gu),k0=/(WCOD+)?/.source.replace("WCOD",B0),H0=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",gu),V0=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",gu),G0=new RegExp("^"+z0+k0+H0+V0+"$"),W0=["material","materials","bones","map"],jc=class{constructor(e,t,n){let s=n||wt.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,s)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,s=this._bindings[n];s!==void 0&&s.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=n.length;s!==r;++s)n[s].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},wt=class i{constructor(e,t,n){this.path=t,this.parsedPath=n||i.parseTrackName(t),this.node=i.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,n){return e&&e.isAnimationObjectGroup?new i.Composite(e,t,n):new i(e,t,n)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(O0,"")}static parseTrackName(e){let t=G0.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},s=n.nodeName&&n.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=n.nodeName.substring(s+1);W0.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,s),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return n}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(r){for(let o=0;o<r.length;o++){let a=r[o];if(a.name===t||a.uuid===t)return a;let c=n(a.children);if(c)return c}return null},s=n(e.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)e[t++]=n[s]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,n=t.objectName,s=t.propertyName,r=t.propertyIndex;if(e||(e=i.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let l=t.objectIndex;switch(n){case"materials":if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let u=0;u<e.length;u++)if(e[u].name===l){l=u;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[n]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[n]}if(l!==void 0){if(e[l]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[l]}}let o=e[s];if(o===void 0){let l=t.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+l+"."+s+" but it wasn't found.",e);return}let a=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?a=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(a=this.Versioning.MatrixWorldNeedsUpdate);let c=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!e.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}c=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=r}else o.fromArray!==void 0&&o.toArray!==void 0?(c=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(c=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=s;this.getValue=this.GetterByBindingType[c],this.setValue=this.SetterByBindingTypeAndVersioning[c][a]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};wt.Composite=jc;wt.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};wt.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};wt.prototype.GetterByBindingType=[wt.prototype._getValue_direct,wt.prototype._getValue_array,wt.prototype._getValue_arrayElement,wt.prototype._getValue_toArray];wt.prototype.SetterByBindingTypeAndVersioning=[[wt.prototype._setValue_direct,wt.prototype._setValue_direct_setNeedsUpdate,wt.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[wt.prototype._setValue_array,wt.prototype._setValue_array_setNeedsUpdate,wt.prototype._setValue_array_setMatrixWorldNeedsUpdate],[wt.prototype._setValue_arrayElement,wt.prototype._setValue_arrayElement_setNeedsUpdate,wt.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[wt.prototype._setValue_fromArray,wt.prototype._setValue_fromArray_setNeedsUpdate,wt.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var eT=new Float32Array(1);var ir=class{constructor(e=1,t=0,n=0){this.radius=e,this.phi=t,this.theta=n}set(e,t,n){return this.radius=e,this.phi=t,this.theta=n,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){return this.phi=Qe(this.phi,1e-6,Math.PI-1e-6),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,n){return this.radius=Math.sqrt(e*e+t*t+n*n),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,n),this.phi=Math.acos(Qe(t/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}};var po=class extends ss{constructor(e=10,t=10,n=4473924,s=8947848){n=new Ne(n),s=new Ne(s);let r=t/2,o=e/t,a=e/2,c=[],l=[];for(let d=0,f=0,g=-a;d<=t;d++,g+=o){c.push(-a,0,g,a,0,g),c.push(g,0,-a,g,0,a);let x=d===r?n:s;x.toArray(l,f),f+=3,x.toArray(l,f),f+=3,x.toArray(l,f),f+=3,x.toArray(l,f),f+=3}let u=new Ct;u.setAttribute("position",new xt(c,3)),u.setAttribute("color",new xt(l,3));let h=new zn({vertexColors:!0,toneMapped:!1});super(u,h),this.type="GridHelper"}dispose(){this.geometry.dispose(),this.material.dispose()}};var Zd=new D,xa,Bc,mo=class extends Et{constructor(e=new D(0,0,1),t=new D(0,0,0),n=1,s=16776960,r=n*.2,o=r*.2){super(),this.type="ArrowHelper",xa===void 0&&(xa=new Ct,xa.setAttribute("position",new xt([0,0,0,0,1,0],3)),Bc=new Pa(.5,1,5,1),Bc.translate(0,-.5,0)),this.position.copy(t),this.line=new Jn(xa,new zn({color:s,toneMapped:!1})),this.line.matrixAutoUpdate=!1,this.add(this.line),this.cone=new ft(Bc,new en({color:s,toneMapped:!1})),this.cone.matrixAutoUpdate=!1,this.add(this.cone),this.setDirection(e),this.setLength(n,r,o)}setDirection(e){if(e.y>.99999)this.quaternion.set(0,0,0,1);else if(e.y<-.99999)this.quaternion.set(1,0,0,0);else{Zd.set(e.z,0,-e.x).normalize();let t=Math.acos(e.y);this.quaternion.setFromAxisAngle(Zd,t)}}setLength(e,t=e*.2,n=t*.2){this.line.scale.set(1,Math.max(1e-4,e-t),1),this.line.updateMatrix(),this.cone.scale.set(n,t,n),this.cone.position.y=e,this.cone.updateMatrix()}setColor(e){this.line.material.color.set(e),this.cone.material.color.set(e)}copy(e){return super.copy(e,!1),this.line.copy(e.line),this.cone.copy(e.cone),this}dispose(){this.line.geometry.dispose(),this.line.material.dispose(),this.cone.geometry.dispose(),this.cone.material.dispose()}},go=class extends ss{constructor(e=1){let t=[0,0,0,e,0,0,0,0,0,0,e,0,0,0,0,0,0,e],n=[1,0,0,1,.6,0,0,1,0,.6,1,0,0,0,1,0,.6,1],s=new Ct;s.setAttribute("position",new xt(t,3)),s.setAttribute("color",new xt(n,3));let r=new zn({vertexColors:!0,toneMapped:!1});super(s,r),this.type="AxesHelper"}setColors(e,t,n){let s=new Ne,r=this.geometry.attributes.color.array;return s.set(e),s.toArray(r,0),s.toArray(r,3),s.set(t),s.toArray(r,6),s.toArray(r,9),s.set(n),s.toArray(r,12),s.toArray(r,15),this.geometry.attributes.color.needsUpdate=!0,this}dispose(){this.geometry.dispose(),this.material.dispose()}};var _o=class extends $n{constructor(e,t=null){super(),this.object=e,this.domElement=t,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(e){if(e===void 0){console.warn("THREE.Controls: connect() now requires an element.");return}this.domElement!==null&&this.disconnect(),this.domElement=e}disconnect(){}dispose(){}update(){}};function _u(i,e,t,n){let s=X0(n);switch(t){case ou:return i*e;case nl:return i*e/s.components*s.byteLength;case il:return i*e/s.components*s.byteLength;case lu:return i*e*2/s.components*s.byteLength;case sl:return i*e*2/s.components*s.byteLength;case au:return i*e*3/s.components*s.byteLength;case _n:return i*e*4/s.components*s.byteLength;case rl:return i*e*4/s.components*s.byteLength;case yo:case vo:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case bo:case So:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case al:case cl:return Math.max(i,16)*Math.max(e,8)/4;case ol:case ll:return Math.max(i,8)*Math.max(e,8)/2;case ul:case hl:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case dl:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case fl:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case pl:return Math.floor((i+4)/5)*Math.floor((e+3)/4)*16;case ml:return Math.floor((i+4)/5)*Math.floor((e+4)/5)*16;case gl:return Math.floor((i+5)/6)*Math.floor((e+4)/5)*16;case _l:return Math.floor((i+5)/6)*Math.floor((e+5)/6)*16;case xl:return Math.floor((i+7)/8)*Math.floor((e+4)/5)*16;case yl:return Math.floor((i+7)/8)*Math.floor((e+5)/6)*16;case vl:return Math.floor((i+7)/8)*Math.floor((e+7)/8)*16;case bl:return Math.floor((i+9)/10)*Math.floor((e+4)/5)*16;case Sl:return Math.floor((i+9)/10)*Math.floor((e+5)/6)*16;case Ml:return Math.floor((i+9)/10)*Math.floor((e+7)/8)*16;case Tl:return Math.floor((i+9)/10)*Math.floor((e+9)/10)*16;case wl:return Math.floor((i+11)/12)*Math.floor((e+9)/10)*16;case El:return Math.floor((i+11)/12)*Math.floor((e+11)/12)*16;case Al:case Rl:case Cl:return Math.ceil(i/4)*Math.ceil(e/4)*16;case Il:case Pl:return Math.ceil(i/4)*Math.ceil(e/4)*8;case Ll:case Dl:return Math.ceil(i/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function X0(i){switch(i){case Hn:case nu:return{byteLength:1,components:1};case rr:case iu:case or:return{byteLength:2,components:1};case el:case tl:return{byteLength:2,components:4};case zi:case Qa:case En:return{byteLength:4,components:1};case su:case ru:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${i}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"180"}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="180");function _p(){let i=null,e=!1,t=null,n=null;function s(r,o){t(r,o),n=i.requestAnimationFrame(s)}return{start:function(){e!==!0&&t!==null&&(n=i.requestAnimationFrame(s),e=!0)},stop:function(){i.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){i=r}}}function q0(i){let e=new WeakMap;function t(a,c){let l=a.array,u=a.usage,h=l.byteLength,d=i.createBuffer();i.bindBuffer(c,d),i.bufferData(c,l,u),a.onUploadCallback();let f;if(l instanceof Float32Array)f=i.FLOAT;else if(typeof Float16Array<"u"&&l instanceof Float16Array)f=i.HALF_FLOAT;else if(l instanceof Uint16Array)a.isFloat16BufferAttribute?f=i.HALF_FLOAT:f=i.UNSIGNED_SHORT;else if(l instanceof Int16Array)f=i.SHORT;else if(l instanceof Uint32Array)f=i.UNSIGNED_INT;else if(l instanceof Int32Array)f=i.INT;else if(l instanceof Int8Array)f=i.BYTE;else if(l instanceof Uint8Array)f=i.UNSIGNED_BYTE;else if(l instanceof Uint8ClampedArray)f=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+l);return{buffer:d,type:f,bytesPerElement:l.BYTES_PER_ELEMENT,version:a.version,size:h}}function n(a,c,l){let u=c.array,h=c.updateRanges;if(i.bindBuffer(l,a),h.length===0)i.bufferSubData(l,0,u);else{h.sort((f,g)=>f.start-g.start);let d=0;for(let f=1;f<h.length;f++){let g=h[d],x=h[f];x.start<=g.start+g.count+1?g.count=Math.max(g.count,x.start+x.count-g.start):(++d,h[d]=x)}h.length=d+1;for(let f=0,g=h.length;f<g;f++){let x=h[f];i.bufferSubData(l,x.start*u.BYTES_PER_ELEMENT,u,x.start,x.count)}c.clearUpdateRanges()}c.onUploadCallback()}function s(a){return a.isInterleavedBufferAttribute&&(a=a.data),e.get(a)}function r(a){a.isInterleavedBufferAttribute&&(a=a.data);let c=e.get(a);c&&(i.deleteBuffer(c.buffer),e.delete(a))}function o(a,c){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){let u=e.get(a);(!u||u.version<a.version)&&e.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}let l=e.get(a);if(l===void 0)e.set(a,t(a,c));else if(l.version<a.version){if(l.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(l.buffer,a,c),l.version=a.version}}return{get:s,remove:r,update:o}}var $0=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,j0=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,J0=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,K0=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Z0=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Q0=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,e_=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,t_=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,n_=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,i_=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,s_=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,r_=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,o_=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,a_=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,l_=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,c_=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,u_=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,h_=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,d_=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,f_=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,p_=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,m_=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,g_=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,__=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,x_=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,y_=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,v_=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,b_=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,S_=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,M_=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,T_="gl_FragColor = linearToOutputTexel( gl_FragColor );",w_=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,E_=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,A_=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,R_=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,C_=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,I_=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,P_=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,L_=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,D_=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,N_=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,U_=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,F_=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,O_=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,B_=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,z_=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,k_=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,H_=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,V_=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,G_=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,W_=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,X_=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Y_=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,q_=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,$_=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,j_=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,J_=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,K_=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Z_=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Q_=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,ex=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,tx=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,nx=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,ix=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,sx=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,rx=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,ox=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,ax=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,lx=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,cx=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,ux=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,hx=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,dx=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,fx=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,px=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,mx=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,gx=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,_x=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,xx=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,yx=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,vx=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,bx=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Sx=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,Mx=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Tx=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,wx=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Ex=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Ax=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Rx=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Cx=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		float depth = unpackRGBAToDepth( texture2D( depths, uv ) );
		#ifdef USE_REVERSED_DEPTH_BUFFER
			return step( depth, compare );
		#else
			return step( compare, depth );
		#endif
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow( sampler2D shadow, vec2 uv, float compare ) {
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		#ifdef USE_REVERSED_DEPTH_BUFFER
			float hard_shadow = step( distribution.x, compare );
		#else
			float hard_shadow = step( compare, distribution.x );
		#endif
		if ( hard_shadow != 1.0 ) {
			float distance = compare - distribution.x;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,Ix=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Px=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Lx=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Dx=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Nx=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Ux=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Fx=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Ox=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Bx=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,zx=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,kx=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Hx=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,Vx=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Gx=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Wx=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Xx=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Yx=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,qx=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,$x=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,jx=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Jx=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Kx=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Zx=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Qx=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,ey=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,ty=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,ny=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,iy=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,sy=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,ry=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,oy=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,ay=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,ly=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,cy=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,uy=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,hy=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,dy=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,fy=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,py=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,my=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,gy=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,_y=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,xy=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,yy=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,vy=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,by=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Sy=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,My=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Ty=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,wy=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Ey=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Ze={alphahash_fragment:$0,alphahash_pars_fragment:j0,alphamap_fragment:J0,alphamap_pars_fragment:K0,alphatest_fragment:Z0,alphatest_pars_fragment:Q0,aomap_fragment:e_,aomap_pars_fragment:t_,batching_pars_vertex:n_,batching_vertex:i_,begin_vertex:s_,beginnormal_vertex:r_,bsdfs:o_,iridescence_fragment:a_,bumpmap_pars_fragment:l_,clipping_planes_fragment:c_,clipping_planes_pars_fragment:u_,clipping_planes_pars_vertex:h_,clipping_planes_vertex:d_,color_fragment:f_,color_pars_fragment:p_,color_pars_vertex:m_,color_vertex:g_,common:__,cube_uv_reflection_fragment:x_,defaultnormal_vertex:y_,displacementmap_pars_vertex:v_,displacementmap_vertex:b_,emissivemap_fragment:S_,emissivemap_pars_fragment:M_,colorspace_fragment:T_,colorspace_pars_fragment:w_,envmap_fragment:E_,envmap_common_pars_fragment:A_,envmap_pars_fragment:R_,envmap_pars_vertex:C_,envmap_physical_pars_fragment:k_,envmap_vertex:I_,fog_vertex:P_,fog_pars_vertex:L_,fog_fragment:D_,fog_pars_fragment:N_,gradientmap_pars_fragment:U_,lightmap_pars_fragment:F_,lights_lambert_fragment:O_,lights_lambert_pars_fragment:B_,lights_pars_begin:z_,lights_toon_fragment:H_,lights_toon_pars_fragment:V_,lights_phong_fragment:G_,lights_phong_pars_fragment:W_,lights_physical_fragment:X_,lights_physical_pars_fragment:Y_,lights_fragment_begin:q_,lights_fragment_maps:$_,lights_fragment_end:j_,logdepthbuf_fragment:J_,logdepthbuf_pars_fragment:K_,logdepthbuf_pars_vertex:Z_,logdepthbuf_vertex:Q_,map_fragment:ex,map_pars_fragment:tx,map_particle_fragment:nx,map_particle_pars_fragment:ix,metalnessmap_fragment:sx,metalnessmap_pars_fragment:rx,morphinstance_vertex:ox,morphcolor_vertex:ax,morphnormal_vertex:lx,morphtarget_pars_vertex:cx,morphtarget_vertex:ux,normal_fragment_begin:hx,normal_fragment_maps:dx,normal_pars_fragment:fx,normal_pars_vertex:px,normal_vertex:mx,normalmap_pars_fragment:gx,clearcoat_normal_fragment_begin:_x,clearcoat_normal_fragment_maps:xx,clearcoat_pars_fragment:yx,iridescence_pars_fragment:vx,opaque_fragment:bx,packing:Sx,premultiplied_alpha_fragment:Mx,project_vertex:Tx,dithering_fragment:wx,dithering_pars_fragment:Ex,roughnessmap_fragment:Ax,roughnessmap_pars_fragment:Rx,shadowmap_pars_fragment:Cx,shadowmap_pars_vertex:Ix,shadowmap_vertex:Px,shadowmask_pars_fragment:Lx,skinbase_vertex:Dx,skinning_pars_vertex:Nx,skinning_vertex:Ux,skinnormal_vertex:Fx,specularmap_fragment:Ox,specularmap_pars_fragment:Bx,tonemapping_fragment:zx,tonemapping_pars_fragment:kx,transmission_fragment:Hx,transmission_pars_fragment:Vx,uv_pars_fragment:Gx,uv_pars_vertex:Wx,uv_vertex:Xx,worldpos_vertex:Yx,background_vert:qx,background_frag:$x,backgroundCube_vert:jx,backgroundCube_frag:Jx,cube_vert:Kx,cube_frag:Zx,depth_vert:Qx,depth_frag:ey,distanceRGBA_vert:ty,distanceRGBA_frag:ny,equirect_vert:iy,equirect_frag:sy,linedashed_vert:ry,linedashed_frag:oy,meshbasic_vert:ay,meshbasic_frag:ly,meshlambert_vert:cy,meshlambert_frag:uy,meshmatcap_vert:hy,meshmatcap_frag:dy,meshnormal_vert:fy,meshnormal_frag:py,meshphong_vert:my,meshphong_frag:gy,meshphysical_vert:_y,meshphysical_frag:xy,meshtoon_vert:yy,meshtoon_frag:vy,points_vert:by,points_frag:Sy,shadow_vert:My,shadow_frag:Ty,sprite_vert:wy,sprite_frag:Ey},ge={common:{diffuse:{value:new Ne(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Je},alphaMap:{value:null},alphaMapTransform:{value:new Je},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Je}},envmap:{envMap:{value:null},envMapRotation:{value:new Je},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Je}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Je}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Je},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Je},normalScale:{value:new De(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Je},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Je}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Je}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Je}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Ne(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Ne(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Je},alphaTest:{value:0},uvTransform:{value:new Je}},sprite:{diffuse:{value:new Ne(16777215)},opacity:{value:1},center:{value:new De(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Je},alphaMap:{value:null},alphaMapTransform:{value:new Je},alphaTest:{value:0}}},ni={basic:{uniforms:nn([ge.common,ge.specularmap,ge.envmap,ge.aomap,ge.lightmap,ge.fog]),vertexShader:Ze.meshbasic_vert,fragmentShader:Ze.meshbasic_frag},lambert:{uniforms:nn([ge.common,ge.specularmap,ge.envmap,ge.aomap,ge.lightmap,ge.emissivemap,ge.bumpmap,ge.normalmap,ge.displacementmap,ge.fog,ge.lights,{emissive:{value:new Ne(0)}}]),vertexShader:Ze.meshlambert_vert,fragmentShader:Ze.meshlambert_frag},phong:{uniforms:nn([ge.common,ge.specularmap,ge.envmap,ge.aomap,ge.lightmap,ge.emissivemap,ge.bumpmap,ge.normalmap,ge.displacementmap,ge.fog,ge.lights,{emissive:{value:new Ne(0)},specular:{value:new Ne(1118481)},shininess:{value:30}}]),vertexShader:Ze.meshphong_vert,fragmentShader:Ze.meshphong_frag},standard:{uniforms:nn([ge.common,ge.envmap,ge.aomap,ge.lightmap,ge.emissivemap,ge.bumpmap,ge.normalmap,ge.displacementmap,ge.roughnessmap,ge.metalnessmap,ge.fog,ge.lights,{emissive:{value:new Ne(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ze.meshphysical_vert,fragmentShader:Ze.meshphysical_frag},toon:{uniforms:nn([ge.common,ge.aomap,ge.lightmap,ge.emissivemap,ge.bumpmap,ge.normalmap,ge.displacementmap,ge.gradientmap,ge.fog,ge.lights,{emissive:{value:new Ne(0)}}]),vertexShader:Ze.meshtoon_vert,fragmentShader:Ze.meshtoon_frag},matcap:{uniforms:nn([ge.common,ge.bumpmap,ge.normalmap,ge.displacementmap,ge.fog,{matcap:{value:null}}]),vertexShader:Ze.meshmatcap_vert,fragmentShader:Ze.meshmatcap_frag},points:{uniforms:nn([ge.points,ge.fog]),vertexShader:Ze.points_vert,fragmentShader:Ze.points_frag},dashed:{uniforms:nn([ge.common,ge.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ze.linedashed_vert,fragmentShader:Ze.linedashed_frag},depth:{uniforms:nn([ge.common,ge.displacementmap]),vertexShader:Ze.depth_vert,fragmentShader:Ze.depth_frag},normal:{uniforms:nn([ge.common,ge.bumpmap,ge.normalmap,ge.displacementmap,{opacity:{value:1}}]),vertexShader:Ze.meshnormal_vert,fragmentShader:Ze.meshnormal_frag},sprite:{uniforms:nn([ge.sprite,ge.fog]),vertexShader:Ze.sprite_vert,fragmentShader:Ze.sprite_frag},background:{uniforms:{uvTransform:{value:new Je},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ze.background_vert,fragmentShader:Ze.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Je}},vertexShader:Ze.backgroundCube_vert,fragmentShader:Ze.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ze.cube_vert,fragmentShader:Ze.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ze.equirect_vert,fragmentShader:Ze.equirect_frag},distanceRGBA:{uniforms:nn([ge.common,ge.displacementmap,{referencePosition:{value:new D},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ze.distanceRGBA_vert,fragmentShader:Ze.distanceRGBA_frag},shadow:{uniforms:nn([ge.lights,ge.fog,{color:{value:new Ne(0)},opacity:{value:1}}]),vertexShader:Ze.shadow_vert,fragmentShader:Ze.shadow_frag}};ni.physical={uniforms:nn([ni.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Je},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Je},clearcoatNormalScale:{value:new De(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Je},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Je},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Je},sheen:{value:0},sheenColor:{value:new Ne(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Je},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Je},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Je},transmissionSamplerSize:{value:new De},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Je},attenuationDistance:{value:0},attenuationColor:{value:new Ne(0)},specularColor:{value:new Ne(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Je},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Je},anisotropyVector:{value:new De},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Je}}]),vertexShader:Ze.meshphysical_vert,fragmentShader:Ze.meshphysical_frag};var Fl={r:0,b:0,g:0},ps=new wn,Ay=new je;function Ry(i,e,t,n,s,r,o){let a=new Ne(0),c=r===!0?0:1,l,u,h=null,d=0,f=null;function g(T){let v=T.isScene===!0?T.background:null;return v&&v.isTexture&&(v=(T.backgroundBlurriness>0?t:e).get(v)),v}function x(T){let v=!1,E=g(T);E===null?p(a,c):E&&E.isColor&&(p(E,1),v=!0);let A=i.xr.getEnvironmentBlendMode();A==="additive"?n.buffers.color.setClear(0,0,0,1,o):A==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,o),(i.autoClear||v)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function m(T,v){let E=g(v);E&&(E.isCubeTexture||E.mapping===xo)?(u===void 0&&(u=new ft(new Ni(1,1,1),new Bn({name:"BackgroundCubeMaterial",uniforms:fs(ni.backgroundCube.uniforms),vertexShader:ni.backgroundCube.vertexShader,fragmentShader:ni.backgroundCube.fragmentShader,side:Ot,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),u.geometry.deleteAttribute("normal"),u.geometry.deleteAttribute("uv"),u.onBeforeRender=function(A,R,L){this.matrixWorld.copyPosition(L.matrixWorld)},Object.defineProperty(u.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(u)),ps.copy(v.backgroundRotation),ps.x*=-1,ps.y*=-1,ps.z*=-1,E.isCubeTexture&&E.isRenderTargetTexture===!1&&(ps.y*=-1,ps.z*=-1),u.material.uniforms.envMap.value=E,u.material.uniforms.flipEnvMap.value=E.isCubeTexture&&E.isRenderTargetTexture===!1?-1:1,u.material.uniforms.backgroundBlurriness.value=v.backgroundBlurriness,u.material.uniforms.backgroundIntensity.value=v.backgroundIntensity,u.material.uniforms.backgroundRotation.value.setFromMatrix4(Ay.makeRotationFromEuler(ps)),u.material.toneMapped=ct.getTransfer(E.colorSpace)!==vt,(h!==E||d!==E.version||f!==i.toneMapping)&&(u.material.needsUpdate=!0,h=E,d=E.version,f=i.toneMapping),u.layers.enableAll(),T.unshift(u,u.geometry,u.material,0,0,null)):E&&E.isTexture&&(l===void 0&&(l=new ft(new so(2,2),new Bn({name:"BackgroundMaterial",uniforms:fs(ni.background.uniforms),vertexShader:ni.background.vertexShader,fragmentShader:ni.background.fragmentShader,side:On,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(l)),l.material.uniforms.t2D.value=E,l.material.uniforms.backgroundIntensity.value=v.backgroundIntensity,l.material.toneMapped=ct.getTransfer(E.colorSpace)!==vt,E.matrixAutoUpdate===!0&&E.updateMatrix(),l.material.uniforms.uvTransform.value.copy(E.matrix),(h!==E||d!==E.version||f!==i.toneMapping)&&(l.material.needsUpdate=!0,h=E,d=E.version,f=i.toneMapping),l.layers.enableAll(),T.unshift(l,l.geometry,l.material,0,0,null))}function p(T,v){T.getRGB(Fl,pu(i)),n.buffers.color.setClear(Fl.r,Fl.g,Fl.b,v,o)}function w(){u!==void 0&&(u.geometry.dispose(),u.material.dispose(),u=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return a},setClearColor:function(T,v=1){a.set(T),c=v,p(a,c)},getClearAlpha:function(){return c},setClearAlpha:function(T){c=T,p(a,c)},render:x,addToRenderList:m,dispose:w}}function Cy(i,e){let t=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=d(null),r=s,o=!1;function a(_,C,F,X,q){let J=!1,W=h(X,F,C);r!==W&&(r=W,l(r.object)),J=f(_,X,F,q),J&&g(_,X,F,q),q!==null&&e.update(q,i.ELEMENT_ARRAY_BUFFER),(J||o)&&(o=!1,v(_,C,F,X),q!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,e.get(q).buffer))}function c(){return i.createVertexArray()}function l(_){return i.bindVertexArray(_)}function u(_){return i.deleteVertexArray(_)}function h(_,C,F){let X=F.wireframe===!0,q=n[_.id];q===void 0&&(q={},n[_.id]=q);let J=q[C.id];J===void 0&&(J={},q[C.id]=J);let W=J[X];return W===void 0&&(W=d(c()),J[X]=W),W}function d(_){let C=[],F=[],X=[];for(let q=0;q<t;q++)C[q]=0,F[q]=0,X[q]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:C,enabledAttributes:F,attributeDivisors:X,object:_,attributes:{},index:null}}function f(_,C,F,X){let q=r.attributes,J=C.attributes,W=0,Z=F.getAttributes();for(let $ in Z)if(Z[$].location>=0){let ce=q[$],Re=J[$];if(Re===void 0&&($==="instanceMatrix"&&_.instanceMatrix&&(Re=_.instanceMatrix),$==="instanceColor"&&_.instanceColor&&(Re=_.instanceColor)),ce===void 0||ce.attribute!==Re||Re&&ce.data!==Re.data)return!0;W++}return r.attributesNum!==W||r.index!==X}function g(_,C,F,X){let q={},J=C.attributes,W=0,Z=F.getAttributes();for(let $ in Z)if(Z[$].location>=0){let ce=J[$];ce===void 0&&($==="instanceMatrix"&&_.instanceMatrix&&(ce=_.instanceMatrix),$==="instanceColor"&&_.instanceColor&&(ce=_.instanceColor));let Re={};Re.attribute=ce,ce&&ce.data&&(Re.data=ce.data),q[$]=Re,W++}r.attributes=q,r.attributesNum=W,r.index=X}function x(){let _=r.newAttributes;for(let C=0,F=_.length;C<F;C++)_[C]=0}function m(_){p(_,0)}function p(_,C){let F=r.newAttributes,X=r.enabledAttributes,q=r.attributeDivisors;F[_]=1,X[_]===0&&(i.enableVertexAttribArray(_),X[_]=1),q[_]!==C&&(i.vertexAttribDivisor(_,C),q[_]=C)}function w(){let _=r.newAttributes,C=r.enabledAttributes;for(let F=0,X=C.length;F<X;F++)C[F]!==_[F]&&(i.disableVertexAttribArray(F),C[F]=0)}function T(_,C,F,X,q,J,W){W===!0?i.vertexAttribIPointer(_,C,F,q,J):i.vertexAttribPointer(_,C,F,X,q,J)}function v(_,C,F,X){x();let q=X.attributes,J=F.getAttributes(),W=C.defaultAttributeValues;for(let Z in J){let $=J[Z];if($.location>=0){let ne=q[Z];if(ne===void 0&&(Z==="instanceMatrix"&&_.instanceMatrix&&(ne=_.instanceMatrix),Z==="instanceColor"&&_.instanceColor&&(ne=_.instanceColor)),ne!==void 0){let ce=ne.normalized,Re=ne.itemSize,He=e.get(ne);if(He===void 0)continue;let it=He.buffer,et=He.type,$e=He.bytesPerElement,K=et===i.INT||et===i.UNSIGNED_INT||ne.gpuType===Qa;if(ne.isInterleavedBufferAttribute){let ee=ne.data,_e=ee.stride,Fe=ne.offset;if(ee.isInstancedInterleavedBuffer){for(let we=0;we<$.locationSize;we++)p($.location+we,ee.meshPerAttribute);_.isInstancedMesh!==!0&&X._maxInstanceCount===void 0&&(X._maxInstanceCount=ee.meshPerAttribute*ee.count)}else for(let we=0;we<$.locationSize;we++)m($.location+we);i.bindBuffer(i.ARRAY_BUFFER,it);for(let we=0;we<$.locationSize;we++)T($.location+we,Re/$.locationSize,et,ce,_e*$e,(Fe+Re/$.locationSize*we)*$e,K)}else{if(ne.isInstancedBufferAttribute){for(let ee=0;ee<$.locationSize;ee++)p($.location+ee,ne.meshPerAttribute);_.isInstancedMesh!==!0&&X._maxInstanceCount===void 0&&(X._maxInstanceCount=ne.meshPerAttribute*ne.count)}else for(let ee=0;ee<$.locationSize;ee++)m($.location+ee);i.bindBuffer(i.ARRAY_BUFFER,it);for(let ee=0;ee<$.locationSize;ee++)T($.location+ee,Re/$.locationSize,et,ce,Re*$e,Re/$.locationSize*ee*$e,K)}}else if(W!==void 0){let ce=W[Z];if(ce!==void 0)switch(ce.length){case 2:i.vertexAttrib2fv($.location,ce);break;case 3:i.vertexAttrib3fv($.location,ce);break;case 4:i.vertexAttrib4fv($.location,ce);break;default:i.vertexAttrib1fv($.location,ce)}}}}w()}function E(){L();for(let _ in n){let C=n[_];for(let F in C){let X=C[F];for(let q in X)u(X[q].object),delete X[q];delete C[F]}delete n[_]}}function A(_){if(n[_.id]===void 0)return;let C=n[_.id];for(let F in C){let X=C[F];for(let q in X)u(X[q].object),delete X[q];delete C[F]}delete n[_.id]}function R(_){for(let C in n){let F=n[C];if(F[_.id]===void 0)continue;let X=F[_.id];for(let q in X)u(X[q].object),delete X[q];delete F[_.id]}}function L(){b(),o=!0,r!==s&&(r=s,l(r.object))}function b(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:a,reset:L,resetDefaultState:b,dispose:E,releaseStatesOfGeometry:A,releaseStatesOfProgram:R,initAttributes:x,enableAttribute:m,disableUnusedAttributes:w}}function Iy(i,e,t){let n;function s(l){n=l}function r(l,u){i.drawArrays(n,l,u),t.update(u,n,1)}function o(l,u,h){h!==0&&(i.drawArraysInstanced(n,l,u,h),t.update(u,n,h))}function a(l,u,h){if(h===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,l,0,u,0,h);let f=0;for(let g=0;g<h;g++)f+=u[g];t.update(f,n,1)}function c(l,u,h,d){if(h===0)return;let f=e.get("WEBGL_multi_draw");if(f===null)for(let g=0;g<l.length;g++)o(l[g],u[g],d[g]);else{f.multiDrawArraysInstancedWEBGL(n,l,0,u,0,d,0,h);let g=0;for(let x=0;x<h;x++)g+=u[x]*d[x];t.update(g,n,1)}}this.setMode=s,this.render=r,this.renderInstances=o,this.renderMultiDraw=a,this.renderMultiDrawInstances=c}function Py(i,e,t,n){let s;function r(){if(s!==void 0)return s;if(e.has("EXT_texture_filter_anisotropic")===!0){let R=e.get("EXT_texture_filter_anisotropic");s=i.getParameter(R.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function o(R){return!(R!==_n&&n.convert(R)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(R){let L=R===or&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(R!==Hn&&n.convert(R)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&R!==En&&!L)}function c(R){if(R==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";R="mediump"}return R==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let l=t.precision!==void 0?t.precision:"highp",u=c(l);u!==l&&(console.warn("THREE.WebGLRenderer:",l,"not supported, using",u,"instead."),l=u);let h=t.logarithmicDepthBuffer===!0,d=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control"),f=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),g=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),x=i.getParameter(i.MAX_TEXTURE_SIZE),m=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),p=i.getParameter(i.MAX_VERTEX_ATTRIBS),w=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),T=i.getParameter(i.MAX_VARYING_VECTORS),v=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),E=g>0,A=i.getParameter(i.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:a,precision:l,logarithmicDepthBuffer:h,reversedDepthBuffer:d,maxTextures:f,maxVertexTextures:g,maxTextureSize:x,maxCubemapSize:m,maxAttributes:p,maxVertexUniforms:w,maxVaryings:T,maxFragmentUniforms:v,vertexTextures:E,maxSamples:A}}function Ly(i){let e=this,t=null,n=0,s=!1,r=!1,o=new Tn,a=new Je,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(h,d){let f=h.length!==0||d||n!==0||s;return s=d,n=h.length,f},this.beginShadows=function(){r=!0,u(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(h,d){t=u(h,d,0)},this.setState=function(h,d,f){let g=h.clippingPlanes,x=h.clipIntersection,m=h.clipShadows,p=i.get(h);if(!s||g===null||g.length===0||r&&!m)r?u(null):l();else{let w=r?0:n,T=w*4,v=p.clippingState||null;c.value=v,v=u(g,d,T,f);for(let E=0;E!==T;++E)v[E]=t[E];p.clippingState=v,this.numIntersection=x?this.numPlanes:0,this.numPlanes+=w}};function l(){c.value!==t&&(c.value=t,c.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function u(h,d,f,g){let x=h!==null?h.length:0,m=null;if(x!==0){if(m=c.value,g!==!0||m===null){let p=f+x*4,w=d.matrixWorldInverse;a.getNormalMatrix(w),(m===null||m.length<p)&&(m=new Float32Array(p));for(let T=0,v=f;T!==x;++T,v+=4)o.copy(h[T]).applyMatrix4(w,a),o.normal.toArray(m,v),m[v+3]=o.constant}c.value=m,c.needsUpdate=!0}return e.numPlanes=x,e.numIntersection=0,m}}function Dy(i){let e=new WeakMap;function t(o,a){return a===Ja?o.mapping=us:a===Ka&&(o.mapping=hs),o}function n(o){if(o&&o.isTexture){let a=o.mapping;if(a===Ja||a===Ka)if(e.has(o)){let c=e.get(o).texture;return t(c,o.mapping)}else{let c=o.image;if(c&&c.height>0){let l=new Aa(c.height);return l.fromEquirectangularTexture(i,o),e.set(o,l),o.addEventListener("dispose",s),t(l.texture,o.mapping)}else return null}}return o}function s(o){let a=o.target;a.removeEventListener("dispose",s);let c=e.get(a);c!==void 0&&(e.delete(a),c.dispose())}function r(){e=new WeakMap}return{get:n,dispose:r}}var hr=4,$f=[.125,.215,.35,.446,.526,.582],_s=20,xu=new ls,jf=new Ne,yu=null,vu=0,bu=0,Su=!1,gs=(1+Math.sqrt(5))/2,ur=1/gs,Jf=[new D(-gs,ur,0),new D(gs,ur,0),new D(-ur,0,gs),new D(ur,0,gs),new D(0,gs,-ur),new D(0,gs,ur),new D(-1,1,-1),new D(1,1,-1),new D(-1,1,1),new D(1,1,1)],Ny=new D,fr=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,n=.1,s=100,r={}){let{size:o=256,position:a=Ny}=r;yu=this._renderer.getRenderTarget(),vu=this._renderer.getActiveCubeFace(),bu=this._renderer.getActiveMipmapLevel(),Su=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(o);let c=this._allocateTargets();return c.depthBuffer=!0,this._sceneToCubeUV(e,n,s,c,a),t>0&&this._blur(c,0,0,t),this._applyPMREM(c),this._cleanup(c),c}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Qf(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Zf(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(yu,vu,bu),this._renderer.xr.enabled=Su,e.scissorTest=!1,Ol(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===us||e.mapping===hs?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),yu=this._renderer.getRenderTarget(),vu=this._renderer.getActiveCubeFace(),bu=this._renderer.getActiveMipmapLevel(),Su=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:on,minFilter:on,generateMipmaps:!1,type:or,format:_n,colorSpace:$t,depthBuffer:!1},s=Kf(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Kf(e,t,n);let{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=Uy(r)),this._blurMaterial=Fy(r,e,t)}return s}_compileMaterial(e){let t=new ft(this._lodPlanes[0],e);this._renderer.compile(t,xu)}_sceneToCubeUV(e,t,n,s,r){let c=new Pt(90,1,t,n),l=[1,-1,1,1,1,1],u=[1,1,1,-1,-1,-1],h=this._renderer,d=h.autoClear,f=h.toneMapping;h.getClearColor(jf),h.toneMapping=bi,h.autoClear=!1,h.state.buffers.depth.getReversed()&&(h.setRenderTarget(s),h.clearDepth(),h.setRenderTarget(null));let x=new en({name:"PMREM.Background",side:Ot,depthWrite:!1,depthTest:!1}),m=new ft(new Ni,x),p=!1,w=e.background;w?w.isColor&&(x.color.copy(w),e.background=null,p=!0):(x.color.copy(jf),p=!0);for(let T=0;T<6;T++){let v=T%3;v===0?(c.up.set(0,l[T],0),c.position.set(r.x,r.y,r.z),c.lookAt(r.x+u[T],r.y,r.z)):v===1?(c.up.set(0,0,l[T]),c.position.set(r.x,r.y,r.z),c.lookAt(r.x,r.y+u[T],r.z)):(c.up.set(0,l[T],0),c.position.set(r.x,r.y,r.z),c.lookAt(r.x,r.y,r.z+u[T]));let E=this._cubeSize;Ol(s,v*E,T>2?E:0,E,E),h.setRenderTarget(s),p&&h.render(m,c),h.render(e,c)}m.geometry.dispose(),m.material.dispose(),h.toneMapping=f,h.autoClear=d,e.background=w}_textureToCubeUV(e,t){let n=this._renderer,s=e.mapping===us||e.mapping===hs;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=Qf()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Zf());let r=s?this._cubemapMaterial:this._equirectMaterial,o=new ft(this._lodPlanes[0],r),a=r.uniforms;a.envMap.value=e;let c=this._cubeSize;Ol(t,0,0,3*c,2*c),n.setRenderTarget(t),n.render(o,xu)}_applyPMREM(e){let t=this._renderer,n=t.autoClear;t.autoClear=!1;let s=this._lodPlanes.length;for(let r=1;r<s;r++){let o=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),a=Jf[(s-r-1)%Jf.length];this._blur(e,r-1,r,o,a)}t.autoClear=n}_blur(e,t,n,s,r){let o=this._pingPongRenderTarget;this._halfBlur(e,o,t,n,s,"latitudinal",r),this._halfBlur(o,e,n,n,s,"longitudinal",r)}_halfBlur(e,t,n,s,r,o,a){let c=this._renderer,l=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let u=3,h=new ft(this._lodPlanes[s],l),d=l.uniforms,f=this._sizeLods[n]-1,g=isFinite(r)?Math.PI/(2*f):2*Math.PI/(2*_s-1),x=r/g,m=isFinite(r)?1+Math.floor(u*x):_s;m>_s&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${_s}`);let p=[],w=0;for(let R=0;R<_s;++R){let L=R/x,b=Math.exp(-L*L/2);p.push(b),R===0?w+=b:R<m&&(w+=2*b)}for(let R=0;R<p.length;R++)p[R]=p[R]/w;d.envMap.value=e.texture,d.samples.value=m,d.weights.value=p,d.latitudinal.value=o==="latitudinal",a&&(d.poleAxis.value=a);let{_lodMax:T}=this;d.dTheta.value=g,d.mipInt.value=T-n;let v=this._sizeLods[s],E=3*v*(s>T-hr?s-T+hr:0),A=4*(this._cubeSize-v);Ol(t,E,A,3*v,2*v),c.setRenderTarget(t),c.render(h,xu)}};function Uy(i){let e=[],t=[],n=[],s=i,r=i-hr+1+$f.length;for(let o=0;o<r;o++){let a=Math.pow(2,s);t.push(a);let c=1/a;o>i-hr?c=$f[o-i+hr-1]:o===0&&(c=0),n.push(c);let l=1/(a-2),u=-l,h=1+l,d=[u,u,h,u,h,h,u,u,h,h,u,h],f=6,g=6,x=3,m=2,p=1,w=new Float32Array(x*g*f),T=new Float32Array(m*g*f),v=new Float32Array(p*g*f);for(let A=0;A<f;A++){let R=A%3*2/3-1,L=A>2?0:-1,b=[R,L,0,R+2/3,L,0,R+2/3,L+1,0,R,L,0,R+2/3,L+1,0,R,L+1,0];w.set(b,x*g*A),T.set(d,m*g*A);let _=[A,A,A,A,A,A];v.set(_,p*g*A)}let E=new Ct;E.setAttribute("position",new Dt(w,x)),E.setAttribute("uv",new Dt(T,m)),E.setAttribute("faceIndex",new Dt(v,p)),e.push(E),s>hr&&s--}return{lodPlanes:e,sizeLods:t,sigmas:n}}function Kf(i,e,t){let n=new jn(i,e,t);return n.texture.mapping=xo,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Ol(i,e,t,n,s){i.viewport.set(e,t,n,s),i.scissor.set(e,t,n,s)}function Fy(i,e,t){let n=new Float32Array(_s),s=new D(0,1,0);return new Bn({name:"SphericalGaussianBlur",defines:{n:_s,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:Lu(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:vi,depthTest:!1,depthWrite:!1})}function Zf(){return new Bn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Lu(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:vi,depthTest:!1,depthWrite:!1})}function Qf(){return new Bn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Lu(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:vi,depthTest:!1,depthWrite:!1})}function Lu(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function Oy(i){let e=new WeakMap,t=null;function n(a){if(a&&a.isTexture){let c=a.mapping,l=c===Ja||c===Ka,u=c===us||c===hs;if(l||u){let h=e.get(a),d=h!==void 0?h.texture.pmremVersion:0;if(a.isRenderTargetTexture&&a.pmremVersion!==d)return t===null&&(t=new fr(i)),h=l?t.fromEquirectangular(a,h):t.fromCubemap(a,h),h.texture.pmremVersion=a.pmremVersion,e.set(a,h),h.texture;if(h!==void 0)return h.texture;{let f=a.image;return l&&f&&f.height>0||u&&f&&s(f)?(t===null&&(t=new fr(i)),h=l?t.fromEquirectangular(a):t.fromCubemap(a),h.texture.pmremVersion=a.pmremVersion,e.set(a,h),a.addEventListener("dispose",r),h.texture):null}}}return a}function s(a){let c=0,l=6;for(let u=0;u<l;u++)a[u]!==void 0&&c++;return c===l}function r(a){let c=a.target;c.removeEventListener("dispose",r);let l=e.get(c);l!==void 0&&(e.delete(c),l.dispose())}function o(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:n,dispose:o}}function By(i){let e={};function t(n){if(e[n]!==void 0)return e[n];let s;switch(n){case"WEBGL_depth_texture":s=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=i.getExtension(n)}return e[n]=s,s}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){let s=t(n);return s===null&&js("THREE.WebGLRenderer: "+n+" extension not supported."),s}}}function zy(i,e,t,n){let s={},r=new WeakMap;function o(h){let d=h.target;d.index!==null&&e.remove(d.index);for(let g in d.attributes)e.remove(d.attributes[g]);d.removeEventListener("dispose",o),delete s[d.id];let f=r.get(d);f&&(e.remove(f),r.delete(d)),n.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,t.memory.geometries--}function a(h,d){return s[d.id]===!0||(d.addEventListener("dispose",o),s[d.id]=!0,t.memory.geometries++),d}function c(h){let d=h.attributes;for(let f in d)e.update(d[f],i.ARRAY_BUFFER)}function l(h){let d=[],f=h.index,g=h.attributes.position,x=0;if(f!==null){let w=f.array;x=f.version;for(let T=0,v=w.length;T<v;T+=3){let E=w[T+0],A=w[T+1],R=w[T+2];d.push(E,A,A,R,R,E)}}else if(g!==void 0){let w=g.array;x=g.version;for(let T=0,v=w.length/3-1;T<v;T+=3){let E=T+0,A=T+1,R=T+2;d.push(E,A,A,R,R,E)}}else return;let m=new(fu(d)?Xr:Wr)(d,1);m.version=x;let p=r.get(h);p&&e.remove(p),r.set(h,m)}function u(h){let d=r.get(h);if(d){let f=h.index;f!==null&&d.version<f.version&&l(h)}else l(h);return r.get(h)}return{get:a,update:c,getWireframeAttribute:u}}function ky(i,e,t){let n;function s(d){n=d}let r,o;function a(d){r=d.type,o=d.bytesPerElement}function c(d,f){i.drawElements(n,f,r,d*o),t.update(f,n,1)}function l(d,f,g){g!==0&&(i.drawElementsInstanced(n,f,r,d*o,g),t.update(f,n,g))}function u(d,f,g){if(g===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,f,0,r,d,0,g);let m=0;for(let p=0;p<g;p++)m+=f[p];t.update(m,n,1)}function h(d,f,g,x){if(g===0)return;let m=e.get("WEBGL_multi_draw");if(m===null)for(let p=0;p<d.length;p++)l(d[p]/o,f[p],x[p]);else{m.multiDrawElementsInstancedWEBGL(n,f,0,r,d,0,x,0,g);let p=0;for(let w=0;w<g;w++)p+=f[w]*x[w];t.update(p,n,1)}}this.setMode=s,this.setIndex=a,this.render=c,this.renderInstances=l,this.renderMultiDraw=u,this.renderMultiDrawInstances=h}function Hy(i){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,o,a){switch(t.calls++,o){case i.TRIANGLES:t.triangles+=a*(r/3);break;case i.LINES:t.lines+=a*(r/2);break;case i.LINE_STRIP:t.lines+=a*(r-1);break;case i.LINE_LOOP:t.lines+=a*r;break;case i.POINTS:t.points+=a*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function s(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:s,update:n}}function Vy(i,e,t){let n=new WeakMap,s=new dt;function r(o,a,c){let l=o.morphTargetInfluences,u=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,h=u!==void 0?u.length:0,d=n.get(a);if(d===void 0||d.count!==h){let b=function(){R.dispose(),n.delete(a),a.removeEventListener("dispose",b)};d!==void 0&&d.texture.dispose();let f=a.morphAttributes.position!==void 0,g=a.morphAttributes.normal!==void 0,x=a.morphAttributes.color!==void 0,m=a.morphAttributes.position||[],p=a.morphAttributes.normal||[],w=a.morphAttributes.color||[],T=0;f===!0&&(T=1),g===!0&&(T=2),x===!0&&(T=3);let v=a.attributes.position.count*T,E=1;v>e.maxTextureSize&&(E=Math.ceil(v/e.maxTextureSize),v=e.maxTextureSize);let A=new Float32Array(v*E*4*h),R=new Vr(A,v,E,h);R.type=En,R.needsUpdate=!0;let L=T*4;for(let _=0;_<h;_++){let C=m[_],F=p[_],X=w[_],q=v*E*4*_;for(let J=0;J<C.count;J++){let W=J*L;f===!0&&(s.fromBufferAttribute(C,J),A[q+W+0]=s.x,A[q+W+1]=s.y,A[q+W+2]=s.z,A[q+W+3]=0),g===!0&&(s.fromBufferAttribute(F,J),A[q+W+4]=s.x,A[q+W+5]=s.y,A[q+W+6]=s.z,A[q+W+7]=0),x===!0&&(s.fromBufferAttribute(X,J),A[q+W+8]=s.x,A[q+W+9]=s.y,A[q+W+10]=s.z,A[q+W+11]=X.itemSize===4?s.w:1)}}d={count:h,texture:R,size:new De(v,E)},n.set(a,d),a.addEventListener("dispose",b)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)c.getUniforms().setValue(i,"morphTexture",o.morphTexture,t);else{let f=0;for(let x=0;x<l.length;x++)f+=l[x];let g=a.morphTargetsRelative?1:1-f;c.getUniforms().setValue(i,"morphTargetBaseInfluence",g),c.getUniforms().setValue(i,"morphTargetInfluences",l)}c.getUniforms().setValue(i,"morphTargetsTexture",d.texture,t),c.getUniforms().setValue(i,"morphTargetsTextureSize",d.size)}return{update:r}}function Gy(i,e,t,n){let s=new WeakMap;function r(c){let l=n.render.frame,u=c.geometry,h=e.get(c,u);if(s.get(h)!==l&&(e.update(h),s.set(h,l)),c.isInstancedMesh&&(c.hasEventListener("dispose",a)===!1&&c.addEventListener("dispose",a),s.get(c)!==l&&(t.update(c.instanceMatrix,i.ARRAY_BUFFER),c.instanceColor!==null&&t.update(c.instanceColor,i.ARRAY_BUFFER),s.set(c,l))),c.isSkinnedMesh){let d=c.skeleton;s.get(d)!==l&&(d.update(),s.set(d,l))}return h}function o(){s=new WeakMap}function a(c){let l=c.target;l.removeEventListener("dispose",a),t.remove(l.instanceMatrix),l.instanceColor!==null&&t.remove(l.instanceColor)}return{update:r,dispose:o}}var xp=new Ft,ep=new to(1,1),yp=new Vr,vp=new wa,bp=new qr,tp=[],np=[],ip=new Float32Array(16),sp=new Float32Array(9),rp=new Float32Array(4);function pr(i,e,t){let n=i[0];if(n<=0||n>0)return i;let s=e*t,r=tp[s];if(r===void 0&&(r=new Float32Array(s),tp[s]=r),e!==0){n.toArray(r,0);for(let o=1,a=0;o!==e;++o)a+=t,i[o].toArray(r,a)}return r}function Bt(i,e){if(i.length!==e.length)return!1;for(let t=0,n=i.length;t<n;t++)if(i[t]!==e[t])return!1;return!0}function zt(i,e){for(let t=0,n=e.length;t<n;t++)i[t]=e[t]}function kl(i,e){let t=np[e];t===void 0&&(t=new Int32Array(e),np[e]=t);for(let n=0;n!==e;++n)t[n]=i.allocateTextureUnit();return t}function Wy(i,e){let t=this.cache;t[0]!==e&&(i.uniform1f(this.addr,e),t[0]=e)}function Xy(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Bt(t,e))return;i.uniform2fv(this.addr,e),zt(t,e)}}function Yy(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(i.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Bt(t,e))return;i.uniform3fv(this.addr,e),zt(t,e)}}function qy(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Bt(t,e))return;i.uniform4fv(this.addr,e),zt(t,e)}}function $y(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(Bt(t,e))return;i.uniformMatrix2fv(this.addr,!1,e),zt(t,e)}else{if(Bt(t,n))return;rp.set(n),i.uniformMatrix2fv(this.addr,!1,rp),zt(t,n)}}function jy(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(Bt(t,e))return;i.uniformMatrix3fv(this.addr,!1,e),zt(t,e)}else{if(Bt(t,n))return;sp.set(n),i.uniformMatrix3fv(this.addr,!1,sp),zt(t,n)}}function Jy(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(Bt(t,e))return;i.uniformMatrix4fv(this.addr,!1,e),zt(t,e)}else{if(Bt(t,n))return;ip.set(n),i.uniformMatrix4fv(this.addr,!1,ip),zt(t,n)}}function Ky(i,e){let t=this.cache;t[0]!==e&&(i.uniform1i(this.addr,e),t[0]=e)}function Zy(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Bt(t,e))return;i.uniform2iv(this.addr,e),zt(t,e)}}function Qy(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Bt(t,e))return;i.uniform3iv(this.addr,e),zt(t,e)}}function ev(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Bt(t,e))return;i.uniform4iv(this.addr,e),zt(t,e)}}function tv(i,e){let t=this.cache;t[0]!==e&&(i.uniform1ui(this.addr,e),t[0]=e)}function nv(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Bt(t,e))return;i.uniform2uiv(this.addr,e),zt(t,e)}}function iv(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Bt(t,e))return;i.uniform3uiv(this.addr,e),zt(t,e)}}function sv(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Bt(t,e))return;i.uniform4uiv(this.addr,e),zt(t,e)}}function rv(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(ep.compareFunction=uu,r=ep):r=xp,t.setTexture2D(e||r,s)}function ov(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture3D(e||vp,s)}function av(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTextureCube(e||bp,s)}function lv(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture2DArray(e||yp,s)}function cv(i){switch(i){case 5126:return Wy;case 35664:return Xy;case 35665:return Yy;case 35666:return qy;case 35674:return $y;case 35675:return jy;case 35676:return Jy;case 5124:case 35670:return Ky;case 35667:case 35671:return Zy;case 35668:case 35672:return Qy;case 35669:case 35673:return ev;case 5125:return tv;case 36294:return nv;case 36295:return iv;case 36296:return sv;case 35678:case 36198:case 36298:case 36306:case 35682:return rv;case 35679:case 36299:case 36307:return ov;case 35680:case 36300:case 36308:case 36293:return av;case 36289:case 36303:case 36311:case 36292:return lv}}function uv(i,e){i.uniform1fv(this.addr,e)}function hv(i,e){let t=pr(e,this.size,2);i.uniform2fv(this.addr,t)}function dv(i,e){let t=pr(e,this.size,3);i.uniform3fv(this.addr,t)}function fv(i,e){let t=pr(e,this.size,4);i.uniform4fv(this.addr,t)}function pv(i,e){let t=pr(e,this.size,4);i.uniformMatrix2fv(this.addr,!1,t)}function mv(i,e){let t=pr(e,this.size,9);i.uniformMatrix3fv(this.addr,!1,t)}function gv(i,e){let t=pr(e,this.size,16);i.uniformMatrix4fv(this.addr,!1,t)}function _v(i,e){i.uniform1iv(this.addr,e)}function xv(i,e){i.uniform2iv(this.addr,e)}function yv(i,e){i.uniform3iv(this.addr,e)}function vv(i,e){i.uniform4iv(this.addr,e)}function bv(i,e){i.uniform1uiv(this.addr,e)}function Sv(i,e){i.uniform2uiv(this.addr,e)}function Mv(i,e){i.uniform3uiv(this.addr,e)}function Tv(i,e){i.uniform4uiv(this.addr,e)}function wv(i,e,t){let n=this.cache,s=e.length,r=kl(t,s);Bt(n,r)||(i.uniform1iv(this.addr,r),zt(n,r));for(let o=0;o!==s;++o)t.setTexture2D(e[o]||xp,r[o])}function Ev(i,e,t){let n=this.cache,s=e.length,r=kl(t,s);Bt(n,r)||(i.uniform1iv(this.addr,r),zt(n,r));for(let o=0;o!==s;++o)t.setTexture3D(e[o]||vp,r[o])}function Av(i,e,t){let n=this.cache,s=e.length,r=kl(t,s);Bt(n,r)||(i.uniform1iv(this.addr,r),zt(n,r));for(let o=0;o!==s;++o)t.setTextureCube(e[o]||bp,r[o])}function Rv(i,e,t){let n=this.cache,s=e.length,r=kl(t,s);Bt(n,r)||(i.uniform1iv(this.addr,r),zt(n,r));for(let o=0;o!==s;++o)t.setTexture2DArray(e[o]||yp,r[o])}function Cv(i){switch(i){case 5126:return uv;case 35664:return hv;case 35665:return dv;case 35666:return fv;case 35674:return pv;case 35675:return mv;case 35676:return gv;case 5124:case 35670:return _v;case 35667:case 35671:return xv;case 35668:case 35672:return yv;case 35669:case 35673:return vv;case 5125:return bv;case 36294:return Sv;case 36295:return Mv;case 36296:return Tv;case 35678:case 36198:case 36298:case 36306:case 35682:return wv;case 35679:case 36299:case 36307:return Ev;case 35680:case 36300:case 36308:case 36293:return Av;case 36289:case 36303:case 36311:case 36292:return Rv}}var Tu=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=cv(t.type)}},wu=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=Cv(t.type)}},Eu=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let s=this.seq;for(let r=0,o=s.length;r!==o;++r){let a=s[r];a.setValue(e,t[a.id],n)}}},Mu=/(\w+)(\])?(\[|\.)?/g;function op(i,e){i.seq.push(e),i.map[e.id]=e}function Iv(i,e,t){let n=i.name,s=n.length;for(Mu.lastIndex=0;;){let r=Mu.exec(n),o=Mu.lastIndex,a=r[1],c=r[2]==="]",l=r[3];if(c&&(a=a|0),l===void 0||l==="["&&o+2===s){op(t,l===void 0?new Tu(a,i,e):new wu(a,i,e));break}else{let h=t.map[a];h===void 0&&(h=new Eu(a),op(t,h)),t=h}}}var dr=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let s=0;s<n;++s){let r=e.getActiveUniform(t,s),o=e.getUniformLocation(t,r.name);Iv(r,o,this)}}setValue(e,t,n,s){let r=this.map[t];r!==void 0&&r.setValue(e,n,s)}setOptional(e,t,n){let s=t[n];s!==void 0&&this.setValue(e,n,s)}static upload(e,t,n,s){for(let r=0,o=t.length;r!==o;++r){let a=t[r],c=n[a.id];c.needsUpdate!==!1&&a.setValue(e,c.value,s)}}static seqWithValue(e,t){let n=[];for(let s=0,r=e.length;s!==r;++s){let o=e[s];o.id in t&&n.push(o)}return n}};function ap(i,e,t){let n=i.createShader(e);return i.shaderSource(n,t),i.compileShader(n),n}var Pv=37297,Lv=0;function Dv(i,e){let t=i.split(`
`),n=[],s=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let o=s;o<r;o++){let a=o+1;n.push(`${a===e?">":" "} ${a}: ${t[o]}`)}return n.join(`
`)}var lp=new Je;function Nv(i){ct._getMatrix(lp,ct.workingColorSpace,i);let e=`mat3( ${lp.elements.map(t=>t.toFixed(4))} )`;switch(ct.getTransfer(i)){case kr:return[e,"LinearTransferOETF"];case vt:return[e,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",i),[e,"LinearTransferOETF"]}}function cp(i,e,t){let n=i.getShaderParameter(e,i.COMPILE_STATUS),r=(i.getShaderInfoLog(e)||"").trim();if(n&&r==="")return"";let o=/ERROR: 0:(\d+)/.exec(r);if(o){let a=parseInt(o[1]);return t.toUpperCase()+`

`+r+`

`+Dv(i.getShaderSource(e),a)}else return r}function Uv(i,e){let t=Nv(e);return[`vec4 ${i}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}function Fv(i,e){let t;switch(e){case Mf:t="Linear";break;case Tf:t="Reinhard";break;case wf:t="Cineon";break;case ja:t="ACESFilmic";break;case Af:t="AgX";break;case Rf:t="Neutral";break;case Ef:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+i+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var Bl=new D;function Ov(){ct.getLuminanceCoefficients(Bl);let i=Bl.x.toFixed(4),e=Bl.y.toFixed(4),t=Bl.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Bv(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(wo).join(`
`)}function zv(i){let e=[];for(let t in i){let n=i[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function kv(i,e){let t={},n=i.getProgramParameter(e,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){let r=i.getActiveAttrib(e,s),o=r.name,a=1;r.type===i.FLOAT_MAT2&&(a=2),r.type===i.FLOAT_MAT3&&(a=3),r.type===i.FLOAT_MAT4&&(a=4),t[o]={type:r.type,location:i.getAttribLocation(e,o),locationSize:a}}return t}function wo(i){return i!==""}function up(i,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function hp(i,e){return i.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var Hv=/^[ \t]*#include +<([\w\d./]+)>/gm;function Au(i){return i.replace(Hv,Gv)}var Vv=new Map;function Gv(i,e){let t=Ze[e];if(t===void 0){let n=Vv.get(e);if(n!==void 0)t=Ze[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n);else throw new Error("Can not resolve #include <"+e+">")}return Au(t)}var Wv=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function dp(i){return i.replace(Wv,Xv)}function Xv(i,e,t,n){let s="";for(let r=parseInt(e);r<parseInt(t);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function fp(i){let e=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?e+=`
#define HIGH_PRECISION`:i.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function Yv(i){let e="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===Kc?e="SHADOWMAP_TYPE_PCF":i.shadowMapType===tf?e="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===ti&&(e="SHADOWMAP_TYPE_VSM"),e}function qv(i){let e="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case us:case hs:e="ENVMAP_TYPE_CUBE";break;case xo:e="ENVMAP_TYPE_CUBE_UV";break}return e}function $v(i){let e="ENVMAP_MODE_REFLECTION";if(i.envMap)switch(i.envMapMode){case hs:e="ENVMAP_MODE_REFRACTION";break}return e}function jv(i){let e="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case $a:e="ENVMAP_BLENDING_MULTIPLY";break;case bf:e="ENVMAP_BLENDING_MIX";break;case Sf:e="ENVMAP_BLENDING_ADD";break}return e}function Jv(i){let e=i.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:n,maxMip:t}}function Kv(i,e,t,n){let s=i.getContext(),r=t.defines,o=t.vertexShader,a=t.fragmentShader,c=Yv(t),l=qv(t),u=$v(t),h=jv(t),d=Jv(t),f=Bv(t),g=zv(r),x=s.createProgram(),m,p,w=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(wo).join(`
`),m.length>0&&(m+=`
`),p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(wo).join(`
`),p.length>0&&(p+=`
`)):(m=[fp(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+u:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(wo).join(`
`),p=[fp(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+l:"",t.envMap?"#define "+u:"",t.envMap?"#define "+h:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor||t.batchingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==bi?"#define TONE_MAPPING":"",t.toneMapping!==bi?Ze.tonemapping_pars_fragment:"",t.toneMapping!==bi?Fv("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Ze.colorspace_pars_fragment,Uv("linearToOutputTexel",t.outputColorSpace),Ov(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(wo).join(`
`)),o=Au(o),o=up(o,t),o=hp(o,t),a=Au(a),a=up(a,t),a=hp(a,t),o=dp(o),a=dp(a),t.isRawShaderMaterial!==!0&&(w=`#version 300 es
`,m=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,p=["#define varying in",t.glslVersion===hu?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===hu?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);let T=w+m+o,v=w+p+a,E=ap(s,s.VERTEX_SHADER,T),A=ap(s,s.FRAGMENT_SHADER,v);s.attachShader(x,E),s.attachShader(x,A),t.index0AttributeName!==void 0?s.bindAttribLocation(x,0,t.index0AttributeName):t.morphTargets===!0&&s.bindAttribLocation(x,0,"position"),s.linkProgram(x);function R(C){if(i.debug.checkShaderErrors){let F=s.getProgramInfoLog(x)||"",X=s.getShaderInfoLog(E)||"",q=s.getShaderInfoLog(A)||"",J=F.trim(),W=X.trim(),Z=q.trim(),$=!0,ne=!0;if(s.getProgramParameter(x,s.LINK_STATUS)===!1)if($=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,x,E,A);else{let ce=cp(s,E,"vertex"),Re=cp(s,A,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(x,s.VALIDATE_STATUS)+`

Material Name: `+C.name+`
Material Type: `+C.type+`

Program Info Log: `+J+`
`+ce+`
`+Re)}else J!==""?console.warn("THREE.WebGLProgram: Program Info Log:",J):(W===""||Z==="")&&(ne=!1);ne&&(C.diagnostics={runnable:$,programLog:J,vertexShader:{log:W,prefix:m},fragmentShader:{log:Z,prefix:p}})}s.deleteShader(E),s.deleteShader(A),L=new dr(s,x),b=kv(s,x)}let L;this.getUniforms=function(){return L===void 0&&R(this),L};let b;this.getAttributes=function(){return b===void 0&&R(this),b};let _=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return _===!1&&(_=s.getProgramParameter(x,Pv)),_},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(x),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=Lv++,this.cacheKey=e,this.usedTimes=1,this.program=x,this.vertexShader=E,this.fragmentShader=A,this}var Zv=0,Ru=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){let t=e.vertexShader,n=e.fragmentShader,s=this._getShaderStage(t),r=this._getShaderStage(n),o=this._getShaderCacheForMaterial(e);return o.has(s)===!1&&(o.add(s),s.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new Cu(e),t.set(e,n)),n}},Cu=class{constructor(e){this.id=Zv++,this.code=e,this.usedTimes=0}};function Qv(i,e,t,n,s,r,o){let a=new Gr,c=new Ru,l=new Set,u=[],h=s.logarithmicDepthBuffer,d=s.vertexTextures,f=s.precision,g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function x(b){return l.add(b),b===0?"uv":`uv${b}`}function m(b,_,C,F,X){let q=F.fog,J=X.geometry,W=b.isMeshStandardMaterial?F.environment:null,Z=(b.isMeshStandardMaterial?t:e).get(b.envMap||W),$=Z&&Z.mapping===xo?Z.image.height:null,ne=g[b.type];b.precision!==null&&(f=s.getMaxPrecision(b.precision),f!==b.precision&&console.warn("THREE.WebGLProgram.getParameters:",b.precision,"not supported, using",f,"instead."));let ce=J.morphAttributes.position||J.morphAttributes.normal||J.morphAttributes.color,Re=ce!==void 0?ce.length:0,He=0;J.morphAttributes.position!==void 0&&(He=1),J.morphAttributes.normal!==void 0&&(He=2),J.morphAttributes.color!==void 0&&(He=3);let it,et,$e,K;if(ne){let Ke=ni[ne];it=Ke.vertexShader,et=Ke.fragmentShader}else it=b.vertexShader,et=b.fragmentShader,c.update(b),$e=c.getVertexShaderID(b),K=c.getFragmentShaderID(b);let ee=i.getRenderTarget(),_e=i.state.buffers.depth.getReversed(),Fe=X.isInstancedMesh===!0,we=X.isBatchedMesh===!0,Ve=!!b.map,bt=!!b.matcap,I=!!Z,st=!!b.aoMap,ke=!!b.lightMap,pe=!!b.bumpMap,ye=!!b.normalMap,tt=!!b.displacementMap,O=!!b.emissiveMap,Q=!!b.metalnessMap,be=!!b.roughnessMap,Ie=b.anisotropy>0,S=b.clearcoat>0,y=b.dispersion>0,H=b.iridescence>0,P=b.sheen>0,G=b.transmission>0,V=Ie&&!!b.anisotropyMap,de=S&&!!b.clearcoatMap,ae=S&&!!b.clearcoatNormalMap,Ae=S&&!!b.clearcoatRoughnessMap,Ce=H&&!!b.iridescenceMap,re=H&&!!b.iridescenceThicknessMap,me=P&&!!b.sheenColorMap,Be=P&&!!b.sheenRoughnessMap,Pe=!!b.specularMap,fe=!!b.specularColorMap,qe=!!b.specularIntensityMap,U=G&&!!b.transmissionMap,ue=G&&!!b.thicknessMap,he=!!b.gradientMap,Me=!!b.alphaMap,se=b.alphaTest>0,te=!!b.alphaHash,Ee=!!b.extensions,Xe=bi;b.toneMapped&&(ee===null||ee.isXRRenderTarget===!0)&&(Xe=i.toneMapping);let ut={shaderID:ne,shaderType:b.type,shaderName:b.name,vertexShader:it,fragmentShader:et,defines:b.defines,customVertexShaderID:$e,customFragmentShaderID:K,isRawShaderMaterial:b.isRawShaderMaterial===!0,glslVersion:b.glslVersion,precision:f,batching:we,batchingColor:we&&X._colorsTexture!==null,instancing:Fe,instancingColor:Fe&&X.instanceColor!==null,instancingMorph:Fe&&X.morphTexture!==null,supportsVertexTextures:d,outputColorSpace:ee===null?i.outputColorSpace:ee.isXRRenderTarget===!0?ee.texture.colorSpace:$t,alphaToCoverage:!!b.alphaToCoverage,map:Ve,matcap:bt,envMap:I,envMapMode:I&&Z.mapping,envMapCubeUVHeight:$,aoMap:st,lightMap:ke,bumpMap:pe,normalMap:ye,displacementMap:d&&tt,emissiveMap:O,normalMapObjectSpace:ye&&b.normalMapType===Df,normalMapTangentSpace:ye&&b.normalMapType===Nl,metalnessMap:Q,roughnessMap:be,anisotropy:Ie,anisotropyMap:V,clearcoat:S,clearcoatMap:de,clearcoatNormalMap:ae,clearcoatRoughnessMap:Ae,dispersion:y,iridescence:H,iridescenceMap:Ce,iridescenceThicknessMap:re,sheen:P,sheenColorMap:me,sheenRoughnessMap:Be,specularMap:Pe,specularColorMap:fe,specularIntensityMap:qe,transmission:G,transmissionMap:U,thicknessMap:ue,gradientMap:he,opaque:b.transparent===!1&&b.blending===Ji&&b.alphaToCoverage===!1,alphaMap:Me,alphaTest:se,alphaHash:te,combine:b.combine,mapUv:Ve&&x(b.map.channel),aoMapUv:st&&x(b.aoMap.channel),lightMapUv:ke&&x(b.lightMap.channel),bumpMapUv:pe&&x(b.bumpMap.channel),normalMapUv:ye&&x(b.normalMap.channel),displacementMapUv:tt&&x(b.displacementMap.channel),emissiveMapUv:O&&x(b.emissiveMap.channel),metalnessMapUv:Q&&x(b.metalnessMap.channel),roughnessMapUv:be&&x(b.roughnessMap.channel),anisotropyMapUv:V&&x(b.anisotropyMap.channel),clearcoatMapUv:de&&x(b.clearcoatMap.channel),clearcoatNormalMapUv:ae&&x(b.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:Ae&&x(b.clearcoatRoughnessMap.channel),iridescenceMapUv:Ce&&x(b.iridescenceMap.channel),iridescenceThicknessMapUv:re&&x(b.iridescenceThicknessMap.channel),sheenColorMapUv:me&&x(b.sheenColorMap.channel),sheenRoughnessMapUv:Be&&x(b.sheenRoughnessMap.channel),specularMapUv:Pe&&x(b.specularMap.channel),specularColorMapUv:fe&&x(b.specularColorMap.channel),specularIntensityMapUv:qe&&x(b.specularIntensityMap.channel),transmissionMapUv:U&&x(b.transmissionMap.channel),thicknessMapUv:ue&&x(b.thicknessMap.channel),alphaMapUv:Me&&x(b.alphaMap.channel),vertexTangents:!!J.attributes.tangent&&(ye||Ie),vertexColors:b.vertexColors,vertexAlphas:b.vertexColors===!0&&!!J.attributes.color&&J.attributes.color.itemSize===4,pointsUvs:X.isPoints===!0&&!!J.attributes.uv&&(Ve||Me),fog:!!q,useFog:b.fog===!0,fogExp2:!!q&&q.isFogExp2,flatShading:b.flatShading===!0&&b.wireframe===!1,sizeAttenuation:b.sizeAttenuation===!0,logarithmicDepthBuffer:h,reversedDepthBuffer:_e,skinning:X.isSkinnedMesh===!0,morphTargets:J.morphAttributes.position!==void 0,morphNormals:J.morphAttributes.normal!==void 0,morphColors:J.morphAttributes.color!==void 0,morphTargetsCount:Re,morphTextureStride:He,numDirLights:_.directional.length,numPointLights:_.point.length,numSpotLights:_.spot.length,numSpotLightMaps:_.spotLightMap.length,numRectAreaLights:_.rectArea.length,numHemiLights:_.hemi.length,numDirLightShadows:_.directionalShadowMap.length,numPointLightShadows:_.pointShadowMap.length,numSpotLightShadows:_.spotShadowMap.length,numSpotLightShadowsWithMaps:_.numSpotLightShadowsWithMaps,numLightProbes:_.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:b.dithering,shadowMapEnabled:i.shadowMap.enabled&&C.length>0,shadowMapType:i.shadowMap.type,toneMapping:Xe,decodeVideoTexture:Ve&&b.map.isVideoTexture===!0&&ct.getTransfer(b.map.colorSpace)===vt,decodeVideoTextureEmissive:O&&b.emissiveMap.isVideoTexture===!0&&ct.getTransfer(b.emissiveMap.colorSpace)===vt,premultipliedAlpha:b.premultipliedAlpha,doubleSided:b.side===tn,flipSided:b.side===Ot,useDepthPacking:b.depthPacking>=0,depthPacking:b.depthPacking||0,index0AttributeName:b.index0AttributeName,extensionClipCullDistance:Ee&&b.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Ee&&b.extensions.multiDraw===!0||we)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:b.customProgramCacheKey()};return ut.vertexUv1s=l.has(1),ut.vertexUv2s=l.has(2),ut.vertexUv3s=l.has(3),l.clear(),ut}function p(b){let _=[];if(b.shaderID?_.push(b.shaderID):(_.push(b.customVertexShaderID),_.push(b.customFragmentShaderID)),b.defines!==void 0)for(let C in b.defines)_.push(C),_.push(b.defines[C]);return b.isRawShaderMaterial===!1&&(w(_,b),T(_,b),_.push(i.outputColorSpace)),_.push(b.customProgramCacheKey),_.join()}function w(b,_){b.push(_.precision),b.push(_.outputColorSpace),b.push(_.envMapMode),b.push(_.envMapCubeUVHeight),b.push(_.mapUv),b.push(_.alphaMapUv),b.push(_.lightMapUv),b.push(_.aoMapUv),b.push(_.bumpMapUv),b.push(_.normalMapUv),b.push(_.displacementMapUv),b.push(_.emissiveMapUv),b.push(_.metalnessMapUv),b.push(_.roughnessMapUv),b.push(_.anisotropyMapUv),b.push(_.clearcoatMapUv),b.push(_.clearcoatNormalMapUv),b.push(_.clearcoatRoughnessMapUv),b.push(_.iridescenceMapUv),b.push(_.iridescenceThicknessMapUv),b.push(_.sheenColorMapUv),b.push(_.sheenRoughnessMapUv),b.push(_.specularMapUv),b.push(_.specularColorMapUv),b.push(_.specularIntensityMapUv),b.push(_.transmissionMapUv),b.push(_.thicknessMapUv),b.push(_.combine),b.push(_.fogExp2),b.push(_.sizeAttenuation),b.push(_.morphTargetsCount),b.push(_.morphAttributeCount),b.push(_.numDirLights),b.push(_.numPointLights),b.push(_.numSpotLights),b.push(_.numSpotLightMaps),b.push(_.numHemiLights),b.push(_.numRectAreaLights),b.push(_.numDirLightShadows),b.push(_.numPointLightShadows),b.push(_.numSpotLightShadows),b.push(_.numSpotLightShadowsWithMaps),b.push(_.numLightProbes),b.push(_.shadowMapType),b.push(_.toneMapping),b.push(_.numClippingPlanes),b.push(_.numClipIntersection),b.push(_.depthPacking)}function T(b,_){a.disableAll(),_.supportsVertexTextures&&a.enable(0),_.instancing&&a.enable(1),_.instancingColor&&a.enable(2),_.instancingMorph&&a.enable(3),_.matcap&&a.enable(4),_.envMap&&a.enable(5),_.normalMapObjectSpace&&a.enable(6),_.normalMapTangentSpace&&a.enable(7),_.clearcoat&&a.enable(8),_.iridescence&&a.enable(9),_.alphaTest&&a.enable(10),_.vertexColors&&a.enable(11),_.vertexAlphas&&a.enable(12),_.vertexUv1s&&a.enable(13),_.vertexUv2s&&a.enable(14),_.vertexUv3s&&a.enable(15),_.vertexTangents&&a.enable(16),_.anisotropy&&a.enable(17),_.alphaHash&&a.enable(18),_.batching&&a.enable(19),_.dispersion&&a.enable(20),_.batchingColor&&a.enable(21),_.gradientMap&&a.enable(22),b.push(a.mask),a.disableAll(),_.fog&&a.enable(0),_.useFog&&a.enable(1),_.flatShading&&a.enable(2),_.logarithmicDepthBuffer&&a.enable(3),_.reversedDepthBuffer&&a.enable(4),_.skinning&&a.enable(5),_.morphTargets&&a.enable(6),_.morphNormals&&a.enable(7),_.morphColors&&a.enable(8),_.premultipliedAlpha&&a.enable(9),_.shadowMapEnabled&&a.enable(10),_.doubleSided&&a.enable(11),_.flipSided&&a.enable(12),_.useDepthPacking&&a.enable(13),_.dithering&&a.enable(14),_.transmission&&a.enable(15),_.sheen&&a.enable(16),_.opaque&&a.enable(17),_.pointsUvs&&a.enable(18),_.decodeVideoTexture&&a.enable(19),_.decodeVideoTextureEmissive&&a.enable(20),_.alphaToCoverage&&a.enable(21),b.push(a.mask)}function v(b){let _=g[b.type],C;if(_){let F=ni[_];C=Wf.clone(F.uniforms)}else C=b.uniforms;return C}function E(b,_){let C;for(let F=0,X=u.length;F<X;F++){let q=u[F];if(q.cacheKey===_){C=q,++C.usedTimes;break}}return C===void 0&&(C=new Kv(i,_,b,r),u.push(C)),C}function A(b){if(--b.usedTimes===0){let _=u.indexOf(b);u[_]=u[u.length-1],u.pop(),b.destroy()}}function R(b){c.remove(b)}function L(){c.dispose()}return{getParameters:m,getProgramCacheKey:p,getUniforms:v,acquireProgram:E,releaseProgram:A,releaseShaderCache:R,programs:u,dispose:L}}function eb(){let i=new WeakMap;function e(o){return i.has(o)}function t(o){let a=i.get(o);return a===void 0&&(a={},i.set(o,a)),a}function n(o){i.delete(o)}function s(o,a,c){i.get(o)[a]=c}function r(){i=new WeakMap}return{has:e,get:t,remove:n,update:s,dispose:r}}function tb(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.material.id!==e.material.id?i.material.id-e.material.id:i.z!==e.z?i.z-e.z:i.id-e.id}function pp(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.z!==e.z?e.z-i.z:i.id-e.id}function mp(){let i=[],e=0,t=[],n=[],s=[];function r(){e=0,t.length=0,n.length=0,s.length=0}function o(h,d,f,g,x,m){let p=i[e];return p===void 0?(p={id:h.id,object:h,geometry:d,material:f,groupOrder:g,renderOrder:h.renderOrder,z:x,group:m},i[e]=p):(p.id=h.id,p.object=h,p.geometry=d,p.material=f,p.groupOrder=g,p.renderOrder=h.renderOrder,p.z=x,p.group=m),e++,p}function a(h,d,f,g,x,m){let p=o(h,d,f,g,x,m);f.transmission>0?n.push(p):f.transparent===!0?s.push(p):t.push(p)}function c(h,d,f,g,x,m){let p=o(h,d,f,g,x,m);f.transmission>0?n.unshift(p):f.transparent===!0?s.unshift(p):t.unshift(p)}function l(h,d){t.length>1&&t.sort(h||tb),n.length>1&&n.sort(d||pp),s.length>1&&s.sort(d||pp)}function u(){for(let h=e,d=i.length;h<d;h++){let f=i[h];if(f.id===null)break;f.id=null,f.object=null,f.geometry=null,f.material=null,f.group=null}}return{opaque:t,transmissive:n,transparent:s,init:r,push:a,unshift:c,finish:u,sort:l}}function nb(){let i=new WeakMap;function e(n,s){let r=i.get(n),o;return r===void 0?(o=new mp,i.set(n,[o])):s>=r.length?(o=new mp,r.push(o)):o=r[s],o}function t(){i=new WeakMap}return{get:e,dispose:t}}function ib(){let i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new D,color:new Ne};break;case"SpotLight":t={position:new D,direction:new D,color:new Ne,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new D,color:new Ne,distance:0,decay:0};break;case"HemisphereLight":t={direction:new D,skyColor:new Ne,groundColor:new Ne};break;case"RectAreaLight":t={color:new Ne,position:new D,halfWidth:new D,halfHeight:new D};break}return i[e.id]=t,t}}}function sb(){let i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new De};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new De};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new De,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[e.id]=t,t}}}var rb=0;function ob(i,e){return(e.castShadow?2:0)-(i.castShadow?2:0)+(e.map?1:0)-(i.map?1:0)}function ab(i){let e=new ib,t=sb(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)n.probe.push(new D);let s=new D,r=new je,o=new je;function a(l){let u=0,h=0,d=0;for(let b=0;b<9;b++)n.probe[b].set(0,0,0);let f=0,g=0,x=0,m=0,p=0,w=0,T=0,v=0,E=0,A=0,R=0;l.sort(ob);for(let b=0,_=l.length;b<_;b++){let C=l[b],F=C.color,X=C.intensity,q=C.distance,J=C.shadow&&C.shadow.map?C.shadow.map.texture:null;if(C.isAmbientLight)u+=F.r*X,h+=F.g*X,d+=F.b*X;else if(C.isLightProbe){for(let W=0;W<9;W++)n.probe[W].addScaledVector(C.sh.coefficients[W],X);R++}else if(C.isDirectionalLight){let W=e.get(C);if(W.color.copy(C.color).multiplyScalar(C.intensity),C.castShadow){let Z=C.shadow,$=t.get(C);$.shadowIntensity=Z.intensity,$.shadowBias=Z.bias,$.shadowNormalBias=Z.normalBias,$.shadowRadius=Z.radius,$.shadowMapSize=Z.mapSize,n.directionalShadow[f]=$,n.directionalShadowMap[f]=J,n.directionalShadowMatrix[f]=C.shadow.matrix,w++}n.directional[f]=W,f++}else if(C.isSpotLight){let W=e.get(C);W.position.setFromMatrixPosition(C.matrixWorld),W.color.copy(F).multiplyScalar(X),W.distance=q,W.coneCos=Math.cos(C.angle),W.penumbraCos=Math.cos(C.angle*(1-C.penumbra)),W.decay=C.decay,n.spot[x]=W;let Z=C.shadow;if(C.map&&(n.spotLightMap[E]=C.map,E++,Z.updateMatrices(C),C.castShadow&&A++),n.spotLightMatrix[x]=Z.matrix,C.castShadow){let $=t.get(C);$.shadowIntensity=Z.intensity,$.shadowBias=Z.bias,$.shadowNormalBias=Z.normalBias,$.shadowRadius=Z.radius,$.shadowMapSize=Z.mapSize,n.spotShadow[x]=$,n.spotShadowMap[x]=J,v++}x++}else if(C.isRectAreaLight){let W=e.get(C);W.color.copy(F).multiplyScalar(X),W.halfWidth.set(C.width*.5,0,0),W.halfHeight.set(0,C.height*.5,0),n.rectArea[m]=W,m++}else if(C.isPointLight){let W=e.get(C);if(W.color.copy(C.color).multiplyScalar(C.intensity),W.distance=C.distance,W.decay=C.decay,C.castShadow){let Z=C.shadow,$=t.get(C);$.shadowIntensity=Z.intensity,$.shadowBias=Z.bias,$.shadowNormalBias=Z.normalBias,$.shadowRadius=Z.radius,$.shadowMapSize=Z.mapSize,$.shadowCameraNear=Z.camera.near,$.shadowCameraFar=Z.camera.far,n.pointShadow[g]=$,n.pointShadowMap[g]=J,n.pointShadowMatrix[g]=C.shadow.matrix,T++}n.point[g]=W,g++}else if(C.isHemisphereLight){let W=e.get(C);W.skyColor.copy(C.color).multiplyScalar(X),W.groundColor.copy(C.groundColor).multiplyScalar(X),n.hemi[p]=W,p++}}m>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=ge.LTC_FLOAT_1,n.rectAreaLTC2=ge.LTC_FLOAT_2):(n.rectAreaLTC1=ge.LTC_HALF_1,n.rectAreaLTC2=ge.LTC_HALF_2)),n.ambient[0]=u,n.ambient[1]=h,n.ambient[2]=d;let L=n.hash;(L.directionalLength!==f||L.pointLength!==g||L.spotLength!==x||L.rectAreaLength!==m||L.hemiLength!==p||L.numDirectionalShadows!==w||L.numPointShadows!==T||L.numSpotShadows!==v||L.numSpotMaps!==E||L.numLightProbes!==R)&&(n.directional.length=f,n.spot.length=x,n.rectArea.length=m,n.point.length=g,n.hemi.length=p,n.directionalShadow.length=w,n.directionalShadowMap.length=w,n.pointShadow.length=T,n.pointShadowMap.length=T,n.spotShadow.length=v,n.spotShadowMap.length=v,n.directionalShadowMatrix.length=w,n.pointShadowMatrix.length=T,n.spotLightMatrix.length=v+E-A,n.spotLightMap.length=E,n.numSpotLightShadowsWithMaps=A,n.numLightProbes=R,L.directionalLength=f,L.pointLength=g,L.spotLength=x,L.rectAreaLength=m,L.hemiLength=p,L.numDirectionalShadows=w,L.numPointShadows=T,L.numSpotShadows=v,L.numSpotMaps=E,L.numLightProbes=R,n.version=rb++)}function c(l,u){let h=0,d=0,f=0,g=0,x=0,m=u.matrixWorldInverse;for(let p=0,w=l.length;p<w;p++){let T=l[p];if(T.isDirectionalLight){let v=n.directional[h];v.direction.setFromMatrixPosition(T.matrixWorld),s.setFromMatrixPosition(T.target.matrixWorld),v.direction.sub(s),v.direction.transformDirection(m),h++}else if(T.isSpotLight){let v=n.spot[f];v.position.setFromMatrixPosition(T.matrixWorld),v.position.applyMatrix4(m),v.direction.setFromMatrixPosition(T.matrixWorld),s.setFromMatrixPosition(T.target.matrixWorld),v.direction.sub(s),v.direction.transformDirection(m),f++}else if(T.isRectAreaLight){let v=n.rectArea[g];v.position.setFromMatrixPosition(T.matrixWorld),v.position.applyMatrix4(m),o.identity(),r.copy(T.matrixWorld),r.premultiply(m),o.extractRotation(r),v.halfWidth.set(T.width*.5,0,0),v.halfHeight.set(0,T.height*.5,0),v.halfWidth.applyMatrix4(o),v.halfHeight.applyMatrix4(o),g++}else if(T.isPointLight){let v=n.point[d];v.position.setFromMatrixPosition(T.matrixWorld),v.position.applyMatrix4(m),d++}else if(T.isHemisphereLight){let v=n.hemi[x];v.direction.setFromMatrixPosition(T.matrixWorld),v.direction.transformDirection(m),x++}}}return{setup:a,setupView:c,state:n}}function gp(i){let e=new ab(i),t=[],n=[];function s(u){l.camera=u,t.length=0,n.length=0}function r(u){t.push(u)}function o(u){n.push(u)}function a(){e.setup(t)}function c(u){e.setupView(t,u)}let l={lightsArray:t,shadowsArray:n,camera:null,lights:e,transmissionRenderTarget:{}};return{init:s,state:l,setupLights:a,setupLightsView:c,pushLight:r,pushShadow:o}}function lb(i){let e=new WeakMap;function t(s,r=0){let o=e.get(s),a;return o===void 0?(a=new gp(i),e.set(s,[a])):r>=o.length?(a=new gp(i),o.push(a)):a=o[r],a}function n(){e=new WeakMap}return{get:t,dispose:n}}var cb=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,ub=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function hb(i,e,t){let n=new er,s=new De,r=new De,o=new dt,a=new La({depthPacking:Lf}),c=new Da,l={},u=t.maxTextureSize,h={[On]:Ot,[Ot]:On,[tn]:tn},d=new Bn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new De},radius:{value:4}},vertexShader:cb,fragmentShader:ub}),f=d.clone();f.defines.HORIZONTAL_PASS=1;let g=new Ct;g.setAttribute("position",new Dt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let x=new ft(g,d),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Kc;let p=this.type;this.render=function(A,R,L){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||A.length===0)return;let b=i.getRenderTarget(),_=i.getActiveCubeFace(),C=i.getActiveMipmapLevel(),F=i.state;F.setBlending(vi),F.buffers.depth.getReversed()===!0?F.buffers.color.setClear(0,0,0,0):F.buffers.color.setClear(1,1,1,1),F.buffers.depth.setTest(!0),F.setScissorTest(!1);let X=p!==ti&&this.type===ti,q=p===ti&&this.type!==ti;for(let J=0,W=A.length;J<W;J++){let Z=A[J],$=Z.shadow;if($===void 0){console.warn("THREE.WebGLShadowMap:",Z,"has no shadow.");continue}if($.autoUpdate===!1&&$.needsUpdate===!1)continue;s.copy($.mapSize);let ne=$.getFrameExtents();if(s.multiply(ne),r.copy($.mapSize),(s.x>u||s.y>u)&&(s.x>u&&(r.x=Math.floor(u/ne.x),s.x=r.x*ne.x,$.mapSize.x=r.x),s.y>u&&(r.y=Math.floor(u/ne.y),s.y=r.y*ne.y,$.mapSize.y=r.y)),$.map===null||X===!0||q===!0){let Re=this.type!==ti?{minFilter:qt,magFilter:qt}:{};$.map!==null&&$.map.dispose(),$.map=new jn(s.x,s.y,Re),$.map.texture.name=Z.name+".shadowMap",$.camera.updateProjectionMatrix()}i.setRenderTarget($.map),i.clear();let ce=$.getViewportCount();for(let Re=0;Re<ce;Re++){let He=$.getViewport(Re);o.set(r.x*He.x,r.y*He.y,r.x*He.z,r.y*He.w),F.viewport(o),$.updateMatrices(Z,Re),n=$.getFrustum(),v(R,L,$.camera,Z,this.type)}$.isPointLightShadow!==!0&&this.type===ti&&w($,L),$.needsUpdate=!1}p=this.type,m.needsUpdate=!1,i.setRenderTarget(b,_,C)};function w(A,R){let L=e.update(x);d.defines.VSM_SAMPLES!==A.blurSamples&&(d.defines.VSM_SAMPLES=A.blurSamples,f.defines.VSM_SAMPLES=A.blurSamples,d.needsUpdate=!0,f.needsUpdate=!0),A.mapPass===null&&(A.mapPass=new jn(s.x,s.y)),d.uniforms.shadow_pass.value=A.map.texture,d.uniforms.resolution.value=A.mapSize,d.uniforms.radius.value=A.radius,i.setRenderTarget(A.mapPass),i.clear(),i.renderBufferDirect(R,null,L,d,x,null),f.uniforms.shadow_pass.value=A.mapPass.texture,f.uniforms.resolution.value=A.mapSize,f.uniforms.radius.value=A.radius,i.setRenderTarget(A.map),i.clear(),i.renderBufferDirect(R,null,L,f,x,null)}function T(A,R,L,b){let _=null,C=L.isPointLight===!0?A.customDistanceMaterial:A.customDepthMaterial;if(C!==void 0)_=C;else if(_=L.isPointLight===!0?c:a,i.localClippingEnabled&&R.clipShadows===!0&&Array.isArray(R.clippingPlanes)&&R.clippingPlanes.length!==0||R.displacementMap&&R.displacementScale!==0||R.alphaMap&&R.alphaTest>0||R.map&&R.alphaTest>0||R.alphaToCoverage===!0){let F=_.uuid,X=R.uuid,q=l[F];q===void 0&&(q={},l[F]=q);let J=q[X];J===void 0&&(J=_.clone(),q[X]=J,R.addEventListener("dispose",E)),_=J}if(_.visible=R.visible,_.wireframe=R.wireframe,b===ti?_.side=R.shadowSide!==null?R.shadowSide:R.side:_.side=R.shadowSide!==null?R.shadowSide:h[R.side],_.alphaMap=R.alphaMap,_.alphaTest=R.alphaToCoverage===!0?.5:R.alphaTest,_.map=R.map,_.clipShadows=R.clipShadows,_.clippingPlanes=R.clippingPlanes,_.clipIntersection=R.clipIntersection,_.displacementMap=R.displacementMap,_.displacementScale=R.displacementScale,_.displacementBias=R.displacementBias,_.wireframeLinewidth=R.wireframeLinewidth,_.linewidth=R.linewidth,L.isPointLight===!0&&_.isMeshDistanceMaterial===!0){let F=i.properties.get(_);F.light=L}return _}function v(A,R,L,b,_){if(A.visible===!1)return;if(A.layers.test(R.layers)&&(A.isMesh||A.isLine||A.isPoints)&&(A.castShadow||A.receiveShadow&&_===ti)&&(!A.frustumCulled||n.intersectsObject(A))){A.modelViewMatrix.multiplyMatrices(L.matrixWorldInverse,A.matrixWorld);let X=e.update(A),q=A.material;if(Array.isArray(q)){let J=X.groups;for(let W=0,Z=J.length;W<Z;W++){let $=J[W],ne=q[$.materialIndex];if(ne&&ne.visible){let ce=T(A,ne,b,_);A.onBeforeShadow(i,A,R,L,X,ce,$),i.renderBufferDirect(L,null,X,ce,A,$),A.onAfterShadow(i,A,R,L,X,ce,$)}}}else if(q.visible){let J=T(A,q,b,_);A.onBeforeShadow(i,A,R,L,X,J,null),i.renderBufferDirect(L,null,X,J,A,null),A.onAfterShadow(i,A,R,L,X,J,null)}}let F=A.children;for(let X=0,q=F.length;X<q;X++)v(F[X],R,L,b,_)}function E(A){A.target.removeEventListener("dispose",E);for(let L in l){let b=l[L],_=A.target.uuid;_ in b&&(b[_].dispose(),delete b[_])}}}var db={[Ha]:Va,[Ga]:Ya,[Wa]:qa,[Ki]:Xa,[Va]:Ha,[Ya]:Ga,[qa]:Wa,[Xa]:Ki};function fb(i,e){function t(){let U=!1,ue=new dt,he=null,Me=new dt(0,0,0,0);return{setMask:function(se){he!==se&&!U&&(i.colorMask(se,se,se,se),he=se)},setLocked:function(se){U=se},setClear:function(se,te,Ee,Xe,ut){ut===!0&&(se*=Xe,te*=Xe,Ee*=Xe),ue.set(se,te,Ee,Xe),Me.equals(ue)===!1&&(i.clearColor(se,te,Ee,Xe),Me.copy(ue))},reset:function(){U=!1,he=null,Me.set(-1,0,0,0)}}}function n(){let U=!1,ue=!1,he=null,Me=null,se=null;return{setReversed:function(te){if(ue!==te){let Ee=e.get("EXT_clip_control");te?Ee.clipControlEXT(Ee.LOWER_LEFT_EXT,Ee.ZERO_TO_ONE_EXT):Ee.clipControlEXT(Ee.LOWER_LEFT_EXT,Ee.NEGATIVE_ONE_TO_ONE_EXT),ue=te;let Xe=se;se=null,this.setClear(Xe)}},getReversed:function(){return ue},setTest:function(te){te?ee(i.DEPTH_TEST):_e(i.DEPTH_TEST)},setMask:function(te){he!==te&&!U&&(i.depthMask(te),he=te)},setFunc:function(te){if(ue&&(te=db[te]),Me!==te){switch(te){case Ha:i.depthFunc(i.NEVER);break;case Va:i.depthFunc(i.ALWAYS);break;case Ga:i.depthFunc(i.LESS);break;case Ki:i.depthFunc(i.LEQUAL);break;case Wa:i.depthFunc(i.EQUAL);break;case Xa:i.depthFunc(i.GEQUAL);break;case Ya:i.depthFunc(i.GREATER);break;case qa:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}Me=te}},setLocked:function(te){U=te},setClear:function(te){se!==te&&(ue&&(te=1-te),i.clearDepth(te),se=te)},reset:function(){U=!1,he=null,Me=null,se=null,ue=!1}}}function s(){let U=!1,ue=null,he=null,Me=null,se=null,te=null,Ee=null,Xe=null,ut=null;return{setTest:function(Ke){U||(Ke?ee(i.STENCIL_TEST):_e(i.STENCIL_TEST))},setMask:function(Ke){ue!==Ke&&!U&&(i.stencilMask(Ke),ue=Ke)},setFunc:function(Ke,Wt,Ht){(he!==Ke||Me!==Wt||se!==Ht)&&(i.stencilFunc(Ke,Wt,Ht),he=Ke,Me=Wt,se=Ht)},setOp:function(Ke,Wt,Ht){(te!==Ke||Ee!==Wt||Xe!==Ht)&&(i.stencilOp(Ke,Wt,Ht),te=Ke,Ee=Wt,Xe=Ht)},setLocked:function(Ke){U=Ke},setClear:function(Ke){ut!==Ke&&(i.clearStencil(Ke),ut=Ke)},reset:function(){U=!1,ue=null,he=null,Me=null,se=null,te=null,Ee=null,Xe=null,ut=null}}}let r=new t,o=new n,a=new s,c=new WeakMap,l=new WeakMap,u={},h={},d=new WeakMap,f=[],g=null,x=!1,m=null,p=null,w=null,T=null,v=null,E=null,A=null,R=new Ne(0,0,0),L=0,b=!1,_=null,C=null,F=null,X=null,q=null,J=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS),W=!1,Z=0,$=i.getParameter(i.VERSION);$.indexOf("WebGL")!==-1?(Z=parseFloat(/^WebGL (\d)/.exec($)[1]),W=Z>=1):$.indexOf("OpenGL ES")!==-1&&(Z=parseFloat(/^OpenGL ES (\d)/.exec($)[1]),W=Z>=2);let ne=null,ce={},Re=i.getParameter(i.SCISSOR_BOX),He=i.getParameter(i.VIEWPORT),it=new dt().fromArray(Re),et=new dt().fromArray(He);function $e(U,ue,he,Me){let se=new Uint8Array(4),te=i.createTexture();i.bindTexture(U,te),i.texParameteri(U,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(U,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Ee=0;Ee<he;Ee++)U===i.TEXTURE_3D||U===i.TEXTURE_2D_ARRAY?i.texImage3D(ue,0,i.RGBA,1,1,Me,0,i.RGBA,i.UNSIGNED_BYTE,se):i.texImage2D(ue+Ee,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,se);return te}let K={};K[i.TEXTURE_2D]=$e(i.TEXTURE_2D,i.TEXTURE_2D,1),K[i.TEXTURE_CUBE_MAP]=$e(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),K[i.TEXTURE_2D_ARRAY]=$e(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),K[i.TEXTURE_3D]=$e(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),o.setClear(1),a.setClear(0),ee(i.DEPTH_TEST),o.setFunc(Ki),pe(!1),ye(Jc),ee(i.CULL_FACE),st(vi);function ee(U){u[U]!==!0&&(i.enable(U),u[U]=!0)}function _e(U){u[U]!==!1&&(i.disable(U),u[U]=!1)}function Fe(U,ue){return h[U]!==ue?(i.bindFramebuffer(U,ue),h[U]=ue,U===i.DRAW_FRAMEBUFFER&&(h[i.FRAMEBUFFER]=ue),U===i.FRAMEBUFFER&&(h[i.DRAW_FRAMEBUFFER]=ue),!0):!1}function we(U,ue){let he=f,Me=!1;if(U){he=d.get(ue),he===void 0&&(he=[],d.set(ue,he));let se=U.textures;if(he.length!==se.length||he[0]!==i.COLOR_ATTACHMENT0){for(let te=0,Ee=se.length;te<Ee;te++)he[te]=i.COLOR_ATTACHMENT0+te;he.length=se.length,Me=!0}}else he[0]!==i.BACK&&(he[0]=i.BACK,Me=!0);Me&&i.drawBuffers(he)}function Ve(U){return g!==U?(i.useProgram(U),g=U,!0):!1}let bt={[Li]:i.FUNC_ADD,[sf]:i.FUNC_SUBTRACT,[rf]:i.FUNC_REVERSE_SUBTRACT};bt[of]=i.MIN,bt[af]=i.MAX;let I={[lf]:i.ZERO,[cf]:i.ONE,[uf]:i.SRC_COLOR,[va]:i.SRC_ALPHA,[gf]:i.SRC_ALPHA_SATURATE,[pf]:i.DST_COLOR,[df]:i.DST_ALPHA,[hf]:i.ONE_MINUS_SRC_COLOR,[ba]:i.ONE_MINUS_SRC_ALPHA,[mf]:i.ONE_MINUS_DST_COLOR,[ff]:i.ONE_MINUS_DST_ALPHA,[_f]:i.CONSTANT_COLOR,[xf]:i.ONE_MINUS_CONSTANT_COLOR,[yf]:i.CONSTANT_ALPHA,[vf]:i.ONE_MINUS_CONSTANT_ALPHA};function st(U,ue,he,Me,se,te,Ee,Xe,ut,Ke){if(U===vi){x===!0&&(_e(i.BLEND),x=!1);return}if(x===!1&&(ee(i.BLEND),x=!0),U!==nf){if(U!==m||Ke!==b){if((p!==Li||v!==Li)&&(i.blendEquation(i.FUNC_ADD),p=Li,v=Li),Ke)switch(U){case Ji:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Zc:i.blendFunc(i.ONE,i.ONE);break;case Qc:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case eu:i.blendFuncSeparate(i.DST_COLOR,i.ONE_MINUS_SRC_ALPHA,i.ZERO,i.ONE);break;default:console.error("THREE.WebGLState: Invalid blending: ",U);break}else switch(U){case Ji:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Zc:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE,i.ONE,i.ONE);break;case Qc:console.error("THREE.WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case eu:console.error("THREE.WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:console.error("THREE.WebGLState: Invalid blending: ",U);break}w=null,T=null,E=null,A=null,R.set(0,0,0),L=0,m=U,b=Ke}return}se=se||ue,te=te||he,Ee=Ee||Me,(ue!==p||se!==v)&&(i.blendEquationSeparate(bt[ue],bt[se]),p=ue,v=se),(he!==w||Me!==T||te!==E||Ee!==A)&&(i.blendFuncSeparate(I[he],I[Me],I[te],I[Ee]),w=he,T=Me,E=te,A=Ee),(Xe.equals(R)===!1||ut!==L)&&(i.blendColor(Xe.r,Xe.g,Xe.b,ut),R.copy(Xe),L=ut),m=U,b=!1}function ke(U,ue){U.side===tn?_e(i.CULL_FACE):ee(i.CULL_FACE);let he=U.side===Ot;ue&&(he=!he),pe(he),U.blending===Ji&&U.transparent===!1?st(vi):st(U.blending,U.blendEquation,U.blendSrc,U.blendDst,U.blendEquationAlpha,U.blendSrcAlpha,U.blendDstAlpha,U.blendColor,U.blendAlpha,U.premultipliedAlpha),o.setFunc(U.depthFunc),o.setTest(U.depthTest),o.setMask(U.depthWrite),r.setMask(U.colorWrite);let Me=U.stencilWrite;a.setTest(Me),Me&&(a.setMask(U.stencilWriteMask),a.setFunc(U.stencilFunc,U.stencilRef,U.stencilFuncMask),a.setOp(U.stencilFail,U.stencilZFail,U.stencilZPass)),O(U.polygonOffset,U.polygonOffsetFactor,U.polygonOffsetUnits),U.alphaToCoverage===!0?ee(i.SAMPLE_ALPHA_TO_COVERAGE):_e(i.SAMPLE_ALPHA_TO_COVERAGE)}function pe(U){_!==U&&(U?i.frontFace(i.CW):i.frontFace(i.CCW),_=U)}function ye(U){U!==Qd?(ee(i.CULL_FACE),U!==C&&(U===Jc?i.cullFace(i.BACK):U===ef?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):_e(i.CULL_FACE),C=U}function tt(U){U!==F&&(W&&i.lineWidth(U),F=U)}function O(U,ue,he){U?(ee(i.POLYGON_OFFSET_FILL),(X!==ue||q!==he)&&(i.polygonOffset(ue,he),X=ue,q=he)):_e(i.POLYGON_OFFSET_FILL)}function Q(U){U?ee(i.SCISSOR_TEST):_e(i.SCISSOR_TEST)}function be(U){U===void 0&&(U=i.TEXTURE0+J-1),ne!==U&&(i.activeTexture(U),ne=U)}function Ie(U,ue,he){he===void 0&&(ne===null?he=i.TEXTURE0+J-1:he=ne);let Me=ce[he];Me===void 0&&(Me={type:void 0,texture:void 0},ce[he]=Me),(Me.type!==U||Me.texture!==ue)&&(ne!==he&&(i.activeTexture(he),ne=he),i.bindTexture(U,ue||K[U]),Me.type=U,Me.texture=ue)}function S(){let U=ce[ne];U!==void 0&&U.type!==void 0&&(i.bindTexture(U.type,null),U.type=void 0,U.texture=void 0)}function y(){try{i.compressedTexImage2D(...arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function H(){try{i.compressedTexImage3D(...arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function P(){try{i.texSubImage2D(...arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function G(){try{i.texSubImage3D(...arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function V(){try{i.compressedTexSubImage2D(...arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function de(){try{i.compressedTexSubImage3D(...arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function ae(){try{i.texStorage2D(...arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function Ae(){try{i.texStorage3D(...arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function Ce(){try{i.texImage2D(...arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function re(){try{i.texImage3D(...arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function me(U){it.equals(U)===!1&&(i.scissor(U.x,U.y,U.z,U.w),it.copy(U))}function Be(U){et.equals(U)===!1&&(i.viewport(U.x,U.y,U.z,U.w),et.copy(U))}function Pe(U,ue){let he=l.get(ue);he===void 0&&(he=new WeakMap,l.set(ue,he));let Me=he.get(U);Me===void 0&&(Me=i.getUniformBlockIndex(ue,U.name),he.set(U,Me))}function fe(U,ue){let Me=l.get(ue).get(U);c.get(ue)!==Me&&(i.uniformBlockBinding(ue,Me,U.__bindingPointIndex),c.set(ue,Me))}function qe(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),o.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),u={},ne=null,ce={},h={},d=new WeakMap,f=[],g=null,x=!1,m=null,p=null,w=null,T=null,v=null,E=null,A=null,R=new Ne(0,0,0),L=0,b=!1,_=null,C=null,F=null,X=null,q=null,it.set(0,0,i.canvas.width,i.canvas.height),et.set(0,0,i.canvas.width,i.canvas.height),r.reset(),o.reset(),a.reset()}return{buffers:{color:r,depth:o,stencil:a},enable:ee,disable:_e,bindFramebuffer:Fe,drawBuffers:we,useProgram:Ve,setBlending:st,setMaterial:ke,setFlipSided:pe,setCullFace:ye,setLineWidth:tt,setPolygonOffset:O,setScissorTest:Q,activeTexture:be,bindTexture:Ie,unbindTexture:S,compressedTexImage2D:y,compressedTexImage3D:H,texImage2D:Ce,texImage3D:re,updateUBOMapping:Pe,uniformBlockBinding:fe,texStorage2D:ae,texStorage3D:Ae,texSubImage2D:P,texSubImage3D:G,compressedTexSubImage2D:V,compressedTexSubImage3D:de,scissor:me,viewport:Be,reset:qe}}function pb(i,e,t,n,s,r,o){let a=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),l=new De,u=new WeakMap,h,d=new WeakMap,f=!1;try{f=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(S,y){return f?new OffscreenCanvas(S,y):$s("canvas")}function x(S,y,H){let P=1,G=Ie(S);if((G.width>H||G.height>H)&&(P=H/Math.max(G.width,G.height)),P<1)if(typeof HTMLImageElement<"u"&&S instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&S instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&S instanceof ImageBitmap||typeof VideoFrame<"u"&&S instanceof VideoFrame){let V=Math.floor(P*G.width),de=Math.floor(P*G.height);h===void 0&&(h=g(V,de));let ae=y?g(V,de):h;return ae.width=V,ae.height=de,ae.getContext("2d").drawImage(S,0,0,V,de),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+G.width+"x"+G.height+") to ("+V+"x"+de+")."),ae}else return"data"in S&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+G.width+"x"+G.height+")."),S;return S}function m(S){return S.generateMipmaps}function p(S){i.generateMipmap(S)}function w(S){return S.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:S.isWebGL3DRenderTarget?i.TEXTURE_3D:S.isWebGLArrayRenderTarget||S.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function T(S,y,H,P,G=!1){if(S!==null){if(i[S]!==void 0)return i[S];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+S+"'")}let V=y;if(y===i.RED&&(H===i.FLOAT&&(V=i.R32F),H===i.HALF_FLOAT&&(V=i.R16F),H===i.UNSIGNED_BYTE&&(V=i.R8)),y===i.RED_INTEGER&&(H===i.UNSIGNED_BYTE&&(V=i.R8UI),H===i.UNSIGNED_SHORT&&(V=i.R16UI),H===i.UNSIGNED_INT&&(V=i.R32UI),H===i.BYTE&&(V=i.R8I),H===i.SHORT&&(V=i.R16I),H===i.INT&&(V=i.R32I)),y===i.RG&&(H===i.FLOAT&&(V=i.RG32F),H===i.HALF_FLOAT&&(V=i.RG16F),H===i.UNSIGNED_BYTE&&(V=i.RG8)),y===i.RG_INTEGER&&(H===i.UNSIGNED_BYTE&&(V=i.RG8UI),H===i.UNSIGNED_SHORT&&(V=i.RG16UI),H===i.UNSIGNED_INT&&(V=i.RG32UI),H===i.BYTE&&(V=i.RG8I),H===i.SHORT&&(V=i.RG16I),H===i.INT&&(V=i.RG32I)),y===i.RGB_INTEGER&&(H===i.UNSIGNED_BYTE&&(V=i.RGB8UI),H===i.UNSIGNED_SHORT&&(V=i.RGB16UI),H===i.UNSIGNED_INT&&(V=i.RGB32UI),H===i.BYTE&&(V=i.RGB8I),H===i.SHORT&&(V=i.RGB16I),H===i.INT&&(V=i.RGB32I)),y===i.RGBA_INTEGER&&(H===i.UNSIGNED_BYTE&&(V=i.RGBA8UI),H===i.UNSIGNED_SHORT&&(V=i.RGBA16UI),H===i.UNSIGNED_INT&&(V=i.RGBA32UI),H===i.BYTE&&(V=i.RGBA8I),H===i.SHORT&&(V=i.RGBA16I),H===i.INT&&(V=i.RGBA32I)),y===i.RGB&&(H===i.UNSIGNED_INT_5_9_9_9_REV&&(V=i.RGB9_E5),H===i.UNSIGNED_INT_10F_11F_11F_REV&&(V=i.R11F_G11F_B10F)),y===i.RGBA){let de=G?kr:ct.getTransfer(P);H===i.FLOAT&&(V=i.RGBA32F),H===i.HALF_FLOAT&&(V=i.RGBA16F),H===i.UNSIGNED_BYTE&&(V=de===vt?i.SRGB8_ALPHA8:i.RGBA8),H===i.UNSIGNED_SHORT_4_4_4_4&&(V=i.RGBA4),H===i.UNSIGNED_SHORT_5_5_5_1&&(V=i.RGB5_A1)}return(V===i.R16F||V===i.R32F||V===i.RG16F||V===i.RG32F||V===i.RGBA16F||V===i.RGBA32F)&&e.get("EXT_color_buffer_float"),V}function v(S,y){let H;return S?y===null||y===zi||y===ar?H=i.DEPTH24_STENCIL8:y===En?H=i.DEPTH32F_STENCIL8:y===rr&&(H=i.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):y===null||y===zi||y===ar?H=i.DEPTH_COMPONENT24:y===En?H=i.DEPTH_COMPONENT32F:y===rr&&(H=i.DEPTH_COMPONENT16),H}function E(S,y){return m(S)===!0||S.isFramebufferTexture&&S.minFilter!==qt&&S.minFilter!==on?Math.log2(Math.max(y.width,y.height))+1:S.mipmaps!==void 0&&S.mipmaps.length>0?S.mipmaps.length:S.isCompressedTexture&&Array.isArray(S.image)?y.mipmaps.length:1}function A(S){let y=S.target;y.removeEventListener("dispose",A),L(y),y.isVideoTexture&&u.delete(y)}function R(S){let y=S.target;y.removeEventListener("dispose",R),_(y)}function L(S){let y=n.get(S);if(y.__webglInit===void 0)return;let H=S.source,P=d.get(H);if(P){let G=P[y.__cacheKey];G.usedTimes--,G.usedTimes===0&&b(S),Object.keys(P).length===0&&d.delete(H)}n.remove(S)}function b(S){let y=n.get(S);i.deleteTexture(y.__webglTexture);let H=S.source,P=d.get(H);delete P[y.__cacheKey],o.memory.textures--}function _(S){let y=n.get(S);if(S.depthTexture&&(S.depthTexture.dispose(),n.remove(S.depthTexture)),S.isWebGLCubeRenderTarget)for(let P=0;P<6;P++){if(Array.isArray(y.__webglFramebuffer[P]))for(let G=0;G<y.__webglFramebuffer[P].length;G++)i.deleteFramebuffer(y.__webglFramebuffer[P][G]);else i.deleteFramebuffer(y.__webglFramebuffer[P]);y.__webglDepthbuffer&&i.deleteRenderbuffer(y.__webglDepthbuffer[P])}else{if(Array.isArray(y.__webglFramebuffer))for(let P=0;P<y.__webglFramebuffer.length;P++)i.deleteFramebuffer(y.__webglFramebuffer[P]);else i.deleteFramebuffer(y.__webglFramebuffer);if(y.__webglDepthbuffer&&i.deleteRenderbuffer(y.__webglDepthbuffer),y.__webglMultisampledFramebuffer&&i.deleteFramebuffer(y.__webglMultisampledFramebuffer),y.__webglColorRenderbuffer)for(let P=0;P<y.__webglColorRenderbuffer.length;P++)y.__webglColorRenderbuffer[P]&&i.deleteRenderbuffer(y.__webglColorRenderbuffer[P]);y.__webglDepthRenderbuffer&&i.deleteRenderbuffer(y.__webglDepthRenderbuffer)}let H=S.textures;for(let P=0,G=H.length;P<G;P++){let V=n.get(H[P]);V.__webglTexture&&(i.deleteTexture(V.__webglTexture),o.memory.textures--),n.remove(H[P])}n.remove(S)}let C=0;function F(){C=0}function X(){let S=C;return S>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+S+" texture units while this GPU supports only "+s.maxTextures),C+=1,S}function q(S){let y=[];return y.push(S.wrapS),y.push(S.wrapT),y.push(S.wrapR||0),y.push(S.magFilter),y.push(S.minFilter),y.push(S.anisotropy),y.push(S.internalFormat),y.push(S.format),y.push(S.type),y.push(S.generateMipmaps),y.push(S.premultiplyAlpha),y.push(S.flipY),y.push(S.unpackAlignment),y.push(S.colorSpace),y.join()}function J(S,y){let H=n.get(S);if(S.isVideoTexture&&Q(S),S.isRenderTargetTexture===!1&&S.isExternalTexture!==!0&&S.version>0&&H.__version!==S.version){let P=S.image;if(P===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(P.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{K(H,S,y);return}}else S.isExternalTexture&&(H.__webglTexture=S.sourceTexture?S.sourceTexture:null);t.bindTexture(i.TEXTURE_2D,H.__webglTexture,i.TEXTURE0+y)}function W(S,y){let H=n.get(S);if(S.isRenderTargetTexture===!1&&S.version>0&&H.__version!==S.version){K(H,S,y);return}t.bindTexture(i.TEXTURE_2D_ARRAY,H.__webglTexture,i.TEXTURE0+y)}function Z(S,y){let H=n.get(S);if(S.isRenderTargetTexture===!1&&S.version>0&&H.__version!==S.version){K(H,S,y);return}t.bindTexture(i.TEXTURE_3D,H.__webglTexture,i.TEXTURE0+y)}function $(S,y){let H=n.get(S);if(S.version>0&&H.__version!==S.version){ee(H,S,y);return}t.bindTexture(i.TEXTURE_CUBE_MAP,H.__webglTexture,i.TEXTURE0+y)}let ne={[Di]:i.REPEAT,[Yn]:i.CLAMP_TO_EDGE,[Ys]:i.MIRRORED_REPEAT},ce={[qt]:i.NEAREST,[Za]:i.NEAREST_MIPMAP_NEAREST,[ds]:i.NEAREST_MIPMAP_LINEAR,[on]:i.LINEAR,[sr]:i.LINEAR_MIPMAP_NEAREST,[kn]:i.LINEAR_MIPMAP_LINEAR},Re={[Nf]:i.NEVER,[kf]:i.ALWAYS,[Uf]:i.LESS,[uu]:i.LEQUAL,[Ff]:i.EQUAL,[zf]:i.GEQUAL,[Of]:i.GREATER,[Bf]:i.NOTEQUAL};function He(S,y){if(y.type===En&&e.has("OES_texture_float_linear")===!1&&(y.magFilter===on||y.magFilter===sr||y.magFilter===ds||y.magFilter===kn||y.minFilter===on||y.minFilter===sr||y.minFilter===ds||y.minFilter===kn)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(S,i.TEXTURE_WRAP_S,ne[y.wrapS]),i.texParameteri(S,i.TEXTURE_WRAP_T,ne[y.wrapT]),(S===i.TEXTURE_3D||S===i.TEXTURE_2D_ARRAY)&&i.texParameteri(S,i.TEXTURE_WRAP_R,ne[y.wrapR]),i.texParameteri(S,i.TEXTURE_MAG_FILTER,ce[y.magFilter]),i.texParameteri(S,i.TEXTURE_MIN_FILTER,ce[y.minFilter]),y.compareFunction&&(i.texParameteri(S,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(S,i.TEXTURE_COMPARE_FUNC,Re[y.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(y.magFilter===qt||y.minFilter!==ds&&y.minFilter!==kn||y.type===En&&e.has("OES_texture_float_linear")===!1)return;if(y.anisotropy>1||n.get(y).__currentAnisotropy){let H=e.get("EXT_texture_filter_anisotropic");i.texParameterf(S,H.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(y.anisotropy,s.getMaxAnisotropy())),n.get(y).__currentAnisotropy=y.anisotropy}}}function it(S,y){let H=!1;S.__webglInit===void 0&&(S.__webglInit=!0,y.addEventListener("dispose",A));let P=y.source,G=d.get(P);G===void 0&&(G={},d.set(P,G));let V=q(y);if(V!==S.__cacheKey){G[V]===void 0&&(G[V]={texture:i.createTexture(),usedTimes:0},o.memory.textures++,H=!0),G[V].usedTimes++;let de=G[S.__cacheKey];de!==void 0&&(G[S.__cacheKey].usedTimes--,de.usedTimes===0&&b(y)),S.__cacheKey=V,S.__webglTexture=G[V].texture}return H}function et(S,y,H){return Math.floor(Math.floor(S/H)/y)}function $e(S,y,H,P){let V=S.updateRanges;if(V.length===0)t.texSubImage2D(i.TEXTURE_2D,0,0,0,y.width,y.height,H,P,y.data);else{V.sort((re,me)=>re.start-me.start);let de=0;for(let re=1;re<V.length;re++){let me=V[de],Be=V[re],Pe=me.start+me.count,fe=et(Be.start,y.width,4),qe=et(me.start,y.width,4);Be.start<=Pe+1&&fe===qe&&et(Be.start+Be.count-1,y.width,4)===fe?me.count=Math.max(me.count,Be.start+Be.count-me.start):(++de,V[de]=Be)}V.length=de+1;let ae=i.getParameter(i.UNPACK_ROW_LENGTH),Ae=i.getParameter(i.UNPACK_SKIP_PIXELS),Ce=i.getParameter(i.UNPACK_SKIP_ROWS);i.pixelStorei(i.UNPACK_ROW_LENGTH,y.width);for(let re=0,me=V.length;re<me;re++){let Be=V[re],Pe=Math.floor(Be.start/4),fe=Math.ceil(Be.count/4),qe=Pe%y.width,U=Math.floor(Pe/y.width),ue=fe,he=1;i.pixelStorei(i.UNPACK_SKIP_PIXELS,qe),i.pixelStorei(i.UNPACK_SKIP_ROWS,U),t.texSubImage2D(i.TEXTURE_2D,0,qe,U,ue,he,H,P,y.data)}S.clearUpdateRanges(),i.pixelStorei(i.UNPACK_ROW_LENGTH,ae),i.pixelStorei(i.UNPACK_SKIP_PIXELS,Ae),i.pixelStorei(i.UNPACK_SKIP_ROWS,Ce)}}function K(S,y,H){let P=i.TEXTURE_2D;(y.isDataArrayTexture||y.isCompressedArrayTexture)&&(P=i.TEXTURE_2D_ARRAY),y.isData3DTexture&&(P=i.TEXTURE_3D);let G=it(S,y),V=y.source;t.bindTexture(P,S.__webglTexture,i.TEXTURE0+H);let de=n.get(V);if(V.version!==de.__version||G===!0){t.activeTexture(i.TEXTURE0+H);let ae=ct.getPrimaries(ct.workingColorSpace),Ae=y.colorSpace===Si?null:ct.getPrimaries(y.colorSpace),Ce=y.colorSpace===Si||ae===Ae?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,y.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,y.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ce);let re=x(y.image,!1,s.maxTextureSize);re=be(y,re);let me=r.convert(y.format,y.colorSpace),Be=r.convert(y.type),Pe=T(y.internalFormat,me,Be,y.colorSpace,y.isVideoTexture);He(P,y);let fe,qe=y.mipmaps,U=y.isVideoTexture!==!0,ue=de.__version===void 0||G===!0,he=V.dataReady,Me=E(y,re);if(y.isDepthTexture)Pe=v(y.format===lr,y.type),ue&&(U?t.texStorage2D(i.TEXTURE_2D,1,Pe,re.width,re.height):t.texImage2D(i.TEXTURE_2D,0,Pe,re.width,re.height,0,me,Be,null));else if(y.isDataTexture)if(qe.length>0){U&&ue&&t.texStorage2D(i.TEXTURE_2D,Me,Pe,qe[0].width,qe[0].height);for(let se=0,te=qe.length;se<te;se++)fe=qe[se],U?he&&t.texSubImage2D(i.TEXTURE_2D,se,0,0,fe.width,fe.height,me,Be,fe.data):t.texImage2D(i.TEXTURE_2D,se,Pe,fe.width,fe.height,0,me,Be,fe.data);y.generateMipmaps=!1}else U?(ue&&t.texStorage2D(i.TEXTURE_2D,Me,Pe,re.width,re.height),he&&$e(y,re,me,Be)):t.texImage2D(i.TEXTURE_2D,0,Pe,re.width,re.height,0,me,Be,re.data);else if(y.isCompressedTexture)if(y.isCompressedArrayTexture){U&&ue&&t.texStorage3D(i.TEXTURE_2D_ARRAY,Me,Pe,qe[0].width,qe[0].height,re.depth);for(let se=0,te=qe.length;se<te;se++)if(fe=qe[se],y.format!==_n)if(me!==null)if(U){if(he)if(y.layerUpdates.size>0){let Ee=_u(fe.width,fe.height,y.format,y.type);for(let Xe of y.layerUpdates){let ut=fe.data.subarray(Xe*Ee/fe.data.BYTES_PER_ELEMENT,(Xe+1)*Ee/fe.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,se,0,0,Xe,fe.width,fe.height,1,me,ut)}y.clearLayerUpdates()}else t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,se,0,0,0,fe.width,fe.height,re.depth,me,fe.data)}else t.compressedTexImage3D(i.TEXTURE_2D_ARRAY,se,Pe,fe.width,fe.height,re.depth,0,fe.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else U?he&&t.texSubImage3D(i.TEXTURE_2D_ARRAY,se,0,0,0,fe.width,fe.height,re.depth,me,Be,fe.data):t.texImage3D(i.TEXTURE_2D_ARRAY,se,Pe,fe.width,fe.height,re.depth,0,me,Be,fe.data)}else{U&&ue&&t.texStorage2D(i.TEXTURE_2D,Me,Pe,qe[0].width,qe[0].height);for(let se=0,te=qe.length;se<te;se++)fe=qe[se],y.format!==_n?me!==null?U?he&&t.compressedTexSubImage2D(i.TEXTURE_2D,se,0,0,fe.width,fe.height,me,fe.data):t.compressedTexImage2D(i.TEXTURE_2D,se,Pe,fe.width,fe.height,0,fe.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):U?he&&t.texSubImage2D(i.TEXTURE_2D,se,0,0,fe.width,fe.height,me,Be,fe.data):t.texImage2D(i.TEXTURE_2D,se,Pe,fe.width,fe.height,0,me,Be,fe.data)}else if(y.isDataArrayTexture)if(U){if(ue&&t.texStorage3D(i.TEXTURE_2D_ARRAY,Me,Pe,re.width,re.height,re.depth),he)if(y.layerUpdates.size>0){let se=_u(re.width,re.height,y.format,y.type);for(let te of y.layerUpdates){let Ee=re.data.subarray(te*se/re.data.BYTES_PER_ELEMENT,(te+1)*se/re.data.BYTES_PER_ELEMENT);t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,te,re.width,re.height,1,me,Be,Ee)}y.clearLayerUpdates()}else t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,re.width,re.height,re.depth,me,Be,re.data)}else t.texImage3D(i.TEXTURE_2D_ARRAY,0,Pe,re.width,re.height,re.depth,0,me,Be,re.data);else if(y.isData3DTexture)U?(ue&&t.texStorage3D(i.TEXTURE_3D,Me,Pe,re.width,re.height,re.depth),he&&t.texSubImage3D(i.TEXTURE_3D,0,0,0,0,re.width,re.height,re.depth,me,Be,re.data)):t.texImage3D(i.TEXTURE_3D,0,Pe,re.width,re.height,re.depth,0,me,Be,re.data);else if(y.isFramebufferTexture){if(ue)if(U)t.texStorage2D(i.TEXTURE_2D,Me,Pe,re.width,re.height);else{let se=re.width,te=re.height;for(let Ee=0;Ee<Me;Ee++)t.texImage2D(i.TEXTURE_2D,Ee,Pe,se,te,0,me,Be,null),se>>=1,te>>=1}}else if(qe.length>0){if(U&&ue){let se=Ie(qe[0]);t.texStorage2D(i.TEXTURE_2D,Me,Pe,se.width,se.height)}for(let se=0,te=qe.length;se<te;se++)fe=qe[se],U?he&&t.texSubImage2D(i.TEXTURE_2D,se,0,0,me,Be,fe):t.texImage2D(i.TEXTURE_2D,se,Pe,me,Be,fe);y.generateMipmaps=!1}else if(U){if(ue){let se=Ie(re);t.texStorage2D(i.TEXTURE_2D,Me,Pe,se.width,se.height)}he&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,me,Be,re)}else t.texImage2D(i.TEXTURE_2D,0,Pe,me,Be,re);m(y)&&p(P),de.__version=V.version,y.onUpdate&&y.onUpdate(y)}S.__version=y.version}function ee(S,y,H){if(y.image.length!==6)return;let P=it(S,y),G=y.source;t.bindTexture(i.TEXTURE_CUBE_MAP,S.__webglTexture,i.TEXTURE0+H);let V=n.get(G);if(G.version!==V.__version||P===!0){t.activeTexture(i.TEXTURE0+H);let de=ct.getPrimaries(ct.workingColorSpace),ae=y.colorSpace===Si?null:ct.getPrimaries(y.colorSpace),Ae=y.colorSpace===Si||de===ae?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,y.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,y.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ae);let Ce=y.isCompressedTexture||y.image[0].isCompressedTexture,re=y.image[0]&&y.image[0].isDataTexture,me=[];for(let te=0;te<6;te++)!Ce&&!re?me[te]=x(y.image[te],!0,s.maxCubemapSize):me[te]=re?y.image[te].image:y.image[te],me[te]=be(y,me[te]);let Be=me[0],Pe=r.convert(y.format,y.colorSpace),fe=r.convert(y.type),qe=T(y.internalFormat,Pe,fe,y.colorSpace),U=y.isVideoTexture!==!0,ue=V.__version===void 0||P===!0,he=G.dataReady,Me=E(y,Be);He(i.TEXTURE_CUBE_MAP,y);let se;if(Ce){U&&ue&&t.texStorage2D(i.TEXTURE_CUBE_MAP,Me,qe,Be.width,Be.height);for(let te=0;te<6;te++){se=me[te].mipmaps;for(let Ee=0;Ee<se.length;Ee++){let Xe=se[Ee];y.format!==_n?Pe!==null?U?he&&t.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+te,Ee,0,0,Xe.width,Xe.height,Pe,Xe.data):t.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+te,Ee,qe,Xe.width,Xe.height,0,Xe.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):U?he&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+te,Ee,0,0,Xe.width,Xe.height,Pe,fe,Xe.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+te,Ee,qe,Xe.width,Xe.height,0,Pe,fe,Xe.data)}}}else{if(se=y.mipmaps,U&&ue){se.length>0&&Me++;let te=Ie(me[0]);t.texStorage2D(i.TEXTURE_CUBE_MAP,Me,qe,te.width,te.height)}for(let te=0;te<6;te++)if(re){U?he&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+te,0,0,0,me[te].width,me[te].height,Pe,fe,me[te].data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+te,0,qe,me[te].width,me[te].height,0,Pe,fe,me[te].data);for(let Ee=0;Ee<se.length;Ee++){let ut=se[Ee].image[te].image;U?he&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+te,Ee+1,0,0,ut.width,ut.height,Pe,fe,ut.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+te,Ee+1,qe,ut.width,ut.height,0,Pe,fe,ut.data)}}else{U?he&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+te,0,0,0,Pe,fe,me[te]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+te,0,qe,Pe,fe,me[te]);for(let Ee=0;Ee<se.length;Ee++){let Xe=se[Ee];U?he&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+te,Ee+1,0,0,Pe,fe,Xe.image[te]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+te,Ee+1,qe,Pe,fe,Xe.image[te])}}}m(y)&&p(i.TEXTURE_CUBE_MAP),V.__version=G.version,y.onUpdate&&y.onUpdate(y)}S.__version=y.version}function _e(S,y,H,P,G,V){let de=r.convert(H.format,H.colorSpace),ae=r.convert(H.type),Ae=T(H.internalFormat,de,ae,H.colorSpace),Ce=n.get(y),re=n.get(H);if(re.__renderTarget=y,!Ce.__hasExternalTextures){let me=Math.max(1,y.width>>V),Be=Math.max(1,y.height>>V);G===i.TEXTURE_3D||G===i.TEXTURE_2D_ARRAY?t.texImage3D(G,V,Ae,me,Be,y.depth,0,de,ae,null):t.texImage2D(G,V,Ae,me,Be,0,de,ae,null)}t.bindFramebuffer(i.FRAMEBUFFER,S),O(y)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,P,G,re.__webglTexture,0,tt(y)):(G===i.TEXTURE_2D||G>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&G<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,P,G,re.__webglTexture,V),t.bindFramebuffer(i.FRAMEBUFFER,null)}function Fe(S,y,H){if(i.bindRenderbuffer(i.RENDERBUFFER,S),y.depthBuffer){let P=y.depthTexture,G=P&&P.isDepthTexture?P.type:null,V=v(y.stencilBuffer,G),de=y.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ae=tt(y);O(y)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,ae,V,y.width,y.height):H?i.renderbufferStorageMultisample(i.RENDERBUFFER,ae,V,y.width,y.height):i.renderbufferStorage(i.RENDERBUFFER,V,y.width,y.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,de,i.RENDERBUFFER,S)}else{let P=y.textures;for(let G=0;G<P.length;G++){let V=P[G],de=r.convert(V.format,V.colorSpace),ae=r.convert(V.type),Ae=T(V.internalFormat,de,ae,V.colorSpace),Ce=tt(y);H&&O(y)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,Ce,Ae,y.width,y.height):O(y)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,Ce,Ae,y.width,y.height):i.renderbufferStorage(i.RENDERBUFFER,Ae,y.width,y.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function we(S,y){if(y&&y.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(i.FRAMEBUFFER,S),!(y.depthTexture&&y.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");let P=n.get(y.depthTexture);P.__renderTarget=y,(!P.__webglTexture||y.depthTexture.image.width!==y.width||y.depthTexture.image.height!==y.height)&&(y.depthTexture.image.width=y.width,y.depthTexture.image.height=y.height,y.depthTexture.needsUpdate=!0),J(y.depthTexture,0);let G=P.__webglTexture,V=tt(y);if(y.depthTexture.format===qs)O(y)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,G,0,V):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,G,0);else if(y.depthTexture.format===lr)O(y)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,G,0,V):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,G,0);else throw new Error("Unknown depthTexture format")}function Ve(S){let y=n.get(S),H=S.isWebGLCubeRenderTarget===!0;if(y.__boundDepthTexture!==S.depthTexture){let P=S.depthTexture;if(y.__depthDisposeCallback&&y.__depthDisposeCallback(),P){let G=()=>{delete y.__boundDepthTexture,delete y.__depthDisposeCallback,P.removeEventListener("dispose",G)};P.addEventListener("dispose",G),y.__depthDisposeCallback=G}y.__boundDepthTexture=P}if(S.depthTexture&&!y.__autoAllocateDepthBuffer){if(H)throw new Error("target.depthTexture not supported in Cube render targets");let P=S.texture.mipmaps;P&&P.length>0?we(y.__webglFramebuffer[0],S):we(y.__webglFramebuffer,S)}else if(H){y.__webglDepthbuffer=[];for(let P=0;P<6;P++)if(t.bindFramebuffer(i.FRAMEBUFFER,y.__webglFramebuffer[P]),y.__webglDepthbuffer[P]===void 0)y.__webglDepthbuffer[P]=i.createRenderbuffer(),Fe(y.__webglDepthbuffer[P],S,!1);else{let G=S.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,V=y.__webglDepthbuffer[P];i.bindRenderbuffer(i.RENDERBUFFER,V),i.framebufferRenderbuffer(i.FRAMEBUFFER,G,i.RENDERBUFFER,V)}}else{let P=S.texture.mipmaps;if(P&&P.length>0?t.bindFramebuffer(i.FRAMEBUFFER,y.__webglFramebuffer[0]):t.bindFramebuffer(i.FRAMEBUFFER,y.__webglFramebuffer),y.__webglDepthbuffer===void 0)y.__webglDepthbuffer=i.createRenderbuffer(),Fe(y.__webglDepthbuffer,S,!1);else{let G=S.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,V=y.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,V),i.framebufferRenderbuffer(i.FRAMEBUFFER,G,i.RENDERBUFFER,V)}}t.bindFramebuffer(i.FRAMEBUFFER,null)}function bt(S,y,H){let P=n.get(S);y!==void 0&&_e(P.__webglFramebuffer,S,S.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),H!==void 0&&Ve(S)}function I(S){let y=S.texture,H=n.get(S),P=n.get(y);S.addEventListener("dispose",R);let G=S.textures,V=S.isWebGLCubeRenderTarget===!0,de=G.length>1;if(de||(P.__webglTexture===void 0&&(P.__webglTexture=i.createTexture()),P.__version=y.version,o.memory.textures++),V){H.__webglFramebuffer=[];for(let ae=0;ae<6;ae++)if(y.mipmaps&&y.mipmaps.length>0){H.__webglFramebuffer[ae]=[];for(let Ae=0;Ae<y.mipmaps.length;Ae++)H.__webglFramebuffer[ae][Ae]=i.createFramebuffer()}else H.__webglFramebuffer[ae]=i.createFramebuffer()}else{if(y.mipmaps&&y.mipmaps.length>0){H.__webglFramebuffer=[];for(let ae=0;ae<y.mipmaps.length;ae++)H.__webglFramebuffer[ae]=i.createFramebuffer()}else H.__webglFramebuffer=i.createFramebuffer();if(de)for(let ae=0,Ae=G.length;ae<Ae;ae++){let Ce=n.get(G[ae]);Ce.__webglTexture===void 0&&(Ce.__webglTexture=i.createTexture(),o.memory.textures++)}if(S.samples>0&&O(S)===!1){H.__webglMultisampledFramebuffer=i.createFramebuffer(),H.__webglColorRenderbuffer=[],t.bindFramebuffer(i.FRAMEBUFFER,H.__webglMultisampledFramebuffer);for(let ae=0;ae<G.length;ae++){let Ae=G[ae];H.__webglColorRenderbuffer[ae]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,H.__webglColorRenderbuffer[ae]);let Ce=r.convert(Ae.format,Ae.colorSpace),re=r.convert(Ae.type),me=T(Ae.internalFormat,Ce,re,Ae.colorSpace,S.isXRRenderTarget===!0),Be=tt(S);i.renderbufferStorageMultisample(i.RENDERBUFFER,Be,me,S.width,S.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ae,i.RENDERBUFFER,H.__webglColorRenderbuffer[ae])}i.bindRenderbuffer(i.RENDERBUFFER,null),S.depthBuffer&&(H.__webglDepthRenderbuffer=i.createRenderbuffer(),Fe(H.__webglDepthRenderbuffer,S,!0)),t.bindFramebuffer(i.FRAMEBUFFER,null)}}if(V){t.bindTexture(i.TEXTURE_CUBE_MAP,P.__webglTexture),He(i.TEXTURE_CUBE_MAP,y);for(let ae=0;ae<6;ae++)if(y.mipmaps&&y.mipmaps.length>0)for(let Ae=0;Ae<y.mipmaps.length;Ae++)_e(H.__webglFramebuffer[ae][Ae],S,y,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ae,Ae);else _e(H.__webglFramebuffer[ae],S,y,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ae,0);m(y)&&p(i.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(de){for(let ae=0,Ae=G.length;ae<Ae;ae++){let Ce=G[ae],re=n.get(Ce),me=i.TEXTURE_2D;(S.isWebGL3DRenderTarget||S.isWebGLArrayRenderTarget)&&(me=S.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(me,re.__webglTexture),He(me,Ce),_e(H.__webglFramebuffer,S,Ce,i.COLOR_ATTACHMENT0+ae,me,0),m(Ce)&&p(me)}t.unbindTexture()}else{let ae=i.TEXTURE_2D;if((S.isWebGL3DRenderTarget||S.isWebGLArrayRenderTarget)&&(ae=S.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(ae,P.__webglTexture),He(ae,y),y.mipmaps&&y.mipmaps.length>0)for(let Ae=0;Ae<y.mipmaps.length;Ae++)_e(H.__webglFramebuffer[Ae],S,y,i.COLOR_ATTACHMENT0,ae,Ae);else _e(H.__webglFramebuffer,S,y,i.COLOR_ATTACHMENT0,ae,0);m(y)&&p(ae),t.unbindTexture()}S.depthBuffer&&Ve(S)}function st(S){let y=S.textures;for(let H=0,P=y.length;H<P;H++){let G=y[H];if(m(G)){let V=w(S),de=n.get(G).__webglTexture;t.bindTexture(V,de),p(V),t.unbindTexture()}}}let ke=[],pe=[];function ye(S){if(S.samples>0){if(O(S)===!1){let y=S.textures,H=S.width,P=S.height,G=i.COLOR_BUFFER_BIT,V=S.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,de=n.get(S),ae=y.length>1;if(ae)for(let Ce=0;Ce<y.length;Ce++)t.bindFramebuffer(i.FRAMEBUFFER,de.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Ce,i.RENDERBUFFER,null),t.bindFramebuffer(i.FRAMEBUFFER,de.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+Ce,i.TEXTURE_2D,null,0);t.bindFramebuffer(i.READ_FRAMEBUFFER,de.__webglMultisampledFramebuffer);let Ae=S.texture.mipmaps;Ae&&Ae.length>0?t.bindFramebuffer(i.DRAW_FRAMEBUFFER,de.__webglFramebuffer[0]):t.bindFramebuffer(i.DRAW_FRAMEBUFFER,de.__webglFramebuffer);for(let Ce=0;Ce<y.length;Ce++){if(S.resolveDepthBuffer&&(S.depthBuffer&&(G|=i.DEPTH_BUFFER_BIT),S.stencilBuffer&&S.resolveStencilBuffer&&(G|=i.STENCIL_BUFFER_BIT)),ae){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,de.__webglColorRenderbuffer[Ce]);let re=n.get(y[Ce]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,re,0)}i.blitFramebuffer(0,0,H,P,0,0,H,P,G,i.NEAREST),c===!0&&(ke.length=0,pe.length=0,ke.push(i.COLOR_ATTACHMENT0+Ce),S.depthBuffer&&S.resolveDepthBuffer===!1&&(ke.push(V),pe.push(V),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,pe)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,ke))}if(t.bindFramebuffer(i.READ_FRAMEBUFFER,null),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),ae)for(let Ce=0;Ce<y.length;Ce++){t.bindFramebuffer(i.FRAMEBUFFER,de.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Ce,i.RENDERBUFFER,de.__webglColorRenderbuffer[Ce]);let re=n.get(y[Ce]).__webglTexture;t.bindFramebuffer(i.FRAMEBUFFER,de.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+Ce,i.TEXTURE_2D,re,0)}t.bindFramebuffer(i.DRAW_FRAMEBUFFER,de.__webglMultisampledFramebuffer)}else if(S.depthBuffer&&S.resolveDepthBuffer===!1&&c){let y=S.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[y])}}}function tt(S){return Math.min(s.maxSamples,S.samples)}function O(S){let y=n.get(S);return S.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&y.__useRenderToTexture!==!1}function Q(S){let y=o.render.frame;u.get(S)!==y&&(u.set(S,y),S.update())}function be(S,y){let H=S.colorSpace,P=S.format,G=S.type;return S.isCompressedTexture===!0||S.isVideoTexture===!0||H!==$t&&H!==Si&&(ct.getTransfer(H)===vt?(P!==_n||G!==Hn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",H)),y}function Ie(S){return typeof HTMLImageElement<"u"&&S instanceof HTMLImageElement?(l.width=S.naturalWidth||S.width,l.height=S.naturalHeight||S.height):typeof VideoFrame<"u"&&S instanceof VideoFrame?(l.width=S.displayWidth,l.height=S.displayHeight):(l.width=S.width,l.height=S.height),l}this.allocateTextureUnit=X,this.resetTextureUnits=F,this.setTexture2D=J,this.setTexture2DArray=W,this.setTexture3D=Z,this.setTextureCube=$,this.rebindTextures=bt,this.setupRenderTarget=I,this.updateRenderTargetMipmap=st,this.updateMultisampleRenderTarget=ye,this.setupDepthRenderbuffer=Ve,this.setupFrameBufferTexture=_e,this.useMultisampledRTT=O}function mb(i,e){function t(n,s=Si){let r,o=ct.getTransfer(s);if(n===Hn)return i.UNSIGNED_BYTE;if(n===el)return i.UNSIGNED_SHORT_4_4_4_4;if(n===tl)return i.UNSIGNED_SHORT_5_5_5_1;if(n===su)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===ru)return i.UNSIGNED_INT_10F_11F_11F_REV;if(n===nu)return i.BYTE;if(n===iu)return i.SHORT;if(n===rr)return i.UNSIGNED_SHORT;if(n===Qa)return i.INT;if(n===zi)return i.UNSIGNED_INT;if(n===En)return i.FLOAT;if(n===or)return i.HALF_FLOAT;if(n===ou)return i.ALPHA;if(n===au)return i.RGB;if(n===_n)return i.RGBA;if(n===qs)return i.DEPTH_COMPONENT;if(n===lr)return i.DEPTH_STENCIL;if(n===nl)return i.RED;if(n===il)return i.RED_INTEGER;if(n===lu)return i.RG;if(n===sl)return i.RG_INTEGER;if(n===rl)return i.RGBA_INTEGER;if(n===yo||n===vo||n===bo||n===So)if(o===vt)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===yo)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===vo)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===bo)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===So)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===yo)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===vo)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===bo)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===So)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===ol||n===al||n===ll||n===cl)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===ol)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===al)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===ll)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===cl)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===ul||n===hl||n===dl)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(n===ul||n===hl)return o===vt?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===dl)return o===vt?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===fl||n===pl||n===ml||n===gl||n===_l||n===xl||n===yl||n===vl||n===bl||n===Sl||n===Ml||n===Tl||n===wl||n===El)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(n===fl)return o===vt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===pl)return o===vt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===ml)return o===vt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===gl)return o===vt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===_l)return o===vt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===xl)return o===vt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===yl)return o===vt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===vl)return o===vt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===bl)return o===vt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===Sl)return o===vt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===Ml)return o===vt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===Tl)return o===vt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===wl)return o===vt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===El)return o===vt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===Al||n===Rl||n===Cl)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(n===Al)return o===vt?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===Rl)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===Cl)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Il||n===Pl||n===Ll||n===Dl)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(n===Il)return r.COMPRESSED_RED_RGTC1_EXT;if(n===Pl)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Ll)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===Dl)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===ar?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:t}}var gb=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,_b=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,Iu=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let n=new no(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new Bn({vertexShader:gb,fragmentShader:_b,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new ft(new so(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Pu=class extends $n{constructor(e,t){super();let n=this,s=null,r=1,o=null,a="local-floor",c=1,l=null,u=null,h=null,d=null,f=null,g=null,x=typeof XRWebGLBinding<"u",m=new Iu,p={},w=t.getContextAttributes(),T=null,v=null,E=[],A=[],R=new De,L=null,b=new Pt;b.viewport=new dt;let _=new Pt;_.viewport=new dt;let C=[b,_],F=new ka,X=null,q=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(K){let ee=E[K];return ee===void 0&&(ee=new Ks,E[K]=ee),ee.getTargetRaySpace()},this.getControllerGrip=function(K){let ee=E[K];return ee===void 0&&(ee=new Ks,E[K]=ee),ee.getGripSpace()},this.getHand=function(K){let ee=E[K];return ee===void 0&&(ee=new Ks,E[K]=ee),ee.getHandSpace()};function J(K){let ee=A.indexOf(K.inputSource);if(ee===-1)return;let _e=E[ee];_e!==void 0&&(_e.update(K.inputSource,K.frame,l||o),_e.dispatchEvent({type:K.type,data:K.inputSource}))}function W(){s.removeEventListener("select",J),s.removeEventListener("selectstart",J),s.removeEventListener("selectend",J),s.removeEventListener("squeeze",J),s.removeEventListener("squeezestart",J),s.removeEventListener("squeezeend",J),s.removeEventListener("end",W),s.removeEventListener("inputsourceschange",Z);for(let K=0;K<E.length;K++){let ee=A[K];ee!==null&&(A[K]=null,E[K].disconnect(ee))}X=null,q=null,m.reset();for(let K in p)delete p[K];e.setRenderTarget(T),f=null,d=null,h=null,s=null,v=null,$e.stop(),n.isPresenting=!1,e.setPixelRatio(L),e.setSize(R.width,R.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(K){r=K,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(K){a=K,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return l||o},this.setReferenceSpace=function(K){l=K},this.getBaseLayer=function(){return d!==null?d:f},this.getBinding=function(){return h===null&&x&&(h=new XRWebGLBinding(s,t)),h},this.getFrame=function(){return g},this.getSession=function(){return s},this.setSession=async function(K){if(s=K,s!==null){if(T=e.getRenderTarget(),s.addEventListener("select",J),s.addEventListener("selectstart",J),s.addEventListener("selectend",J),s.addEventListener("squeeze",J),s.addEventListener("squeezestart",J),s.addEventListener("squeezeend",J),s.addEventListener("end",W),s.addEventListener("inputsourceschange",Z),w.xrCompatible!==!0&&await t.makeXRCompatible(),L=e.getPixelRatio(),e.getSize(R),x&&"createProjectionLayer"in XRWebGLBinding.prototype){let _e=null,Fe=null,we=null;w.depth&&(we=w.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,_e=w.stencil?lr:qs,Fe=w.stencil?ar:zi);let Ve={colorFormat:t.RGBA8,depthFormat:we,scaleFactor:r};h=this.getBinding(),d=h.createProjectionLayer(Ve),s.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),v=new jn(d.textureWidth,d.textureHeight,{format:_n,type:Hn,depthTexture:new to(d.textureWidth,d.textureHeight,Fe,void 0,void 0,void 0,void 0,void 0,void 0,_e),stencilBuffer:w.stencil,colorSpace:e.outputColorSpace,samples:w.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1})}else{let _e={antialias:w.antialias,alpha:!0,depth:w.depth,stencil:w.stencil,framebufferScaleFactor:r};f=new XRWebGLLayer(s,t,_e),s.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),v=new jn(f.framebufferWidth,f.framebufferHeight,{format:_n,type:Hn,colorSpace:e.outputColorSpace,stencilBuffer:w.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1})}v.isXRRenderTarget=!0,this.setFoveation(c),l=null,o=await s.requestReferenceSpace(a),$e.setContext(s),$e.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return m.getDepthTexture()};function Z(K){for(let ee=0;ee<K.removed.length;ee++){let _e=K.removed[ee],Fe=A.indexOf(_e);Fe>=0&&(A[Fe]=null,E[Fe].disconnect(_e))}for(let ee=0;ee<K.added.length;ee++){let _e=K.added[ee],Fe=A.indexOf(_e);if(Fe===-1){for(let Ve=0;Ve<E.length;Ve++)if(Ve>=A.length){A.push(_e),Fe=Ve;break}else if(A[Ve]===null){A[Ve]=_e,Fe=Ve;break}if(Fe===-1)break}let we=E[Fe];we&&we.connect(_e)}}let $=new D,ne=new D;function ce(K,ee,_e){$.setFromMatrixPosition(ee.matrixWorld),ne.setFromMatrixPosition(_e.matrixWorld);let Fe=$.distanceTo(ne),we=ee.projectionMatrix.elements,Ve=_e.projectionMatrix.elements,bt=we[14]/(we[10]-1),I=we[14]/(we[10]+1),st=(we[9]+1)/we[5],ke=(we[9]-1)/we[5],pe=(we[8]-1)/we[0],ye=(Ve[8]+1)/Ve[0],tt=bt*pe,O=bt*ye,Q=Fe/(-pe+ye),be=Q*-pe;if(ee.matrixWorld.decompose(K.position,K.quaternion,K.scale),K.translateX(be),K.translateZ(Q),K.matrixWorld.compose(K.position,K.quaternion,K.scale),K.matrixWorldInverse.copy(K.matrixWorld).invert(),we[10]===-1)K.projectionMatrix.copy(ee.projectionMatrix),K.projectionMatrixInverse.copy(ee.projectionMatrixInverse);else{let Ie=bt+Q,S=I+Q,y=tt-be,H=O+(Fe-be),P=st*I/S*Ie,G=ke*I/S*Ie;K.projectionMatrix.makePerspective(y,H,P,G,Ie,S),K.projectionMatrixInverse.copy(K.projectionMatrix).invert()}}function Re(K,ee){ee===null?K.matrixWorld.copy(K.matrix):K.matrixWorld.multiplyMatrices(ee.matrixWorld,K.matrix),K.matrixWorldInverse.copy(K.matrixWorld).invert()}this.updateCamera=function(K){if(s===null)return;let ee=K.near,_e=K.far;m.texture!==null&&(m.depthNear>0&&(ee=m.depthNear),m.depthFar>0&&(_e=m.depthFar)),F.near=_.near=b.near=ee,F.far=_.far=b.far=_e,(X!==F.near||q!==F.far)&&(s.updateRenderState({depthNear:F.near,depthFar:F.far}),X=F.near,q=F.far),F.layers.mask=K.layers.mask|6,b.layers.mask=F.layers.mask&3,_.layers.mask=F.layers.mask&5;let Fe=K.parent,we=F.cameras;Re(F,Fe);for(let Ve=0;Ve<we.length;Ve++)Re(we[Ve],Fe);we.length===2?ce(F,b,_):F.projectionMatrix.copy(b.projectionMatrix),He(K,F,Fe)};function He(K,ee,_e){_e===null?K.matrix.copy(ee.matrixWorld):(K.matrix.copy(_e.matrixWorld),K.matrix.invert(),K.matrix.multiply(ee.matrixWorld)),K.matrix.decompose(K.position,K.quaternion,K.scale),K.updateMatrixWorld(!0),K.projectionMatrix.copy(ee.projectionMatrix),K.projectionMatrixInverse.copy(ee.projectionMatrixInverse),K.isPerspectiveCamera&&(K.fov=es*2*Math.atan(1/K.projectionMatrix.elements[5]),K.zoom=1)}this.getCamera=function(){return F},this.getFoveation=function(){if(!(d===null&&f===null))return c},this.setFoveation=function(K){c=K,d!==null&&(d.fixedFoveation=K),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=K)},this.hasDepthSensing=function(){return m.texture!==null},this.getDepthSensingMesh=function(){return m.getMesh(F)},this.getCameraTexture=function(K){return p[K]};let it=null;function et(K,ee){if(u=ee.getViewerPose(l||o),g=ee,u!==null){let _e=u.views;f!==null&&(e.setRenderTargetFramebuffer(v,f.framebuffer),e.setRenderTarget(v));let Fe=!1;_e.length!==F.cameras.length&&(F.cameras.length=0,Fe=!0);for(let I=0;I<_e.length;I++){let st=_e[I],ke=null;if(f!==null)ke=f.getViewport(st);else{let ye=h.getViewSubImage(d,st);ke=ye.viewport,I===0&&(e.setRenderTargetTextures(v,ye.colorTexture,ye.depthStencilTexture),e.setRenderTarget(v))}let pe=C[I];pe===void 0&&(pe=new Pt,pe.layers.enable(I),pe.viewport=new dt,C[I]=pe),pe.matrix.fromArray(st.transform.matrix),pe.matrix.decompose(pe.position,pe.quaternion,pe.scale),pe.projectionMatrix.fromArray(st.projectionMatrix),pe.projectionMatrixInverse.copy(pe.projectionMatrix).invert(),pe.viewport.set(ke.x,ke.y,ke.width,ke.height),I===0&&(F.matrix.copy(pe.matrix),F.matrix.decompose(F.position,F.quaternion,F.scale)),Fe===!0&&F.cameras.push(pe)}let we=s.enabledFeatures;if(we&&we.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&x){h=n.getBinding();let I=h.getDepthInformation(_e[0]);I&&I.isValid&&I.texture&&m.init(I,s.renderState)}if(we&&we.includes("camera-access")&&x){e.state.unbindTexture(),h=n.getBinding();for(let I=0;I<_e.length;I++){let st=_e[I].camera;if(st){let ke=p[st];ke||(ke=new no,p[st]=ke);let pe=h.getCameraImage(st);ke.sourceTexture=pe}}}}for(let _e=0;_e<E.length;_e++){let Fe=A[_e],we=E[_e];Fe!==null&&we!==void 0&&we.update(Fe,ee,l||o)}it&&it(K,ee),ee.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:ee}),g=null}let $e=new _p;$e.setAnimationLoop(et),this.setAnimationLoop=function(K){it=K},this.dispose=function(){}}},ms=new wn,xb=new je;function yb(i,e){function t(m,p){m.matrixAutoUpdate===!0&&m.updateMatrix(),p.value.copy(m.matrix)}function n(m,p){p.color.getRGB(m.fogColor.value,pu(i)),p.isFog?(m.fogNear.value=p.near,m.fogFar.value=p.far):p.isFogExp2&&(m.fogDensity.value=p.density)}function s(m,p,w,T,v){p.isMeshBasicMaterial||p.isMeshLambertMaterial?r(m,p):p.isMeshToonMaterial?(r(m,p),h(m,p)):p.isMeshPhongMaterial?(r(m,p),u(m,p)):p.isMeshStandardMaterial?(r(m,p),d(m,p),p.isMeshPhysicalMaterial&&f(m,p,v)):p.isMeshMatcapMaterial?(r(m,p),g(m,p)):p.isMeshDepthMaterial?r(m,p):p.isMeshDistanceMaterial?(r(m,p),x(m,p)):p.isMeshNormalMaterial?r(m,p):p.isLineBasicMaterial?(o(m,p),p.isLineDashedMaterial&&a(m,p)):p.isPointsMaterial?c(m,p,w,T):p.isSpriteMaterial?l(m,p):p.isShadowMaterial?(m.color.value.copy(p.color),m.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function r(m,p){m.opacity.value=p.opacity,p.color&&m.diffuse.value.copy(p.color),p.emissive&&m.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(m.map.value=p.map,t(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.bumpMap&&(m.bumpMap.value=p.bumpMap,t(p.bumpMap,m.bumpMapTransform),m.bumpScale.value=p.bumpScale,p.side===Ot&&(m.bumpScale.value*=-1)),p.normalMap&&(m.normalMap.value=p.normalMap,t(p.normalMap,m.normalMapTransform),m.normalScale.value.copy(p.normalScale),p.side===Ot&&m.normalScale.value.negate()),p.displacementMap&&(m.displacementMap.value=p.displacementMap,t(p.displacementMap,m.displacementMapTransform),m.displacementScale.value=p.displacementScale,m.displacementBias.value=p.displacementBias),p.emissiveMap&&(m.emissiveMap.value=p.emissiveMap,t(p.emissiveMap,m.emissiveMapTransform)),p.specularMap&&(m.specularMap.value=p.specularMap,t(p.specularMap,m.specularMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest);let w=e.get(p),T=w.envMap,v=w.envMapRotation;T&&(m.envMap.value=T,ms.copy(v),ms.x*=-1,ms.y*=-1,ms.z*=-1,T.isCubeTexture&&T.isRenderTargetTexture===!1&&(ms.y*=-1,ms.z*=-1),m.envMapRotation.value.setFromMatrix4(xb.makeRotationFromEuler(ms)),m.flipEnvMap.value=T.isCubeTexture&&T.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=p.reflectivity,m.ior.value=p.ior,m.refractionRatio.value=p.refractionRatio),p.lightMap&&(m.lightMap.value=p.lightMap,m.lightMapIntensity.value=p.lightMapIntensity,t(p.lightMap,m.lightMapTransform)),p.aoMap&&(m.aoMap.value=p.aoMap,m.aoMapIntensity.value=p.aoMapIntensity,t(p.aoMap,m.aoMapTransform))}function o(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,p.map&&(m.map.value=p.map,t(p.map,m.mapTransform))}function a(m,p){m.dashSize.value=p.dashSize,m.totalSize.value=p.dashSize+p.gapSize,m.scale.value=p.scale}function c(m,p,w,T){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.size.value=p.size*w,m.scale.value=T*.5,p.map&&(m.map.value=p.map,t(p.map,m.uvTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function l(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.rotation.value=p.rotation,p.map&&(m.map.value=p.map,t(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function u(m,p){m.specular.value.copy(p.specular),m.shininess.value=Math.max(p.shininess,1e-4)}function h(m,p){p.gradientMap&&(m.gradientMap.value=p.gradientMap)}function d(m,p){m.metalness.value=p.metalness,p.metalnessMap&&(m.metalnessMap.value=p.metalnessMap,t(p.metalnessMap,m.metalnessMapTransform)),m.roughness.value=p.roughness,p.roughnessMap&&(m.roughnessMap.value=p.roughnessMap,t(p.roughnessMap,m.roughnessMapTransform)),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)}function f(m,p,w){m.ior.value=p.ior,p.sheen>0&&(m.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),m.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(m.sheenColorMap.value=p.sheenColorMap,t(p.sheenColorMap,m.sheenColorMapTransform)),p.sheenRoughnessMap&&(m.sheenRoughnessMap.value=p.sheenRoughnessMap,t(p.sheenRoughnessMap,m.sheenRoughnessMapTransform))),p.clearcoat>0&&(m.clearcoat.value=p.clearcoat,m.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(m.clearcoatMap.value=p.clearcoatMap,t(p.clearcoatMap,m.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,t(p.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(m.clearcoatNormalMap.value=p.clearcoatNormalMap,t(p.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===Ot&&m.clearcoatNormalScale.value.negate())),p.dispersion>0&&(m.dispersion.value=p.dispersion),p.iridescence>0&&(m.iridescence.value=p.iridescence,m.iridescenceIOR.value=p.iridescenceIOR,m.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(m.iridescenceMap.value=p.iridescenceMap,t(p.iridescenceMap,m.iridescenceMapTransform)),p.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=p.iridescenceThicknessMap,t(p.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),p.transmission>0&&(m.transmission.value=p.transmission,m.transmissionSamplerMap.value=w.texture,m.transmissionSamplerSize.value.set(w.width,w.height),p.transmissionMap&&(m.transmissionMap.value=p.transmissionMap,t(p.transmissionMap,m.transmissionMapTransform)),m.thickness.value=p.thickness,p.thicknessMap&&(m.thicknessMap.value=p.thicknessMap,t(p.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=p.attenuationDistance,m.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(m.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(m.anisotropyMap.value=p.anisotropyMap,t(p.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=p.specularIntensity,m.specularColor.value.copy(p.specularColor),p.specularColorMap&&(m.specularColorMap.value=p.specularColorMap,t(p.specularColorMap,m.specularColorMapTransform)),p.specularIntensityMap&&(m.specularIntensityMap.value=p.specularIntensityMap,t(p.specularIntensityMap,m.specularIntensityMapTransform))}function g(m,p){p.matcap&&(m.matcap.value=p.matcap)}function x(m,p){let w=e.get(p).light;m.referencePosition.value.setFromMatrixPosition(w.matrixWorld),m.nearDistance.value=w.shadow.camera.near,m.farDistance.value=w.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function vb(i,e,t,n){let s={},r={},o=[],a=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function c(w,T){let v=T.program;n.uniformBlockBinding(w,v)}function l(w,T){let v=s[w.id];v===void 0&&(g(w),v=u(w),s[w.id]=v,w.addEventListener("dispose",m));let E=T.program;n.updateUBOMapping(w,E);let A=e.render.frame;r[w.id]!==A&&(d(w),r[w.id]=A)}function u(w){let T=h();w.__bindingPointIndex=T;let v=i.createBuffer(),E=w.__size,A=w.usage;return i.bindBuffer(i.UNIFORM_BUFFER,v),i.bufferData(i.UNIFORM_BUFFER,E,A),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,T,v),v}function h(){for(let w=0;w<a;w++)if(o.indexOf(w)===-1)return o.push(w),w;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(w){let T=s[w.id],v=w.uniforms,E=w.__cache;i.bindBuffer(i.UNIFORM_BUFFER,T);for(let A=0,R=v.length;A<R;A++){let L=Array.isArray(v[A])?v[A]:[v[A]];for(let b=0,_=L.length;b<_;b++){let C=L[b];if(f(C,A,b,E)===!0){let F=C.__offset,X=Array.isArray(C.value)?C.value:[C.value],q=0;for(let J=0;J<X.length;J++){let W=X[J],Z=x(W);typeof W=="number"||typeof W=="boolean"?(C.__data[0]=W,i.bufferSubData(i.UNIFORM_BUFFER,F+q,C.__data)):W.isMatrix3?(C.__data[0]=W.elements[0],C.__data[1]=W.elements[1],C.__data[2]=W.elements[2],C.__data[3]=0,C.__data[4]=W.elements[3],C.__data[5]=W.elements[4],C.__data[6]=W.elements[5],C.__data[7]=0,C.__data[8]=W.elements[6],C.__data[9]=W.elements[7],C.__data[10]=W.elements[8],C.__data[11]=0):(W.toArray(C.__data,q),q+=Z.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,F,C.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function f(w,T,v,E){let A=w.value,R=T+"_"+v;if(E[R]===void 0)return typeof A=="number"||typeof A=="boolean"?E[R]=A:E[R]=A.clone(),!0;{let L=E[R];if(typeof A=="number"||typeof A=="boolean"){if(L!==A)return E[R]=A,!0}else if(L.equals(A)===!1)return L.copy(A),!0}return!1}function g(w){let T=w.uniforms,v=0,E=16;for(let R=0,L=T.length;R<L;R++){let b=Array.isArray(T[R])?T[R]:[T[R]];for(let _=0,C=b.length;_<C;_++){let F=b[_],X=Array.isArray(F.value)?F.value:[F.value];for(let q=0,J=X.length;q<J;q++){let W=X[q],Z=x(W),$=v%E,ne=$%Z.boundary,ce=$+ne;v+=ne,ce!==0&&E-ce<Z.storage&&(v+=E-ce),F.__data=new Float32Array(Z.storage/Float32Array.BYTES_PER_ELEMENT),F.__offset=v,v+=Z.storage}}}let A=v%E;return A>0&&(v+=E-A),w.__size=v,w.__cache={},this}function x(w){let T={boundary:0,storage:0};return typeof w=="number"||typeof w=="boolean"?(T.boundary=4,T.storage=4):w.isVector2?(T.boundary=8,T.storage=8):w.isVector3||w.isColor?(T.boundary=16,T.storage=12):w.isVector4?(T.boundary=16,T.storage=16):w.isMatrix3?(T.boundary=48,T.storage=48):w.isMatrix4?(T.boundary=64,T.storage=64):w.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",w),T}function m(w){let T=w.target;T.removeEventListener("dispose",m);let v=o.indexOf(T.__bindingPointIndex);o.splice(v,1),i.deleteBuffer(s[T.id]),delete s[T.id],delete r[T.id]}function p(){for(let w in s)i.deleteBuffer(s[w]);o=[],s={},r={}}return{bind:c,update:l,dispose:p}}var zl=class{constructor(e={}){let{canvas:t=Hf(),context:n=null,depth:s=!0,stencil:r=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:l=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:h=!1,reversedDepthBuffer:d=!1}=e;this.isWebGLRenderer=!0;let f;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");f=n.getContextAttributes().alpha}else f=o;let g=new Uint32Array(4),x=new Int32Array(4),m=null,p=null,w=[],T=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=bi,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let v=this,E=!1;this._outputColorSpace=Ut;let A=0,R=0,L=null,b=-1,_=null,C=new dt,F=new dt,X=null,q=new Ne(0),J=0,W=t.width,Z=t.height,$=1,ne=null,ce=null,Re=new dt(0,0,W,Z),He=new dt(0,0,W,Z),it=!1,et=new er,$e=!1,K=!1,ee=new je,_e=new D,Fe=new dt,we={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},Ve=!1;function bt(){return L===null?$:1}let I=n;function st(M,z){return t.getContext(M,z)}try{let M={alpha:!0,depth:s,stencil:r,antialias:a,premultipliedAlpha:c,preserveDrawingBuffer:l,powerPreference:u,failIfMajorPerformanceCaveat:h};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${"180"}`),t.addEventListener("webglcontextlost",he,!1),t.addEventListener("webglcontextrestored",Me,!1),t.addEventListener("webglcontextcreationerror",se,!1),I===null){let z="webgl2";if(I=st(z,M),I===null)throw st(z)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(M){throw console.error("THREE.WebGLRenderer: "+M.message),M}let ke,pe,ye,tt,O,Q,be,Ie,S,y,H,P,G,V,de,ae,Ae,Ce,re,me,Be,Pe,fe,qe;function U(){ke=new By(I),ke.init(),Pe=new mb(I,ke),pe=new Py(I,ke,e,Pe),ye=new fb(I,ke),pe.reversedDepthBuffer&&d&&ye.buffers.depth.setReversed(!0),tt=new Hy(I),O=new eb,Q=new pb(I,ke,ye,O,pe,Pe,tt),be=new Dy(v),Ie=new Oy(v),S=new q0(I),fe=new Cy(I,S),y=new zy(I,S,tt,fe),H=new Gy(I,y,S,tt),re=new Vy(I,pe,Q),ae=new Ly(O),P=new Qv(v,be,Ie,ke,pe,fe,ae),G=new yb(v,O),V=new nb,de=new lb(ke),Ce=new Ry(v,be,Ie,ye,H,f,c),Ae=new hb(v,H,pe),qe=new vb(I,tt,pe,ye),me=new Iy(I,ke,tt),Be=new ky(I,ke,tt),tt.programs=P.programs,v.capabilities=pe,v.extensions=ke,v.properties=O,v.renderLists=V,v.shadowMap=Ae,v.state=ye,v.info=tt}U();let ue=new Pu(v,I);this.xr=ue,this.getContext=function(){return I},this.getContextAttributes=function(){return I.getContextAttributes()},this.forceContextLoss=function(){let M=ke.get("WEBGL_lose_context");M&&M.loseContext()},this.forceContextRestore=function(){let M=ke.get("WEBGL_lose_context");M&&M.restoreContext()},this.getPixelRatio=function(){return $},this.setPixelRatio=function(M){M!==void 0&&($=M,this.setSize(W,Z,!1))},this.getSize=function(M){return M.set(W,Z)},this.setSize=function(M,z,j=!0){if(ue.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}W=M,Z=z,t.width=Math.floor(M*$),t.height=Math.floor(z*$),j===!0&&(t.style.width=M+"px",t.style.height=z+"px"),this.setViewport(0,0,M,z)},this.getDrawingBufferSize=function(M){return M.set(W*$,Z*$).floor()},this.setDrawingBufferSize=function(M,z,j){W=M,Z=z,$=j,t.width=Math.floor(M*j),t.height=Math.floor(z*j),this.setViewport(0,0,M,z)},this.getCurrentViewport=function(M){return M.copy(C)},this.getViewport=function(M){return M.copy(Re)},this.setViewport=function(M,z,j,Y){M.isVector4?Re.set(M.x,M.y,M.z,M.w):Re.set(M,z,j,Y),ye.viewport(C.copy(Re).multiplyScalar($).round())},this.getScissor=function(M){return M.copy(He)},this.setScissor=function(M,z,j,Y){M.isVector4?He.set(M.x,M.y,M.z,M.w):He.set(M,z,j,Y),ye.scissor(F.copy(He).multiplyScalar($).round())},this.getScissorTest=function(){return it},this.setScissorTest=function(M){ye.setScissorTest(it=M)},this.setOpaqueSort=function(M){ne=M},this.setTransparentSort=function(M){ce=M},this.getClearColor=function(M){return M.copy(Ce.getClearColor())},this.setClearColor=function(){Ce.setClearColor(...arguments)},this.getClearAlpha=function(){return Ce.getClearAlpha()},this.setClearAlpha=function(){Ce.setClearAlpha(...arguments)},this.clear=function(M=!0,z=!0,j=!0){let Y=0;if(M){let k=!1;if(L!==null){let oe=L.texture.format;k=oe===rl||oe===sl||oe===il}if(k){let oe=L.texture.type,xe=oe===Hn||oe===zi||oe===rr||oe===ar||oe===el||oe===tl,Te=Ce.getClearColor(),ve=Ce.getClearAlpha(),ze=Te.r,Ge=Te.g,Le=Te.b;xe?(g[0]=ze,g[1]=Ge,g[2]=Le,g[3]=ve,I.clearBufferuiv(I.COLOR,0,g)):(x[0]=ze,x[1]=Ge,x[2]=Le,x[3]=ve,I.clearBufferiv(I.COLOR,0,x))}else Y|=I.COLOR_BUFFER_BIT}z&&(Y|=I.DEPTH_BUFFER_BIT),j&&(Y|=I.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),I.clear(Y)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",he,!1),t.removeEventListener("webglcontextrestored",Me,!1),t.removeEventListener("webglcontextcreationerror",se,!1),Ce.dispose(),V.dispose(),de.dispose(),O.dispose(),be.dispose(),Ie.dispose(),H.dispose(),fe.dispose(),qe.dispose(),P.dispose(),ue.dispose(),ue.removeEventListener("sessionstart",Ht),ue.removeEventListener("sessionend",Vn),Gn.stop()};function he(M){M.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),E=!0}function Me(){console.log("THREE.WebGLRenderer: Context Restored."),E=!1;let M=tt.autoReset,z=Ae.enabled,j=Ae.autoUpdate,Y=Ae.needsUpdate,k=Ae.type;U(),tt.autoReset=M,Ae.enabled=z,Ae.autoUpdate=j,Ae.needsUpdate=Y,Ae.type=k}function se(M){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",M.statusMessage)}function te(M){let z=M.target;z.removeEventListener("dispose",te),Ee(z)}function Ee(M){Xe(M),O.remove(M)}function Xe(M){let z=O.get(M).programs;z!==void 0&&(z.forEach(function(j){P.releaseProgram(j)}),M.isShaderMaterial&&P.releaseShaderCache(M))}this.renderBufferDirect=function(M,z,j,Y,k,oe){z===null&&(z=we);let xe=k.isMesh&&k.matrixWorld.determinant()<0,Te=Wi(M,z,j,Y,k);ye.setMaterial(Y,xe);let ve=j.index,ze=1;if(Y.wireframe===!0){if(ve=y.getWireframeAttribute(j),ve===void 0)return;ze=2}let Ge=j.drawRange,Le=j.attributes.position,Ye=Ge.start*ze,pt=(Ge.start+Ge.count)*ze;oe!==null&&(Ye=Math.max(Ye,oe.start*ze),pt=Math.min(pt,(oe.start+oe.count)*ze)),ve!==null?(Ye=Math.max(Ye,0),pt=Math.min(pt,ve.count)):Le!=null&&(Ye=Math.max(Ye,0),pt=Math.min(pt,Le.count));let At=pt-Ye;if(At<0||At===1/0)return;fe.setup(k,Y,Te,j,ve);let ht,rt=me;if(ve!==null&&(ht=S.get(ve),rt=Be,rt.setIndex(ht)),k.isMesh)Y.wireframe===!0?(ye.setLineWidth(Y.wireframeLinewidth*bt()),rt.setMode(I.LINES)):rt.setMode(I.TRIANGLES);else if(k.isLine){let Oe=Y.linewidth;Oe===void 0&&(Oe=1),ye.setLineWidth(Oe*bt()),k.isLineSegments?rt.setMode(I.LINES):k.isLineLoop?rt.setMode(I.LINE_LOOP):rt.setMode(I.LINE_STRIP)}else k.isPoints?rt.setMode(I.POINTS):k.isSprite&&rt.setMode(I.TRIANGLES);if(k.isBatchedMesh)if(k._multiDrawInstances!==null)js("THREE.WebGLRenderer: renderMultiDrawInstances has been deprecated and will be removed in r184. Append to renderMultiDraw arguments and use indirection."),rt.renderMultiDrawInstances(k._multiDrawStarts,k._multiDrawCounts,k._multiDrawCount,k._multiDrawInstances);else if(ke.get("WEBGL_multi_draw"))rt.renderMultiDraw(k._multiDrawStarts,k._multiDrawCounts,k._multiDrawCount);else{let Oe=k._multiDrawStarts,St=k._multiDrawCounts,lt=k._multiDrawCount,Xt=ve?S.get(ve).bytesPerElement:1,xn=O.get(Y).currentProgram.getUniforms();for(let Vt=0;Vt<lt;Vt++)xn.setValue(I,"_gl_DrawID",Vt),rt.render(Oe[Vt]/Xt,St[Vt])}else if(k.isInstancedMesh)rt.renderInstances(Ye,At,k.count);else if(j.isInstancedBufferGeometry){let Oe=j._maxInstanceCount!==void 0?j._maxInstanceCount:1/0,St=Math.min(j.instanceCount,Oe);rt.renderInstances(Ye,At,St)}else rt.render(Ye,At)};function ut(M,z,j){M.transparent===!0&&M.side===tn&&M.forceSinglePass===!1?(M.side=Ot,M.needsUpdate=!0,vs(M,z,j),M.side=On,M.needsUpdate=!0,vs(M,z,j),M.side=tn):vs(M,z,j)}this.compile=function(M,z,j=null){j===null&&(j=M),p=de.get(j),p.init(z),T.push(p),j.traverseVisible(function(k){k.isLight&&k.layers.test(z.layers)&&(p.pushLight(k),k.castShadow&&p.pushShadow(k))}),M!==j&&M.traverseVisible(function(k){k.isLight&&k.layers.test(z.layers)&&(p.pushLight(k),k.castShadow&&p.pushShadow(k))}),p.setupLights();let Y=new Set;return M.traverse(function(k){if(!(k.isMesh||k.isPoints||k.isLine||k.isSprite))return;let oe=k.material;if(oe)if(Array.isArray(oe))for(let xe=0;xe<oe.length;xe++){let Te=oe[xe];ut(Te,j,k),Y.add(Te)}else ut(oe,j,k),Y.add(oe)}),p=T.pop(),Y},this.compileAsync=function(M,z,j=null){let Y=this.compile(M,z,j);return new Promise(k=>{function oe(){if(Y.forEach(function(xe){O.get(xe).currentProgram.isReady()&&Y.delete(xe)}),Y.size===0){k(M);return}setTimeout(oe,10)}ke.get("KHR_parallel_shader_compile")!==null?oe():setTimeout(oe,10)})};let Ke=null;function Wt(M){Ke&&Ke(M)}function Ht(){Gn.stop()}function Vn(){Gn.start()}let Gn=new _p;Gn.setAnimationLoop(Wt),typeof self<"u"&&Gn.setContext(self),this.setAnimationLoop=function(M){Ke=M,ue.setAnimationLoop(M),M===null?Gn.stop():Gn.start()},ue.addEventListener("sessionstart",Ht),ue.addEventListener("sessionend",Vn),this.render=function(M,z){if(z!==void 0&&z.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(E===!0)return;if(M.matrixWorldAutoUpdate===!0&&M.updateMatrixWorld(),z.parent===null&&z.matrixWorldAutoUpdate===!0&&z.updateMatrixWorld(),ue.enabled===!0&&ue.isPresenting===!0&&(ue.cameraAutoUpdate===!0&&ue.updateCamera(z),z=ue.getCamera()),M.isScene===!0&&M.onBeforeRender(v,M,z,L),p=de.get(M,T.length),p.init(z),T.push(p),ee.multiplyMatrices(z.projectionMatrix,z.matrixWorldInverse),et.setFromProjectionMatrix(ee,Un,z.reversedDepth),K=this.localClippingEnabled,$e=ae.init(this.clippingPlanes,K),m=V.get(M,w.length),m.init(),w.push(m),ue.enabled===!0&&ue.isPresenting===!0){let oe=v.xr.getDepthSensingMesh();oe!==null&&Vi(oe,z,-1/0,v.sortObjects)}Vi(M,z,0,v.sortObjects),m.finish(),v.sortObjects===!0&&m.sort(ne,ce),Ve=ue.enabled===!1||ue.isPresenting===!1||ue.hasDepthSensing()===!1,Ve&&Ce.addToRenderList(m,M),this.info.render.frame++,$e===!0&&ae.beginShadows();let j=p.state.shadowsArray;Ae.render(j,M,z),$e===!0&&ae.endShadows(),this.info.autoReset===!0&&this.info.reset();let Y=m.opaque,k=m.transmissive;if(p.setupLights(),z.isArrayCamera){let oe=z.cameras;if(k.length>0)for(let xe=0,Te=oe.length;xe<Te;xe++){let ve=oe[xe];yr(Y,k,M,ve)}Ve&&Ce.render(M);for(let xe=0,Te=oe.length;xe<Te;xe++){let ve=oe[xe];si(m,M,ve,ve.viewport)}}else k.length>0&&yr(Y,k,M,z),Ve&&Ce.render(M),si(m,M,z);L!==null&&R===0&&(Q.updateMultisampleRenderTarget(L),Q.updateRenderTargetMipmap(L)),M.isScene===!0&&M.onAfterRender(v,M,z),fe.resetDefaultState(),b=-1,_=null,T.pop(),T.length>0?(p=T[T.length-1],$e===!0&&ae.setGlobalState(v.clippingPlanes,p.state.camera)):p=null,w.pop(),w.length>0?m=w[w.length-1]:m=null};function Vi(M,z,j,Y){if(M.visible===!1)return;if(M.layers.test(z.layers)){if(M.isGroup)j=M.renderOrder;else if(M.isLOD)M.autoUpdate===!0&&M.update(z);else if(M.isLight)p.pushLight(M),M.castShadow&&p.pushShadow(M);else if(M.isSprite){if(!M.frustumCulled||et.intersectsSprite(M)){Y&&Fe.setFromMatrixPosition(M.matrixWorld).applyMatrix4(ee);let xe=H.update(M),Te=M.material;Te.visible&&m.push(M,xe,Te,j,Fe.z,null)}}else if((M.isMesh||M.isLine||M.isPoints)&&(!M.frustumCulled||et.intersectsObject(M))){let xe=H.update(M),Te=M.material;if(Y&&(M.boundingSphere!==void 0?(M.boundingSphere===null&&M.computeBoundingSphere(),Fe.copy(M.boundingSphere.center)):(xe.boundingSphere===null&&xe.computeBoundingSphere(),Fe.copy(xe.boundingSphere.center)),Fe.applyMatrix4(M.matrixWorld).applyMatrix4(ee)),Array.isArray(Te)){let ve=xe.groups;for(let ze=0,Ge=ve.length;ze<Ge;ze++){let Le=ve[ze],Ye=Te[Le.materialIndex];Ye&&Ye.visible&&m.push(M,xe,Ye,j,Fe.z,Le)}}else Te.visible&&m.push(M,xe,Te,j,Fe.z,null)}}let oe=M.children;for(let xe=0,Te=oe.length;xe<Te;xe++)Vi(oe[xe],z,j,Y)}function si(M,z,j,Y){let k=M.opaque,oe=M.transmissive,xe=M.transparent;p.setupLightsView(j),$e===!0&&ae.setGlobalState(v.clippingPlanes,j),Y&&ye.viewport(C.copy(Y)),k.length>0&&Rn(k,z,j),oe.length>0&&Rn(oe,z,j),xe.length>0&&Rn(xe,z,j),ye.buffers.depth.setTest(!0),ye.buffers.depth.setMask(!0),ye.buffers.color.setMask(!0),ye.setPolygonOffset(!1)}function yr(M,z,j,Y){if((j.isScene===!0?j.overrideMaterial:null)!==null)return;p.state.transmissionRenderTarget[Y.id]===void 0&&(p.state.transmissionRenderTarget[Y.id]=new jn(1,1,{generateMipmaps:!0,type:ke.has("EXT_color_buffer_half_float")||ke.has("EXT_color_buffer_float")?or:Hn,minFilter:kn,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:ct.workingColorSpace}));let oe=p.state.transmissionRenderTarget[Y.id],xe=Y.viewport||C;oe.setSize(xe.z*v.transmissionResolutionScale,xe.w*v.transmissionResolutionScale);let Te=v.getRenderTarget(),ve=v.getActiveCubeFace(),ze=v.getActiveMipmapLevel();v.setRenderTarget(oe),v.getClearColor(q),J=v.getClearAlpha(),J<1&&v.setClearColor(16777215,.5),v.clear(),Ve&&Ce.render(j);let Ge=v.toneMapping;v.toneMapping=bi;let Le=Y.viewport;if(Y.viewport!==void 0&&(Y.viewport=void 0),p.setupLightsView(Y),$e===!0&&ae.setGlobalState(v.clippingPlanes,Y),Rn(M,j,Y),Q.updateMultisampleRenderTarget(oe),Q.updateRenderTargetMipmap(oe),ke.has("WEBGL_multisampled_render_to_texture")===!1){let Ye=!1;for(let pt=0,At=z.length;pt<At;pt++){let ht=z[pt],rt=ht.object,Oe=ht.geometry,St=ht.material,lt=ht.group;if(St.side===tn&&rt.layers.test(Y.layers)){let Xt=St.side;St.side=Ot,St.needsUpdate=!0,Wn(rt,j,Y,Oe,St,lt),St.side=Xt,St.needsUpdate=!0,Ye=!0}}Ye===!0&&(Q.updateMultisampleRenderTarget(oe),Q.updateRenderTargetMipmap(oe))}v.setRenderTarget(Te,ve,ze),v.setClearColor(q,J),Le!==void 0&&(Y.viewport=Le),v.toneMapping=Ge}function Rn(M,z,j){let Y=z.isScene===!0?z.overrideMaterial:null;for(let k=0,oe=M.length;k<oe;k++){let xe=M[k],Te=xe.object,ve=xe.geometry,ze=xe.group,Ge=xe.material;Ge.allowOverride===!0&&Y!==null&&(Ge=Y),Te.layers.test(j.layers)&&Wn(Te,z,j,ve,Ge,ze)}}function Wn(M,z,j,Y,k,oe){M.onBeforeRender(v,z,j,Y,k,oe),M.modelViewMatrix.multiplyMatrices(j.matrixWorldInverse,M.matrixWorld),M.normalMatrix.getNormalMatrix(M.modelViewMatrix),k.onBeforeRender(v,z,j,Y,M,oe),k.transparent===!0&&k.side===tn&&k.forceSinglePass===!1?(k.side=Ot,k.needsUpdate=!0,v.renderBufferDirect(j,z,Y,k,M,oe),k.side=On,k.needsUpdate=!0,v.renderBufferDirect(j,z,Y,k,M,oe),k.side=tn):v.renderBufferDirect(j,z,Y,k,M,oe),M.onAfterRender(v,z,j,Y,k,oe)}function vs(M,z,j){z.isScene!==!0&&(z=we);let Y=O.get(M),k=p.state.lights,oe=p.state.shadowsArray,xe=k.state.version,Te=P.getParameters(M,k.state,oe,z,j),ve=P.getProgramCacheKey(Te),ze=Y.programs;Y.environment=M.isMeshStandardMaterial?z.environment:null,Y.fog=z.fog,Y.envMap=(M.isMeshStandardMaterial?Ie:be).get(M.envMap||Y.environment),Y.envMapRotation=Y.environment!==null&&M.envMap===null?z.environmentRotation:M.envMapRotation,ze===void 0&&(M.addEventListener("dispose",te),ze=new Map,Y.programs=ze);let Ge=ze.get(ve);if(Ge!==void 0){if(Y.currentProgram===Ge&&Y.lightsStateVersion===xe)return Gi(M,Te),Ge}else Te.uniforms=P.getUniforms(M),M.onBeforeCompile(Te,v),Ge=P.acquireProgram(Te,ve),ze.set(ve,Ge),Y.uniforms=Te.uniforms;let Le=Y.uniforms;return(!M.isShaderMaterial&&!M.isRawShaderMaterial||M.clipping===!0)&&(Le.clippingPlanes=ae.uniform),Gi(M,Te),Y.needsLights=tc(M),Y.lightsStateVersion=xe,Y.needsLights&&(Le.ambientLightColor.value=k.state.ambient,Le.lightProbe.value=k.state.probe,Le.directionalLights.value=k.state.directional,Le.directionalLightShadows.value=k.state.directionalShadow,Le.spotLights.value=k.state.spot,Le.spotLightShadows.value=k.state.spotShadow,Le.rectAreaLights.value=k.state.rectArea,Le.ltc_1.value=k.state.rectAreaLTC1,Le.ltc_2.value=k.state.rectAreaLTC2,Le.pointLights.value=k.state.point,Le.pointLightShadows.value=k.state.pointShadow,Le.hemisphereLights.value=k.state.hemi,Le.directionalShadowMap.value=k.state.directionalShadowMap,Le.directionalShadowMatrix.value=k.state.directionalShadowMatrix,Le.spotShadowMap.value=k.state.spotShadowMap,Le.spotLightMatrix.value=k.state.spotLightMatrix,Le.spotLightMap.value=k.state.spotLightMap,Le.pointShadowMap.value=k.state.pointShadowMap,Le.pointShadowMatrix.value=k.state.pointShadowMatrix),Y.currentProgram=Ge,Y.uniformsList=null,Ge}function Lo(M){if(M.uniformsList===null){let z=M.currentProgram.getUniforms();M.uniformsList=dr.seqWithValue(z.seq,M.uniforms)}return M.uniformsList}function Gi(M,z){let j=O.get(M);j.outputColorSpace=z.outputColorSpace,j.batching=z.batching,j.batchingColor=z.batchingColor,j.instancing=z.instancing,j.instancingColor=z.instancingColor,j.instancingMorph=z.instancingMorph,j.skinning=z.skinning,j.morphTargets=z.morphTargets,j.morphNormals=z.morphNormals,j.morphColors=z.morphColors,j.morphTargetsCount=z.morphTargetsCount,j.numClippingPlanes=z.numClippingPlanes,j.numIntersection=z.numClipIntersection,j.vertexAlphas=z.vertexAlphas,j.vertexTangents=z.vertexTangents,j.toneMapping=z.toneMapping}function Wi(M,z,j,Y,k){z.isScene!==!0&&(z=we),Q.resetTextureUnits();let oe=z.fog,xe=Y.isMeshStandardMaterial?z.environment:null,Te=L===null?v.outputColorSpace:L.isXRRenderTarget===!0?L.texture.colorSpace:$t,ve=(Y.isMeshStandardMaterial?Ie:be).get(Y.envMap||xe),ze=Y.vertexColors===!0&&!!j.attributes.color&&j.attributes.color.itemSize===4,Ge=!!j.attributes.tangent&&(!!Y.normalMap||Y.anisotropy>0),Le=!!j.morphAttributes.position,Ye=!!j.morphAttributes.normal,pt=!!j.morphAttributes.color,At=bi;Y.toneMapped&&(L===null||L.isXRRenderTarget===!0)&&(At=v.toneMapping);let ht=j.morphAttributes.position||j.morphAttributes.normal||j.morphAttributes.color,rt=ht!==void 0?ht.length:0,Oe=O.get(Y),St=p.state.lights;if($e===!0&&(K===!0||M!==_)){let Tt=M===_&&Y.id===b;ae.setState(Y,M,Tt)}let lt=!1;Y.version===Oe.__version?(Oe.needsLights&&Oe.lightsStateVersion!==St.state.version||Oe.outputColorSpace!==Te||k.isBatchedMesh&&Oe.batching===!1||!k.isBatchedMesh&&Oe.batching===!0||k.isBatchedMesh&&Oe.batchingColor===!0&&k.colorTexture===null||k.isBatchedMesh&&Oe.batchingColor===!1&&k.colorTexture!==null||k.isInstancedMesh&&Oe.instancing===!1||!k.isInstancedMesh&&Oe.instancing===!0||k.isSkinnedMesh&&Oe.skinning===!1||!k.isSkinnedMesh&&Oe.skinning===!0||k.isInstancedMesh&&Oe.instancingColor===!0&&k.instanceColor===null||k.isInstancedMesh&&Oe.instancingColor===!1&&k.instanceColor!==null||k.isInstancedMesh&&Oe.instancingMorph===!0&&k.morphTexture===null||k.isInstancedMesh&&Oe.instancingMorph===!1&&k.morphTexture!==null||Oe.envMap!==ve||Y.fog===!0&&Oe.fog!==oe||Oe.numClippingPlanes!==void 0&&(Oe.numClippingPlanes!==ae.numPlanes||Oe.numIntersection!==ae.numIntersection)||Oe.vertexAlphas!==ze||Oe.vertexTangents!==Ge||Oe.morphTargets!==Le||Oe.morphNormals!==Ye||Oe.morphColors!==pt||Oe.toneMapping!==At||Oe.morphTargetsCount!==rt)&&(lt=!0):(lt=!0,Oe.__version=Y.version);let Xt=Oe.currentProgram;lt===!0&&(Xt=vs(Y,z,k));let xn=!1,Vt=!1,Mi=!1,gt=Xt.getUniforms(),sn=Oe.uniforms;if(ye.useProgram(Xt.program)&&(xn=!0,Vt=!0,Mi=!0),Y.id!==b&&(b=Y.id,Vt=!0),xn||_!==M){ye.buffers.depth.getReversed()&&M.reversedDepth!==!0&&(M._reversedDepth=!0,M.updateProjectionMatrix()),gt.setValue(I,"projectionMatrix",M.projectionMatrix),gt.setValue(I,"viewMatrix",M.matrixWorldInverse);let jt=gt.map.cameraPosition;jt!==void 0&&jt.setValue(I,_e.setFromMatrixPosition(M.matrixWorld)),pe.logarithmicDepthBuffer&&gt.setValue(I,"logDepthBufFC",2/(Math.log(M.far+1)/Math.LN2)),(Y.isMeshPhongMaterial||Y.isMeshToonMaterial||Y.isMeshLambertMaterial||Y.isMeshBasicMaterial||Y.isMeshStandardMaterial||Y.isShaderMaterial)&&gt.setValue(I,"isOrthographic",M.isOrthographicCamera===!0),_!==M&&(_=M,Vt=!0,Mi=!0)}if(k.isSkinnedMesh){gt.setOptional(I,k,"bindMatrix"),gt.setOptional(I,k,"bindMatrixInverse");let Tt=k.skeleton;Tt&&(Tt.boneTexture===null&&Tt.computeBoneTexture(),gt.setValue(I,"boneTexture",Tt.boneTexture,Q))}k.isBatchedMesh&&(gt.setOptional(I,k,"batchingTexture"),gt.setValue(I,"batchingTexture",k._matricesTexture,Q),gt.setOptional(I,k,"batchingIdTexture"),gt.setValue(I,"batchingIdTexture",k._indirectTexture,Q),gt.setOptional(I,k,"batchingColorTexture"),k._colorsTexture!==null&&gt.setValue(I,"batchingColorTexture",k._colorsTexture,Q));let Rt=j.morphAttributes;if((Rt.position!==void 0||Rt.normal!==void 0||Rt.color!==void 0)&&re.update(k,j,Xt),(Vt||Oe.receiveShadow!==k.receiveShadow)&&(Oe.receiveShadow=k.receiveShadow,gt.setValue(I,"receiveShadow",k.receiveShadow)),Y.isMeshGouraudMaterial&&Y.envMap!==null&&(sn.envMap.value=ve,sn.flipEnvMap.value=ve.isCubeTexture&&ve.isRenderTargetTexture===!1?-1:1),Y.isMeshStandardMaterial&&Y.envMap===null&&z.environment!==null&&(sn.envMapIntensity.value=z.environmentIntensity),Vt&&(gt.setValue(I,"toneMappingExposure",v.toneMappingExposure),Oe.needsLights&&ec(sn,Mi),oe&&Y.fog===!0&&G.refreshFogUniforms(sn,oe),G.refreshMaterialUniforms(sn,Y,$,Z,p.state.transmissionRenderTarget[M.id]),dr.upload(I,Lo(Oe),sn,Q)),Y.isShaderMaterial&&Y.uniformsNeedUpdate===!0&&(dr.upload(I,Lo(Oe),sn,Q),Y.uniformsNeedUpdate=!1),Y.isSpriteMaterial&&gt.setValue(I,"center",k.center),gt.setValue(I,"modelViewMatrix",k.modelViewMatrix),gt.setValue(I,"normalMatrix",k.normalMatrix),gt.setValue(I,"modelMatrix",k.matrixWorld),Y.isShaderMaterial||Y.isRawShaderMaterial){let Tt=Y.uniformsGroups;for(let jt=0,vr=Tt.length;jt<vr;jt++){let yn=Tt[jt];qe.update(yn,Xt),qe.bind(yn,Xt)}}return Xt}function ec(M,z){M.ambientLightColor.needsUpdate=z,M.lightProbe.needsUpdate=z,M.directionalLights.needsUpdate=z,M.directionalLightShadows.needsUpdate=z,M.pointLights.needsUpdate=z,M.pointLightShadows.needsUpdate=z,M.spotLights.needsUpdate=z,M.spotLightShadows.needsUpdate=z,M.rectAreaLights.needsUpdate=z,M.hemisphereLights.needsUpdate=z}function tc(M){return M.isMeshLambertMaterial||M.isMeshToonMaterial||M.isMeshPhongMaterial||M.isMeshStandardMaterial||M.isShadowMaterial||M.isShaderMaterial&&M.lights===!0}this.getActiveCubeFace=function(){return A},this.getActiveMipmapLevel=function(){return R},this.getRenderTarget=function(){return L},this.setRenderTargetTextures=function(M,z,j){let Y=O.get(M);Y.__autoAllocateDepthBuffer=M.resolveDepthBuffer===!1,Y.__autoAllocateDepthBuffer===!1&&(Y.__useRenderToTexture=!1),O.get(M.texture).__webglTexture=z,O.get(M.depthTexture).__webglTexture=Y.__autoAllocateDepthBuffer?void 0:j,Y.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(M,z){let j=O.get(M);j.__webglFramebuffer=z,j.__useDefaultFramebuffer=z===void 0};let nc=I.createFramebuffer();this.setRenderTarget=function(M,z=0,j=0){L=M,A=z,R=j;let Y=!0,k=null,oe=!1,xe=!1;if(M){let ve=O.get(M);if(ve.__useDefaultFramebuffer!==void 0)ye.bindFramebuffer(I.FRAMEBUFFER,null),Y=!1;else if(ve.__webglFramebuffer===void 0)Q.setupRenderTarget(M);else if(ve.__hasExternalTextures)Q.rebindTextures(M,O.get(M.texture).__webglTexture,O.get(M.depthTexture).__webglTexture);else if(M.depthBuffer){let Le=M.depthTexture;if(ve.__boundDepthTexture!==Le){if(Le!==null&&O.has(Le)&&(M.width!==Le.image.width||M.height!==Le.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");Q.setupDepthRenderbuffer(M)}}let ze=M.texture;(ze.isData3DTexture||ze.isDataArrayTexture||ze.isCompressedArrayTexture)&&(xe=!0);let Ge=O.get(M).__webglFramebuffer;M.isWebGLCubeRenderTarget?(Array.isArray(Ge[z])?k=Ge[z][j]:k=Ge[z],oe=!0):M.samples>0&&Q.useMultisampledRTT(M)===!1?k=O.get(M).__webglMultisampledFramebuffer:Array.isArray(Ge)?k=Ge[j]:k=Ge,C.copy(M.viewport),F.copy(M.scissor),X=M.scissorTest}else C.copy(Re).multiplyScalar($).floor(),F.copy(He).multiplyScalar($).floor(),X=it;if(j!==0&&(k=nc),ye.bindFramebuffer(I.FRAMEBUFFER,k)&&Y&&ye.drawBuffers(M,k),ye.viewport(C),ye.scissor(F),ye.setScissorTest(X),oe){let ve=O.get(M.texture);I.framebufferTexture2D(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_CUBE_MAP_POSITIVE_X+z,ve.__webglTexture,j)}else if(xe){let ve=z;for(let ze=0;ze<M.textures.length;ze++){let Ge=O.get(M.textures[ze]);I.framebufferTextureLayer(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0+ze,Ge.__webglTexture,j,ve)}}else if(M!==null&&j!==0){let ve=O.get(M.texture);I.framebufferTexture2D(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_2D,ve.__webglTexture,j)}b=-1},this.readRenderTargetPixels=function(M,z,j,Y,k,oe,xe,Te=0){if(!(M&&M.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let ve=O.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&xe!==void 0&&(ve=ve[xe]),ve){ye.bindFramebuffer(I.FRAMEBUFFER,ve);try{let ze=M.textures[Te],Ge=ze.format,Le=ze.type;if(!pe.textureFormatReadable(Ge)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!pe.textureTypeReadable(Le)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}z>=0&&z<=M.width-Y&&j>=0&&j<=M.height-k&&(M.textures.length>1&&I.readBuffer(I.COLOR_ATTACHMENT0+Te),I.readPixels(z,j,Y,k,Pe.convert(Ge),Pe.convert(Le),oe))}finally{let ze=L!==null?O.get(L).__webglFramebuffer:null;ye.bindFramebuffer(I.FRAMEBUFFER,ze)}}},this.readRenderTargetPixelsAsync=async function(M,z,j,Y,k,oe,xe,Te=0){if(!(M&&M.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let ve=O.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&xe!==void 0&&(ve=ve[xe]),ve)if(z>=0&&z<=M.width-Y&&j>=0&&j<=M.height-k){ye.bindFramebuffer(I.FRAMEBUFFER,ve);let ze=M.textures[Te],Ge=ze.format,Le=ze.type;if(!pe.textureFormatReadable(Ge))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!pe.textureTypeReadable(Le))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let Ye=I.createBuffer();I.bindBuffer(I.PIXEL_PACK_BUFFER,Ye),I.bufferData(I.PIXEL_PACK_BUFFER,oe.byteLength,I.STREAM_READ),M.textures.length>1&&I.readBuffer(I.COLOR_ATTACHMENT0+Te),I.readPixels(z,j,Y,k,Pe.convert(Ge),Pe.convert(Le),0);let pt=L!==null?O.get(L).__webglFramebuffer:null;ye.bindFramebuffer(I.FRAMEBUFFER,pt);let At=I.fenceSync(I.SYNC_GPU_COMMANDS_COMPLETE,0);return I.flush(),await Vf(I,At,4),I.bindBuffer(I.PIXEL_PACK_BUFFER,Ye),I.getBufferSubData(I.PIXEL_PACK_BUFFER,0,oe),I.deleteBuffer(Ye),I.deleteSync(At),oe}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(M,z=null,j=0){let Y=Math.pow(2,-j),k=Math.floor(M.image.width*Y),oe=Math.floor(M.image.height*Y),xe=z!==null?z.x:0,Te=z!==null?z.y:0;Q.setTexture2D(M,0),I.copyTexSubImage2D(I.TEXTURE_2D,j,0,0,xe,Te,k,oe),ye.unbindTexture()};let Do=I.createFramebuffer(),No=I.createFramebuffer();this.copyTextureToTexture=function(M,z,j=null,Y=null,k=0,oe=null){oe===null&&(k!==0?(js("WebGLRenderer: copyTextureToTexture function signature has changed to support src and dst mipmap levels."),oe=k,k=0):oe=0);let xe,Te,ve,ze,Ge,Le,Ye,pt,At,ht=M.isCompressedTexture?M.mipmaps[oe]:M.image;if(j!==null)xe=j.max.x-j.min.x,Te=j.max.y-j.min.y,ve=j.isBox3?j.max.z-j.min.z:1,ze=j.min.x,Ge=j.min.y,Le=j.isBox3?j.min.z:0;else{let Rt=Math.pow(2,-k);xe=Math.floor(ht.width*Rt),Te=Math.floor(ht.height*Rt),M.isDataArrayTexture?ve=ht.depth:M.isData3DTexture?ve=Math.floor(ht.depth*Rt):ve=1,ze=0,Ge=0,Le=0}Y!==null?(Ye=Y.x,pt=Y.y,At=Y.z):(Ye=0,pt=0,At=0);let rt=Pe.convert(z.format),Oe=Pe.convert(z.type),St;z.isData3DTexture?(Q.setTexture3D(z,0),St=I.TEXTURE_3D):z.isDataArrayTexture||z.isCompressedArrayTexture?(Q.setTexture2DArray(z,0),St=I.TEXTURE_2D_ARRAY):(Q.setTexture2D(z,0),St=I.TEXTURE_2D),I.pixelStorei(I.UNPACK_FLIP_Y_WEBGL,z.flipY),I.pixelStorei(I.UNPACK_PREMULTIPLY_ALPHA_WEBGL,z.premultiplyAlpha),I.pixelStorei(I.UNPACK_ALIGNMENT,z.unpackAlignment);let lt=I.getParameter(I.UNPACK_ROW_LENGTH),Xt=I.getParameter(I.UNPACK_IMAGE_HEIGHT),xn=I.getParameter(I.UNPACK_SKIP_PIXELS),Vt=I.getParameter(I.UNPACK_SKIP_ROWS),Mi=I.getParameter(I.UNPACK_SKIP_IMAGES);I.pixelStorei(I.UNPACK_ROW_LENGTH,ht.width),I.pixelStorei(I.UNPACK_IMAGE_HEIGHT,ht.height),I.pixelStorei(I.UNPACK_SKIP_PIXELS,ze),I.pixelStorei(I.UNPACK_SKIP_ROWS,Ge),I.pixelStorei(I.UNPACK_SKIP_IMAGES,Le);let gt=M.isDataArrayTexture||M.isData3DTexture,sn=z.isDataArrayTexture||z.isData3DTexture;if(M.isDepthTexture){let Rt=O.get(M),Tt=O.get(z),jt=O.get(Rt.__renderTarget),vr=O.get(Tt.__renderTarget);ye.bindFramebuffer(I.READ_FRAMEBUFFER,jt.__webglFramebuffer),ye.bindFramebuffer(I.DRAW_FRAMEBUFFER,vr.__webglFramebuffer);for(let yn=0;yn<ve;yn++)gt&&(I.framebufferTextureLayer(I.READ_FRAMEBUFFER,I.COLOR_ATTACHMENT0,O.get(M).__webglTexture,k,Le+yn),I.framebufferTextureLayer(I.DRAW_FRAMEBUFFER,I.COLOR_ATTACHMENT0,O.get(z).__webglTexture,oe,At+yn)),I.blitFramebuffer(ze,Ge,xe,Te,Ye,pt,xe,Te,I.DEPTH_BUFFER_BIT,I.NEAREST);ye.bindFramebuffer(I.READ_FRAMEBUFFER,null),ye.bindFramebuffer(I.DRAW_FRAMEBUFFER,null)}else if(k!==0||M.isRenderTargetTexture||O.has(M)){let Rt=O.get(M),Tt=O.get(z);ye.bindFramebuffer(I.READ_FRAMEBUFFER,Do),ye.bindFramebuffer(I.DRAW_FRAMEBUFFER,No);for(let jt=0;jt<ve;jt++)gt?I.framebufferTextureLayer(I.READ_FRAMEBUFFER,I.COLOR_ATTACHMENT0,Rt.__webglTexture,k,Le+jt):I.framebufferTexture2D(I.READ_FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_2D,Rt.__webglTexture,k),sn?I.framebufferTextureLayer(I.DRAW_FRAMEBUFFER,I.COLOR_ATTACHMENT0,Tt.__webglTexture,oe,At+jt):I.framebufferTexture2D(I.DRAW_FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_2D,Tt.__webglTexture,oe),k!==0?I.blitFramebuffer(ze,Ge,xe,Te,Ye,pt,xe,Te,I.COLOR_BUFFER_BIT,I.NEAREST):sn?I.copyTexSubImage3D(St,oe,Ye,pt,At+jt,ze,Ge,xe,Te):I.copyTexSubImage2D(St,oe,Ye,pt,ze,Ge,xe,Te);ye.bindFramebuffer(I.READ_FRAMEBUFFER,null),ye.bindFramebuffer(I.DRAW_FRAMEBUFFER,null)}else sn?M.isDataTexture||M.isData3DTexture?I.texSubImage3D(St,oe,Ye,pt,At,xe,Te,ve,rt,Oe,ht.data):z.isCompressedArrayTexture?I.compressedTexSubImage3D(St,oe,Ye,pt,At,xe,Te,ve,rt,ht.data):I.texSubImage3D(St,oe,Ye,pt,At,xe,Te,ve,rt,Oe,ht):M.isDataTexture?I.texSubImage2D(I.TEXTURE_2D,oe,Ye,pt,xe,Te,rt,Oe,ht.data):M.isCompressedTexture?I.compressedTexSubImage2D(I.TEXTURE_2D,oe,Ye,pt,ht.width,ht.height,rt,ht.data):I.texSubImage2D(I.TEXTURE_2D,oe,Ye,pt,xe,Te,rt,Oe,ht);I.pixelStorei(I.UNPACK_ROW_LENGTH,lt),I.pixelStorei(I.UNPACK_IMAGE_HEIGHT,Xt),I.pixelStorei(I.UNPACK_SKIP_PIXELS,xn),I.pixelStorei(I.UNPACK_SKIP_ROWS,Vt),I.pixelStorei(I.UNPACK_SKIP_IMAGES,Mi),oe===0&&z.generateMipmaps&&I.generateMipmap(St),ye.unbindTexture()},this.initRenderTarget=function(M){O.get(M).__webglFramebuffer===void 0&&Q.setupRenderTarget(M)},this.initTexture=function(M){M.isCubeTexture?Q.setTextureCube(M,0):M.isData3DTexture?Q.setTexture3D(M,0):M.isDataArrayTexture||M.isCompressedArrayTexture?Q.setTexture2DArray(M,0):Q.setTexture2D(M,0),ye.unbindTexture()},this.resetState=function(){A=0,R=0,L=null,ye.reset(),fe.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Un}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=ct._getDrawingBufferColorSpace(e),t.unpackColorSpace=ct._getUnpackColorSpace()}};var Sp={ur3:{links:[{x:0,y:0,z:.1519,roll:0,pitch:0,yaw:0},{x:0,y:0,z:0,roll:1.570796327,pitch:0,yaw:0},{x:-.24365,y:0,z:0,roll:0,pitch:0,yaw:0},{x:-.21325,y:0,z:.11235,roll:0,pitch:0,yaw:0},{x:0,y:-.08535,z:-1750557762378351e-26,roll:1.570796327,pitch:0,yaw:0},{x:0,y:.0819,z:-1679797079540562e-26,roll:1.570796326589793,pitch:3.141592653589793,yaw:3.141592653589793}],jointLimits:[[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-3.141592654,3.141592654],[-6.283185307,6.283185307],[-6.283185307,6.283185307],null]},ur5:{links:[{x:0,y:0,z:.089159,roll:0,pitch:0,yaw:0},{x:0,y:0,z:0,roll:1.570796327,pitch:0,yaw:0},{x:-.425,y:0,z:0,roll:0,pitch:0,yaw:0},{x:-.39225,y:0,z:.10915,roll:0,pitch:0,yaw:0},{x:0,y:-.09465,z:-1941303950897609e-26,roll:1.570796327,pitch:0,yaw:0},{x:0,y:.0823,z:-1688001216681175e-26,roll:1.570796326589793,pitch:3.141592653589793,yaw:3.141592653589793}],jointLimits:[[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-3.141592654,3.141592654],[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-6.283185307,6.283185307]]},ur10:{links:[{x:0,y:0,z:.1273,roll:0,pitch:0,yaw:0},{x:0,y:0,z:0,roll:1.570796327,pitch:0,yaw:0},{x:-.612,y:0,z:0,roll:0,pitch:0,yaw:0},{x:-.5723,y:0,z:.163941,roll:0,pitch:0,yaw:0},{x:0,y:-.1157,z:-2373046667922381e-26,roll:1.570796327,pitch:0,yaw:0},{x:0,y:.0922,z:-1891053610911353e-26,roll:1.570796326589793,pitch:3.141592653589793,yaw:3.141592653589793}],jointLimits:[[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-3.141592654,3.141592654],[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-6.283185307,6.283185307]]},ur3e:{links:[{x:0,y:0,z:.15185,roll:0,pitch:0,yaw:0},{x:0,y:0,z:0,roll:1.570796327,pitch:0,yaw:0},{x:-.24355,y:0,z:0,roll:0,pitch:0,yaw:0},{x:-.2132,y:0,z:.13105,roll:0,pitch:0,yaw:0},{x:0,y:-.08535,z:-1750557762378351e-26,roll:1.570796327,pitch:0,yaw:0},{x:0,y:.0921,z:-18890025766262e-24,roll:1.570796326589793,pitch:3.141592653589793,yaw:3.141592653589793}],jointLimits:[[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-3.141592654,3.141592654],[-6.283185307,6.283185307],[-6.283185307,6.283185307],null]},ur5e:{links:[{x:0,y:0,z:.1625,roll:0,pitch:0,yaw:0},{x:0,y:0,z:0,roll:1.570796327,pitch:0,yaw:0},{x:-.425,y:0,z:0,roll:0,pitch:0,yaw:0},{x:-.3922,y:0,z:.1333,roll:0,pitch:0,yaw:0},{x:0,y:-.0997,z:-2044881182297852e-26,roll:1.570796327,pitch:0,yaw:0},{x:0,y:.0996,z:-2042830148012698e-26,roll:1.570796326589793,pitch:3.141592653589793,yaw:3.141592653589793}],jointLimits:[[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-3.141592654,3.141592654],[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-6.283185307,6.283185307]]},ur7e:{links:[{x:0,y:0,z:.1625,roll:0,pitch:0,yaw:0},{x:0,y:0,z:0,roll:1.570796327,pitch:0,yaw:0},{x:-.425,y:0,z:0,roll:0,pitch:0,yaw:0},{x:-.3922,y:0,z:.1333,roll:0,pitch:0,yaw:0},{x:0,y:-.0997,z:-2044881182297852e-26,roll:1.570796327,pitch:0,yaw:0},{x:0,y:.0996,z:-2042830148012698e-26,roll:1.570796326589793,pitch:3.141592653589793,yaw:3.141592653589793}],jointLimits:[[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-3.141592654,3.141592654],[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-6.283185307,6.283185307]]},ur10e:{links:[{x:0,y:0,z:.1807,roll:0,pitch:0,yaw:0},{x:0,y:0,z:0,roll:1.570796327,pitch:0,yaw:0},{x:-.6127,y:0,z:0,roll:0,pitch:0,yaw:0},{x:-.57155,y:0,z:.17415,roll:0,pitch:0,yaw:0},{x:0,y:-.11985,z:-2458164590756244e-26,roll:1.570796327,pitch:0,yaw:0},{x:0,y:.11655,z:-2390480459346185e-26,roll:1.570796326589793,pitch:3.141592653589793,yaw:3.141592653589793}],jointLimits:[[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-3.141592654,3.141592654],[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-6.283185307,6.283185307]]},ur12e:{links:[{x:0,y:0,z:.1807,roll:0,pitch:0,yaw:0},{x:0,y:0,z:0,roll:1.570796327,pitch:0,yaw:0},{x:-.6127,y:0,z:0,roll:0,pitch:0,yaw:0},{x:-.57155,y:0,z:.17415,roll:0,pitch:0,yaw:0},{x:0,y:-.11985,z:-2458164590756244e-26,roll:1.570796327,pitch:0,yaw:0},{x:0,y:.11655,z:-2390480459346185e-26,roll:1.570796326589793,pitch:3.141592653589793,yaw:3.141592653589793}],jointLimits:[[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-3.141592654,3.141592654],[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-6.283185307,6.283185307]]},ur16e:{links:[{x:0,y:0,z:.1807,roll:0,pitch:0,yaw:0},{x:0,y:0,z:0,roll:1.570796327,pitch:0,yaw:0},{x:-.4784,y:0,z:0,roll:0,pitch:0,yaw:0},{x:-.36,y:0,z:.17415,roll:0,pitch:0,yaw:0},{x:0,y:-.11985,z:-2458164590756244e-26,roll:1.570796327,pitch:0,yaw:0},{x:0,y:.11655,z:-2390480459346185e-26,roll:1.570796326589793,pitch:3.141592653589793,yaw:3.141592653589793}],jointLimits:[[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-3.141592654,3.141592654],[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-6.283185307,6.283185307]]},ur8long:{links:[{x:0,y:0,z:.2186,roll:0,pitch:0,yaw:0},{x:0,y:0,z:0,roll:1.570796327,pitch:0,yaw:0},{x:-.8989,y:0,z:0,roll:0,pitch:0,yaw:0},{x:-.7149,y:0,z:.1824,roll:0,pitch:0,yaw:0},{x:0,y:-.1361,z:-2791457662093657e-26,roll:1.570796327,pitch:0,yaw:0},{x:0,y:.1434,z:-2941183164909849e-26,roll:1.570796326589793,pitch:3.141592653589793,yaw:3.141592653589793}],jointLimits:[[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-3.141592654,3.141592654],[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-6.283185307,6.283185307]]},ur15:{links:[{x:0,y:0,z:.2186,roll:0,pitch:0,yaw:0},{x:0,y:0,z:0,roll:1.570796327,pitch:0,yaw:0},{x:-.6475,y:0,z:0,roll:0,pitch:0,yaw:0},{x:-.5164,y:0,z:.1824,roll:0,pitch:0,yaw:0},{x:0,y:-.1361,z:-2791457662093657e-26,roll:1.570796327,pitch:0,yaw:0},{x:0,y:.1434,z:-2941183164909849e-26,roll:1.570796326589793,pitch:3.141592653589793,yaw:3.141592653589793}],jointLimits:[[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-3.141592654,3.141592654],[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-6.283185307,6.283185307]]},ur18:{links:[{x:0,y:0,z:.2186,roll:0,pitch:0,yaw:0},{x:0,y:0,z:0,roll:1.570796327,pitch:0,yaw:0},{x:-.475,y:0,z:0,roll:0,pitch:0,yaw:0},{x:-.3389,y:0,z:.1824,roll:0,pitch:0,yaw:0},{x:0,y:-.1361,z:-2791457662093657e-26,roll:1.570796327,pitch:0,yaw:0},{x:0,y:.1434,z:-2941183164909849e-26,roll:1.570796326589793,pitch:3.141592653589793,yaw:3.141592653589793}],jointLimits:[[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-3.141592654,3.141592654],[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-6.283185307,6.283185307]]},ur20:{links:[{x:0,y:0,z:.2363,roll:0,pitch:0,yaw:0},{x:0,y:0,z:0,roll:1.570796327,pitch:0,yaw:0},{x:-.862,y:0,z:0,roll:0,pitch:0,yaw:0},{x:-.7287,y:0,z:.201,roll:0,pitch:0,yaw:0},{x:0,y:-.1593,z:-3267297616249225e-26,roll:1.570796327,pitch:0,yaw:0},{x:0,y:.1543,z:-31647459019915597e-27,roll:1.570796326589793,pitch:3.141592653589793,yaw:3.141592653589793}],jointLimits:[[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-3.141592654,3.141592654],[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-6.283185307,6.283185307]]},ur30:{links:[{x:0,y:0,z:.2363,roll:0,pitch:0,yaw:0},{x:0,y:0,z:0,roll:1.570796327,pitch:0,yaw:0},{x:-.637,y:0,z:0,roll:0,pitch:0,yaw:0},{x:-.5037,y:0,z:.201,roll:0,pitch:0,yaw:0},{x:0,y:-.1593,z:-3267297616249225e-26,roll:1.570796327,pitch:0,yaw:0},{x:0,y:.1543,z:-31647459019915597e-27,roll:1.570796326589793,pitch:3.141592653589793,yaw:3.141592653589793}],jointLimits:[[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-3.141592654,3.141592654],[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-6.283185307,6.283185307]]}};var Mp={type:"change"},Nu={type:"start"},wp={type:"end"},Hl=new mi,Tp=new Tn,Sb=Math.cos(70*To.DEG2RAD),kt=new D,fn=2*Math.PI,Mt={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},Du=1e-6,Vl=class extends _o{constructor(e,t=null){super(e,t),this.state=Mt.NONE,this.target=new D,this.cursor=new D,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:Oi.ROTATE,MIDDLE:Oi.DOLLY,RIGHT:Oi.PAN},this.touches={ONE:Bi.ROTATE,TWO:Bi.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._domElementKeyEvents=null,this._lastPosition=new D,this._lastQuaternion=new an,this._lastTargetPosition=new D,this._quat=new an().setFromUnitVectors(e.up,new D(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new ir,this._sphericalDelta=new ir,this._scale=1,this._panOffset=new D,this._rotateStart=new De,this._rotateEnd=new De,this._rotateDelta=new De,this._panStart=new De,this._panEnd=new De,this._panDelta=new De,this._dollyStart=new De,this._dollyEnd=new De,this._dollyDelta=new De,this._dollyDirection=new D,this._mouse=new De,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=Tb.bind(this),this._onPointerDown=Mb.bind(this),this._onPointerUp=wb.bind(this),this._onContextMenu=Lb.bind(this),this._onMouseWheel=Rb.bind(this),this._onKeyDown=Cb.bind(this),this._onTouchStart=Ib.bind(this),this._onTouchMove=Pb.bind(this),this._onMouseDown=Eb.bind(this),this._onMouseMove=Ab.bind(this),this._interceptControlDown=Db.bind(this),this._interceptControlUp=Nb.bind(this),this.domElement!==null&&this.connect(this.domElement),this.update()}connect(e){super.connect(e),this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents(),this.domElement.getRootNode().removeEventListener("keydown",this._interceptControlDown,{capture:!0}),this.domElement.style.touchAction="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(e){e.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=e}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(Mp),this.update(),this.state=Mt.NONE}update(e=null){let t=this.object.position;kt.copy(t).sub(this.target),kt.applyQuaternion(this._quat),this._spherical.setFromVector3(kt),this.autoRotate&&this.state===Mt.NONE&&this._rotateLeft(this._getAutoRotationAngle(e)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let n=this.minAzimuthAngle,s=this.maxAzimuthAngle;isFinite(n)&&isFinite(s)&&(n<-Math.PI?n+=fn:n>Math.PI&&(n-=fn),s<-Math.PI?s+=fn:s>Math.PI&&(s-=fn),n<=s?this._spherical.theta=Math.max(n,Math.min(s,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(n+s)/2?Math.max(n,this._spherical.theta):Math.min(s,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let r=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{let o=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),r=o!=this._spherical.radius}if(kt.setFromSpherical(this._spherical),kt.applyQuaternion(this._quatInverse),t.copy(this.target).add(kt),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let o=null;if(this.object.isPerspectiveCamera){let a=kt.length();o=this._clampDistance(a*this._scale);let c=a-o;this.object.position.addScaledVector(this._dollyDirection,c),this.object.updateMatrixWorld(),r=!!c}else if(this.object.isOrthographicCamera){let a=new D(this._mouse.x,this._mouse.y,0);a.unproject(this.object);let c=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),r=c!==this.object.zoom;let l=new D(this._mouse.x,this._mouse.y,0);l.unproject(this.object),this.object.position.sub(l).add(a),this.object.updateMatrixWorld(),o=kt.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;o!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(o).add(this.object.position):(Hl.origin.copy(this.object.position),Hl.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(Hl.direction))<Sb?this.object.lookAt(this.target):(Tp.setFromNormalAndCoplanarPoint(this.object.up,this.target),Hl.intersectPlane(Tp,this.target))))}else if(this.object.isOrthographicCamera){let o=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),o!==this.object.zoom&&(this.object.updateProjectionMatrix(),r=!0)}return this._scale=1,this._performCursorZoom=!1,r||this._lastPosition.distanceToSquared(this.object.position)>Du||8*(1-this._lastQuaternion.dot(this.object.quaternion))>Du||this._lastTargetPosition.distanceToSquared(this.target)>Du?(this.dispatchEvent(Mp),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(e){return e!==null?fn/60*this.autoRotateSpeed*e:fn/60/60*this.autoRotateSpeed}_getZoomScale(e){let t=Math.abs(e*.01);return Math.pow(.95,this.zoomSpeed*t)}_rotateLeft(e){this._sphericalDelta.theta-=e}_rotateUp(e){this._sphericalDelta.phi-=e}_panLeft(e,t){kt.setFromMatrixColumn(t,0),kt.multiplyScalar(-e),this._panOffset.add(kt)}_panUp(e,t){this.screenSpacePanning===!0?kt.setFromMatrixColumn(t,1):(kt.setFromMatrixColumn(t,0),kt.crossVectors(this.object.up,kt)),kt.multiplyScalar(e),this._panOffset.add(kt)}_pan(e,t){let n=this.domElement;if(this.object.isPerspectiveCamera){let s=this.object.position;kt.copy(s).sub(this.target);let r=kt.length();r*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*e*r/n.clientHeight,this.object.matrix),this._panUp(2*t*r/n.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(e*(this.object.right-this.object.left)/this.object.zoom/n.clientWidth,this.object.matrix),this._panUp(t*(this.object.top-this.object.bottom)/this.object.zoom/n.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(e,t){if(!this.zoomToCursor)return;this._performCursorZoom=!0;let n=this.domElement.getBoundingClientRect(),s=e-n.left,r=t-n.top,o=n.width,a=n.height;this._mouse.x=s/o*2-1,this._mouse.y=-(r/a)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(e){return Math.max(this.minDistance,Math.min(this.maxDistance,e))}_handleMouseDownRotate(e){this._rotateStart.set(e.clientX,e.clientY)}_handleMouseDownDolly(e){this._updateZoomParameters(e.clientX,e.clientX),this._dollyStart.set(e.clientX,e.clientY)}_handleMouseDownPan(e){this._panStart.set(e.clientX,e.clientY)}_handleMouseMoveRotate(e){this._rotateEnd.set(e.clientX,e.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(fn*this._rotateDelta.x/t.clientHeight),this._rotateUp(fn*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(e){this._dollyEnd.set(e.clientX,e.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(e){this._panEnd.set(e.clientX,e.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(e){this._updateZoomParameters(e.clientX,e.clientY),e.deltaY<0?this._dollyIn(this._getZoomScale(e.deltaY)):e.deltaY>0&&this._dollyOut(this._getZoomScale(e.deltaY)),this.update()}_handleKeyDown(e){let t=!1;switch(e.code){case this.keys.UP:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(fn*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),t=!0;break;case this.keys.BOTTOM:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(-fn*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),t=!0;break;case this.keys.LEFT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(fn*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),t=!0;break;case this.keys.RIGHT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(-fn*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),t=!0;break}t&&(e.preventDefault(),this.update())}_handleTouchStartRotate(e){if(this._pointers.length===1)this._rotateStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),s=.5*(e.pageY+t.y);this._rotateStart.set(n,s)}}_handleTouchStartPan(e){if(this._pointers.length===1)this._panStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),s=.5*(e.pageY+t.y);this._panStart.set(n,s)}}_handleTouchStartDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,s=e.pageY-t.y,r=Math.sqrt(n*n+s*s);this._dollyStart.set(0,r)}_handleTouchStartDollyPan(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enablePan&&this._handleTouchStartPan(e)}_handleTouchStartDollyRotate(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enableRotate&&this._handleTouchStartRotate(e)}_handleTouchMoveRotate(e){if(this._pointers.length==1)this._rotateEnd.set(e.pageX,e.pageY);else{let n=this._getSecondPointerPosition(e),s=.5*(e.pageX+n.x),r=.5*(e.pageY+n.y);this._rotateEnd.set(s,r)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(fn*this._rotateDelta.x/t.clientHeight),this._rotateUp(fn*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(e){if(this._pointers.length===1)this._panEnd.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),s=.5*(e.pageY+t.y);this._panEnd.set(n,s)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,s=e.pageY-t.y,r=Math.sqrt(n*n+s*s);this._dollyEnd.set(0,r),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);let o=(e.pageX+t.x)*.5,a=(e.pageY+t.y)*.5;this._updateZoomParameters(o,a)}_handleTouchMoveDollyPan(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enablePan&&this._handleTouchMovePan(e)}_handleTouchMoveDollyRotate(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enableRotate&&this._handleTouchMoveRotate(e)}_addPointer(e){this._pointers.push(e.pointerId)}_removePointer(e){delete this._pointerPositions[e.pointerId];for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId){this._pointers.splice(t,1);return}}_isTrackingPointer(e){for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId)return!0;return!1}_trackPointer(e){let t=this._pointerPositions[e.pointerId];t===void 0&&(t=new De,this._pointerPositions[e.pointerId]=t),t.set(e.pageX,e.pageY)}_getSecondPointerPosition(e){let t=e.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[t]}_customWheelEvent(e){let t=e.deltaMode,n={clientX:e.clientX,clientY:e.clientY,deltaY:e.deltaY};switch(t){case 1:n.deltaY*=16;break;case 2:n.deltaY*=100;break}return e.ctrlKey&&!this._controlActive&&(n.deltaY*=10),n}};function Mb(i){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(i.pointerId),this.domElement.addEventListener("pointermove",this._onPointerMove),this.domElement.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(i)&&(this._addPointer(i),i.pointerType==="touch"?this._onTouchStart(i):this._onMouseDown(i)))}function Tb(i){this.enabled!==!1&&(i.pointerType==="touch"?this._onTouchMove(i):this._onMouseMove(i))}function wb(i){switch(this._removePointer(i),this._pointers.length){case 0:this.domElement.releasePointerCapture(i.pointerId),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(wp),this.state=Mt.NONE;break;case 1:let e=this._pointers[0],t=this._pointerPositions[e];this._onTouchStart({pointerId:e,pageX:t.x,pageY:t.y});break}}function Eb(i){let e;switch(i.button){case 0:e=this.mouseButtons.LEFT;break;case 1:e=this.mouseButtons.MIDDLE;break;case 2:e=this.mouseButtons.RIGHT;break;default:e=-1}switch(e){case Oi.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(i),this.state=Mt.DOLLY;break;case Oi.ROTATE:if(i.ctrlKey||i.metaKey||i.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(i),this.state=Mt.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(i),this.state=Mt.ROTATE}break;case Oi.PAN:if(i.ctrlKey||i.metaKey||i.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(i),this.state=Mt.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(i),this.state=Mt.PAN}break;default:this.state=Mt.NONE}this.state!==Mt.NONE&&this.dispatchEvent(Nu)}function Ab(i){switch(this.state){case Mt.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(i);break;case Mt.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(i);break;case Mt.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(i);break}}function Rb(i){this.enabled===!1||this.enableZoom===!1||this.state!==Mt.NONE||(i.preventDefault(),this.dispatchEvent(Nu),this._handleMouseWheel(this._customWheelEvent(i)),this.dispatchEvent(wp))}function Cb(i){this.enabled!==!1&&this._handleKeyDown(i)}function Ib(i){switch(this._trackPointer(i),this._pointers.length){case 1:switch(this.touches.ONE){case Bi.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(i),this.state=Mt.TOUCH_ROTATE;break;case Bi.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(i),this.state=Mt.TOUCH_PAN;break;default:this.state=Mt.NONE}break;case 2:switch(this.touches.TWO){case Bi.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(i),this.state=Mt.TOUCH_DOLLY_PAN;break;case Bi.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(i),this.state=Mt.TOUCH_DOLLY_ROTATE;break;default:this.state=Mt.NONE}break;default:this.state=Mt.NONE}this.state!==Mt.NONE&&this.dispatchEvent(Nu)}function Pb(i){switch(this._trackPointer(i),this.state){case Mt.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(i),this.update();break;case Mt.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(i),this.update();break;case Mt.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(i),this.update();break;case Mt.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(i),this.update();break;default:this.state=Mt.NONE}}function Lb(i){this.enabled!==!1&&i.preventDefault()}function Db(i){i.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function Nb(i){i.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}var Gl=class extends ts{constructor(){super();let e=new Ni;e.deleteAttribute("uv");let t=new un({side:Ot}),n=new un,s=new as(16777215,900,28,2);s.position.set(.418,16.199,.3),this.add(s);let r=new ft(e,t);r.position.set(-.757,13.219,.717),r.scale.set(31.713,28.305,28.591),this.add(r);let o=new is(e,n,6),a=new Et;a.position.set(-10.906,2.009,1.846),a.rotation.set(0,-.195,0),a.scale.set(2.328,7.905,4.651),a.updateMatrix(),o.setMatrixAt(0,a.matrix),a.position.set(-5.607,-.754,-.758),a.rotation.set(0,.994,0),a.scale.set(1.97,1.534,3.955),a.updateMatrix(),o.setMatrixAt(1,a.matrix),a.position.set(6.167,.857,7.803),a.rotation.set(0,.561,0),a.scale.set(3.927,6.285,3.687),a.updateMatrix(),o.setMatrixAt(2,a.matrix),a.position.set(-2.017,.018,6.124),a.rotation.set(0,.333,0),a.scale.set(2.002,4.566,2.064),a.updateMatrix(),o.setMatrixAt(3,a.matrix),a.position.set(2.291,-.756,-2.621),a.rotation.set(0,-.286,0),a.scale.set(1.546,1.552,1.496),a.updateMatrix(),o.setMatrixAt(4,a.matrix),a.position.set(-2.193,-.369,-5.547),a.rotation.set(0,.516,0),a.scale.set(3.875,3.487,2.986),a.updateMatrix(),o.setMatrixAt(5,a.matrix),this.add(o);let c=new ft(e,mr(50));c.position.set(-16.116,14.37,8.208),c.scale.set(.1,2.428,2.739),this.add(c);let l=new ft(e,mr(50));l.position.set(-16.109,18.021,-8.207),l.scale.set(.1,2.425,2.751),this.add(l);let u=new ft(e,mr(17));u.position.set(14.904,12.198,-1.832),u.scale.set(.15,4.265,6.331),this.add(u);let h=new ft(e,mr(43));h.position.set(-.462,8.89,14.52),h.scale.set(4.38,5.441,.088),this.add(h);let d=new ft(e,mr(20));d.position.set(3.235,11.486,-12.541),d.scale.set(2.5,2,.1),this.add(d);let f=new ft(e,mr(100));f.position.set(0,20,0),f.scale.set(1,.1,1),this.add(f)}dispose(){let e=new Set;this.traverse(t=>{t.isMesh&&(e.add(t.geometry),e.add(t.material))});for(let t of e)t.dispose()}};function mr(i){return new ro({color:0,emissive:16777215,emissiveIntensity:i})}var ki=Object.freeze({light:Object.freeze({center:10135476,grid:13226973}),dark:Object.freeze({center:3359829,grid:2241348})});function Ep(i=2,e=20,t=ki.dark){let n=t??ki.dark,s=new po(i,e,n.center,n.grid);return s.name="base_grid",s.rotation.x=Math.PI/2,s.userData.size=i,s.userData.divisions=e,s}function Ub(i,e=ki.dark){let t=e??ki.dark,n=i?.geometry?.getAttribute?.("color"),s=i?.userData?.divisions;if(!n||!Number.isFinite(s)||s<=0)return!1;let r=s/2,o=new Ne(t.center),a=new Ne(t.grid),c=!1;for(let l=0;l<=s;l++){let u=l===r?o:a;for(let h=0;h<4;h++){let d=l*4+h;if(d>=n.count)break;n.setXYZ(d,u.r,u.g,u.b),c=!0}}return n.needsUpdate=!0,c}var Wl=Object.freeze({fov:45,near:.01,far:100,position:Object.freeze([.8,-.8,.6])}),Uu=Object.freeze({ambientIntensity:.8,directionalIntensity:1.2,directionalPosition:Object.freeze([1,2,1])}),Ap={iso:{label:"\u7B49\u8F74\u6D4B",direction:[1,-1,.8]},front:{label:"\u524D\u89C6",direction:[0,-1,0]},side:{label:"\u4FA7\u89C6",direction:[1,0,0]},top:{label:"\u4FEF\u89C6",direction:[.02,-.02,1]}},Rp="iso",Fu=1.25;function Fb(i,e=45,t=1,n=Fu){let s=Number.isFinite(i)&&i>0?i:1,o=(Number.isFinite(e)&&e>0&&e<180?e:45)*Math.PI/180,a=s/Math.sin(o/2),c=Number.isFinite(t)&&t>0?t:1,l=2*Math.atan(Math.tan(o/2)*c),u=s/Math.sin(l/2),h=Number.isFinite(n)&&n>0?n:Fu;return Math.max(a,u)*h}function Ob(i){let t=(Number.isFinite(i)&&i>0?i:1)*2*1.5,n=Math.max(.5,Math.ceil(t*2)/2),s=Math.min(40,Math.max(8,Math.round(n/.1)));return{size:n,divisions:s}}function Cp(i,{maxPixelRatio:e=2,rendererFactory:t,theme:n="dark"}={}){let s=typeof t=="function"?t(i):new zl({canvas:i,antialias:!0,alpha:!0});s.toneMapping=ja,s.toneMappingExposure=1;let r=new ts,o=null,a=null;try{a=new fr(s),o=a.fromScene(new Gl,.04),r.environment=o.texture}catch{o=null,a=null}let c=new Pt(Wl.fov,1,Wl.near,Wl.far);c.up.set(0,0,1),c.position.set(...Wl.position);let l=n==="light"?"light":"dark",u=ki[l]??ki.dark,h=Ep(2,20,u);r.add(new ho(16777215,Uu.ambientIntensity));let d=new cs(16777215,Uu.directionalIntensity);d.position.set(...Uu.directionalPosition),r.add(d),r.add(h);let f=new Vl(c,i);f.enableDamping=!0,f.target.set(0,0,.3),f.minDistance=.15,f.maxDistance=6;let g=null,x=new Set;f.addEventListener?.("change",()=>{for(let R of x)try{R()}catch{}});function m(R){let{size:L,divisions:b}=Ob(R);if(!(h?.userData?.size===L&&h?.userData?.divisions===b)){if(h){r.remove(h);try{h.geometry?.dispose?.(),h.material?.dispose?.()}catch{}}h=Ep(L,b,u),h.userData.size=L,h.userData.divisions=b,r.add(h)}}function p(R){let L=R==="light"?"light":"dark";return L===l?!1:(l=L,u=ki[l]??ki.dark,h&&Ub(h,u),!0)}function w(){let{clientWidth:R,clientHeight:L}=i;if(R===0||L===0)return!1;let b=Math.min(e,Math.max(1,typeof globalThis<"u"&&globalThis.devicePixelRatio||1));return s.setPixelRatio(b),s.setSize(R,L,!1),c.aspect=R/L,c.updateProjectionMatrix(),!0}function T(R,{padding:L=Fu,minRadius:b=0}={}){if(!R)return!1;R.updateMatrixWorld?.(!0);let _=null;try{let J=new ln().setFromObject(R);J.isEmpty()||(_=J.getBoundingSphere(new Zt))}catch{_=null}let C=_&&Number.isFinite(_.radius)&&_.radius>0?_.radius:.5,F=Number.isFinite(b)&&b>0?b:0,X=Math.max(C,F);return g={center:_?_.center.clone():new D(0,0,.3),radius:X,padding:L},m(X),f.minDistance=X*.15,f.maxDistance=X*12,c.near=Math.max(.001,X/100),c.far=Math.max(10,X*100),c.updateProjectionMatrix(),v(Rp)}function v(R){if(g===null)return!1;let L=Ap[R]??Ap[Rp],b=new D(...L.direction).normalize(),_=Fb(g.radius,c.fov,c.aspect,g.padding);return f.target.copy(g.center),c.position.copy(g.center).addScaledVector(b,_),c.lookAt(g.center),f.update(),!0}function E(){f.update(),s.render(r,c)}function A(){f.dispose(),x.clear();try{h?.geometry?.dispose?.(),h?.material?.dispose?.()}catch{}h&&r.remove(h),h=null;try{o?.dispose?.(),a?.dispose?.()}catch{}o=null;try{s.forceContextLoss?.()}catch{}s.dispose()}return{renderer:s,scene:r,camera:c,controls:f,get grid(){return h},currentFitRadius(){return g?.radius??0},resize:w,render:E,fitTo:T,setViewPreset:v,applyTheme:p,onCameraChange(R){x.add(R)},dispose:A}}var gr=.08,Bb=.12,zb=.03,kb=.3,Ip=Object.freeze([Object.freeze({text:"X",color:16725587}),Object.freeze({text:"Y",color:9240374}),Object.freeze({text:"Z",color:3580671})]);function Pp(i){return!Number.isFinite(i)||i<=0?gr:Math.min(kb,Math.max(zb,i*Bb))}function Hb(i,e){try{let t=document.createElement("canvas");t.width=64,t.height=64;let n=t.getContext("2d");if(!n)return null;n.font="bold 44px sans-serif",n.textAlign="center",n.textBaseline="middle",n.lineWidth=6,n.strokeStyle="rgba(8, 12, 16, 0.9)",n.strokeText(i,32,34),n.fillStyle=`#${new Ne(e).getHexString()}`,n.fillText(i,32,34);let s=new eo(t);return s.needsUpdate=!0,s}catch{return null}}function Ou(i=gr){let e=new Lt;e.name="ursim-twin-tcp-axes";let t=new Lt;t.name="ursim-twin-tcp-axes-content",e.add(t);let n=new go(i);n.name="ursim-twin-tcp-axes-lines",t.add(n);let s=new Lt;s.name="ursim-twin-tcp-axes-labels";let r=[];for(let o=0;o<Ip.length;o++){let{text:a,color:c}=Ip[o],l=Hb(a,c);if(l===null)continue;let u=new Zs({map:l,transparent:!0,depthTest:!1}),h=new $r(u),d=i*1.12;h.position.set(o===0?d:0,o===1?d:0,o===2?d:0),h.scale.setScalar(i*.45),h.name=`ursim-twin-tcp-axis-${a.toLowerCase()}`,s.add(h),r.push(h)}return t.add(s),e.userData.content=t,e.userData.axes=n,e.userData.labels=r,e}function Lp(i,e){let t=gr,n=Number.isFinite(e)&&e>0?e/t:1;i?.userData?.content?.scale?.setScalar?.(n)}function Dp(i){i?.traverse?.(e=>{e.geometry?.dispose?.();let t=e.material;if(Array.isArray(t))for(let n of t)n?.map?.dispose?.(),n?.dispose?.();else t&&(t.map?.dispose?.(),t.dispose?.())})}function Bu(i,e){if(e===cu)return console.warn("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles."),i;if(e===cr||e===Mo){let t=i.getIndex();if(t===null){let o=[],a=i.getAttribute("position");if(a!==void 0){for(let c=0;c<a.count;c++)o.push(c);i.setIndex(o),t=i.getIndex()}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible."),i}let n=t.count-2,s=[];if(e===cr)for(let o=1;o<=n;o++)s.push(t.getX(0)),s.push(t.getX(o)),s.push(t.getX(o+1));else for(let o=0;o<n;o++)o%2===0?(s.push(t.getX(o)),s.push(t.getX(o+1)),s.push(t.getX(o+2))):(s.push(t.getX(o+2)),s.push(t.getX(o+1)),s.push(t.getX(o)));s.length/3!==n&&console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.");let r=i.clone();return r.setIndex(s),r.clearGroups(),r}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:",e),i}var Xl=class extends ei{constructor(e){super(e),this.dracoLoader=null,this.ktx2Loader=null,this.meshoptDecoder=null,this.pluginCallbacks=[],this.register(function(t){return new Xu(t)}),this.register(function(t){return new Yu(t)}),this.register(function(t){return new th(t)}),this.register(function(t){return new nh(t)}),this.register(function(t){return new ih(t)}),this.register(function(t){return new $u(t)}),this.register(function(t){return new ju(t)}),this.register(function(t){return new Ju(t)}),this.register(function(t){return new Ku(t)}),this.register(function(t){return new Wu(t)}),this.register(function(t){return new Zu(t)}),this.register(function(t){return new qu(t)}),this.register(function(t){return new eh(t)}),this.register(function(t){return new Qu(t)}),this.register(function(t){return new Vu(t)}),this.register(function(t){return new sh(t)}),this.register(function(t){return new rh(t)})}load(e,t,n,s){let r=this,o;if(this.resourcePath!=="")o=this.resourcePath;else if(this.path!==""){let l=yi.extractUrlBase(e);o=yi.resolveURL(l,this.path)}else o=yi.extractUrlBase(e);this.manager.itemStart(e);let a=function(l){s?s(l):console.error(l),r.manager.itemError(e),r.manager.itemEnd(e)},c=new nr(this.manager);c.setPath(this.path),c.setResponseType("arraybuffer"),c.setRequestHeader(this.requestHeader),c.setWithCredentials(this.withCredentials),c.load(e,function(l){try{r.parse(l,o,function(u){t(u),r.manager.itemEnd(e)},a)}catch(u){a(u)}},n,a)}setDRACOLoader(e){return this.dracoLoader=e,this}setKTX2Loader(e){return this.ktx2Loader=e,this}setMeshoptDecoder(e){return this.meshoptDecoder=e,this}register(e){return this.pluginCallbacks.indexOf(e)===-1&&this.pluginCallbacks.push(e),this}unregister(e){return this.pluginCallbacks.indexOf(e)!==-1&&this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(e),1),this}parse(e,t,n,s){let r,o={},a={},c=new TextDecoder;if(typeof e=="string")r=JSON.parse(e);else if(e instanceof ArrayBuffer)if(c.decode(new Uint8Array(e,0,4))===Bp){try{o[ot.KHR_BINARY_GLTF]=new oh(e)}catch(h){s&&s(h);return}r=JSON.parse(o[ot.KHR_BINARY_GLTF].content)}else r=JSON.parse(c.decode(e));else r=e;if(r.asset===void 0||r.asset.version[0]<2){s&&s(new Error("THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported."));return}let l=new fh(r,{path:t||this.resourcePath||"",crossOrigin:this.crossOrigin,requestHeader:this.requestHeader,manager:this.manager,ktx2Loader:this.ktx2Loader,meshoptDecoder:this.meshoptDecoder});l.fileLoader.setRequestHeader(this.requestHeader);for(let u=0;u<this.pluginCallbacks.length;u++){let h=this.pluginCallbacks[u](l);h.name||console.error("THREE.GLTFLoader: Invalid plugin found: missing name"),a[h.name]=h,o[h.name]=!0}if(r.extensionsUsed)for(let u=0;u<r.extensionsUsed.length;++u){let h=r.extensionsUsed[u],d=r.extensionsRequired||[];switch(h){case ot.KHR_MATERIALS_UNLIT:o[h]=new Gu;break;case ot.KHR_DRACO_MESH_COMPRESSION:o[h]=new ah(r,this.dracoLoader);break;case ot.KHR_TEXTURE_TRANSFORM:o[h]=new lh;break;case ot.KHR_MESH_QUANTIZATION:o[h]=new ch;break;default:d.indexOf(h)>=0&&a[h]===void 0&&console.warn('THREE.GLTFLoader: Unknown extension "'+h+'".')}}l.setExtensions(o),l.setPlugins(a),l.parse(n,s)}parseAsync(e,t){let n=this;return new Promise(function(s,r){n.parse(e,t,s,r)})}};function Vb(){let i={};return{get:function(e){return i[e]},add:function(e,t){i[e]=t},remove:function(e){delete i[e]},removeAll:function(){i={}}}}var ot={KHR_BINARY_GLTF:"KHR_binary_glTF",KHR_DRACO_MESH_COMPRESSION:"KHR_draco_mesh_compression",KHR_LIGHTS_PUNCTUAL:"KHR_lights_punctual",KHR_MATERIALS_CLEARCOAT:"KHR_materials_clearcoat",KHR_MATERIALS_DISPERSION:"KHR_materials_dispersion",KHR_MATERIALS_IOR:"KHR_materials_ior",KHR_MATERIALS_SHEEN:"KHR_materials_sheen",KHR_MATERIALS_SPECULAR:"KHR_materials_specular",KHR_MATERIALS_TRANSMISSION:"KHR_materials_transmission",KHR_MATERIALS_IRIDESCENCE:"KHR_materials_iridescence",KHR_MATERIALS_ANISOTROPY:"KHR_materials_anisotropy",KHR_MATERIALS_UNLIT:"KHR_materials_unlit",KHR_MATERIALS_VOLUME:"KHR_materials_volume",KHR_TEXTURE_BASISU:"KHR_texture_basisu",KHR_TEXTURE_TRANSFORM:"KHR_texture_transform",KHR_MESH_QUANTIZATION:"KHR_mesh_quantization",KHR_MATERIALS_EMISSIVE_STRENGTH:"KHR_materials_emissive_strength",EXT_MATERIALS_BUMP:"EXT_materials_bump",EXT_TEXTURE_WEBP:"EXT_texture_webp",EXT_TEXTURE_AVIF:"EXT_texture_avif",EXT_MESHOPT_COMPRESSION:"EXT_meshopt_compression",EXT_MESH_GPU_INSTANCING:"EXT_mesh_gpu_instancing"},Vu=class{constructor(e){this.parser=e,this.name=ot.KHR_LIGHTS_PUNCTUAL,this.cache={refs:{},uses:{}}}_markDefs(){let e=this.parser,t=this.parser.json.nodes||[];for(let n=0,s=t.length;n<s;n++){let r=t[n];r.extensions&&r.extensions[this.name]&&r.extensions[this.name].light!==void 0&&e._addNodeRef(this.cache,r.extensions[this.name].light)}}_loadLight(e){let t=this.parser,n="light:"+e,s=t.cache.get(n);if(s)return s;let r=t.json,c=((r.extensions&&r.extensions[this.name]||{}).lights||[])[e],l,u=new Ne(16777215);c.color!==void 0&&u.setRGB(c.color[0],c.color[1],c.color[2],$t);let h=c.range!==void 0?c.range:0;switch(c.type){case"directional":l=new cs(u),l.target.position.set(0,0,-1),l.add(l.target);break;case"point":l=new as(u),l.distance=h;break;case"spot":l=new uo(u),l.distance=h,c.spot=c.spot||{},c.spot.innerConeAngle=c.spot.innerConeAngle!==void 0?c.spot.innerConeAngle:0,c.spot.outerConeAngle=c.spot.outerConeAngle!==void 0?c.spot.outerConeAngle:Math.PI/4,l.angle=c.spot.outerConeAngle,l.penumbra=1-c.spot.innerConeAngle/c.spot.outerConeAngle,l.target.position.set(0,0,-1),l.add(l.target);break;default:throw new Error("THREE.GLTFLoader: Unexpected light type: "+c.type)}return l.position.set(0,0,0),ii(l,c),c.intensity!==void 0&&(l.intensity=c.intensity),l.name=t.createUniqueName(c.name||"light_"+e),s=Promise.resolve(l),t.cache.add(n,s),s}getDependency(e,t){if(e==="light")return this._loadLight(t)}createNodeAttachment(e){let t=this,n=this.parser,r=n.json.nodes[e],a=(r.extensions&&r.extensions[this.name]||{}).light;return a===void 0?null:this._loadLight(a).then(function(c){return n._getNodeRef(t.cache,a,c)})}},Gu=class{constructor(){this.name=ot.KHR_MATERIALS_UNLIT}getMaterialType(){return en}extendParams(e,t,n){let s=[];e.color=new Ne(1,1,1),e.opacity=1;let r=t.pbrMetallicRoughness;if(r){if(Array.isArray(r.baseColorFactor)){let o=r.baseColorFactor;e.color.setRGB(o[0],o[1],o[2],$t),e.opacity=o[3]}r.baseColorTexture!==void 0&&s.push(n.assignTexture(e,"map",r.baseColorTexture,Ut))}return Promise.all(s)}},Wu=class{constructor(e){this.parser=e,this.name=ot.KHR_MATERIALS_EMISSIVE_STRENGTH}extendMaterialParams(e,t){let s=this.parser.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();let r=s.extensions[this.name].emissiveStrength;return r!==void 0&&(t.emissiveIntensity=r),Promise.resolve()}},Xu=class{constructor(e){this.parser=e,this.name=ot.KHR_MATERIALS_CLEARCOAT}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:hn}extendMaterialParams(e,t){let n=this.parser,s=n.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();let r=[],o=s.extensions[this.name];if(o.clearcoatFactor!==void 0&&(t.clearcoat=o.clearcoatFactor),o.clearcoatTexture!==void 0&&r.push(n.assignTexture(t,"clearcoatMap",o.clearcoatTexture)),o.clearcoatRoughnessFactor!==void 0&&(t.clearcoatRoughness=o.clearcoatRoughnessFactor),o.clearcoatRoughnessTexture!==void 0&&r.push(n.assignTexture(t,"clearcoatRoughnessMap",o.clearcoatRoughnessTexture)),o.clearcoatNormalTexture!==void 0&&(r.push(n.assignTexture(t,"clearcoatNormalMap",o.clearcoatNormalTexture)),o.clearcoatNormalTexture.scale!==void 0)){let a=o.clearcoatNormalTexture.scale;t.clearcoatNormalScale=new De(a,a)}return Promise.all(r)}},Yu=class{constructor(e){this.parser=e,this.name=ot.KHR_MATERIALS_DISPERSION}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:hn}extendMaterialParams(e,t){let s=this.parser.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();let r=s.extensions[this.name];return t.dispersion=r.dispersion!==void 0?r.dispersion:0,Promise.resolve()}},qu=class{constructor(e){this.parser=e,this.name=ot.KHR_MATERIALS_IRIDESCENCE}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:hn}extendMaterialParams(e,t){let n=this.parser,s=n.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();let r=[],o=s.extensions[this.name];return o.iridescenceFactor!==void 0&&(t.iridescence=o.iridescenceFactor),o.iridescenceTexture!==void 0&&r.push(n.assignTexture(t,"iridescenceMap",o.iridescenceTexture)),o.iridescenceIor!==void 0&&(t.iridescenceIOR=o.iridescenceIor),t.iridescenceThicknessRange===void 0&&(t.iridescenceThicknessRange=[100,400]),o.iridescenceThicknessMinimum!==void 0&&(t.iridescenceThicknessRange[0]=o.iridescenceThicknessMinimum),o.iridescenceThicknessMaximum!==void 0&&(t.iridescenceThicknessRange[1]=o.iridescenceThicknessMaximum),o.iridescenceThicknessTexture!==void 0&&r.push(n.assignTexture(t,"iridescenceThicknessMap",o.iridescenceThicknessTexture)),Promise.all(r)}},$u=class{constructor(e){this.parser=e,this.name=ot.KHR_MATERIALS_SHEEN}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:hn}extendMaterialParams(e,t){let n=this.parser,s=n.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();let r=[];t.sheenColor=new Ne(0,0,0),t.sheenRoughness=0,t.sheen=1;let o=s.extensions[this.name];if(o.sheenColorFactor!==void 0){let a=o.sheenColorFactor;t.sheenColor.setRGB(a[0],a[1],a[2],$t)}return o.sheenRoughnessFactor!==void 0&&(t.sheenRoughness=o.sheenRoughnessFactor),o.sheenColorTexture!==void 0&&r.push(n.assignTexture(t,"sheenColorMap",o.sheenColorTexture,Ut)),o.sheenRoughnessTexture!==void 0&&r.push(n.assignTexture(t,"sheenRoughnessMap",o.sheenRoughnessTexture)),Promise.all(r)}},ju=class{constructor(e){this.parser=e,this.name=ot.KHR_MATERIALS_TRANSMISSION}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:hn}extendMaterialParams(e,t){let n=this.parser,s=n.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();let r=[],o=s.extensions[this.name];return o.transmissionFactor!==void 0&&(t.transmission=o.transmissionFactor),o.transmissionTexture!==void 0&&r.push(n.assignTexture(t,"transmissionMap",o.transmissionTexture)),Promise.all(r)}},Ju=class{constructor(e){this.parser=e,this.name=ot.KHR_MATERIALS_VOLUME}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:hn}extendMaterialParams(e,t){let n=this.parser,s=n.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();let r=[],o=s.extensions[this.name];t.thickness=o.thicknessFactor!==void 0?o.thicknessFactor:0,o.thicknessTexture!==void 0&&r.push(n.assignTexture(t,"thicknessMap",o.thicknessTexture)),t.attenuationDistance=o.attenuationDistance||1/0;let a=o.attenuationColor||[1,1,1];return t.attenuationColor=new Ne().setRGB(a[0],a[1],a[2],$t),Promise.all(r)}},Ku=class{constructor(e){this.parser=e,this.name=ot.KHR_MATERIALS_IOR}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:hn}extendMaterialParams(e,t){let s=this.parser.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();let r=s.extensions[this.name];return t.ior=r.ior!==void 0?r.ior:1.5,Promise.resolve()}},Zu=class{constructor(e){this.parser=e,this.name=ot.KHR_MATERIALS_SPECULAR}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:hn}extendMaterialParams(e,t){let n=this.parser,s=n.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();let r=[],o=s.extensions[this.name];t.specularIntensity=o.specularFactor!==void 0?o.specularFactor:1,o.specularTexture!==void 0&&r.push(n.assignTexture(t,"specularIntensityMap",o.specularTexture));let a=o.specularColorFactor||[1,1,1];return t.specularColor=new Ne().setRGB(a[0],a[1],a[2],$t),o.specularColorTexture!==void 0&&r.push(n.assignTexture(t,"specularColorMap",o.specularColorTexture,Ut)),Promise.all(r)}},Qu=class{constructor(e){this.parser=e,this.name=ot.EXT_MATERIALS_BUMP}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:hn}extendMaterialParams(e,t){let n=this.parser,s=n.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();let r=[],o=s.extensions[this.name];return t.bumpScale=o.bumpFactor!==void 0?o.bumpFactor:1,o.bumpTexture!==void 0&&r.push(n.assignTexture(t,"bumpMap",o.bumpTexture)),Promise.all(r)}},eh=class{constructor(e){this.parser=e,this.name=ot.KHR_MATERIALS_ANISOTROPY}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:hn}extendMaterialParams(e,t){let n=this.parser,s=n.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();let r=[],o=s.extensions[this.name];return o.anisotropyStrength!==void 0&&(t.anisotropy=o.anisotropyStrength),o.anisotropyRotation!==void 0&&(t.anisotropyRotation=o.anisotropyRotation),o.anisotropyTexture!==void 0&&r.push(n.assignTexture(t,"anisotropyMap",o.anisotropyTexture)),Promise.all(r)}},th=class{constructor(e){this.parser=e,this.name=ot.KHR_TEXTURE_BASISU}loadTexture(e){let t=this.parser,n=t.json,s=n.textures[e];if(!s.extensions||!s.extensions[this.name])return null;let r=s.extensions[this.name],o=t.options.ktx2Loader;if(!o){if(n.extensionsRequired&&n.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");return null}return t.loadTextureImage(e,r.source,o)}},nh=class{constructor(e){this.parser=e,this.name=ot.EXT_TEXTURE_WEBP}loadTexture(e){let t=this.name,n=this.parser,s=n.json,r=s.textures[e];if(!r.extensions||!r.extensions[t])return null;let o=r.extensions[t],a=s.images[o.source],c=n.textureLoader;if(a.uri){let l=n.options.manager.getHandler(a.uri);l!==null&&(c=l)}return n.loadTextureImage(e,o.source,c)}},ih=class{constructor(e){this.parser=e,this.name=ot.EXT_TEXTURE_AVIF}loadTexture(e){let t=this.name,n=this.parser,s=n.json,r=s.textures[e];if(!r.extensions||!r.extensions[t])return null;let o=r.extensions[t],a=s.images[o.source],c=n.textureLoader;if(a.uri){let l=n.options.manager.getHandler(a.uri);l!==null&&(c=l)}return n.loadTextureImage(e,o.source,c)}},sh=class{constructor(e){this.name=ot.EXT_MESHOPT_COMPRESSION,this.parser=e}loadBufferView(e){let t=this.parser.json,n=t.bufferViews[e];if(n.extensions&&n.extensions[this.name]){let s=n.extensions[this.name],r=this.parser.getDependency("buffer",s.buffer),o=this.parser.options.meshoptDecoder;if(!o||!o.supported){if(t.extensionsRequired&&t.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files");return null}return r.then(function(a){let c=s.byteOffset||0,l=s.byteLength||0,u=s.count,h=s.byteStride,d=new Uint8Array(a,c,l);return o.decodeGltfBufferAsync?o.decodeGltfBufferAsync(u,h,d,s.mode,s.filter).then(function(f){return f.buffer}):o.ready.then(function(){let f=new ArrayBuffer(u*h);return o.decodeGltfBuffer(new Uint8Array(f),u,h,d,s.mode,s.filter),f})})}else return null}},rh=class{constructor(e){this.name=ot.EXT_MESH_GPU_INSTANCING,this.parser=e}createNodeMesh(e){let t=this.parser.json,n=t.nodes[e];if(!n.extensions||!n.extensions[this.name]||n.mesh===void 0)return null;let s=t.meshes[n.mesh];for(let l of s.primitives)if(l.mode!==An.TRIANGLES&&l.mode!==An.TRIANGLE_STRIP&&l.mode!==An.TRIANGLE_FAN&&l.mode!==void 0)return null;let o=n.extensions[this.name].attributes,a=[],c={};for(let l in o)a.push(this.parser.getDependency("accessor",o[l]).then(u=>(c[l]=u,c[l])));return a.length<1?null:(a.push(this.parser.createNodeMesh(e)),Promise.all(a).then(l=>{let u=l.pop(),h=u.isGroup?u.children:[u],d=l[0].count,f=[];for(let g of h){let x=new je,m=new D,p=new an,w=new D(1,1,1),T=new is(g.geometry,g.material,d);for(let v=0;v<d;v++)c.TRANSLATION&&m.fromBufferAttribute(c.TRANSLATION,v),c.ROTATION&&p.fromBufferAttribute(c.ROTATION,v),c.SCALE&&w.fromBufferAttribute(c.SCALE,v),T.setMatrixAt(v,x.compose(m,p,w));for(let v in c)if(v==="_COLOR_0"){let E=c[v];T.instanceColor=new Fi(E.array,E.itemSize,E.normalized)}else v!=="TRANSLATION"&&v!=="ROTATION"&&v!=="SCALE"&&g.geometry.setAttribute(v,c[v]);Et.prototype.copy.call(T,g),this.parser.assignFinalMaterial(T),f.push(T)}return u.isGroup?(u.clear(),u.add(...f),u):f[0]}))}},Bp="glTF",Eo=12,Np={JSON:1313821514,BIN:5130562},oh=class{constructor(e){this.name=ot.KHR_BINARY_GLTF,this.content=null,this.body=null;let t=new DataView(e,0,Eo),n=new TextDecoder;if(this.header={magic:n.decode(new Uint8Array(e.slice(0,4))),version:t.getUint32(4,!0),length:t.getUint32(8,!0)},this.header.magic!==Bp)throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");if(this.header.version<2)throw new Error("THREE.GLTFLoader: Legacy binary file detected.");let s=this.header.length-Eo,r=new DataView(e,Eo),o=0;for(;o<s;){let a=r.getUint32(o,!0);o+=4;let c=r.getUint32(o,!0);if(o+=4,c===Np.JSON){let l=new Uint8Array(e,Eo+o,a);this.content=n.decode(l)}else if(c===Np.BIN){let l=Eo+o;this.body=e.slice(l,l+a)}o+=a}if(this.content===null)throw new Error("THREE.GLTFLoader: JSON content not found.")}},ah=class{constructor(e,t){if(!t)throw new Error("THREE.GLTFLoader: No DRACOLoader instance provided.");this.name=ot.KHR_DRACO_MESH_COMPRESSION,this.json=e,this.dracoLoader=t,this.dracoLoader.preload()}decodePrimitive(e,t){let n=this.json,s=this.dracoLoader,r=e.extensions[this.name].bufferView,o=e.extensions[this.name].attributes,a={},c={},l={};for(let u in o){let h=hh[u]||u.toLowerCase();a[h]=o[u]}for(let u in e.attributes){let h=hh[u]||u.toLowerCase();if(o[u]!==void 0){let d=n.accessors[e.attributes[u]],f=_r[d.componentType];l[h]=f.name,c[h]=d.normalized===!0}}return t.getDependency("bufferView",r).then(function(u){return new Promise(function(h,d){s.decodeDracoFile(u,function(f){for(let g in f.attributes){let x=f.attributes[g],m=c[g];m!==void 0&&(x.normalized=m)}h(f)},a,l,$t,d)})})}},lh=class{constructor(){this.name=ot.KHR_TEXTURE_TRANSFORM}extendTexture(e,t){return(t.texCoord===void 0||t.texCoord===e.channel)&&t.offset===void 0&&t.rotation===void 0&&t.scale===void 0||(e=e.clone(),t.texCoord!==void 0&&(e.channel=t.texCoord),t.offset!==void 0&&e.offset.fromArray(t.offset),t.rotation!==void 0&&(e.rotation=t.rotation),t.scale!==void 0&&e.repeat.fromArray(t.scale),e.needsUpdate=!0),e}},ch=class{constructor(){this.name=ot.KHR_MESH_QUANTIZATION}},Yl=class extends gi{constructor(e,t,n,s){super(e,t,n,s)}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=e*s*3+s;for(let o=0;o!==s;o++)t[o]=n[r+o];return t}interpolate_(e,t,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=a*2,l=a*3,u=s-t,h=(n-t)/u,d=h*h,f=d*h,g=e*l,x=g-l,m=-2*f+3*d,p=f-d,w=1-m,T=p-d+h;for(let v=0;v!==a;v++){let E=o[x+v+a],A=o[x+v+c]*u,R=o[g+v+a],L=o[g+v]*u;r[v]=w*E+T*A+m*R+p*L}return r}},Gb=new an,uh=class extends Yl{interpolate_(e,t,n,s){let r=super.interpolate_(e,t,n,s);return Gb.fromArray(r).normalize().toArray(r),r}},An={FLOAT:5126,FLOAT_MAT3:35675,FLOAT_MAT4:35676,FLOAT_VEC2:35664,FLOAT_VEC3:35665,FLOAT_VEC4:35666,LINEAR:9729,REPEAT:10497,SAMPLER_2D:35678,POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6,UNSIGNED_BYTE:5121,UNSIGNED_SHORT:5123},_r={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array},Up={9728:qt,9729:on,9984:Za,9985:sr,9986:ds,9987:kn},Fp={33071:Yn,33648:Ys,10497:Di},zu={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},hh={POSITION:"position",NORMAL:"normal",TANGENT:"tangent",TEXCOORD_0:"uv",TEXCOORD_1:"uv1",TEXCOORD_2:"uv2",TEXCOORD_3:"uv3",COLOR_0:"color",WEIGHTS_0:"skinWeight",JOINTS_0:"skinIndex"},Hi={scale:"scale",translation:"position",rotation:"quaternion",weights:"morphTargetInfluences"},Wb={CUBICSPLINE:void 0,LINEAR:Qi,STEP:Zi},ku={OPAQUE:"OPAQUE",MASK:"MASK",BLEND:"BLEND"};function Xb(i){return i.DefaultMaterial===void 0&&(i.DefaultMaterial=new un({color:16777215,emissive:0,metalness:1,roughness:1,transparent:!1,depthTest:!0,side:On})),i.DefaultMaterial}function xs(i,e,t){for(let n in t.extensions)i[n]===void 0&&(e.userData.gltfExtensions=e.userData.gltfExtensions||{},e.userData.gltfExtensions[n]=t.extensions[n])}function ii(i,e){e.extras!==void 0&&(typeof e.extras=="object"?Object.assign(i.userData,e.extras):console.warn("THREE.GLTFLoader: Ignoring primitive type .extras, "+e.extras))}function Yb(i,e,t){let n=!1,s=!1,r=!1;for(let l=0,u=e.length;l<u;l++){let h=e[l];if(h.POSITION!==void 0&&(n=!0),h.NORMAL!==void 0&&(s=!0),h.COLOR_0!==void 0&&(r=!0),n&&s&&r)break}if(!n&&!s&&!r)return Promise.resolve(i);let o=[],a=[],c=[];for(let l=0,u=e.length;l<u;l++){let h=e[l];if(n){let d=h.POSITION!==void 0?t.getDependency("accessor",h.POSITION):i.attributes.position;o.push(d)}if(s){let d=h.NORMAL!==void 0?t.getDependency("accessor",h.NORMAL):i.attributes.normal;a.push(d)}if(r){let d=h.COLOR_0!==void 0?t.getDependency("accessor",h.COLOR_0):i.attributes.color;c.push(d)}}return Promise.all([Promise.all(o),Promise.all(a),Promise.all(c)]).then(function(l){let u=l[0],h=l[1],d=l[2];return n&&(i.morphAttributes.position=u),s&&(i.morphAttributes.normal=h),r&&(i.morphAttributes.color=d),i.morphTargetsRelative=!0,i})}function qb(i,e){if(i.updateMorphTargets(),e.weights!==void 0)for(let t=0,n=e.weights.length;t<n;t++)i.morphTargetInfluences[t]=e.weights[t];if(e.extras&&Array.isArray(e.extras.targetNames)){let t=e.extras.targetNames;if(i.morphTargetInfluences.length===t.length){i.morphTargetDictionary={};for(let n=0,s=t.length;n<s;n++)i.morphTargetDictionary[t[n]]=n}else console.warn("THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.")}}function $b(i){let e,t=i.extensions&&i.extensions[ot.KHR_DRACO_MESH_COMPRESSION];if(t?e="draco:"+t.bufferView+":"+t.indices+":"+Hu(t.attributes):e=i.indices+":"+Hu(i.attributes)+":"+i.mode,i.targets!==void 0)for(let n=0,s=i.targets.length;n<s;n++)e+=":"+Hu(i.targets[n]);return e}function Hu(i){let e="",t=Object.keys(i).sort();for(let n=0,s=t.length;n<s;n++)e+=t[n]+":"+i[t[n]]+";";return e}function dh(i){switch(i){case Int8Array:return 1/127;case Uint8Array:return 1/255;case Int16Array:return 1/32767;case Uint16Array:return 1/65535;default:throw new Error("THREE.GLTFLoader: Unsupported normalized accessor component type.")}}function jb(i){return i.search(/\.jpe?g($|\?)/i)>0||i.search(/^data\:image\/jpeg/)===0?"image/jpeg":i.search(/\.webp($|\?)/i)>0||i.search(/^data\:image\/webp/)===0?"image/webp":i.search(/\.ktx2($|\?)/i)>0||i.search(/^data\:image\/ktx2/)===0?"image/ktx2":"image/png"}var Jb=new je,fh=class{constructor(e={},t={}){this.json=e,this.extensions={},this.plugins={},this.options=t,this.cache=new Vb,this.associations=new Map,this.primitiveCache={},this.nodeCache={},this.meshCache={refs:{},uses:{}},this.cameraCache={refs:{},uses:{}},this.lightCache={refs:{},uses:{}},this.sourceCache={},this.textureCache={},this.nodeNamesUsed={};let n=!1,s=-1,r=!1,o=-1;if(typeof navigator<"u"){let a=navigator.userAgent;n=/^((?!chrome|android).)*safari/i.test(a)===!0;let c=a.match(/Version\/(\d+)/);s=n&&c?parseInt(c[1],10):-1,r=a.indexOf("Firefox")>-1,o=r?a.match(/Firefox\/([0-9]+)\./)[1]:-1}typeof createImageBitmap>"u"||n&&s<17||r&&o<98?this.textureLoader=new lo(this.options.manager):this.textureLoader=new fo(this.options.manager),this.textureLoader.setCrossOrigin(this.options.crossOrigin),this.textureLoader.setRequestHeader(this.options.requestHeader),this.fileLoader=new nr(this.options.manager),this.fileLoader.setResponseType("arraybuffer"),this.options.crossOrigin==="use-credentials"&&this.fileLoader.setWithCredentials(!0)}setExtensions(e){this.extensions=e}setPlugins(e){this.plugins=e}parse(e,t){let n=this,s=this.json,r=this.extensions;this.cache.removeAll(),this.nodeCache={},this._invokeAll(function(o){return o._markDefs&&o._markDefs()}),Promise.all(this._invokeAll(function(o){return o.beforeRoot&&o.beforeRoot()})).then(function(){return Promise.all([n.getDependencies("scene"),n.getDependencies("animation"),n.getDependencies("camera")])}).then(function(o){let a={scene:o[0][s.scene||0],scenes:o[0],animations:o[1],cameras:o[2],asset:s.asset,parser:n,userData:{}};return xs(r,a,s),ii(a,s),Promise.all(n._invokeAll(function(c){return c.afterRoot&&c.afterRoot(a)})).then(function(){for(let c of a.scenes)c.updateMatrixWorld();e(a)})}).catch(t)}_markDefs(){let e=this.json.nodes||[],t=this.json.skins||[],n=this.json.meshes||[];for(let s=0,r=t.length;s<r;s++){let o=t[s].joints;for(let a=0,c=o.length;a<c;a++)e[o[a]].isBone=!0}for(let s=0,r=e.length;s<r;s++){let o=e[s];o.mesh!==void 0&&(this._addNodeRef(this.meshCache,o.mesh),o.skin!==void 0&&(n[o.mesh].isSkinnedMesh=!0)),o.camera!==void 0&&this._addNodeRef(this.cameraCache,o.camera)}}_addNodeRef(e,t){t!==void 0&&(e.refs[t]===void 0&&(e.refs[t]=e.uses[t]=0),e.refs[t]++)}_getNodeRef(e,t,n){if(e.refs[t]<=1)return n;let s=n.clone(),r=(o,a)=>{let c=this.associations.get(o);c!=null&&this.associations.set(a,c);for(let[l,u]of o.children.entries())r(u,a.children[l])};return r(n,s),s.name+="_instance_"+e.uses[t]++,s}_invokeOne(e){let t=Object.values(this.plugins);t.push(this);for(let n=0;n<t.length;n++){let s=e(t[n]);if(s)return s}return null}_invokeAll(e){let t=Object.values(this.plugins);t.unshift(this);let n=[];for(let s=0;s<t.length;s++){let r=e(t[s]);r&&n.push(r)}return n}getDependency(e,t){let n=e+":"+t,s=this.cache.get(n);if(!s){switch(e){case"scene":s=this.loadScene(t);break;case"node":s=this._invokeOne(function(r){return r.loadNode&&r.loadNode(t)});break;case"mesh":s=this._invokeOne(function(r){return r.loadMesh&&r.loadMesh(t)});break;case"accessor":s=this.loadAccessor(t);break;case"bufferView":s=this._invokeOne(function(r){return r.loadBufferView&&r.loadBufferView(t)});break;case"buffer":s=this.loadBuffer(t);break;case"material":s=this._invokeOne(function(r){return r.loadMaterial&&r.loadMaterial(t)});break;case"texture":s=this._invokeOne(function(r){return r.loadTexture&&r.loadTexture(t)});break;case"skin":s=this.loadSkin(t);break;case"animation":s=this._invokeOne(function(r){return r.loadAnimation&&r.loadAnimation(t)});break;case"camera":s=this.loadCamera(t);break;default:if(s=this._invokeOne(function(r){return r!=this&&r.getDependency&&r.getDependency(e,t)}),!s)throw new Error("Unknown type: "+e);break}this.cache.add(n,s)}return s}getDependencies(e){let t=this.cache.get(e);if(!t){let n=this,s=this.json[e+(e==="mesh"?"es":"s")]||[];t=Promise.all(s.map(function(r,o){return n.getDependency(e,o)})),this.cache.add(e,t)}return t}loadBuffer(e){let t=this.json.buffers[e],n=this.fileLoader;if(t.type&&t.type!=="arraybuffer")throw new Error("THREE.GLTFLoader: "+t.type+" buffer type is not supported.");if(t.uri===void 0&&e===0)return Promise.resolve(this.extensions[ot.KHR_BINARY_GLTF].body);let s=this.options;return new Promise(function(r,o){n.load(yi.resolveURL(t.uri,s.path),r,void 0,function(){o(new Error('THREE.GLTFLoader: Failed to load buffer "'+t.uri+'".'))})})}loadBufferView(e){let t=this.json.bufferViews[e];return this.getDependency("buffer",t.buffer).then(function(n){let s=t.byteLength||0,r=t.byteOffset||0;return n.slice(r,r+s)})}loadAccessor(e){let t=this,n=this.json,s=this.json.accessors[e];if(s.bufferView===void 0&&s.sparse===void 0){let o=zu[s.type],a=_r[s.componentType],c=s.normalized===!0,l=new a(s.count*o);return Promise.resolve(new Dt(l,o,c))}let r=[];return s.bufferView!==void 0?r.push(this.getDependency("bufferView",s.bufferView)):r.push(null),s.sparse!==void 0&&(r.push(this.getDependency("bufferView",s.sparse.indices.bufferView)),r.push(this.getDependency("bufferView",s.sparse.values.bufferView))),Promise.all(r).then(function(o){let a=o[0],c=zu[s.type],l=_r[s.componentType],u=l.BYTES_PER_ELEMENT,h=u*c,d=s.byteOffset||0,f=s.bufferView!==void 0?n.bufferViews[s.bufferView].byteStride:void 0,g=s.normalized===!0,x,m;if(f&&f!==h){let p=Math.floor(d/f),w="InterleavedBuffer:"+s.bufferView+":"+s.componentType+":"+p+":"+s.count,T=t.cache.get(w);T||(x=new l(a,p*f,s.count*f/u),T=new ns(x,f/u),t.cache.add(w,T)),m=new Ui(T,c,d%f/u,g)}else a===null?x=new l(s.count*c):x=new l(a,d,s.count*c),m=new Dt(x,c,g);if(s.sparse!==void 0){let p=zu.SCALAR,w=_r[s.sparse.indices.componentType],T=s.sparse.indices.byteOffset||0,v=s.sparse.values.byteOffset||0,E=new w(o[1],T,s.sparse.count*p),A=new l(o[2],v,s.sparse.count*c);a!==null&&(m=new Dt(m.array.slice(),m.itemSize,m.normalized)),m.normalized=!1;for(let R=0,L=E.length;R<L;R++){let b=E[R];if(m.setX(b,A[R*c]),c>=2&&m.setY(b,A[R*c+1]),c>=3&&m.setZ(b,A[R*c+2]),c>=4&&m.setW(b,A[R*c+3]),c>=5)throw new Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.")}m.normalized=g}return m})}loadTexture(e){let t=this.json,n=this.options,r=t.textures[e].source,o=t.images[r],a=this.textureLoader;if(o.uri){let c=n.manager.getHandler(o.uri);c!==null&&(a=c)}return this.loadTextureImage(e,r,a)}loadTextureImage(e,t,n){let s=this,r=this.json,o=r.textures[e],a=r.images[t],c=(a.uri||a.bufferView)+":"+o.sampler;if(this.textureCache[c])return this.textureCache[c];let l=this.loadImageSource(t,n).then(function(u){u.flipY=!1,u.name=o.name||a.name||"",u.name===""&&typeof a.uri=="string"&&a.uri.startsWith("data:image/")===!1&&(u.name=a.uri);let d=(r.samplers||{})[o.sampler]||{};return u.magFilter=Up[d.magFilter]||on,u.minFilter=Up[d.minFilter]||kn,u.wrapS=Fp[d.wrapS]||Di,u.wrapT=Fp[d.wrapT]||Di,u.generateMipmaps=!u.isCompressedTexture&&u.minFilter!==qt&&u.minFilter!==on,s.associations.set(u,{textures:e}),u}).catch(function(){return null});return this.textureCache[c]=l,l}loadImageSource(e,t){let n=this,s=this.json,r=this.options;if(this.sourceCache[e]!==void 0)return this.sourceCache[e].then(h=>h.clone());let o=s.images[e],a=self.URL||self.webkitURL,c=o.uri||"",l=!1;if(o.bufferView!==void 0)c=n.getDependency("bufferView",o.bufferView).then(function(h){l=!0;let d=new Blob([h],{type:o.mimeType});return c=a.createObjectURL(d),c});else if(o.uri===void 0)throw new Error("THREE.GLTFLoader: Image "+e+" is missing URI and bufferView");let u=Promise.resolve(c).then(function(h){return new Promise(function(d,f){let g=d;t.isImageBitmapLoader===!0&&(g=function(x){let m=new Ft(x);m.needsUpdate=!0,d(m)}),t.load(yi.resolveURL(h,r.path),g,void 0,f)})}).then(function(h){return l===!0&&a.revokeObjectURL(c),ii(h,o),h.userData.mimeType=o.mimeType||jb(o.uri),h}).catch(function(h){throw console.error("THREE.GLTFLoader: Couldn't load texture",c),h});return this.sourceCache[e]=u,u}assignTexture(e,t,n,s){let r=this;return this.getDependency("texture",n.index).then(function(o){if(!o)return null;if(n.texCoord!==void 0&&n.texCoord>0&&(o=o.clone(),o.channel=n.texCoord),r.extensions[ot.KHR_TEXTURE_TRANSFORM]){let a=n.extensions!==void 0?n.extensions[ot.KHR_TEXTURE_TRANSFORM]:void 0;if(a){let c=r.associations.get(o);o=r.extensions[ot.KHR_TEXTURE_TRANSFORM].extendTexture(o,a),r.associations.set(o,c)}}return s!==void 0&&(o.colorSpace=s),e[t]=o,o})}assignFinalMaterial(e){let t=e.geometry,n=e.material,s=t.attributes.tangent===void 0,r=t.attributes.color!==void 0,o=t.attributes.normal===void 0;if(e.isPoints){let a="PointsMaterial:"+n.uuid,c=this.cache.get(a);c||(c=new tr,Qt.prototype.copy.call(c,n),c.color.copy(n.color),c.map=n.map,c.sizeAttenuation=!1,this.cache.add(a,c)),n=c}else if(e.isLine){let a="LineBasicMaterial:"+n.uuid,c=this.cache.get(a);c||(c=new zn,Qt.prototype.copy.call(c,n),c.color.copy(n.color),c.map=n.map,this.cache.add(a,c)),n=c}if(s||r||o){let a="ClonedMaterial:"+n.uuid+":";s&&(a+="derivative-tangents:"),r&&(a+="vertex-colors:"),o&&(a+="flat-shading:");let c=this.cache.get(a);c||(c=n.clone(),r&&(c.vertexColors=!0),o&&(c.flatShading=!0),s&&(c.normalScale&&(c.normalScale.y*=-1),c.clearcoatNormalScale&&(c.clearcoatNormalScale.y*=-1)),this.cache.add(a,c),this.associations.set(c,this.associations.get(n))),n=c}e.material=n}getMaterialType(){return un}loadMaterial(e){let t=this,n=this.json,s=this.extensions,r=n.materials[e],o,a={},c=r.extensions||{},l=[];if(c[ot.KHR_MATERIALS_UNLIT]){let h=s[ot.KHR_MATERIALS_UNLIT];o=h.getMaterialType(),l.push(h.extendParams(a,r,t))}else{let h=r.pbrMetallicRoughness||{};if(a.color=new Ne(1,1,1),a.opacity=1,Array.isArray(h.baseColorFactor)){let d=h.baseColorFactor;a.color.setRGB(d[0],d[1],d[2],$t),a.opacity=d[3]}h.baseColorTexture!==void 0&&l.push(t.assignTexture(a,"map",h.baseColorTexture,Ut)),a.metalness=h.metallicFactor!==void 0?h.metallicFactor:1,a.roughness=h.roughnessFactor!==void 0?h.roughnessFactor:1,h.metallicRoughnessTexture!==void 0&&(l.push(t.assignTexture(a,"metalnessMap",h.metallicRoughnessTexture)),l.push(t.assignTexture(a,"roughnessMap",h.metallicRoughnessTexture))),o=this._invokeOne(function(d){return d.getMaterialType&&d.getMaterialType(e)}),l.push(Promise.all(this._invokeAll(function(d){return d.extendMaterialParams&&d.extendMaterialParams(e,a)})))}r.doubleSided===!0&&(a.side=tn);let u=r.alphaMode||ku.OPAQUE;if(u===ku.BLEND?(a.transparent=!0,a.depthWrite=!1):(a.transparent=!1,u===ku.MASK&&(a.alphaTest=r.alphaCutoff!==void 0?r.alphaCutoff:.5)),r.normalTexture!==void 0&&o!==en&&(l.push(t.assignTexture(a,"normalMap",r.normalTexture)),a.normalScale=new De(1,1),r.normalTexture.scale!==void 0)){let h=r.normalTexture.scale;a.normalScale.set(h,h)}if(r.occlusionTexture!==void 0&&o!==en&&(l.push(t.assignTexture(a,"aoMap",r.occlusionTexture)),r.occlusionTexture.strength!==void 0&&(a.aoMapIntensity=r.occlusionTexture.strength)),r.emissiveFactor!==void 0&&o!==en){let h=r.emissiveFactor;a.emissive=new Ne().setRGB(h[0],h[1],h[2],$t)}return r.emissiveTexture!==void 0&&o!==en&&l.push(t.assignTexture(a,"emissiveMap",r.emissiveTexture,Ut)),Promise.all(l).then(function(){let h=new o(a);return r.name&&(h.name=r.name),ii(h,r),t.associations.set(h,{materials:e}),r.extensions&&xs(s,h,r),h})}createUniqueName(e){let t=wt.sanitizeNodeName(e||"");return t in this.nodeNamesUsed?t+"_"+ ++this.nodeNamesUsed[t]:(this.nodeNamesUsed[t]=0,t)}loadGeometries(e){let t=this,n=this.extensions,s=this.primitiveCache;function r(a){return n[ot.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(a,t).then(function(c){return Op(c,a,t)})}let o=[];for(let a=0,c=e.length;a<c;a++){let l=e[a],u=$b(l),h=s[u];if(h)o.push(h.promise);else{let d;l.extensions&&l.extensions[ot.KHR_DRACO_MESH_COMPRESSION]?d=r(l):d=Op(new Ct,l,t),s[u]={primitive:l,promise:d},o.push(d)}}return Promise.all(o)}loadMesh(e){let t=this,n=this.json,s=this.extensions,r=n.meshes[e],o=r.primitives,a=[];for(let c=0,l=o.length;c<l;c++){let u=o[c].material===void 0?Xb(this.cache):this.getDependency("material",o[c].material);a.push(u)}return a.push(t.loadGeometries(o)),Promise.all(a).then(function(c){let l=c.slice(0,c.length-1),u=c[c.length-1],h=[];for(let f=0,g=u.length;f<g;f++){let x=u[f],m=o[f],p,w=l[f];if(m.mode===An.TRIANGLES||m.mode===An.TRIANGLE_STRIP||m.mode===An.TRIANGLE_FAN||m.mode===void 0)p=r.isSkinnedMesh===!0?new jr(x,w):new ft(x,w),p.isSkinnedMesh===!0&&p.normalizeSkinWeights(),m.mode===An.TRIANGLE_STRIP?p.geometry=Bu(p.geometry,Mo):m.mode===An.TRIANGLE_FAN&&(p.geometry=Bu(p.geometry,cr));else if(m.mode===An.LINES)p=new ss(x,w);else if(m.mode===An.LINE_STRIP)p=new Jn(x,w);else if(m.mode===An.LINE_LOOP)p=new Zr(x,w);else if(m.mode===An.POINTS)p=new Qr(x,w);else throw new Error("THREE.GLTFLoader: Primitive mode unsupported: "+m.mode);Object.keys(p.geometry.morphAttributes).length>0&&qb(p,r),p.name=t.createUniqueName(r.name||"mesh_"+e),ii(p,r),m.extensions&&xs(s,p,m),t.assignFinalMaterial(p),h.push(p)}for(let f=0,g=h.length;f<g;f++)t.associations.set(h[f],{meshes:e,primitives:f});if(h.length===1)return r.extensions&&xs(s,h[0],r),h[0];let d=new Lt;r.extensions&&xs(s,d,r),t.associations.set(d,{meshes:e});for(let f=0,g=h.length;f<g;f++)d.add(h[f]);return d})}loadCamera(e){let t,n=this.json.cameras[e],s=n[n.type];if(!s){console.warn("THREE.GLTFLoader: Missing camera parameters.");return}return n.type==="perspective"?t=new Pt(To.radToDeg(s.yfov),s.aspectRatio||1,s.znear||1,s.zfar||2e6):n.type==="orthographic"&&(t=new ls(-s.xmag,s.xmag,s.ymag,-s.ymag,s.znear,s.zfar)),n.name&&(t.name=this.createUniqueName(n.name)),ii(t,n),Promise.resolve(t)}loadSkin(e){let t=this.json.skins[e],n=[];for(let s=0,r=t.joints.length;s<r;s++)n.push(this._loadNodeShallow(t.joints[s]));return t.inverseBindMatrices!==void 0?n.push(this.getDependency("accessor",t.inverseBindMatrices)):n.push(null),Promise.all(n).then(function(s){let r=s.pop(),o=s,a=[],c=[];for(let l=0,u=o.length;l<u;l++){let h=o[l];if(h){a.push(h);let d=new je;r!==null&&d.fromArray(r.array,l*16),c.push(d)}else console.warn('THREE.GLTFLoader: Joint "%s" could not be found.',t.joints[l])}return new Kr(a,c)})}loadAnimation(e){let t=this.json,n=this,s=t.animations[e],r=s.name?s.name:"animation_"+e,o=[],a=[],c=[],l=[],u=[];for(let h=0,d=s.channels.length;h<d;h++){let f=s.channels[h],g=s.samplers[f.sampler],x=f.target,m=x.node,p=s.parameters!==void 0?s.parameters[g.input]:g.input,w=s.parameters!==void 0?s.parameters[g.output]:g.output;x.node!==void 0&&(o.push(this.getDependency("node",m)),a.push(this.getDependency("accessor",p)),c.push(this.getDependency("accessor",w)),l.push(g),u.push(x))}return Promise.all([Promise.all(o),Promise.all(a),Promise.all(c),Promise.all(l),Promise.all(u)]).then(function(h){let d=h[0],f=h[1],g=h[2],x=h[3],m=h[4],p=[];for(let T=0,v=d.length;T<v;T++){let E=d[T],A=f[T],R=g[T],L=x[T],b=m[T];if(E===void 0)continue;E.updateMatrix&&E.updateMatrix();let _=n._createAnimationTracks(E,A,R,L,b);if(_)for(let C=0;C<_.length;C++)p.push(_[C])}let w=new ao(r,void 0,p);return ii(w,s),w})}createNodeMesh(e){let t=this.json,n=this,s=t.nodes[e];return s.mesh===void 0?null:n.getDependency("mesh",s.mesh).then(function(r){let o=n._getNodeRef(n.meshCache,s.mesh,r);return s.weights!==void 0&&o.traverse(function(a){if(a.isMesh)for(let c=0,l=s.weights.length;c<l;c++)a.morphTargetInfluences[c]=s.weights[c]}),o})}loadNode(e){let t=this.json,n=this,s=t.nodes[e],r=n._loadNodeShallow(e),o=[],a=s.children||[];for(let l=0,u=a.length;l<u;l++)o.push(n.getDependency("node",a[l]));let c=s.skin===void 0?Promise.resolve(null):n.getDependency("skin",s.skin);return Promise.all([r,Promise.all(o),c]).then(function(l){let u=l[0],h=l[1],d=l[2];d!==null&&u.traverse(function(f){f.isSkinnedMesh&&f.bind(d,Jb)});for(let f=0,g=h.length;f<g;f++)u.add(h[f]);return u})}_loadNodeShallow(e){let t=this.json,n=this.extensions,s=this;if(this.nodeCache[e]!==void 0)return this.nodeCache[e];let r=t.nodes[e],o=r.name?s.createUniqueName(r.name):"",a=[],c=s._invokeOne(function(l){return l.createNodeMesh&&l.createNodeMesh(e)});return c&&a.push(c),r.camera!==void 0&&a.push(s.getDependency("camera",r.camera).then(function(l){return s._getNodeRef(s.cameraCache,r.camera,l)})),s._invokeAll(function(l){return l.createNodeAttachment&&l.createNodeAttachment(e)}).forEach(function(l){a.push(l)}),this.nodeCache[e]=Promise.all(a).then(function(l){let u;if(r.isBone===!0?u=new Qs:l.length>1?u=new Lt:l.length===1?u=l[0]:u=new Et,u!==l[0])for(let h=0,d=l.length;h<d;h++)u.add(l[h]);if(r.name&&(u.userData.name=r.name,u.name=o),ii(u,r),r.extensions&&xs(n,u,r),r.matrix!==void 0){let h=new je;h.fromArray(r.matrix),u.applyMatrix4(h)}else r.translation!==void 0&&u.position.fromArray(r.translation),r.rotation!==void 0&&u.quaternion.fromArray(r.rotation),r.scale!==void 0&&u.scale.fromArray(r.scale);if(!s.associations.has(u))s.associations.set(u,{});else if(r.mesh!==void 0&&s.meshCache.refs[r.mesh]>1){let h=s.associations.get(u);s.associations.set(u,{...h})}return s.associations.get(u).nodes=e,u}),this.nodeCache[e]}loadScene(e){let t=this.extensions,n=this.json.scenes[e],s=this,r=new Lt;n.name&&(r.name=s.createUniqueName(n.name)),ii(r,n),n.extensions&&xs(t,r,n);let o=n.nodes||[],a=[];for(let c=0,l=o.length;c<l;c++)a.push(s.getDependency("node",o[c]));return Promise.all(a).then(function(c){for(let u=0,h=c.length;u<h;u++)r.add(c[u]);let l=u=>{let h=new Map;for(let[d,f]of s.associations)(d instanceof Qt||d instanceof Ft)&&h.set(d,f);return u.traverse(d=>{let f=s.associations.get(d);f!=null&&h.set(d,f)}),h};return s.associations=l(r),r})}_createAnimationTracks(e,t,n,s,r){let o=[],a=e.name?e.name:e.uuid,c=[];Hi[r.path]===Hi.weights?e.traverse(function(d){d.morphTargetInfluences&&c.push(d.name?d.name:d.uuid)}):c.push(a);let l;switch(Hi[r.path]){case Hi.weights:l=Kn;break;case Hi.rotation:l=Zn;break;case Hi.translation:case Hi.scale:l=Qn;break;default:switch(n.itemSize){case 1:l=Kn;break;case 2:case 3:default:l=Qn;break}break}let u=s.interpolation!==void 0?Wb[s.interpolation]:Qi,h=this._getArrayFromAccessor(n);for(let d=0,f=c.length;d<f;d++){let g=new l(c[d]+"."+Hi[r.path],t.array,h,u);s.interpolation==="CUBICSPLINE"&&this._createCubicSplineTrackInterpolant(g),o.push(g)}return o}_getArrayFromAccessor(e){let t=e.array;if(e.normalized){let n=dh(t.constructor),s=new Float32Array(t.length);for(let r=0,o=t.length;r<o;r++)s[r]=t[r]*n;t=s}return t}_createCubicSplineTrackInterpolant(e){e.createInterpolant=function(n){let s=this instanceof Zn?uh:Yl;return new s(this.times,this.values,this.getValueSize()/3,n)},e.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline=!0}};function Kb(i,e,t){let n=e.attributes,s=new ln;if(n.POSITION!==void 0){let a=t.json.accessors[n.POSITION],c=a.min,l=a.max;if(c!==void 0&&l!==void 0){if(s.set(new D(c[0],c[1],c[2]),new D(l[0],l[1],l[2])),a.normalized){let u=dh(_r[a.componentType]);s.min.multiplyScalar(u),s.max.multiplyScalar(u)}}else{console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");return}}else return;let r=e.targets;if(r!==void 0){let a=new D,c=new D;for(let l=0,u=r.length;l<u;l++){let h=r[l];if(h.POSITION!==void 0){let d=t.json.accessors[h.POSITION],f=d.min,g=d.max;if(f!==void 0&&g!==void 0){if(c.setX(Math.max(Math.abs(f[0]),Math.abs(g[0]))),c.setY(Math.max(Math.abs(f[1]),Math.abs(g[1]))),c.setZ(Math.max(Math.abs(f[2]),Math.abs(g[2]))),d.normalized){let x=dh(_r[d.componentType]);c.multiplyScalar(x)}a.max(c)}else console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.")}}s.expandByVector(a)}i.boundingBox=s;let o=new Zt;s.getCenter(o.center),o.radius=s.min.distanceTo(s.max)/2,i.boundingSphere=o}function Op(i,e,t){let n=e.attributes,s=[];function r(o,a){return t.getDependency("accessor",o).then(function(c){i.setAttribute(a,c)})}for(let o in n){let a=hh[o]||o.toLowerCase();a in i.attributes||s.push(r(n[o],a))}if(e.indices!==void 0&&!i.index){let o=t.getDependency("accessor",e.indices).then(function(a){i.setIndex(a)});s.push(o)}return ct.workingColorSpace!==$t&&"COLOR_0"in n&&console.warn(`THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${ct.workingColorSpace}" not supported.`),ii(i,e),Kb(i,e,t),Promise.all(s).then(function(){return e.targets!==void 0?Yb(i,e.targets,t):i})}var xr=["base","shoulder","upperarm","forearm","wrist1","wrist2","wrist3"],Hp=[.15,.12,.24,.21,.085,.092,.092],ys=new Map,ql=new Map,Zb=20,zp=null;async function Qb(i){return zp??=new Xl,await zp.loadAsync(i)}var eS=16723245;function ph(i,e,{emissive:t=eS,intensity:n=.55}={}){let s=new Set(Array.from(e??[]).map(Number).filter(o=>Number.isInteger(o)));if(i==null||typeof i.getObjectByName!="function")return 0;let r=0;for(let o=0;o<6;o+=1){let a=i.getObjectByName(`assemble_${xr[o+1]}`);if(a==null)continue;let c=s.has(o);c&&(r+=1),a.traverse?.(l=>{if(l?.isMesh!==!0)return;let u=l.material;if(u==null||typeof u.emissive?.setHex!="function")return;l.userData?.ursimTintOriginal===void 0&&(l.userData.ursimTintOriginal={hex:u.emissive.getHex(),intensity:u.emissiveIntensity??1,shared:!0});let h=l.userData.ursimTintOriginal;h.shared===!0&&(u=u.clone(),l.material=u,h.shared=!1),c?(u.emissive.setHex(t),u.emissiveIntensity=n):(u.emissive.setHex(h.hex),u.emissiveIntensity=h.intensity)})}return r}function tS(i){let e=[];for(let t=0;t<7;t++){let n=new Lt;n.name=`assemble_${xr[t]}`,n.matrixAutoUpdate=!1,e.push(n)}for(let t=1;t<7;t++)e[0].add(e[t]);for(let t=0;t<7;t++){let n=i?.getObjectByName?.(xr[t]);n&&e[t].add(n)}return i?.add?.(e[0]),e}function nS(i){let e=[];for(let t=0;t<7;t++){let n=Array.isArray(i)?i[t]:void 0;e.push(Number.isFinite(n)&&n>0?n:Hp[t])}return e}function $l(i){if(!Array.isArray(i)||i.length<6)return null;if(i.every(n=>n!==null&&typeof n=="object"&&!Array.isArray(n))){let n=[];for(let s=0;s<6;s+=1){let{x:r=0,y:o=0,z:a=0}=i[s];if(!Number.isFinite(r)||!Number.isFinite(o)||!Number.isFinite(a))return null;n.push(Math.hypot(r,o,a))}return n.push(n[5]),n}if(i.length<7)return null;let e=[];for(let n=0;n<7;n++){let s=i[n];if(!Array.isArray(s)||s.length<12)return null;let r=s[3],o=s[7],a=s[11];if(!Number.isFinite(r)||!Number.isFinite(o)||!Number.isFinite(a))return null;e.push([r,o,a])}let t=[];for(let n=0;n<6;n++){let[s,r,o]=e[n],[a,c,l]=e[n+1];t.push(Math.hypot(a-s,c-r,l-o))}return t.push(t[5]),t}function iS(i=Hp){let e=nS(i),t=new Lt;t.name="fallback_arm";let n=new un({color:8952234,roughness:.6,metalness:.1});for(let s=0;s<7;s++){let r=Math.max(.04,e[s]*.8),o=new ft(new io(Math.max(.03,e[s]*.18),r),n);o.name=xr[s],o.position.z=e[s]*.5,t.add(o)}return t}async function Vp(i,e={}){let t=String(i??"").toLowerCase(),n=ys.get(t);if(n)return n.refs+=1,kp(n);let s=ql.get(t),r=s??sS(t,e);s===void 0&&(ql.set(t,r),r.then(()=>ql.delete(t),()=>ql.delete(t)));let o=await r;return o.refs+=1,kp(o)}async function sS(i,e){let t=typeof e.loadGltf=="function"?e.loadGltf:Qb,n,s=!1;try{let c=(await t(`${td}?model=${encodeURIComponent(i)}`))?.scene;if(!c||typeof c.traverse!="function")throw new Error("GLB \u7ED3\u679C\u7F3A\u5C11 scene");n=c}catch{n=iS(e.armLinks),s=!0}let r=tS(n),o={id:i,refs:0,root:n,groups:r,usedFallback:s,applyFK(a){mh(r,a)}};return rS(o),o}function rS(i){if(ys.set(i.id,i),!(ys.size<=Zb)){for(let[e,t]of ys)if(!(t===i||t.refs>0)){Gp(t.root),ys.delete(e);return}}}function mh(i,e){let t=e?.links;if(!(!Array.isArray(t)||!Array.isArray(i))){i[0]&&(i[0].matrix.identity(),i[0].matrixWorldNeedsUpdate=!0);for(let n=1;n<7;n++){let s=t[n-1];i[n]&&Array.isArray(s)&&(i[n].matrix.fromArray(s),i[n].matrixWorldNeedsUpdate=!0)}}}function kp(i){let e=!1;return{root:i.root,groups:i.groups,usedFallback:i.usedFallback,applyFK:i.applyFK,dispose(){e||(e=!0,i.refs-=1,!(i.refs>0)&&(Gp(i.root),ys.get(i.id)===i&&ys.delete(i.id)))}}}var oS=["map","lightMap","aoMap","emissiveMap","bumpMap","normalMap","displacementMap","roughnessMap","metalnessMap","alphaMap","clearcoatMap","clearcoatNormalMap","clearcoatRoughnessMap","iridescenceMap","iridescenceThicknessMap","sheenColorMap","sheenRoughnessMap","specularMap","specularColorMap","specularIntensityMap","transmissionMap","thicknessMap","anisotropyMap","gradientMap"];function Gp(i){i?.traverse?.(e=>{e.geometry?.dispose?.();let t=Array.isArray(e.material)?e.material:e.material?[e.material]:[];for(let n of t){for(let s of oS)n?.[s]?.dispose?.();n?.dispose?.()}}),i?.parent?.remove?.(i)}function aS(){return[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}function Wp(i,e){let t=new Array(16);for(let n=0;n<4;n++)for(let s=0;s<4;s++)t[n*4+s]=i[s]*e[n*4]+i[4+s]*e[n*4+1]+i[8+s]*e[n*4+2]+i[12+s]*e[n*4+3];return t}function lS(i){let e=Math.cos(i),t=Math.sin(i);return[e,t,0,0,-t,e,0,0,0,0,1,0,0,0,0,1]}function cS(i,e,t,n,s,r){let o=Math.cos(n),a=Math.sin(n),c=Math.cos(s),l=Math.sin(s),u=Math.cos(r),h=Math.sin(r);return[u*c,h*c,-l,0,u*l*a-h*o,h*l*a+u*o,c*a,0,u*l*o+h*a,h*l*o-u*a,c*o,0,i,e,t,1]}function Ao(i,e){let t=[],n=aS();for(let s=0;s<6;s++){let r=i.links[s];n=Wp(n,cS(r.x??0,r.y??0,r.z??0,r.roll??0,r.pitch??0,r.yaw??0)),n=Wp(n,lS(e?.[s]??0)),t.push(n.slice())}return{links:t,tool0:n.slice()}}var uS=3,hS=8,dS=.001,fS=.004,Xp=5,jl=180/Math.PI,pS=i=>[i[8],i[9],i[10]],Yp=i=>[i[12],i[13],i[14]];function mS(i,e){if(i==null||e==null||e.length<6)return null;let t=Ao(i,e),n=t?.tool0,s=t?.links;if(!n||!Array.isArray(s)||s.length<6)return null;let r=[[],[],[],[],[],[]],o=Yp(n);for(let a=0;a<6;a+=1){let c=s[a],l=pS(c),u=Yp(c),h=o[0]-u[0],d=o[1]-u[1],f=o[2]-u[2];r[0][a]=l[1]*f-l[2]*d,r[1][a]=l[2]*h-l[0]*f,r[2][a]=l[0]*d-l[1]*h,r[3][a]=l[0],r[4][a]=l[1],r[5][a]=l[2]}return r}function gS(i){if(!Array.isArray(i)||i.length!==6)return null;let e=i.map(n=>Array.from(n)),t=1;for(let n=0;n<6;n+=1){let s=n;for(let r=n+1;r<6;r+=1)Math.abs(e[r][n])>Math.abs(e[s][n])&&(s=r);if(e[s][n]===0)return 0;if(s!==n){let r=e[s];e[s]=e[n],e[n]=r,t=-t}t*=e[n][n];for(let r=n+1;r<6;r+=1){let o=e[r][n]/e[n][n];if(o!==0)for(let a=n;a<6;a+=1)e[r][a]-=o*e[n][a]}}return t}function _S(i,e,t=null){let n=mS(i,e);if(n===null)return null;let s=gS(n);if(s===null||!Number.isFinite(s))return null;let r=Math.abs(s);return!Number.isFinite(t)||!(t>0)?r:r/t**3}function xS(i,e){if(i==null||e==null)return null;let t=1/0,n=-1,s=Math.min(i.length??0,e.length??0);for(let r=0;r<s;r+=1){let o=e[r],a=i[r];if(o==null||a==null||!Number.isFinite(a))continue;let[c,l]=o;if(!Number.isFinite(c)||!Number.isFinite(l))continue;let u=a<c?(a-c)*jl:a>l?(l-a)*jl:Math.min(a-c,l-a)*jl;u<t&&(t=u,n=r)}return n<0?null:{deg:t,joint:n}}function qp({kin:i,joints:e,limits:t=null,reach:n=null,manip:s=null}={}){if(i==null||e==null||e.length<6)return null;let r=Array.from(e).slice(0,6);if(!r.every(d=>Number.isFinite(d)))return null;let o=Math.abs(r[4])*jl,a=Number.isFinite(s)?s:_S(i,r,n),c=xS(r,t),l=[],u="ok",h=d=>{d==="at"||u==="at"?u="at":(d==="near"||u==="near")&&(u="near")};return o<=uS?(h("at"),l.push("wrist")):o<=hS&&(h("near"),l.push("wrist")),a!==null&&Number.isFinite(a)&&(a<=dS?(h("at"),l.push("manip")):a<=fS&&(h("near"),l.push("manip"))),c!==null&&c.deg<=Xp&&(h(c.deg<0?"at":"near"),l.push("limit")),{level:u,wristDeg:o,manip:a,limitDeg:c===null?null:c.deg,limitJoint:c===null?null:c.joint,limitNear:c!==null&&c.deg<=Xp,reasons:l}}var $p=5949690,yS=.28,vS=16754263;function jp(i,e={}){let t=i?.root;if(!t||typeof t.clone!="function")throw new Error("createGhostArm: \u9700\u8981\u4E00\u4E2A\u542B root \u7684\u6A21\u578B\u53E5\u67C4");let n=t.clone(!0);n.name="ursim-twin-ghost-arm";let s=new un({color:e.color??$p,transparent:!0,opacity:e.opacity??yS,depthWrite:!1,side:tn,roughness:.5,metalness:.05});n.traverse?.(o=>{o.isMesh&&(o.material=s)});let r=[];for(let o=0;o<7;o++)r.push(n.getObjectByName?.(`assemble_${xr[o]}`)??null);return n.visible=!1,{root:n,groups:r,material:s,applyFK(o){mh(r,o)},setVisible(o){n.visible=o===!0},setPending(o){let a=e.color??$p;s.color.setHex(o===!0?vS:a)}}}function gh(i){i!=null&&(i.root?.parent?.remove?.(i.root),i.material?.dispose?.())}var Jp=4030118,bS=16765286,_h=.1,SS=.002,MS=.6,TS=1;function Jl(i){let e=$l(i);if(e===null)return null;let t=e.slice(0,6).reduce((n,s)=>n+(Number.isFinite(s)?s:0),0);return t>0?t:null}function wS(i,e={}){if(!Array.isArray(i)||i.length<3)return null;let[t,n,s]=i;if(!Number.isFinite(t)||!Number.isFinite(n)||!Number.isFinite(s))return null;let r=Math.hypot(t,n,s),o=Number.isFinite(e.deadzoneN)?e.deadzoneN:TS;if(!(r>o))return null;let a=Number.isFinite(e.metersPerNewton)?e.metersPerNewton:SS,c=Number.isFinite(e.maxLength)?e.maxLength:MS,l=Math.min(c,r*a);return{direction:[t/r,n/r,s/r],length:l}}function Kp(i){let e=new Lt;e.name="ursim-twin-reach-sphere";let t=Number.isFinite(i)&&i>0?i:1,n=new ft(new rs(t,32,20),new en({color:Jp,transparent:!0,opacity:.06,side:Ot,depthWrite:!1}));n.name="ursim-twin-reach-shell",e.add(n);let s=new ft(new rs(t,16,10),new en({color:Jp,transparent:!0,opacity:.18,wireframe:!0,depthWrite:!1,side:tn}));return s.name="ursim-twin-reach-wire",e.add(s),e.visible=!1,e}function Zp(i=.03){let e=Number.isFinite(i)&&i>0?i:.03,t=new ft(new rs(e/2,16,12),new en({color:bS,depthTest:!1}));return t.name="ursim-twin-cog-marker",t.visible=!1,t}function Qp(i){let e=new mo(new D(0,0,1),new D(0,0,0),_h,16777215,_h*.25,_h*.15);return e.name="ursim-twin-force-arrow",e.visible=!1,xh(e,i),e}function xh(i,e,t){if(i==null)return;let n=wS(e,t);if(n===null){i.visible=!1;return}i.setDirection(new D(...n.direction)),i.setLength(n.length,n.length*.25,n.length*.15),i.visible=!0}function em(i){i!=null&&(i.traverse?.(e=>{e.geometry?.dispose?.();let t=e.material;if(Array.isArray(t))for(let n of t)n?.dispose?.();else t?.dispose?.()}),i.parent?.remove?.(i))}function ES(i,e,t){return i.map((n,s)=>n+(e[s]-n)*t)}function tm(i,e,t){let n=e.ts-i.ts;if(!(n>0))return e.q.slice();let s=Math.min(1,Math.max(0,(t-i.ts)/n));return ES(i.q,e.q,s)}function nm(i,e,t){return[...i,e].filter(s=>e.ts-s.ts<=t)}function im(i){return i.map(e=>[e.tcp[0],e.tcp[1],e.tcp[2]])}var AS=Object.freeze([.12,.28,.45]),RS=Object.freeze([.35,.78,1]);function sm(i,e={}){if(!Array.isArray(i)||i.length===0)return[];let t=Array.isArray(e.oldColor)?e.oldColor:AS,n=Array.isArray(e.newColor)?e.newColor:RS,r=i.map(l=>Number.isFinite(l?.ts)?l.ts:null).filter(l=>l!==null),o=r.length>0?Math.max(...r):null,a=r.length>0?Math.min(...r):null,c=o!==null&&a!==null?o-a:0;return i.map((l,u)=>{let h;return c>0&&Number.isFinite(l?.ts)?h=(l.ts-a)/c:h=i.length<=1?1:u/(i.length-1),h=Math.min(1,Math.max(0,h)),[t[0]+(n[0]-t[0])*h,t[1]+(n[1]-t[1])*h,t[2]+(n[2]-t[2])*h]})}var CS="ts,tcp_x,tcp_y,tcp_z,j1,j2,j3,j4,j5,j6";function rm(i){let e=[CS];if(!Array.isArray(i))return e.join(`
`);let t=n=>Number.isFinite(n)?n.toFixed(6):"";for(let n of i){let s=Array.isArray(n?.tcp)?n.tcp:[],r=Array.isArray(n?.q)?n.q:[],o=[t(n?.ts),t(s[0]),t(s[1]),t(s[2]),t(r[0]),t(r[1]),t(r[2]),t(r[3]),t(r[4]),t(r[5])];e.push(o.join(","))}return e.join(`
`)}var om="dsh-ursim-twin-styles",IS="data-dsh-ursim-twin-style",PS=`
.ursim-twin-panel {
  /* \u2500\u2500 \u4E3B\u9898\u5C42 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
     \u5DE6\u503C = \u5BBF\u4E3B token\uFF08\u968F\u4E3B\u9898\u81EA\u52A8\u7FFB\u8F6C\uFF09\uFF1B\u53F3\u503C = \u672C\u5730\u56DE\u9000\uFF08\u72EC\u7ACB\u9875\u9762/\u5047 DOM\uFF09\u3002
     \u4E0B\u9762 body[data-ds-dark-theme] \u90A3\u6761\u53EA\u6539**\u56DE\u9000\u503C**\uFF1A\u5BBF\u4E3B token \u5B58\u5728\u65F6\u4E24\u5904\u90FD\u89E3\u6790\u6210
     \u540C\u4E00\u4E2A\u5BBF\u4E3B\u503C\uFF0C\u6240\u4EE5\u6DF1\u8272\u5757\u4E0D\u4F1A\u4E0E\u5BBF\u4E3B\u4E3B\u9898\u6253\u67B6\u3002 */
  --ursim-canvas-inner: var(--dsw-alias-bg-layer-1, #fbfcfe);
  --ursim-canvas-outer: var(--dsw-alias-bg-base, #e9edf2);
  --ursim-surface: var(--dsw-alias-bg-layer-1, #ffffff);
  --ursim-chrome: var(--dsw-alias-bg-layer-1, #ffffff);
  --ursim-input-bg: var(--dsw-alias-bg-base, #ffffff);
  --ursim-text: var(--dsw-alias-label-primary, #1f2328);
  --ursim-text-secondary: var(--dsw-alias-label-secondary, #59636e);
  --ursim-text-tertiary: var(--dsw-alias-label-tertiary, #818b98);
  --ursim-border-subtle: var(--dsw-alias-border-l1, #e6eaef);
  --ursim-border: var(--dsw-alias-border-l2, #d1d9e0);
  --ursim-hover-bg: var(--dsw-alias-interactive-bg-hover, #eef1f4);
  --ursim-accent: var(--dsw-alias-state-business-primary, #0969da);
  --ursim-ok: var(--dsw-alias-state-success-primary, #1a7f37);
  --ursim-warn: var(--dsw-alias-state-warn-primary, #9a6700);
  --ursim-danger: var(--dsw-alias-state-error-primary, #cf222e);
  /* \u4E0B\u9762\u8FD9\u4E00\u7EC4\u5BBF\u4E3B\u6CA1\u6709\u5BF9\u5E94 token\uFF1A\u7528\u672C\u5730\u6210\u5BF9\u503C\uFF0C\u6DF1\u8272\u5757\u91CC\u6362\u6389\u3002
     \u5F3A\u8C03\u8272/\u7D2B\u8272\u5E95\u4E0A\u7684\u6587\u5B57\u4E5F\u5FC5\u987B\u8DDF\u7740\u6362 \u2014\u2014 \u6D45\u8272\u4E3B\u9898\u7684\u5F3A\u8C03\u8272\u6DF1\u3001\u8981\u767D\u5B57\uFF1B
     \u6DF1\u8272\u4E3B\u9898\u7684\u5F3A\u8C03\u8272\u6D45\u3001\u8981\u6DF1\u5B57\u3002 */
  --ursim-accent-ink: #ffffff;
  --ursim-pending: #bc4c00;
  --ursim-sim: #8250df;
  --ursim-sim-ink: #ffffff;

  position: relative;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  /* \u5BB9\u5668\u67E5\u8BE2\u7684\u951A\u70B9\uFF08\u89C1\u6587\u4EF6\u672B\u5C3E\u7684 @container\uFF09\uFF1A\u9762\u677F\u5BBD\u5EA6\u53D6\u51B3\u4E8E\u5BBF\u4E3B\u53F3\u680F\uFF0C\u800C\u4E0D\u662F viewport\uFF0C
     \u6240\u4EE5"\u7A84\u4E86\u5C31\u964D\u5217\u5BBD"\u5FC5\u987B\u6309**\u9762\u677F\u81EA\u8EAB**\u7684\u5BBD\u5EA6\u5224\u65AD\u3002 */
  container-type: inline-size;
  background: radial-gradient(circle at 50% 25%, var(--ursim-canvas-inner) 0%, var(--ursim-canvas-outer) 72%);
  color: var(--ursim-text);
  font: 12px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, 'Courier New', monospace;
}
body[data-ds-dark-theme] .ursim-twin-panel {
  --ursim-canvas-inner: var(--dsw-alias-bg-layer-1, #161b22);
  --ursim-canvas-outer: var(--dsw-alias-bg-base, #0b0f14);
  --ursim-surface: var(--dsw-alias-bg-layer-1, #161b22);
  --ursim-chrome: var(--dsw-alias-bg-layer-1, #0d1117);
  --ursim-input-bg: var(--dsw-alias-bg-base, #0d1117);
  --ursim-text: var(--dsw-alias-label-primary, #c9d1d9);
  --ursim-text-secondary: var(--dsw-alias-label-secondary, #8b949e);
  --ursim-text-tertiary: var(--dsw-alias-label-tertiary, #6e7681);
  --ursim-border-subtle: var(--dsw-alias-border-l1, #21262d);
  --ursim-border: var(--dsw-alias-border-l2, #30363d);
  --ursim-hover-bg: var(--dsw-alias-interactive-bg-hover, #21262d);
  --ursim-accent: var(--dsw-alias-state-business-primary, #58a6ff);
  --ursim-ok: var(--dsw-alias-state-success-primary, #3fb950);
  --ursim-warn: var(--dsw-alias-state-warn-primary, #d29922);
  --ursim-danger: var(--dsw-alias-state-error-primary, #f85149);
  --ursim-accent-ink: #0d1117;
  --ursim-pending: #ffa657;
  --ursim-sim: #a371f7;
  --ursim-sim-ink: #0d1117;
}
.ursim-twin-view {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
}
/* \u2500\u2500 \u4E24\u680F\u9AA8\u67B6\u4E0E\u53EF\u6536\u8D77\u63A7\u5236\u8F68\uFF08feat/twin-control-panel\uFF1B2026-10-20 \u5408\u5E76\u4E3A\u5355\u8F68\uFF09\u2500\u2500\u2500\u2500
   \u8FD9\u91CC\u662F\u63A7\u5236\u8F68\u9759\u6001\u6837\u5F0F\u7684**\u552F\u4E00\u771F\u6E90**\uFF08\u4EE5\u524D\u5199\u5728 JS \u7684 inline \u4E0A\uFF09\u3002\u8FD0\u884C\u671F\u53EA\u5269\u4E00\u4E2A\u52A8\u6001\u91CF\uFF1A
   stage.style.gridTemplateColumns \u2014\u2014 \u5B83\u7684\u552F\u4E00\u62FC\u6CD5\u662F twin-controls.js \u7684 stageColumns()\uFF0C
   \u56E0\u4E3A\u5217\u5BBD\u53D6\u51B3\u4E8E\u63A7\u5236\u8F68\u662F\u5426\u6536\u8D77\u3002\u6536\u8D77\u6001\u672C\u8EAB\u843D\u5728 data-collapsed \u5C5E\u6027\u4E0A\uFF0C\u6B63\u6587\u663E\u9690\u7531\u4E0B\u9762\u7684
   CSS \u51B3\u5B9A\uFF0C\u4E0D\u9760 JS \u6539 style.display\u3002
   \u26A0\uFE0F \u4E0D\u8981\u5728\u8FD9\u91CC\u5199\u6B7B\u5217\u5BBD\uFF1A.ursim-twin-stage \u7684 grid \u6A21\u677F\u7531\u9762\u677F\u6309\u72B6\u6001\u5199\u5165 inline\u3002 */
.ursim-twin-stage {
  display: grid;
  align-items: stretch;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
}
.ursim-twin-rail {
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  overflow-y: auto;
  min-width: 0;
  box-sizing: border-box;
  /* \u534A\u900F\u660E chrome\uFF1A\u4E0E\u5DE5\u5177\u680F/HUD \u540C\u4E00\u5957\u8D28\u611F\u3002 */
  background: color-mix(in srgb, var(--ursim-chrome) 88%, transparent);
}
/* \u63A7\u5236\u8F68\u8D34\u5728\u753B\u5E03\u53F3\u4FA7\uFF1A\u7528 data-* \u53D6\u503C\u800C\u4E0D\u662F\u518D\u4F20\u4E00\u4E2A class\uFF08\u5C5E\u6027\u4ECD\u662F side \u8BED\u4E49\uFF0C
   \u5C06\u6765\u82E5\u8981\u6062\u590D\u4E00\u6761\u5DE6\u4FA7\u8F68\uFF0C\u52A0\u4E00\u6761 [data-ursim-twin-rail='left'] \u89C4\u5219\u5373\u53EF\uFF09\u3002 */
.ursim-twin-rail[data-ursim-twin-rail='right'] { border-left: 1px solid var(--ursim-border-subtle); }
.ursim-twin-rail-toggle {
  flex: 0 0 auto;
  height: 24px;
  padding: 0;
  /* font: inherit \u4F1A\u91CD\u7F6E font-size/line-height\uFF0C\u6240\u4EE5\u8FD9\u4E24\u6761\u5FC5\u987B\u5199\u5728\u5B83\u540E\u9762\u3002 */
  font: inherit;
  font-size: 11px;
  line-height: 1;
  color: var(--ursim-text-secondary);
  background: transparent;
  border: 0;
  border-bottom: 1px solid var(--ursim-border-subtle);
  cursor: pointer;
}
.ursim-twin-rail-body {
  flex: 1 1 auto;
  min-height: 0;
  box-sizing: border-box;
  padding: 6px 6px 8px;
}
/* \u6536\u8D77\u540E\u6B63\u6587\u5FC5\u987B\u5F7B\u5E95\u8BA9\u4F4D\uFF08\u4E0D\u80FD\u53EA\u9760 overflow \u85CF\uFF1A\u90A3\u6837\u4ECD\u80FD\u6EDA\u51FA\u5185\u5BB9\uFF09\uFF0C\u628A\u624B\u4FDD\u7559\u3002 */
.ursim-twin-rail[data-collapsed='true'] .ursim-twin-rail-body { display: none; }
/*
 * \u89C6\u89D2\u5DE5\u5177\u680F\u3002\u4EE5\u524D\u9762\u677F\u91CC\u552F\u4E00\u7684\u63A7\u4EF6\u662F\u4E00\u4E2A\u753B\u5E03 \u2014\u2014 OrbitControls \u5141\u8BB8\u628A\u76F8\u673A\u63A8\u8FDB\u673A\u68B0\u81C2\u5185\u90E8\u6216
 * \u63A8\u5230\u770B\u4E0D\u89C1\u7684\u5730\u65B9\uFF0C\u800C"\u91CD\u7F6E"\u53EA\u80FD\u9760\u6536\u8D77\u9762\u677F\u518D\u5C55\u5F00\u3002\u8FD9\u6392\u6309\u94AE\u8865\u4E0A\u90A3\u4E2A\u7F3A\u53E3\u3002
 */
.ursim-twin-toolbar {
  flex: 0 0 auto;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 6px 8px;
  border-bottom: 1px solid var(--ursim-border-subtle);
  /* \u534A\u900F\u660E chrome\uFF1A3D \u753B\u9762\u4ECE\u4E0B\u9762\u900F\u51FA\u6765\u4E00\u70B9\uFF0C\u4E0E\u5BBF\u4E3B\u7684\u6D6E\u5C42\u8D28\u611F\u4E00\u81F4\u3002 */
  background: color-mix(in srgb, var(--ursim-chrome) 88%, transparent);
}
.ursim-twin-toolbar-button {
  flex: 0 0 auto;
  padding: 2px 8px;
  border: 1px solid var(--ursim-border);
  border-radius: 4px;
  background: var(--ursim-surface);
  color: var(--ursim-text);
  font: inherit;
  cursor: pointer;
}
.ursim-twin-toolbar-button:hover { border-color: var(--ursim-accent); color: var(--ursim-accent); }
.ursim-twin-toolbar-button:active { background: var(--ursim-hover-bg); }
.ursim-twin-canvas {
  display: block;
  width: 100%;
  height: 100%;
  outline: none;
}
/*
 * \u952E\u76D8\u7126\u70B9\u5FC5\u987B\u53EF\u89C1\uFF08P2\uFF09\uFF1A\u4EE5\u524D\u5168\u6587\u53EA\u6709\u4E0A\u9762\u90A3\u6761 outline:none\uFF0CTab \u8D70\u4E00\u5708\u5B8C\u5168\u770B\u4E0D\u51FA\u7126\u70B9\u843D\u5728
 * \u54EA\u4E2A\u6309\u94AE/\u8F93\u5165\u6846\u4E0A \u2014\u2014 \u800C\u8FD9\u91CC\u6BCF\u4E2A\u6309\u94AE\u90FD\u4F1A\u771F\u4E0B\u53D1\u547D\u4EE4\u3002\u53EA\u5728 :focus-visible \u65F6\u753B\u73AF\uFF1A\u9F20\u6807\u70B9\u51FB
 * \u4E0D\u51FA\u73B0\uFF0C\u952E\u76D8\u5BFC\u822A\u5FC5\u51FA\u73B0\u3002\u753B\u5E03\u7528\u8D1F offset\uFF0C\u5426\u5219\u73AF\u4F1A\u88AB .ursim-twin-panel \u7684 overflow \u88C1\u6389\u3002
 */
.ursim-twin-canvas:focus-visible {
  outline: 2px solid var(--ursim-accent);
  outline-offset: -2px;
}
.ursim-twin-toolbar-button:focus-visible,
.ursim-twin-rail-toggle:focus-visible,
.ursim-twin-layer-toggle:focus-visible,
.ursim-twin-sim-toggle:focus-visible,
.ursim-twin-sim select:focus-visible,
.ursim-twin-io-summary:focus-visible,
.ursim-twin-sim-caps-summary:focus-visible,
.ursim-twin-ctl-button:focus-visible,
.ursim-twin-ctl-seg-button:focus-visible,
.ursim-twin-ctl-step:focus-visible,
.ursim-twin-ctl-pose-input:focus-visible,
.ursim-twin-ctl-joint-range:focus-visible {
  outline: 2px solid var(--ursim-accent);
  outline-offset: 2px;
}
.ursim-twin-hud {
  flex: 0 0 auto;
  display: grid;
  gap: 2px;
  padding: 8px 10px;
  border-top: 1px solid var(--ursim-border-subtle);
  background: color-mix(in srgb, var(--ursim-chrome) 88%, transparent);
}
.ursim-twin-hud-row {
  overflow: hidden;
  white-space: pre;
  text-overflow: ellipsis;
  color: var(--ursim-text-secondary);
}
.ursim-twin-status {
  flex: 0 0 auto;
  padding: 6px 10px;
  border-top: 1px solid var(--ursim-border-subtle);
  color: var(--ursim-text-secondary);
}
.ursim-twin-error {
  flex: 0 0 auto;
  padding: 0 10px 6px;
  color: var(--ursim-danger);
  white-space: pre-wrap;
}
.ursim-twin-panel[data-ursim-twin-connected='true'] .ursim-twin-status { color: var(--ursim-ok); }
/* \u5B89\u5168\u72B6\u6001\u5F02\u5E38\u65F6\u538B\u8FC7\u4E0A\u9762\u90A3\u6761\u7EFF\u8272\uFF1A\u540C\u7B49\u7279\u5F02\u6027\uFF0C\u9760**\u5199\u5728\u540E\u9762**\u53D6\u80DC\uFF0C\u4E0D\u8981\u4E0A\u79FB\u8FD9\u4E24\u6761\u3002 */
.ursim-twin-panel[data-ursim-twin-hazard='true'] .ursim-twin-status { color: var(--ursim-danger); }
.ursim-twin-hud-row[data-ursim-twin-hazard='true'] { color: var(--ursim-danger); }
/* \u5173\u8282\u8D85\u51FA kinematics.json \u7684\u9650\u4F4D\uFF1A\u548C"\u5B89\u5168\u5F02\u5E38"\u7528\u540C\u4E00\u4E2A\u8B66\u793A\u8272\uFF0C\u4F46\u53EA\u67D3\u90A3\u4E00\u884C\u3002 */
.ursim-twin-hud-row[data-ursim-twin-overlimit='true'] { color: var(--ursim-danger); }
/* \u5F85\u5BA1\u6279\u7684\u8FD0\u52A8\u76EE\u6807\uFF1A\u4E0E\u5E7D\u7075\u81C2\u7684"\u5F85\u5BA1\u6279"\u6A59\u8272\u4E00\u81F4\uFF0C\u8BA9 HUD \u6587\u5B57\u4E0E 3D \u91CC\u7684\u5047\u81C2\u5BF9\u5F97\u4E0A\u3002
   \u7A7A\u7684\u65F6\u5019\uFF08\u6CA1\u6709\u5BA1\u6279\uFF09\u8FD9\u4E00\u884C\u4E0D\u67D3\u8272\uFF0C\u4E5F\u5C31\u770B\u4E0D\u51FA\u5360\u4F4D\u3002 */
.ursim-twin-hud-row[data-ursim-twin-pending]:not(:empty) { color: var(--ursim-pending); }
/* \u5DE5\u7A0B\u8F85\u52A9\u56FE\u5C42\u7684\u5F00\u5173\uFF08\u6E05\u5355\u7B2C 9 \u6761\uFF09\uFF1A\u514B\u5236\u7684\u5C0F\u6309\u94AE\uFF0C\u6FC0\u6D3B\u6001\u7528\u5B9E\u5FC3\u5F3A\u8C03\u8272\uFF0C\u4E00\u773C\u770B\u51FA\u54EA\u4E9B\u56FE\u5C42\u5F00\u7740\u3002 */
.ursim-twin-layer-toggle {
  margin-right: 6px;
  padding: 1px 6px;
  font: inherit;
  font-size: 11px;
  color: var(--ursim-text-secondary);
  background: transparent;
  border: 1px solid var(--ursim-border);
  border-radius: 4px;
  cursor: pointer;
}
.ursim-twin-layer-toggle[aria-pressed='true'] {
  color: var(--ursim-accent-ink);
  background: var(--ursim-accent);
  border-color: var(--ursim-accent);
}
/* \u8EAB\u4EFD\u884C\uFF08\u673A\u578B + IP\uFF09\u6BD4\u8BFB\u6570\u66F4\u91CD\u8981\uFF0C\u7ED9\u5B83\u6B63\u5E38\u524D\u666F\u8272\u800C\u4E0D\u662F\u6CE8\u91CA\u7070\u3002
   \u8EAB\u4EFD\u6587\u5B57\u662F\u8FD9\u4E00\u884C\u81EA\u5DF1\u7684\u6587\u672C\u8282\u70B9\uFF0C**\u6570\u636E\u901A\u9053\u5065\u5EB7\u5EA6\u4F5C\u4E3A\u7B2C\u4E8C\u4E2A flex \u9879\u8DDF\u5728\u5B83\u540E\u9762\u3001\u540C\u4E00\u884C\u663E\u793A**
   \uFF08\u7528\u6237\u8981\u6C42\uFF1A\u505C\u6EDE\u63D0\u793A\u8981\u6392\u5728"\u673A\u5668\u4EBA <\u578B\u53F7> \xB7 <IP>"\u540E\u9762\u3001\u4E24\u8005\u540C\u4E00\u884C\uFF09\u3002\u4E24\u8005\u90FD\u4E0D\u6362\u884C\u3001\u8D85\u957F\u5404\u81EA\u7701\u7565\u3002 */
.ursim-twin-hud-row[data-ursim-twin-identity] {
  display: flex;
  gap: 8px;
  align-items: baseline;
  color: var(--ursim-text);
}
/* flex \u9879\u9ED8\u8BA4\u53EF\u6536\u7F29\uFF0C\u4F46\u8981 min-width: 0 \u624D\u4F1A\u771F\u7684\u7701\u7565\uFF0C\u800C\u4E0D\u662F\u628A\u6574\u884C\u6491\u7834\u3002 */
.ursim-twin-hud-row[data-ursim-twin-identity] > [data-ursim-twin-feed] { min-width: 0; }
/* \u6570\u636E\u901A\u9053\u5065\u5EB7\u5EA6\uFF080.6.6\uFF09\uFF1A\u505C\u6EDE/\u91CD\u8FDE\u5FC5\u987B\u4E00\u773C\u53EF\u89C1 \u2014\u2014 \u753B\u9762\u505C\u4F4F\u65F6\u7528\u6237\u8981\u80FD\u5206\u6E05
   "\u673A\u5668\u4EBA\u505C\u4E86"\u4E0E"\u6570\u636E\u505C\u4E86"\uFF0C\u6240\u4EE5\u8FD9\u4E00\u884C\u7528\u8B66\u793A\u8272\uFF08\u9EC4=\u505C\u6EDE/\u91CD\u8FDE\u4E2D\uFF0C\u7EA2=\u901A\u9053\u4E0D\u53EF\u7528\uFF09\u3002 */
.ursim-twin-hud-row[data-ursim-twin-feed-state='stale'] { color: var(--ursim-warn); }
.ursim-twin-hud-row[data-ursim-twin-feed-state='retrying'] { color: var(--ursim-warn); }
/* \u2500\u2500 \u79BB\u7EBF\u4EFF\u771F\uFF080.7.0\uFF09\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
   \u4EFF\u771F\u6001\u5FC5\u987B**\u4E00\u773C\u53EF\u89C1**\uFF1A\u89D2\u6807\u538B\u5728\u6700\u4E0A\u9762\u3001\u5F00\u5173\u4E0E\u9009\u62E9\u9879\u5355\u72EC\u4E00\u884C\u3001\u72B6\u6001\u8272\u6539\u7528\u7D2B\u8272\u7CFB
   \uFF08\u4E0E"\u5DF2\u8FDE\u63A5"\u7684\u7EFF\u3001"\u5F02\u5E38"\u7684\u7EA2/\u9EC4\u90FD\u4E0D\u540C\uFF09\uFF0C\u514D\u5F97\u4EFB\u4F55\u4EBA\u628A\u865A\u62DF\u673A\u5668\u4EBA\u5F53\u6210\u771F\u673A\u3002 */
.ursim-twin-sim {
  flex: 0 0 auto;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-bottom: 1px solid var(--ursim-border);
  font-size: 11px;
  color: var(--ursim-text-secondary);
}
.ursim-twin-sim-toggle {
  padding: 2px 8px;
  font: inherit;
  font-size: 11px;
  color: var(--ursim-text-secondary);
  background: transparent;
  border: 1px solid var(--ursim-border);
  border-radius: 4px;
  cursor: pointer;
}
.ursim-twin-sim-toggle[aria-pressed='true'] {
  color: var(--ursim-sim-ink);
  background: var(--ursim-sim);
  border-color: var(--ursim-sim);
}
.ursim-twin-sim-toggle:disabled { opacity: 0.55; cursor: progress; }
.ursim-twin-sim select {
  font: inherit;
  font-size: 11px;
  color: var(--ursim-text);
  background: var(--ursim-input-bg);
  border: 1px solid var(--ursim-border);
  border-radius: 4px;
  padding: 1px 4px;
}
.ursim-twin-sim select:disabled { opacity: 0.55; }
.ursim-twin-sim-note { flex: 1 1 100%; color: var(--ursim-text-tertiary); }
.ursim-twin-sim-error { flex: 1 1 100%; color: var(--ursim-danger); }
/* \u89D2\u6807\uFF1A\u76D6\u5728 3D \u89C6\u56FE\u5DE6\u4E0A\u89D2\uFF0C\u8DDF\u7740\u753B\u5E03\u4E00\u8D77\u7F29\u653E\u4E0D\u7559\u7F1D\u3002 */
.ursim-twin-sim-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 2;
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--ursim-sim-ink);
  background: var(--ursim-sim);
  border-radius: 4px;
  pointer-events: none;
}
.ursim-twin-panel[data-ursim-twin-sim='true'] .ursim-twin-view { outline: 1px solid var(--ursim-sim); outline-offset: -1px; }
.ursim-twin-panel[data-ursim-twin-sim='true'] .ursim-twin-status { color: var(--ursim-sim); }
/* \u6A21\u5F0F\u89D2\u6807\u7684\u4E09\u6001\uFF08P0\uFF09\uFF1A\u4EFF\u771F\u4E2D\u6CBF\u7528\u4E0A\u9762\u7684\u7D2B\u8272\uFF1B**\u771F\u673A\u6A21\u5F0F\u7EA2\u8272\u4E14\u5E38\u663E**\uFF08\u8FD9\u662F\u64CD\u4F5C\u5458\u6700\u8BE5\u4E00\u773C\u770B\u5230\u7684
   \u4E8B \u2014\u2014 \u4ECE\u524D\u771F\u673A\u6A21\u5F0F\u4E0B\u4EC0\u4E48\u6807\u8BC6\u90FD\u6CA1\u6709\uFF0C\u800C"\u6CA1\u6709\u89D2\u6807"\u8BFB\u8D77\u6765\u5C31\u662F"\u5B89\u5168"\uFF09\uFF1B\u672A\u8FDE\u63A5\u8D70\u4E2D\u6027\u7070\u3002 */
.ursim-twin-sim-badge[data-ursim-twin-mode='real'] {
  color: #ffffff;
  background: var(--ursim-danger);
}
.ursim-twin-sim-badge[data-ursim-twin-mode='idle'] {
  color: var(--ursim-text-secondary);
  background: var(--ursim-hover-bg);
  border: 1px solid var(--ursim-border-subtle);
}
/* \u4EFF\u771F\u80FD\u529B\u6E05\u5355\uFF08P2\uFF09\uFF1A\u6298\u53E0\u6001\u53EA\u6709\u4E00\u884C\u6458\u8981\u3002 */
.ursim-twin-sim-caps {
  flex: 1 1 100%;
  font-size: 11px;
  color: var(--ursim-text-secondary);
}
.ursim-twin-sim-caps-summary { cursor: pointer; }
.ursim-twin-sim-caps-body { margin: 2px 0 0 12px; line-height: 1.5; }
/* \u5947\u5F02\u70B9\u63D0\u793A\u884C\uFF080.1.11\uFF0CC1\uFF09\uFF1Anear \u8D70\u8B66\u544A\u8272\u3001at \u8D70\u5371\u9669\u8272\uFF0C\u4E0E\u300C\u26A0 \u8D85\u9650\u300D\u540C\u4E00\u5957\u8BED\u4E49\u3002 */
.ursim-twin-hud-row[data-ursim-twin-risk='near'] { color: var(--ursim-warn); }
.ursim-twin-hud-row[data-ursim-twin-risk='at'] { color: var(--ursim-danger); font-weight: 600; }
/* I/O \u4E0E\u5BC4\u5B58\u5668\u8BFB\u6570\uFF080.1.9\uFF09\uFF1A\u7B49\u5BBD + \u4FDD\u7559\u6362\u884C\uFF0C\u4F4D\u4E32\u624D\u5BF9\u9F50\u3002 */
.ursim-twin-io {
  flex: 1 1 100%;
  font-size: 11px;
  color: var(--ursim-text-secondary);
}
.ursim-twin-io-summary { cursor: pointer; }
.ursim-twin-io-body {
  margin: 2px 0 0 12px;
  line-height: 1.6;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  white-space: pre-wrap;
}
/* \u2500\u2500 \u63A7\u5236\u8F68\uFF082026-10-20 \u5408\u5E76\u4E3A\u5355\u6761\u53F3\u8F68\uFF0C\u8F68\u5BBD 600px\uFF09\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
   \u5E03\u5C40\u6309\u7528\u6237\u7ED9\u7684\u53C2\u7167\u56FE\u81EA\u4E0A\u800C\u4E0B\uFF1A
     \u53EA\u8BFB\u8BFB\u6570\u884C \u2192 TCP \u4F4D\u59FF\u516D\u683C\uFF08X/Y/Z \u4E00\u884C\u3001RX/RY/RZ \u4E00\u884C\uFF09+ \u53F3\u4FA7\u300C\u5750\u6807\u7CFB\u300D\u7AD6\u6392\u4E24\u6863
     \u2192 \u4E24\u5757\u65B9\u5411\u76D8\uFF08TCP \u4F4D\u7F6E / TCP \u65B9\u5411\uFF09+ \u53F3\u4FA7\u4E24\u6863\u6B65\u957F\u7AD6\u6392 \u2192 \u516D\u884C\u5173\u8282\uFF08\u25C0 \u6ED1\u5757 \u25B6 \u89D2\u5EA6\uFF09\u3002
   \u4E3B\u533A\u662F\u4E24\u5217 grid\uFF1A\u5DE6\u5217\uFF08\u4F4D\u59FF + \u65B9\u5411\u76D8\uFF09\u81EA\u9002\u5E94\uFF0C\u53F3\u5217\u56FA\u5B9A 172px\uFF08\u5750\u6807\u7CFB + \u6B65\u957F\uFF09\uFF0C
   \u5BF9\u5E94\u53C2\u7167\u56FE\u53F3\u4FA7\u90A3\u6761\u7AD6\u5E26 \u2014\u2014 \u5750\u6807\u7CFB\u4E0E\u6B65\u957F\u5FC5\u987B\u843D\u5728\u540C\u4E00\u5217\uFF0C\u5426\u5219\u4E24\u8005\u5DE6\u53F3\u4F1A\u9519\u5F00\u3002
   \u72B6\u6001\u53EA\u8D70\u5C5E\u6027\uFF1A\u6309\u94AE\u53EF\u7528\u6027\u4EA4\u7ED9 disabled\u3001\u6863\u4F4D\u4EA4\u7ED9 aria-pressed\u3001\u6574\u5757\u72B6\u6001\u4EA4\u7ED9
   data-ursim-ctl-state \u2014\u2014 \u8FD9\u91CC\u6CA1\u6709\u4EFB\u4F55 inline \u6837\u5F0F\uFF0C\u8FD0\u884C\u671F\u4E5F\u4E0D\u5199 style.*\u3002 */
.ursim-twin-rail-body[data-ursim-twin-rail-body='right'] {
  padding: 8px 10px;
}
.ursim-twin-ctl-note {
  margin: 0 0 6px;
  font-size: 11px;
  line-height: 1.35;
  color: var(--ursim-warn);
}
.ursim-twin-ctl-note:empty { display: none; }
.ursim-twin-ctl-error {
  margin: 0 0 6px;
  font-size: 11px;
  line-height: 1.35;
  color: var(--ursim-danger);
  white-space: pre-wrap;
}
.ursim-twin-ctl-error:empty { display: none; }
/* \u9876\u90E8\u53EA\u8BFB\u8BFB\u6570\uFF08TCP \u7C73\u5236\u4E09\u5143\u7EC4\uFF09\uFF1A\u7B49\u5BBD\u6570\u5B57\uFF0C\u653E\u4E0D\u4E0B\u5C31\u7701\u7565\uFF0C\u4E0D\u6362\u884C\u3002 */
.ursim-twin-ctl-summary {
  margin: 0 0 8px;
  font-size: 12px;
  color: var(--ursim-text-secondary);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ursim-twin-ctl-summary:empty { display: none; }
/* \u4E3B\u533A\u4E24\u5217\uFF1A\u5DE6 = \u4F4D\u59FF + \u65B9\u5411\u76D8\uFF0C\u53F3 = \u5750\u6807\u7CFB + \u6B65\u957F\u3002 */
.ursim-twin-ctl-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 172px;
  gap: 10px;
  align-items: start;
  margin: 0 0 8px;
}
.ursim-twin-ctl-primary {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}
.ursim-twin-ctl-side {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}
.ursim-twin-ctl-section { margin: 0; min-width: 0; }
.ursim-twin-ctl-label {
  margin: 0 0 4px;
  font-size: 11px;
  color: var(--ursim-text-secondary);
}
/* \u70B9\u52A8\u884C\uFF1A\u4F4D\u7F6E\u76D8 | \u65B9\u5411\u76D8\uFF08\u4E0E\u53C2\u7167\u56FE\u4E00\u81F4\uFF0C\u4E24\u5757\u76D8\u5E76\u6392\uFF09\u3002 */
.ursim-twin-ctl-jog {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 10px;
  align-items: start;
}
.ursim-twin-ctl-pad {
  display: grid;
  /* 3 \xD7 60 + 2 \xD7 6 = 192\uFF1A\u4E24\u76D8\u5E76\u6392 2 \xD7 192 + 10 = 394 \u2264 \u5DE6\u5217\u53EF\u7528\u5BBD\u5EA6\uFF08600 \u2212 1 \u8FB9\u6846 \u2212
     20 \u5185\u8FB9\u8DDD \u2212 172 \u53F3\u5217 \u2212 10 \u5217\u95F4\u8DDD \u2248 397\uFF09\u3002 */
  grid-template-columns: repeat(3, 60px);
  grid-template-rows: repeat(3, 60px);
  gap: 6px;
  justify-content: start;
}
.ursim-twin-ctl-cell { display: block; }
.ursim-twin-ctl-button {
  width: 60px;
  height: 60px;
  padding: 0;
  font: inherit;
  font-size: 13px;
  line-height: 1;
  color: var(--ursim-text);
  background: var(--ursim-surface);
  border: 1px solid var(--ursim-border);
  border-radius: 6px;
  cursor: pointer;
  /* \u89E6\u5C4F\u4E0A\u4E0D\u8981 300 ms \u53CC\u51FB\u7F29\u653E\u5EF6\u8FDF\uFF1A\u70B9\u52A8\u8981\u6C42"\u6309\u4E0B\u5373\u52A8"\u3002 */
  touch-action: manipulation;
}
.ursim-twin-ctl-button:hover:not(:disabled) {
  border-color: var(--ursim-accent);
  color: var(--ursim-accent);
}
.ursim-twin-ctl-button:active:not(:disabled) { background: var(--ursim-hover-bg); }
.ursim-twin-ctl-button:disabled { opacity: 0.45; cursor: not-allowed; }
/* busy\uFF08\u547D\u4EE4\u5728\u9014\uFF09\u4E0D\u843D disabled \u2014\u2014 \u88AB\u7981\u7528\u7684\u6309\u94AE\u6536\u4E0D\u5230 pointerup\uFF0C\u4F1A\u628A\u957F\u6309\u6390\u65AD\u3002
   \u8FD9\u91CC\u53EA\u7528 aria-disabled \u628A"\u8FD9\u4E00\u62CD\u4E0D\u4F1A\u53D1\u51FA\u53BB"\u8868\u8FBE\u51FA\u6765\uFF0C\u6309\u94AE\u4ECD\u53EF\u63A5\u6536\u6307\u9488\u4E8B\u4EF6\u3002 */
.ursim-twin-ctl-button[aria-disabled='true'] { opacity: 0.55; cursor: progress; }
/* Z / RZ \u884C\uFF1A\u4E24\u679A\u6309\u94AE\u5404\u5360\u534A\u6761\u76D8\u5BBD\uFF0C\u9AD8\u5EA6\u6BD4\u5706\u76D8\u94AE\u77EE\u3002 */
.ursim-twin-ctl-row {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}
.ursim-twin-ctl-row .ursim-twin-ctl-button {
  flex: 1 1 0;
  width: auto;
  height: 38px;
}
/* \u5206\u6BB5\u63A7\u4EF6\uFF1A\u6A2A\u5411\uFF08\u6B65\u957F\u5728\u53F3\u4FA7\u5217\u65F6\u6539\u4E3A\u7AD6\u6392\uFF0C\u89C1\u4E0B\u9762 .ursim-twin-ctl-stepcol\uFF09\u3002 */
.ursim-twin-ctl-seg {
  display: flex;
  height: 30px;
  margin: 0;
  border: 1px solid var(--ursim-border);
  border-radius: 4px;
  overflow: hidden;
}
.ursim-twin-ctl-seg-button {
  flex: 1 1 0;
  min-width: 0;
  height: 30px;
  padding: 0;
  font: inherit;
  font-size: 11px;
  line-height: 1;
  color: var(--ursim-text-secondary);
  background: var(--ursim-surface);
  border: 0;
  border-right: 1px solid var(--ursim-border-subtle);
  cursor: pointer;
}
.ursim-twin-ctl-seg-button:last-child { border-right: 0; border-bottom: 0; }
.ursim-twin-ctl-seg-button[aria-pressed='true'] {
  color: var(--ursim-accent-ink);
  background: var(--ursim-accent);
}
.ursim-twin-ctl-seg-button:disabled { opacity: 0.45; cursor: not-allowed; }
/* \u5750\u6807\u7CFB\uFF1A\u7AD6\u6392\u4E24\u6863\uFF08\u5DE5\u5177\u7CFB / \u57FA\u5EA7\u7CFB\uFF09\u3002 */
.ursim-twin-ctl-frame { min-width: 0; }
.ursim-twin-ctl-frame .ursim-twin-ctl-seg {
  flex-direction: column;
  height: auto;
}
.ursim-twin-ctl-frame .ursim-twin-ctl-seg-button {
  flex: 0 0 34px;
  height: 34px;
  border-right: 0;
  border-bottom: 1px solid var(--ursim-border-subtle);
}
/* \u6B65\u957F\uFF1A\u4E24\u5217\uFF08mm / \xB0\uFF09\uFF0C\u6BCF\u5217\u5185\u90E8\u7AD6\u6392\u4E09\u6863\u3002 */
.ursim-twin-ctl-steps {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 8px;
}
.ursim-twin-ctl-stepcol { min-width: 0; }
.ursim-twin-ctl-stepcol .ursim-twin-ctl-seg {
  flex-direction: column;
  height: auto;
}
.ursim-twin-ctl-stepcol .ursim-twin-ctl-seg-button {
  flex: 0 0 28px;
  height: 28px;
  border-right: 0;
  border-bottom: 1px solid var(--ursim-border-subtle);
}
/* TCP \u4F4D\u59FF\u516D\u683C\uFF1A3 \u5217 \xD7 2 \u884C\uFF08X/Y/Z mm\uFF0CRX/RY/RZ rad\uFF09\u3002 */
.ursim-twin-ctl-pose {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px 8px;
  margin: 0;
}
.ursim-twin-ctl-pose-cell {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 30px;
  min-width: 0;
}
.ursim-twin-ctl-pose-label {
  flex: 0 0 26px;
  font-size: 11px;
  color: var(--ursim-text-secondary);
}
.ursim-twin-ctl-pose-input {
  flex: 1 1 auto;
  min-width: 0;
  height: 30px;
  box-sizing: border-box;
  padding: 0 6px;
  font: inherit;
  font-size: 12px;
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: var(--ursim-text);
  background: var(--ursim-surface);
  border: 1px solid var(--ursim-border);
  border-radius: 4px;
}
.ursim-twin-ctl-pose-input:disabled { opacity: 0.45; cursor: not-allowed; }
/* \u5173\u8282\uFF1A\u540D\u79F0 56 + \u25C0 32 + \u6ED1\u5757 + \u25B6 32 + \u89D2\u5EA6 64\uFF0C\u884C\u9AD8 34\u3002 */
.ursim-twin-ctl-joint-row {
  display: grid;
  grid-template-columns: 56px 32px minmax(0, 1fr) 32px 64px;
  align-items: center;
  /* \u95F4\u9699 10px\uFF1A\u25C0 / \u25B6 \u6BCF\u679A\u90FD\u771F\u4E0B\u53D1 1\xB0\uFF0C\u8D34\u592A\u8FD1\u65F6\u8BEF\u89E6\u4E00\u6B21\u673A\u68B0\u81C2\u5C31\u52A8\u3002 */
  gap: 10px;
  height: 34px;
}
.ursim-twin-ctl-joint-name {
  font-size: 11px;
  color: var(--ursim-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ursim-twin-ctl-step {
  /* \u547D\u4E2D\u533A 32\xD732\uFF1A\u8FD9\u662F"\u6BCF\u70B9\u4E00\u6B21\u771F\u4E0B\u53D1 1\xB0"\u7684\u6309\u94AE\uFF0C\u518D\u5C0F\u5728\u89E6\u5C4F/\u89E6\u63A7\u677F\u4E0A\u5BB9\u6613\u70B9\u504F\u3002 */
  width: 32px;
  height: 32px;
  margin: 0;
  padding: 0;
  font: inherit;
  font-size: 11px;
  line-height: 1;
  color: var(--ursim-text);
  background: var(--ursim-surface);
  border: 1px solid var(--ursim-border);
  border-radius: 4px;
  cursor: pointer;
  touch-action: manipulation;
}
.ursim-twin-ctl-step:hover:not(:disabled) {
  border-color: var(--ursim-accent);
  color: var(--ursim-accent);
}
.ursim-twin-ctl-step:disabled { opacity: 0.45; cursor: not-allowed; }
.ursim-twin-ctl-joint-range {
  width: 100%;
  min-width: 0;
}
.ursim-twin-ctl-joint-range:disabled { opacity: 0.45; }
.ursim-twin-ctl-joint-value {
  font-size: 12px;
  text-align: right;
  color: var(--ursim-text-secondary);
  font-variant-numeric: tabular-nums;
}
/* \u5931\u8D25\u6807\u7EA2\uFF1A\u7EDF\u4E00\u7531 data-ursim-invalid \u9A71\u52A8\uFF0C\u4E0B\u4E00\u5E27\u6210\u529F\u81EA\u52A8\u6D88\u5931\u3002 */
.ursim-twin-ctl-pose-input[data-ursim-invalid='true'],
.ursim-twin-ctl-joint-range[data-ursim-invalid='true'] {
  border-color: var(--ursim-danger);
  color: var(--ursim-danger);
}
.ursim-twin-ctl-joint-range[data-ursim-invalid='true'] {
  outline: 1px solid var(--ursim-danger);
  outline-offset: 1px;
}
.ursim-twin-ctl-joint-value[data-ursim-invalid='true'] { color: var(--ursim-danger); }
/*
 * \u957F\u6309\u70B9\u52A8\u7684"\u901F\u5EA6\u6D41"\u6A21\u5F0F\uFF08P2\uFF09\u3002
 *
 * data-ursim-jog-mode \u7531 twin-controls.js \u5728\u957F\u6309 250 ms \u540E\u4ECE step \u5207\u5230 velocity \u2014\u2014 \u90A3\u662F\u552F\u4E00
 * \u8BF4\u660E"\u73B0\u5728\u4E0D\u662F\u4E00\u6B65\u4E00\u52A8\uFF0C\u800C\u662F\u5728\u6301\u7EED\u5F80\u4E0B\u53D1\u901F\u5EA6"\u7684\u4FE1\u53F7\u3002\u4EE5\u524D\u53EA\u5199\u5C5E\u6027\u3001\u6CA1\u6709\u4EFB\u4F55\u6837\u5F0F\uFF1A\u624B\u6307\u6309\u7740
 * \u7684\u65F6\u5019\u754C\u9762\u6BEB\u65E0\u53D8\u5316\uFF0C\u7528\u6237\u65E0\u4ECE\u5224\u65AD\u677E\u624B\u4F1A\u4E0D\u4F1A\u7ACB\u523B\u505C\u3002\u8FD9\u91CC\u7ED9\u70B9\u52A8\u677F\u63CF\u8FB9 + \u6309\u94AE\u53D8\u8272\uFF0C\u8BA9"\u6B63\u5728\u8FDE\u7EED
 * \u8FD0\u52A8"\u5728\u4F59\u5149\u91CC\u4E5F\u770B\u5F97\u89C1\uFF08\u677E\u624B\u5373\u56DE step\uFF0C\u63CF\u8FB9\u968F\u4E4B\u6D88\u5931\uFF09\u3002
 */
[data-ursim-jog-mode='velocity'] .ursim-twin-ctl-pad {
  border-radius: 6px;
  box-shadow: 0 0 0 2px var(--ursim-warn);
}
[data-ursim-jog-mode='velocity'] .ursim-twin-ctl-button {
  border-color: var(--ursim-warn);
}
/*
 * \u7A84\u9762\u677F\uFF08P2 \u5BB9\u9519\uFF09\u3002
 *
 * \u5355\u6761\u8F68\u56FA\u5B9A 600px\u3001\u4E2D\u95F4 3D \u5217\u6700\u5C11 280px\uFF0C\u56E0\u6B64\u9762\u677F\u5BBD\u5EA6\u4E0D\u8DB3 \u2248 880px \u65F6\u6574\u6761\u8F68\u4F1A\u6389\u51FA\u53EF\u89C6\u533A\u3002
 * \u8FD9\u91CC\u4E0D\u6539\u5217\u5BBD\uFF08inline \u7684 grid-template-columns \u7531 stageColumns() \u62FC\u51FA\uFF0C\u6D4B\u8BD5\u6309\u5B83\u65AD\u8A00\uFF0C
 * \u585E\u8FDB\u6837\u5F0F\u4F1A\u8BA9"\u5217\u5BBD"\u51FA\u73B0\u4E24\u4E2A\u771F\u6E90\uFF09\uFF0C\u800C\u662F\u5141\u8BB8\u6A2A\u5411\u6EDA\u52A8\uFF1A\u63A7\u4EF6\u8FD8\u5728\uFF0C\u53EA\u662F\u8981\u5212\u4E00\u4E0B\u3002
 */
@container (max-width: 999px) {
  .ursim-twin-stage { overflow-x: auto; }
}
`.trim();function am(i=globalThis.document){if(!i||typeof i.createElement!="function")return null;let e=typeof i.getElementById=="function"?i.getElementById(om):null;if(e)return e;let t=i.createElement("style");return t.id=om,typeof t.setAttribute=="function"&&t.setAttribute(IS,""),t.textContent=PS,(i.head??i.documentElement??i.body??null)?.appendChild?.(t),t}var Ue=Es(),LS=600,DS=24,NS=280,um="dsh-nonead-ursim.rails";function US(i){return i===!0?DS:LS}function Eh(i){return`minmax(${NS}px, 1fr) ${US(i?.right===!0)}px`}function FS(i){let e={right:!1},t=null;try{t=i?.getItem?.(um)??null}catch{return e}if(typeof t!="string"||t==="")return e;let n=null;try{n=JSON.parse(t)}catch{return e}return!n||typeof n!="object"?e:{right:n.right===!0}}function OS(i,e){let t={right:e?.right===!0};try{return i?.setItem?.(um,JSON.stringify(t)),t}catch{return null}}function hm(i,e,t={}){let n=typeof t.onChange=="function"?t.onChange:null,s=i.createElement("div");s.className="ursim-twin-rail",s.setAttribute("data-ursim-twin-rail","right");let r=i.createElement("button");r.setAttribute("type","button"),r.className="ursim-twin-rail-toggle",r.setAttribute("data-ursim-twin-rail-toggle","right");let o=i.createElement("div");o.className="ursim-twin-rail-body",o.setAttribute("data-ursim-twin-rail-body","right"),s.appendChild(r),s.appendChild(o);let a=!1;function c(){s.setAttribute("data-collapsed",a?"true":"false"),r.setAttribute("aria-expanded",a?"false":"true"),r.textContent=a?"\u2039":"\u203A";let u=a?"\u5C55\u5F00\u63A7\u5236\u8F68":"\u6536\u8D77\u63A7\u5236\u8F68";r.setAttribute("title",u),r.setAttribute("aria-label",u)}function l(u,h={}){let d=u===!0;return d===a||(a=d,c(),h.persist!==!1&&OS(e,{right:a}),n?.(a)),a}return r.addEventListener("click",()=>{l(!a)}),a=FS(e).right===!0,c(),{rail:s,toggle:r,body:o,setCollapsed:l,isCollapsed:()=>a}}function BS(i,e){let t=i?.createElement?.("div")??null;return t?(t.className="ursim-twin-rail-body",t.setAttribute("data-ursim-twin-rail-body","right"),t.__deps=e??{},t):null}function Zl(){let i=null,e=new Set,t=()=>{for(let n of[...e])try{n(i!==null)}catch{}};return{tryAcquire(n){return i!==null?!1:(i=n,t(),!0)},release(n){i===n&&(i=null,t())},isHeld:()=>i!==null,subscribe(n){return typeof n!="function"?()=>{}:(e.add(n),()=>e.delete(n))}}}var zS=250,kS=100,HS=400,VS=.025,GS=15,WS=GS*Math.PI/180,XS=Object.freeze([1,5,10]),YS=Object.freeze([1,2,5]),qS=5,$S=1;function jS(i,e,t){return{mode:"cartesian",axis:i,distance:e,frame:t==="base"?"base":"tool"}}function JS(i,e,t){return{mode:"rotate",axis:i,deltaRad:e*Math.PI/180,frame:t==="base"?"base":"tool"}}var Ro=Object.freeze({"cartesian-x-plus":{mode:"cartesian",axis:"x",sign:1,label:"X+"},"cartesian-x-minus":{mode:"cartesian",axis:"x",sign:-1,label:"X\u2212"},"cartesian-y-plus":{mode:"cartesian",axis:"y",sign:1,label:"Y+"},"cartesian-y-minus":{mode:"cartesian",axis:"y",sign:-1,label:"Y\u2212"},"cartesian-z-plus":{mode:"cartesian",axis:"z",sign:1,label:"Z+"},"cartesian-z-minus":{mode:"cartesian",axis:"z",sign:-1,label:"Z\u2212"},"rotate-rx-plus":{mode:"rotate",axis:"rx",sign:1,label:"RX+"},"rotate-rx-minus":{mode:"rotate",axis:"rx",sign:-1,label:"RX\u2212"},"rotate-ry-plus":{mode:"rotate",axis:"ry",sign:1,label:"RY+"},"rotate-ry-minus":{mode:"rotate",axis:"ry",sign:-1,label:"RY\u2212"},"rotate-rz-plus":{mode:"rotate",axis:"rz",sign:1,label:"RZ+"},"rotate-rz-minus":{mode:"rotate",axis:"rz",sign:-1,label:"RZ\u2212"},home:{mode:"home",label:Ue.controlsHome}});function at(i,e,t,n,s){let r=i.createElement(e);return t&&(r.className=t),n&&r.setAttribute(n,s===void 0?"":String(s)),r}function Kl(i,e,t,n,s){let r=at(i,"button",e,n,s);return r.setAttribute("type","button"),r.textContent=t,r}function yh(i,e,t,n,s,r){let o=at(i,"div","ursim-twin-ctl-seg");o.setAttribute("role","group"),o.setAttribute("aria-label",e);let a=[],c=s,l=u=>{c=u;for(let h of a)h.button.setAttribute("aria-pressed",h.value===c?"true":"false")};for(let u of n){let h=Kl(i,"ursim-twin-ctl-seg-button",u.text,t,u.value);u.title&&h.setAttribute("title",u.title),h.addEventListener("click",()=>{h.disabled!==!0&&(l(u.value),r?.(u.value))}),o.appendChild(h),a.push({button:h,value:u.value})}return l(c),{wrap:o,buttons:a,setActive:l}}function KS(i,e={}){let t={...e},n=typeof t.send=="function"?t.send:null,s=typeof t.setTimeout=="function"?t.setTimeout:globalThis.setTimeout,r=typeof t.clearTimeout=="function"?t.clearTimeout:globalThis.clearTimeout,o=t.lock??Zl(),a=t.host??null,c=!1,l=qS,u=$S,h="tool",d=!1,f=null,g=!1,x=null,m=null,p=null,w=null,T=[],v=(P,G,V)=>{P.addEventListener(G,V),T.push(()=>P.removeEventListener?.(G,V))},E=i?.defaultView??null,A=[],R=(P,G,V,de)=>{!P||typeof P.addEventListener!="function"||(P.addEventListener(G,V,de),A.push(()=>P.removeEventListener?.(G,V,de)))},L=[],b=[],_=at(i,"div","ursim-twin-ctl-section","data-ursim-ctl-section","position"),C=at(i,"div","ursim-twin-ctl-label");C.textContent=Ue.controlsTcpPosition,_.appendChild(C);let F=at(i,"div","ursim-twin-ctl-pad","data-ursim-ctl-pad","position");_.appendChild(F);for(let P of[null,"cartesian-y-plus",null,"cartesian-x-minus","home","cartesian-x-plus",null,"cartesian-y-minus",null]){if(P===null){let G=at(i,"span","ursim-twin-ctl-cell");G.setAttribute("aria-hidden","true"),F.appendChild(G);continue}F.appendChild(_e(P))}let X=at(i,"div","ursim-twin-ctl-row","data-ursim-ctl-row","z");X.appendChild(_e("cartesian-z-plus")),X.appendChild(_e("cartesian-z-minus")),_.appendChild(X);let q=at(i,"div","ursim-twin-ctl-section","data-ursim-ctl-section","orientation"),J=at(i,"div","ursim-twin-ctl-label");J.textContent=Ue.controlsTcpOrientation,q.appendChild(J);let W=at(i,"div","ursim-twin-ctl-pad","data-ursim-ctl-pad","orientation");q.appendChild(W);for(let P of[null,"rotate-rx-plus",null,"rotate-ry-minus",null,"rotate-ry-plus",null,"rotate-rx-minus",null]){if(P===null){let G=at(i,"span","ursim-twin-ctl-cell");G.setAttribute("aria-hidden","true"),W.appendChild(G);continue}W.appendChild(_e(P))}let Z=at(i,"div","ursim-twin-ctl-row","data-ursim-ctl-row","rz");Z.appendChild(_e("rotate-rz-plus")),Z.appendChild(_e("rotate-rz-minus")),q.appendChild(Z);let $=at(i,"div","ursim-twin-ctl-section","data-ursim-ctl-section","steps"),ne=at(i,"div","ursim-twin-ctl-steps"),ce=at(i,"div","ursim-twin-ctl-stepcol"),Re=at(i,"div","ursim-twin-ctl-label");Re.textContent=Ue.controlsStepMm,ce.appendChild(Re);let He=yh(i,Ue.controlsStepMm,"data-ursim-step-mm",XS.map(P=>({value:String(P),text:String(P),title:Ue.controlsStepMmOptionTitle(P)})),String(l),P=>{l=Number(P),Fe()});He.wrap.setAttribute("data-ursim-ctl-seg","step-mm"),b.push(...He.buttons.map(P=>P.button)),ce.appendChild(He.wrap),ne.appendChild(ce);let it=at(i,"div","ursim-twin-ctl-stepcol"),et=at(i,"div","ursim-twin-ctl-label");et.textContent=Ue.controlsStepDeg,it.appendChild(et);let $e=yh(i,Ue.controlsStepDeg,"data-ursim-step-deg",YS.map(P=>({value:String(P),text:String(P),title:Ue.controlsStepDegOptionTitle(P)})),String(u),P=>{u=Number(P),Fe()});$e.wrap.setAttribute("data-ursim-ctl-seg","step-deg"),b.push(...$e.buttons.map(P=>P.button)),it.appendChild($e.wrap),ne.appendChild(it),$.appendChild(ne);let K=yh(i,Ue.controlsFrameTitle,"data-ursim-frame",[{value:"tool",text:Ue.controlsFrameTool,title:Ue.controlsFrameOptionTitle(Ue.controlsFrameTool)},{value:"base",text:Ue.controlsFrameBase,title:Ue.controlsFrameOptionTitle(Ue.controlsFrameBase)}],h,P=>{h=P,Fe()});K.wrap.setAttribute("data-ursim-ctl-seg","frame"),b.push(...K.buttons.map(P=>P.button));let ee=at(i,"div","ursim-twin-ctl-jog","data-ursim-ctl-row","jog");ee.appendChild(_),ee.appendChild(q);function _e(P){let G=Ro[P],V=Kl(i,"ursim-twin-ctl-button",G?.label??P,"data-ursim-jog",P);return V.disabled=!0,v(V,"pointerdown",de=>{de?.preventDefault?.(),tt()&&Q();try{V.setPointerCapture?.(de?.pointerId),p={button:V,id:de?.pointerId}}catch{p=null}Ve(P)}),v(V,"pointerup",O),v(V,"pointerleave",O),v(V,"pointercancel",O),v(V,"lostpointercapture",O),L.push({button:V,key:P}),V}function Fe(){let P=h==="base"?Ue.controlsFrameBase:Ue.controlsFrameTool;for(let{button:G,key:V}of L){let de=Ro[V];if(!de)continue;if(de.mode==="home"){G.setAttribute("title",Ue.controlsHomeTitle);continue}let ae=String(de.axis).toUpperCase();G.setAttribute("title",de.mode==="cartesian"?Ue.controlsJogPositionTitle(P,ae,de.sign,l):Ue.controlsJogRotateTitle(P,ae,de.sign,u))}}function we(P){let G=Ro[P];return G?G.mode==="home"?{mode:"home"}:G.mode==="cartesian"?jS(G.axis,l*G.sign/1e3,h):JS(G.axis,u*G.sign,h):null}function Ve(P){c||!d||n===null||I(we(P))&&(g=!0,x=P,ye("step"),Ro[P]?.mode!=="home"&&st(P))}function bt(P){let G=Ro[P];if(!G||G.mode==="home")return null;let V=[0,0,0,0,0,0];if(G.mode==="cartesian"){let de=G.axis==="x"?0:G.axis==="y"?1:2;V[de]=G.sign*VS}else{let de=G.axis==="rx"?3:G.axis==="ry"?4:5;V[de]=G.sign*WS}return{mode:"velocity",twist:V,frame:h==="base"?"base":"tool",ttlMs:HS}}function I(P){if(c||!P||n===null||!d||!o.tryAcquire("jog"))return!1;let G=()=>{o.release("jog"),c||be()},V;try{V=n(P)}catch{return G(),!1}return V!==null&&typeof V?.then=="function"?V.then(G,G):G(),be(),!0}function st(P){x=P,pe(),f=s(()=>{f=null,!(c||!g)&&(ye("velocity"),ke())},zS)}function ke(){if(c||!g)return;let P=bt(x);d&&P!==null&&I(P),f=s(ke,kS)}function pe(){f!==null&&(typeof r=="function"&&r(f),f=null)}function ye(P){P!==m&&(m=P,ee.setAttribute("data-ursim-jog-mode",P),a&&a!==ee&&a.setAttribute("data-ursim-jog-mode",P))}function tt(){let P=g;g=!1,x=null,pe();let G=p;if(p=null,G)try{G.button.hasPointerCapture?.(G.id)===!0&&G.button.releasePointerCapture(G.id)}catch{}return ye("step"),P}function O(){tt()&&Q()}function Q(){if(n===null)return;let P=V=>{ee.setAttribute("data-ursim-stop-failed","true"),t.reportError?.(Ue.controlsStopFailed(V instanceof Error?V.message:String(V)))},G;try{G=n({mode:"stop"})}catch(V){P(V);return}G!==null&&typeof G?.then=="function"?G.then(()=>{ee.removeAttribute?.("data-ursim-stop-failed")},P):ee.removeAttribute?.("data-ursim-stop-failed")}R(E,"blur",()=>O()),R(E,"pointerup",()=>O(),!0),R(E,"visibilitychange",()=>{i?.visibilityState==="hidden"&&O()});function be(){let P=o.isHeld(),G=`${d?"1":"0"}${P?"1":"0"}`;if(G!==w){w=G;for(let V of L)V.button.disabled=!d,V.button.setAttribute("aria-disabled",P?"true":"false");for(let V of b)V.disabled=!d;ee.setAttribute("data-ursim-ctl-state",d?P?"busy":"ready":"disabled")}}function Ie(P){return!(n===null||P?.connected!==!0||P?.feedStale===!0||P?.simulated!==!0)}function S(P){if(c)return;let G=Ie(P);G!==d&&(d=G,d||O(),be())}function y(){if(!c){c=!0,O();for(let P of T)try{P()}catch{}T.length=0;for(let P of A)try{P()}catch{}A.length=0}}let H=o.subscribe(()=>be());return ye("step"),Fe(),be(),{row:ee,steps:$,frameSeg:K.wrap,sync:S,dispose(){H(),y()}}}var vh=Object.freeze(["x","y","z","rx","ry","rz"]),ZS=Object.freeze({x:0,y:1,z:2,rx:3,ry:4,rz:5}),Mh=-360,Th=360;function wh(i){return i==="x"||i==="y"||i==="z"}function lm(i){return Array.isArray(i)&&i.length===6&&i.every(Number.isFinite)}function bh(i){let e=Number(i);return Number.isFinite(e)?Math.min(Th,Math.max(Mh,e)):0}function cm(i,e){return wh(i)?(e*1e3).toFixed(1):Number(e).toFixed(3)}var QS=/^-?\d+(\.\d+)?$/;function eM(i){let e=String(i??"").trim();if(e===""||!QS.test(e))return null;let t=Number(e);return Number.isFinite(t)?t:null}function Sh(i){let e=Number(i);return Number.isFinite(e)?String(Number(e.toFixed(3))).replace(/^-/,"\u2212"):"\u2014"}function dm(i,e,t={}){let n=e??BS(i,t);if(!n)return{body:null,deps:t,sync(){},dispose(){}};n.setAttribute("data-ursim-twin-rail-body","right");let s={...n.__deps??{},...t};n.__deps=s;let r=typeof s.send=="function"?s.send:null,o=typeof s.previewJoints=="function"?s.previewJoints:null,a=s.lock??Zl(),c=!1,l=!1,u=null,h=null,d=null,f=null,g=null,x=null,m=new Set,p=new Set,w=[],T=(O,Q,be)=>{O.addEventListener(Q,be),w.push(()=>O.removeEventListener?.(Q,be))},v=at(i,"div","ursim-twin-ctl-note","data-ursim-ctl-note");n.appendChild(v);let E=at(i,"div","ursim-twin-ctl-error","data-ursim-ctl-error");n.appendChild(E);let A=at(i,"div","ursim-twin-ctl-summary","data-ursim-ctl-summary");A.setAttribute("role","status"),A.setAttribute("title",Ue.controlsSummaryTitle),A.textContent="",n.appendChild(A);let R=Object.create(null),L=[],b=at(i,"div","ursim-twin-ctl-section","data-ursim-ctl-section","pose"),_=at(i,"div","ursim-twin-ctl-label");_.textContent=Ue.controlsToolPosition,_.setAttribute("title",Ue.controlsToolPositionTitle),b.appendChild(_);let C=at(i,"div","ursim-twin-ctl-pose","data-ursim-ctl-grid","pose");for(let O of vh){let Q={axis:O,index:ZS[O],input:null,editing:!1,lastSent:null,skipChange:!1},be=at(i,"div","ursim-twin-ctl-pose-cell","data-ursim-pose-cell",O),Ie=at(i,"span","ursim-twin-ctl-pose-label");Ie.textContent=O.toUpperCase();let S=i.createElement("input");S.setAttribute("type","text"),S.className="ursim-twin-ctl-pose-input",S.setAttribute("inputmode","decimal"),S.setAttribute("data-ursim-pose",O),S.setAttribute("aria-label",`${O.toUpperCase()} (${wh(O)?"mm":"rad"})`),S.setAttribute("title",Ue.controlsToolPositionTitle),S.setAttribute("placeholder",Ue.controlsNoPoseData),S.value="",S.disabled=!0,Q.input=S,R[O]=Q,be.appendChild(Ie),be.appendChild(S),C.appendChild(be),T(S,"keydown",y=>{y?.key==="Enter"&&(y?.preventDefault?.(),Q.skipChange=$e(O)!==!1)}),T(S,"change",()=>{if(Q.skipChange){Q.skipChange=!1;return}$e(O)}),T(S,"input",()=>{Q.editing=!0,Q.lastSent=null,Q.skipChange=!1,bt(S)}),T(S,"focus",()=>{Q.editing=!0}),T(S,"blur",()=>{Q.editing=!1})}b.appendChild(C);let F=KS(i,{...s,lock:a,host:e}),X=at(i,"div","ursim-twin-ctl-frame","data-ursim-ctl-frame","frame"),q=at(i,"div","ursim-twin-ctl-label");q.textContent=Ue.controlsFrameTitle,X.appendChild(q),F.frameSeg&&X.appendChild(F.frameSeg);let J=at(i,"div","ursim-twin-ctl-main"),W=at(i,"div","ursim-twin-ctl-primary"),Z=at(i,"div","ursim-twin-ctl-side");W.appendChild(b),F.row&&W.appendChild(F.row),Z.appendChild(X),F.steps&&Z.appendChild(F.steps),J.appendChild(W),J.appendChild(Z),n.appendChild(J);let $=at(i,"div","ursim-twin-ctl-section","data-ursim-ctl-section","joints"),ne=at(i,"div","ursim-twin-ctl-label");ne.textContent=Ue.controlsJoints,ne.setAttribute("title",Ue.controlsJointsTitle),$.appendChild(ne);let ce=[Ue.controlsJointBase,Ue.controlsJointShoulder,Ue.controlsJointElbow,Ue.controlsJointWrist1,Ue.controlsJointWrist2,Ue.controlsJointWrist3];for(let O=0;O<6;O+=1){let Q=at(i,"div","ursim-twin-ctl-joint-row","data-ursim-joint-row",O),be=at(i,"span","ursim-twin-ctl-joint-name");be.textContent=ce[O],be.setAttribute("title",ce[O]);let Ie=Kl(i,"ursim-twin-ctl-step","\u25C0","data-ursim-joint-dec",O);Ie.setAttribute("aria-label",`${ce[O]} \u22121\xB0`),Ie.setAttribute("title",Ue.controlsJointStepTitle(ce[O],-1));let S=i.createElement("input");S.setAttribute("type","range"),S.className="ursim-twin-ctl-joint-range",S.setAttribute("data-ursim-joint",O),S.setAttribute("aria-label",`${ce[O]} (\xB0)`),S.setAttribute("title",Ue.controlsJointsTitle),S.setAttribute("min",String(Mh)),S.setAttribute("max",String(Th)),S.setAttribute("step","1"),S.min=String(Mh),S.max=String(Th),S.step="1",S.value="0",S.disabled=!0;let y=Kl(i,"ursim-twin-ctl-step","\u25B6","data-ursim-joint-inc",O);y.setAttribute("aria-label",`${ce[O]} +1\xB0`),y.setAttribute("title",Ue.controlsJointStepTitle(ce[O],1));let H=at(i,"span","ursim-twin-ctl-joint-value","data-ursim-joint-value",O);H.textContent="",Q.appendChild(be),Q.appendChild(Ie),Q.appendChild(S),Q.appendChild(y),Q.appendChild(H),$.appendChild(Q),L[O]={row:Q,name:be,dec:Ie,slider:S,inc:y,value:H},T(S,"input",()=>{if(c)return;let P=Number(S.value);if(Number.isFinite(P)&&(m.add(O),bt(S),H.textContent=Ue.controlsJointValue(P),u!==null&&o!==null)){let G=u.slice();G[O]=P*Math.PI/180,Re(G)}}),T(S,"change",()=>{if(m.delete(O),c)return;let P=bh(Number(S.value));if(!l||a.isHeld()||r===null||u===null){we(O),He(),E.textContent=et(u===null?Ue.controlsNoPoseData:Ue.controlsRejectedCommand);return}let G=u.slice();G[O]=P*Math.PI/180,E.textContent="",K({mode:"joint",q:G},{onFail:()=>{we(O),Ve(S)},onOk:()=>{bt(S)},onSettled:He})||He()}),T(y,"click",()=>it(O,1)),T(Ie,"click",()=>it(O,-1))}n.appendChild($);function Re(O){if(o!==null)try{o(O)}catch{}}function He(){if(o!==null)try{o(null)}catch{}}function it(O,Q){if(c||!l||a.isHeld()||r===null||u===null){c||(E.textContent=et(u===null?Ue.controlsNoPoseData:Ue.controlsRejectedCommand));return}let be=L[O];if(!be)return;let Ie=u.slice();Ie[O]+=Q*Math.PI/180,E.textContent="",K({mode:"joint",q:Ie},{onFail:()=>Ve(be.slider)})}function et(O){return a.isHeld()?Ue.controlsBusyRetry:g!==null&&g!==""?g:O}function $e(O){let Q=R[O];if(!Q)return!1;Q.editing=!1;let be=Q.input;if(c||!l||a.isHeld()||r===null)return c||(E.textContent=et(Ue.controlsRejectedCommand),Ve(be),Q.editing=!0),!0;let Ie=String(be.value??"").trim(),S=eM(Ie);if(S===null)return Fe(O),Ve(be),E.textContent=Ue.controlsInvalidRollback,!0;if(Q.lastSent===be.value)return!0;if(h===null)return E.textContent=Ue.controlsNoPoseData,!0;let y=h.slice();return y[Q.index]=wh(O)?S/1e3:S,E.textContent="",K({mode:"pose",pose:y},{onFail:()=>{Fe(O),Ve(be)},onOk:()=>{Q.lastSent=be.value,bt(be)}})||(E.textContent=et(Ue.controlsRejectedCommand)),!0}function K(O,Q={}){if(c||!O||r===null||!l||!a.tryAcquire("rail"))return!1;let be=S=>{a.release("rail"),_e(S,Q)},Ie;try{Ie=r(O)}catch(S){return be(S),!1}return Ie!==null&&typeof Ie?.then=="function"?Ie.then(S=>be(ee(S)),S=>be(S)):be(ee(Ie)),st(),!0}function ee(O){if(O===null||typeof O!="object"||O.ok!==!1)return null;let Q=O.error===void 0||O.error===null?"":String(O.error);return new Error(Q===""?Ue.controlsRejectedCommand:Q)}function _e(O,Q){c||(O?(E.textContent=Ue.controlsCommandFailed(O instanceof Error?O.message:String(O)),Q?.onFail?.(),f=d):Q?.onOk?.(),Q?.onSettled?.(),st())}function Fe(O){let Q=R[O];Q&&(Q.lastSent=null,h!==null&&(Q.input.value=cm(O,h[Q.index])))}function we(O){let Q=L[O];if(!Q||u===null)return;let be=u[O]*180/Math.PI;Q.slider.value=String(bh(Math.round(be))),Q.value.textContent=Ue.controlsJointValue(be)}function Ve(O){O&&(O.setAttribute("data-ursim-invalid","true"),O.setAttribute("aria-invalid","true"),p.add(O),f=d)}function bt(O){!O||!p.has(O)||(O.removeAttribute("data-ursim-invalid"),O.removeAttribute("aria-invalid"),p.delete(O))}function I(){for(let O of[...p])bt(O);f=null}function st(){let O=a.isHeld(),Q=`${l?"1":"0"}${O?"1":"0"}`;if(Q===x)return;x=Q;let be=!l||O;for(let Ie of vh)R[Ie].input.disabled=be;for(let Ie of L)Ie.slider.disabled=be,Ie.inc.disabled=be,Ie.dec.disabled=be;n.setAttribute("data-ursim-ctl-state",l?O?"busy":"ready":"disabled")}function ke(O){return r===null||O?.connected!==!0?Ue.controlsDisabledDisconnected:O?.feedStale===!0?Ue.controlsDisabledStale:O?.simulated!==!0?Ue.controlsDisabledSimOnly:""}function pe(O){if(c)return;F.sync(O);let Q=ke(O),be=Q==="";be!==l&&(l=be,l||(m.clear(),He()),st()),Q!==g&&(g=Q,v.textContent=Q),lm(O?.q)&&(u=O.q.slice()),lm(O?.tcp)&&(h=O.tcp.slice(),A.textContent=Ue.controlsSummary(Sh(h[0]),Sh(h[1]),Sh(h[2])));let Ie=Number.isFinite(O?.ts)?O.ts:null;if(Ie!==null&&(d=Ie),p.size>0&&(f===null||Ie!==null&&Ie!==f)&&I(),h!==null)for(let S of vh){let y=R[S];y.editing||(y.input.value=cm(S,h[y.index]))}if(u!==null)for(let S=0;S<6;S+=1){if(m.has(S))continue;let y=L[S],H=u[S]*180/Math.PI;y.slider.value=String(bh(Math.round(H))),y.value.textContent=Ue.controlsJointValue(H)}}function ye(){if(!c){c=!0,tt(),F.dispose(),He(),m.clear(),p.clear(),a.release("rail");for(let O of w)try{O()}catch{}w.length=0}}let tt=a.subscribe(()=>st());return st(),{body:n,deps:s,sync:pe,dispose:ye}}var mm="data-ds-dark-theme",tM="--dsw-alias-bg-base",fm="light",pm="dark";function nM(i){try{return i?.matchMedia?.("(prefers-color-scheme: dark)")?.matches===!0}catch{return!1}}function iM(i,e){if(typeof e?.getComputedStyle!="function")return!1;for(let t of[i?.body,i?.documentElement])if(t)try{let n=e.getComputedStyle(t)?.getPropertyValue?.(tM);if(typeof n=="string"&&n.trim()!=="")return!0}catch{}return!1}function Ah(i={}){let e=i.document??globalThis.document,t=i.window??globalThis;return e?.body?.hasAttribute?.(mm)?pm:iM(e,t)?fm:nM(t)?pm:fm}function gm(i,e={}){let t=e.document??globalThis.document,n=e.window??globalThis,s=[],r=()=>{let l;try{l=Ah({document:t,window:n})}catch{return}try{i?.(l)}catch{}},o=t?.body,a=n?.MutationObserver??globalThis.MutationObserver;if(o&&typeof a=="function"){let l=new a(r);l.observe(o,{attributes:!0,attributeFilter:[mm]}),s.push(()=>l.disconnect?.())}let c=null;try{c=n?.matchMedia?.("(prefers-color-scheme: dark)")??null}catch{c=null}return c&&typeof c.addEventListener=="function"&&(c.addEventListener("change",r),s.push(()=>c.removeEventListener?.("change",r))),()=>{for(;s.length>0;){let l=s.pop();try{l()}catch{}}}}function _m(i){let e=n=>String(n).padStart(2,"0"),t=i instanceof Date&&!Number.isNaN(i.getTime())?i:new Date(0);return`${t.getFullYear()}-${e(t.getMonth()+1)}-${e(t.getDate())} ${e(t.getHours())}:${e(t.getMinutes())}:${e(t.getSeconds())}`}function Rh(i,e){let n=(typeof i?.model=="string"&&i.model.trim()!==""?i.model.trim():"robot").replace(/[^A-Za-z0-9._-]+/gu,"-"),s=_m(e).replace(/[: ]/gu,"-");return`ursim-twin-${n}-${s}.png`}function sM(i,e){let t=[],n=typeof i?.model=="string"&&i.model!==""?i.model:"\u672A\u77E5\u578B\u53F7",s=typeof i?.ip=="string"&&i.ip!==""?i.ip:"\u672A\u6307\u5B9A IP";t.push(`${n}  \xB7  ${s}`),i?.simulated===!0&&t.push("\u79BB\u7EBF\u4EFF\u771F\uFF08\u975E\u771F\u673A\uFF09");let r=i?.detail;if(r!==null&&typeof r=="object"){let c=[];typeof r.safety_mode=="string"&&r.safety_mode!==""&&c.push(`\u5B89\u5168 ${r.safety_mode}`),typeof r.robot_mode=="string"&&r.robot_mode!==""&&c.push(`\u6A21\u5F0F ${r.robot_mode}`),Number.isFinite(r.speed_scaling)&&c.push(`\u500D\u7387 ${(r.speed_scaling*100).toFixed(0)}%`),c.length>0&&t.push(c.join("  \xB7  "))}let o=i?.q;Array.isArray(o)&&o.length>=6&&o.every(Number.isFinite)&&t.push(o.map((c,l)=>`J${l+1} ${(c*180/Math.PI).toFixed(1)}\xB0`).join("  "));let a=i?.tcp;return Array.isArray(a)&&a.length>=3&&a.slice(0,3).every(Number.isFinite)&&t.push(`TCP [${a[0].toFixed(3)}, ${a[1].toFixed(3)}, ${a[2].toFixed(3)}] m`),t.push(_m(e)),t}function rM(i,e,t){if(i==null||!Array.isArray(e)||e.length===0)return;let n=Number.isFinite(t?.padding)?t.padding:16,s=Number.isFinite(t?.lineHeight)?t.lineHeight:22,r=Number.isFinite(t?.height)?t.height:0,o=Number.isFinite(t?.width)?t.width:0;i.save?.(),i.fillStyle="rgba(8, 12, 16, 0.62)";let a=e.length*s+n*.6;i.fillRect?.(0,r-a,o,a),i.font=`${Math.round(s*.6)}px sans-serif`,i.fillStyle="#e6edf3",i.textBaseline="bottom";for(let c=0;c<e.length;c++){let l=r-n-c*s;i.fillText?.(e[c],n,l)}i.restore?.()}function xm(i,e,t={}){let n=t.document??globalThis.document;if(n==null||i==null||typeof n.createElement!="function")return null;try{let s=n.createElement("canvas");s.width=i.width,s.height=i.height;let r=s.getContext?.("2d");return r==null?null:(r.drawImage(i,0,0),rM(r,sM(e,t.now??new Date),{width:s.width,height:s.height,...t.lineHeight===void 0?{}:{lineHeight:t.lineHeight},...t.padding===void 0?{}:{padding:t.padding}}),s.toDataURL("image/png"))}catch{return null}}function Ch(i,e,t={}){let n=t.document??globalThis.document;if(n==null||typeof i!="string"||i==="")return!1;try{let s=n.createElement("a");return s.href=i,s.download=e,s.rel="noopener",s.click?.(),!0}catch{return!1}}var ie=Es(),Co=600,oM=6e4,aM=100,Tm=2500,lM=1e4,cM=3e3,uM=1e4,ym="\u6570\u636E\u5DF2\u505C\u6B62\u66F4\u65B0",wm="\u6570\u636E\u901A\u9053\u91CD\u8FDE\u4E2D\u2026",vm=0,hM=400;var dM="\u672A\u8FDE\u63A5\u673A\u5668\u4EBA",fM="\u5DF2\u8FDE\u63A5 \xB7 \u6B63\u5728\u52A0\u8F7D\u6A21\u578B\u2026",Io="\u5DF2\u8FDE\u63A5",pM="\uFF08\u65E0\u5185\u7F6E\u6A21\u578B\uFF0C\u4F7F\u7528\u8FD1\u4F3C\u51E0\u4F55\u4F53\uFF09",mM="\u6E32\u67D3\u5F02\u5E38\uFF1A",gM=5e3,_M="\u6A21\u578B\u52A0\u8F7D\u5931\u8D25\uFF1A",xM="\u5F53\u524D\u73AF\u5883\u4E0D\u652F\u6301 WebGL\uFF1A\u5DF2\u5207\u6362\u4E3A\u7EAF\u6570\u503C\u6A21\u5F0F\uFF08\u5173\u8282\u89D2\u4E0E TCP \u4ECD\u4F1A\u66F4\u65B0\uFF09",yM="\u673A\u5668\u4EBA\u672A\u8FD4\u56DE\u5B8C\u6574\u7684\u5173\u8282\u89D2",vM="3D \u4E0A\u4E0B\u6587\u4E22\u5931\uFF08GPU \u91CD\u7F6E\uFF09\u2014\u2014 \u6536\u8D77\u5E76\u91CD\u65B0\u5C55\u5F00\u9762\u677F\u53EF\u6062\u590D",bM="\u673A\u5668\u4EBA\u53EF\u80FD\u5DF2\u505C\u6B62\uFF0C\u8BF7\u68C0\u67E5\u793A\u6559\u5668";function SM(i,e,t){switch(i){case"no_robot":return ie.disconnectNeverConnected;case"robot_not_connected":return ie.disconnectReason(e);case"ambiguous_robot":return ie.disconnectAmbiguous(ie.disconnectCandidates(t));case"worker_unavailable":return ie.disconnectWorkerDown(e);case"robot_error":return ie.disconnectReadFailed(e);default:return e?ie.disconnectReason(e):ie.statusDisconnected}}var Em=Sp,MM="ur3",TM=Math.max(0,...Object.values(Em).map(i=>Jl(i?.links)??0));function Ql(i){let e=Em??{},t=String(i??"").trim().toLowerCase();return e[t]??e[MM]??Object.values(e)[0]??null}function bm(i){let e=[];for(let t=0;t<6;t++){let n=i?.[t],s=Number.isFinite(n)?n*180/Math.PI:null;e.push(`J${t+1} ${s===null?"--":s.toFixed(1)}`)}return`${ie.jointsPrefix}  ${e.join("  ")}`}function wM(i,e){if(i==null||e==null)return[];let t=[],n=Math.min(i.length??0,e.length??0);for(let s=0;s<n;s++){let r=e[s],o=i[s];if(!Array.isArray(r)||!Number.isFinite(o))continue;let[a,c]=r;!Number.isFinite(a)||!Number.isFinite(c)||a>c||(o<a||o>c)&&t.push(s+1)}return t}function EM(i){let t=["x","y","z","rx","ry","rz"].map((n,s)=>{let r=i?.[s];return Number.isFinite(r)?`${n} ${r.toFixed(s<3?4:3)}`:`${n} --`});return`${ie.tcpPrefix}  ${t.join("  ")}`}var AM=ie.safetyMode,RM=ie.robotMode,CM=ie.programState,IM="<\u67E5\u8BE2\u5931\u8D25>";function Ph(i,e){let t=typeof i=="string"?i.trim():"";return t===""?"--":t===IM?ie.queryFailed:e[t]??t}function PM(i={}){let e=typeof i.status=="string"?i.status:"",t=Number.isFinite(i.frames)?i.frames:0,n=Number.isFinite(i.frameErrors)?i.frameErrors:0,s=`\uFF08\u5DF2\u6536 ${t} \u5E27${n>0?`\uFF0C\u5931\u8D25 ${n} \u5E27`:""}\uFF09`;if(e==="unsupported")return`\u5F53\u524D\u73AF\u5883\u6CA1\u6709 EventSource\uFF1A${ym}${s}`;if(e==="retrying"||e==="connecting")return`${wm}${s}`;let r=Number.isFinite(i.ageMs)?Math.max(0,i.ageMs):0;return i.feedStale===!0||r>Tm?i.connected!==!0?"":`${ym} ${(r/1e3).toFixed(1)}s \xB7 \u6B63\u5728\u91CD\u8BD5${s}`:""}var Am=i=>Ph(i,AM),LM=i=>Ph(i,RM),DM=i=>Ph(i,CM);function Ih(i){if(typeof i!="string")return!1;let e=i.trim().toUpperCase();return e===""?!1:e!=="NORMAL"&&e!=="REDUCED"}function NM(i){let e=typeof i=="number"?i:Number(i);return Number.isFinite(e)?`x${e.toFixed(2)}`:"--"}function Sm(i,e,t=0,n=""){if(!Array.isArray(i)||i.length===0)return`${e}  --`;let s=[];for(let r=0;r<i.length;r++){let o=i[r];s.push(`J${r+1} ${Number.isFinite(o)?o.toFixed(t)+n:"--"}`)}return`${e}  ${s.join("  ")}`}function UM(i){let e=i&&typeof i=="object"?i:null;if(e===null||typeof e.error=="string")return{status:e?.error?ie.detailStatusFailed(e.error):"",temps:"",power:"",currents:"",tcpSpeed:"",hazard:!1};let t=[`\u5B89\u5168 ${Am(e.safety_mode)}`,`\u6A21\u5F0F ${LM(e.robot_mode)}`,`\u7A0B\u5E8F ${DM(e.program_state)}`,`\u901F\u5EA6 ${NM(e.speed_scaling)}`];e.running===!0&&t.push(ie.detailRunning);let n=e.telemetry_estimated===!0?ie.detailEstimatedSuffix:"",s=o=>o===""||o===void 0?"":`${o}${n}`,r=FM(e.tcp_speed);return{status:t.join("  "),temps:s(Sm(e.joint_temperatures,ie.detailTempsPrefix)),power:Number.isFinite(Number(e.robot_voltage))&&Number.isFinite(Number(e.robot_current))?s(ie.detailBus(Number(e.robot_voltage).toFixed(1),Number(e.robot_current).toFixed(2))):"",currents:s(Array.isArray(e.joint_currents)?Sm(e.joint_currents,ie.detailCurrentsPrefix,2):""),tcpSpeed:s(r),hazard:Ih(e.safety_mode)}}function FM(i){if(!Array.isArray(i)||i.length<3)return"";let[e,t,n]=i.slice(0,3).map(Number);return!Number.isFinite(e)||!Number.isFinite(t)||!Number.isFinite(n)?"":ie.detailTcpSpeed(Math.hypot(e,t,n).toFixed(3))}var OM=[{key:"reset",label:ie.viewReset},{key:"iso",label:ie.viewIso},{key:"front",label:ie.viewFront},{key:"side",label:ie.viewSide},{key:"top",label:ie.viewTop}];function Mm(i,e){let t=e?.ts-i?.ts;return Number.isFinite(t)?Math.min(hM,Math.max(vm,t)):vm}function nt(i,e,t,n){let s=i.createElement(e);return t&&(s.className=t),n&&s.setAttribute(n,""),s}function Po(i,e){e&&(typeof i?.remove=="function"?i.remove(e):e.parent?.remove?.(e))}var Rm="ursim-twin-robot";function BM(i,e){if(!(!i||!Array.isArray(i.children)))for(let t of i.children.slice())!t||t===e||t.name===Rm&&Po(i,t)}function Cm({container:i,state:e,sceneFactory:t=Cp,modelLoader:n=Vp,raf:s=globalThis.requestAnimationFrame,caf:r=globalThis.cancelAnimationFrame,now:o=()=>performance.now(),request:a=globalThis.fetch,autoSim:c=!0}={}){if(!i||typeof i.appendChild!="function")throw new TypeError("mountTwinPanel: \u9700\u8981\u4E00\u4E2A\u53EF\u7528\u7684 container \u5143\u7D20");let l=i.ownerDocument??globalThis.document;if(!l||typeof l.createElement!="function")throw new TypeError("mountTwinPanel: \u9700\u8981\u53EF\u7528\u7684 DOM\uFF08container.ownerDocument \u6216 globalThis.document\uFF09");am(l);let u=!1,h=Ah({document:l,window:l.defaultView??globalThis}),d=null,f=null,g=null,x="",m="",p=0,w="",T=0,v=[],E=0,A=null,R=null,L=!1,b=null,_=null,C=null,F=null,X=!1,q=-1/0,J=null,W=null,Z=null,$=null,ne="",ce=0,Re=!1,He=!1,it=!1,et="",$e=!1,K=!1,ee=null,_e=null,Fe=-1/0,we=null,Ve=!0,bt=-1/0,I=null,st=!1,ke=l.hidden===!0,pe=nt(l,"div","ursim-twin-panel","data-ursim-twin-panel");pe.setAttribute("data-ursim-twin-connected","false");let ye=nt(l,"div","ursim-twin-view","data-ursim-twin-view"),tt=nt(l,"canvas","ursim-twin-canvas","data-ursim-twin-canvas");tt.setAttribute("role","img"),tt.setAttribute("aria-label",ie.canvasLabel),tt.setAttribute("tabindex","0"),tt.addEventListener("keydown",N=>{let B=N?.key,le=B==="ArrowUp"?"top":B==="ArrowDown"?"iso":B==="ArrowLeft"?"side":B==="ArrowRight"?"front":B==="Home"?"reset":null;le!==null&&(N.preventDefault?.(),Dh(le))}),ye.appendChild(tt);let O=nt(l,"div","ursim-twin-sim-badge","data-ursim-twin-sim-badge");O.setAttribute("title",ie.simBadgeTitle),O.textContent=ie.simBadge,O.style.display="none",ye.appendChild(O);let Q=nt(l,"div","ursim-twin-hud","data-ursim-twin-hud");Q.setAttribute("role","status"),Q.setAttribute("aria-live","polite"),Q.setAttribute("aria-label",ie.hudLabel);let be=nt(l,"div","ursim-twin-hud-row","data-ursim-twin-robots"),Ie=nt(l,"div","ursim-twin-hud-row","data-ursim-twin-pending"),S=nt(l,"div","ursim-twin-hud-row","data-ursim-twin-feed");S.style.display="none";let y=nt(l,"div","ursim-twin-hud-row","data-ursim-twin-identity"),H=nt(l,"span","ursim-twin-identity-text","data-ursim-twin-identity-text"),P=nt(l,"div","ursim-twin-hud-row","data-ursim-twin-joints"),G=nt(l,"div","ursim-twin-hud-row","data-ursim-twin-tcp"),V=nt(l,"div","ursim-twin-hud-row","data-ursim-twin-detail");P.setAttribute("aria-live","off"),G.setAttribute("aria-live","off"),V.setAttribute("aria-live","off");let de=nt(l,"div","ursim-twin-hud-row","data-ursim-twin-power"),ae=nt(l,"div","ursim-twin-hud-row","data-ursim-twin-risk-row");Q.appendChild(be),Q.appendChild(Ie),Q.appendChild(y),y.appendChild(H),y.appendChild(S);let Ae=nt(l,"div","ursim-twin-hud-row","data-ursim-twin-layers"),Ce={};for(let[N,B]of[["reach",ie.layerReach],["base",ie.layerBase],["force",ie.layerForce],["ghost",ie.layerGhost]]){let le=nt(l,"button","ursim-twin-layer-toggle",`data-ursim-twin-layer-${N}`);le.type="button",le.textContent=B,le.setAttribute("aria-pressed","false"),Ce[N]=le,le.addEventListener("click",()=>{Ye[N]=!Ye[N],le.setAttribute("aria-pressed",Ye[N]?"true":"false"),At(),N==="reach"&&Jh(),Ti()}),Ae.appendChild(le)}Q.appendChild(Ae);let re=nt(l,"button","ursim-twin-layer-toggle","data-ursim-twin-screenshot");re.type="button",re.textContent=ie.screenshot,re.setAttribute("aria-label",ie.screenshotLabel),re.addEventListener("click",()=>{Lh();let N=f?.renderer?.domElement??tt,B=xm(N,R,{document:l});B!==null&&Ch(B,Rh(R,new Date),{document:l})}),Ae.appendChild(re);let me=(N,B,le)=>{let Se=nt(l,"button","ursim-twin-layer-toggle",`data-ursim-twin-trajectory-${B}`);return Se.type="button",Se.textContent=N,Se.setAttribute("aria-pressed","false"),Se.addEventListener("click",()=>{le(Se),Ti()}),Ae.appendChild(Se),Se};me(ie.trajectoryClear,"clear",()=>{v=[],rt.setDrawRange(0,0)}),me(ie.trajectoryPause,"pause",N=>{L=!L,N.setAttribute("aria-pressed",L?"true":"false"),N.textContent=L?ie.trajectoryResume:ie.trajectoryPause}),me(ie.trajectoryExport,"export",()=>{let N=rm(v),B=`data:text/csv;charset=utf-8,${encodeURIComponent(N)}`;Ch(B,`ursim-twin-trajectory-${Rh(R,new Date).replace(/^ursim-twin-|\.png$/gu,"")}.csv`,{document:l})}),Q.appendChild(P),Q.appendChild(G),Q.appendChild(V),Q.appendChild(de),Q.appendChild(ae);let Be=nt(l,"details","ursim-twin-io","data-ursim-twin-io"),Pe=nt(l,"summary","ursim-twin-io-summary","data-ursim-twin-io-summary");Pe.textContent=ie.ioSummary;let fe=nt(l,"div","ursim-twin-io-body","data-ursim-twin-io-body"),qe=nt(l,"div","ursim-twin-io-bits","data-ursim-twin-io-bits"),U=nt(l,"div","ursim-twin-io-regs","data-ursim-twin-io-regs");fe.appendChild(qe),fe.appendChild(U),Be.appendChild(Pe),Be.appendChild(fe),Q.appendChild(Be);let ue=["int","double","bit"],he=8,Me=1e3,se=-1/0;Be.addEventListener("toggle",()=>{Be.open===!0&&(se=-1/0,Vh(!0))});let te=nt(l,"div","ursim-twin-toolbar","data-ursim-twin-toolbar");for(let N of OM){let B=nt(l,"button","ursim-twin-toolbar-button","data-ursim-twin-view-button");B.setAttribute("type","button"),B.setAttribute("data-ursim-twin-view-button",N.key),B.setAttribute("title",N.label),B.textContent=N.label,B.addEventListener("click",()=>Dh(N.key)),te.appendChild(B)}let Ee=nt(l,"div","ursim-twin-status","data-ursim-twin-status"),Xe=nt(l,"div","ursim-twin-error","data-ursim-twin-error"),ut=nt(l,"div","ursim-twin-sim","data-ursim-twin-sim-bar"),Ke=nt(l,"button","ursim-twin-sim-toggle","data-ursim-twin-sim-toggle");Ke.setAttribute("type","button"),Ke.setAttribute("aria-pressed","false"),Ke.setAttribute("aria-label",ie.simTitle),Ke.textContent=ie.simToggleOn,Ke.addEventListener("click",()=>{br(!Yt)});let Wt=l.createElement("select");Wt.setAttribute("data-ursim-twin-sim-model",""),Wt.setAttribute("aria-label",ie.simModelLabel);let Ht=l.createElement("select");Ht.setAttribute("data-ursim-twin-sim-preset",""),Ht.setAttribute("aria-label",ie.simPresetLabel);let Vn=l.createElement("select");Vn.setAttribute("data-ursim-twin-sim-speed",""),Vn.setAttribute("aria-label",ie.simSpeedLabel);let Gn=nt(l,"div","ursim-twin-sim-note","data-ursim-twin-sim-note"),Vi=nt(l,"div","ursim-twin-sim-error","data-ursim-twin-sim-error");ut.appendChild(Ke),ut.appendChild(Wt),ut.appendChild(Ht),ut.appendChild(Vn),ut.appendChild(Gn),ut.appendChild(Vi);let si=nt(l,"details","ursim-twin-sim-caps","data-ursim-twin-sim-caps"),yr=nt(l,"summary","ursim-twin-sim-caps-summary","data-ursim-twin-sim-caps-summary");yr.textContent=ie.simCapsSummary;let Rn=nt(l,"div","ursim-twin-sim-caps-body","data-ursim-twin-sim-caps-body");si.appendChild(yr),si.appendChild(Rn),si.style.display="none",ut.appendChild(si);let Wn=nt(l,"div","ursim-twin-stage","data-ursim-twin-stage"),vs=(()=>{try{return(l.defaultView??globalThis)?.localStorage??null}catch{return null}})();function Lo(){Wn.style.gridTemplateColumns=Eh({right:Gi.isCollapsed()}),Uo(),Ti()}let Gi=hm(l,vs,{onChange:Lo});Wn.appendChild(ye),Wn.appendChild(Gi.rail),Wn.style.gridTemplateColumns=Eh({right:Gi.isCollapsed()});let Wi=null;async function ec(N){if(typeof a!="function")throw new Error("\u8BF7\u6C42\u5B9E\u73B0\u4E0D\u53EF\u7528");let le=await(await a(id,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(N)})).json();if(le===null||typeof le!="object"||le.ok!==!0)throw new Error(String(le?.error??"\u5BBF\u4E3B\u62D2\u7EDD\u4E86\u8FD9\u6B21\u70B9\u52A8"));return le}let tc=Zl(),nc={send:ec,lock:tc,getSnapshot:()=>e?.getSnapshot?.()??{},previewJoints(N){let B=Array.isArray(N)&&N.length===6&&N.every(Number.isFinite)?N.slice():null;B===null&&Wi===null||(Wi=B,st=!1,Ve=!0)},reportError(N){typeof N!="string"||N===""||No(N)}},Do=dm(l,Gi.body,nc);pe.appendChild(te),pe.appendChild(ut),pe.appendChild(Wn),pe.appendChild(Q),pe.appendChild(Ee),pe.appendChild(Xe),i.appendChild(pe);function No(N){ne=N,ce=o()+gM,Xe.textContent=N}function M(){ne===""&&Xe.textContent===""||(ne="",ce=0,Xe.textContent="")}function z(N){ne!==""&&(N<ce||M())}let j=()=>M();pe.addEventListener("pointerdown",j,!0),pe.addEventListener("keydown",j,!0),te.style.display="none",Wn.style.display="none",ye.style.display="none",Q.style.display="none",Ee.textContent=dM;let Y=null,k=null,oe=!1,xe=.02,Te=null,ve=Kp(1),ze=Ou(gr);ze.name="ursim-twin-base-axes";let Ge=Zp(),Le=Qp(null),Ye={reach:!1,base:!1,force:!1,cog:!1,ghost:!0};function pt(){Y&&Y.setVisible?.(Ye.ghost===!0&&oe===!0)}function At(){ve.visible=Ye.reach,ze.visible=Ye.base,Le.visible=!1,Ge.visible=Ye.cog,pt()}At();let ht=Ou(gr);ht.matrixAutoUpdate=!1;let rt=new Ct,Oe=new xt(new Float32Array(Co*3),3);Oe.setUsage(Ul),rt.setAttribute("position",Oe);let St=new xt(new Float32Array(Co*3),3);St.setUsage(Ul),rt.setAttribute("color",St),rt.setDrawRange(0,0);let lt=Oe.array,Xt=St.array,xn=new Jn(rt,new zn({color:3526911,vertexColors:!0}));xn.name="ursim-twin-trajectory",xn.frustumCulled=!1;let Vt=l.defaultView??(typeof globalThis.addEventListener=="function"?globalThis:null),Mi=()=>Uo();Vt?.addEventListener?.("resize",Mi);let gt=null,sn=l.defaultView?.ResizeObserver??globalThis.ResizeObserver;if(typeof sn=="function")try{gt=new sn(()=>Uo()),gt.observe(i),gt.observe?.(ye)}catch{gt=null}function Rt(N){Ee.textContent=N}function Tt(){if(He){Rt(vM);return}if(!X){let B=e?.getSnapshot?.()??{};Rt(SM(B.code,B.error,B.ips));return}if($e){Rt(`${Io} \xB7 ${yM}`);return}let N=e?.getSnapshot?.()?.detail?.safety_mode;if(Ih(N)){Rt(`${Am(N)} \xB7 ${bM}`);return}if(it){Rt(xM);return}if(et!==""){Rt(`${Io} \xB7 ${_M}${et}${ie.statusLoadRetrying}`);return}if(!g){Rt(fM);return}if(Yt){let B=String(m||e?.getSnapshot?.()?.model||"");Rt(ie.simActiveStatus(kh(B)));return}if(x!==""&&x!==m){Rt(`${Io} \xB7 ${ie.statusSwitchingModel(x)}`);return}Rt(g.usedFallback?`${Io} \xB7 ${m}${pM}`:`${Io} \xB7 ${m}`)}let jt=gm(N=>{if(N!==h){h=N;try{f?.applyTheme?.(h)}catch{}Ti()}},{document:l,window:l.defaultView??globalThis});function vr(){if(f||it)return f;try{f=t(tt,{theme:h})??{}}catch(N){return it=!0,f=null,et=N instanceof Error?N.message:String(N),Tt(),null}f.scene?.add?.(ht),f.scene?.add?.(xn),f.scene?.add?.(ve),f.scene?.add?.(ze),f.scene?.add?.(Ge),f.scene?.add?.(Le),f.onCameraChange?.(()=>Ti());try{f.applyTheme?.(h)}catch{}return Lm(),yn(),f}function yn(){if(!f||He)return;let N=!1;try{N=f.resize?.()!==!1}catch{N=!1}Re=!N}function Lm(){let N=f?.renderer?.domElement??tt;N?.addEventListener&&(N.addEventListener("webglcontextlost",B=>{B?.preventDefault?.(),He=!0,Tt()}),N.addEventListener("webglcontextrestored",()=>{He=!1,yn(),Tt()}))}function Uo(){yn()}function Lh(){f?.render?.()}function Ti(){Ve=!0}function Dh(N){N==="reset"?f?.fitTo?.(g?.root):f?.setViewPreset?.(N),Ti()}function Dm(){d!==null&&(r?.(d),d=null)}function Nh(){u||ke||d!==null||(d=s(Zh))}let Uh=()=>{if(ke=l.hidden===!0,ke)Dm();else{try{e?.retryNow?.(!1)}catch{}Ti(),Nh()}};Vt?.addEventListener?.("visibilitychange",Uh);function Nm(N,B,le){let Se=Number.isFinite(B?.ts)?B.ts:null;(Se===null||Se!==_e)&&(_e=Se,ee=N);let We=e?.getStreamHealth?.()??{},mt=ee===null?0:Math.max(0,N-ee),_t=PM({status:We.status,connected:le,feedStale:B?.feedStale===!0,ageMs:mt,frames:We.frames,frameErrors:We.frameErrors});if(_t!==we&&(we=_t,S.textContent=_t,S.style.display=_t===""?"none":"",S.setAttribute("data-ursim-twin-feed-state",_t===""?"ok":_t.startsWith(wm)?"retrying":"stale")),le&&mt>lM&&N-Fe>=uM){Fe=N;try{e?.retryNow?.(!0)}catch{}}}let Fh="127.0.0.1",Um="ur12e",Oh="upright",Fm=1,Om=["ur3","ur3e","ur5","ur5e","ur7e","ur10","ur10e","ur12e","ur16e","ur8long","ur15","ur18","ur20","ur30"],Bm=["zero","upright","reach"],zm=[1,.5,.25,.1],Yt=!1,bs=!1,Nt={model:"ur5e",preset:"zero",speed_scaling:1},Bh=[...Om],ic=null,Fo="",zh="sim",sc=[],Oo=null,Bo=!1;function kh(N){let B=String(N??"");return B.toLowerCase().startsWith("ur")?`UR${B.slice(2)}`:B}function rc(N,B,le){for(;N.firstChild;)N.removeChild(N.firstChild);for(let We of B){let mt=l.createElement("option");mt.value=We.value,mt.textContent=We.label,N.appendChild(mt)}let Se=B.some(We=>We.value===le);N.value=Se?le:B[0]?.value??""}function Xn(){Ke.setAttribute("aria-pressed",Yt?"true":"false"),Ke.textContent=Yt?ie.simToggleOff:ie.simToggleOn,Ke.disabled=bs||typeof a!="function";let N={zero:ie.simPresetZero,upright:ie.simPresetUpright,reach:ie.simPresetReach};rc(Wt,Bh.map(le=>({value:le,label:kh(le)})),Nt.model),rc(Ht,Bm.map(le=>({value:le,label:N[le]??le})),Nt.preset),rc(Vn,zm.map(le=>({value:String(le),label:`${Math.round(le*100)}%`})),String(Nt.speed_scaling));for(let le of[Wt,Ht,Vn])le.disabled=bs;let B=Fo!==""?ie.simRestoreFailed(Fo):bs?ie.simApplying:Yt?ie.simUnsupported:ie.simUses;Gn.textContent=Yt&&Fo===""?`${B} ${ie.simCollapseStops}`:B,km()}function km(){let N=Oo!==null&&typeof Oo=="object"?Oo:null;if(N===null){si.style.display="none",Rn.textContent="",Rn.removeAttribute?.("title");return}let B=[[ie.simCapsMotion,N.motion],[ie.simCapsRead,N.read],[ie.simCapsIo,N.io],[ie.simCapsTelemetry,N.telemetry]].filter(([,mt])=>Array.isArray(mt)&&mt.length>0),le=B.map(([mt,_t])=>ie.simCapsBucket(mt,_t.length)),Se=Array.isArray(N.not_simulated)?N.not_simulated:[];Se.length>0&&le.push(ie.simCapsCannot(Se.length)),Rn.textContent=le.join("  \xB7  ");let We=B.map(([mt,_t])=>`${mt}: ${_t.join(", ")}`);Se.length>0&&We.push(`${ie.simCapsCannot(Se.length)}: ${Se.join("; ")}`),We.length>0?Rn.setAttribute("title",We.join(`
`)):Rn.removeAttribute?.("title"),si.style.display=le.length>0?"":"none"}let Hh=0;async function Vh(N){if(typeof a!="function")return;let B=++Hh,le=()=>u||B!==Hh,Se=e?.getSnapshot?.()??{},We=typeof Se.ip=="string"?Se.ip:"",mt=We===""?"":`ip=${encodeURIComponent(We)}&`;oc([ie.ioReading]);try{let Cn=await(await a(`${Ts}?${mt}io=1`,{cache:"no-store"})).json();if(le()||(Hm(Cn?.io??null),N!==!0))return;for(let vn of ue){let bn=await(await a(`${Ts}?${mt}reg=${vn}&from=0&count=${he}`,{cache:"no-store"})).json();if(le())return;Vm(bn?.registers??null,vn)}}catch(_t){le()||oc([ie.ioFailed(_t instanceof Error?_t.message:String(_t))])}}function Gh(N){if(!Array.isArray(N))return"\u2014";let B=[];for(let le=0;le<N.length;le+=8)B.push(N.slice(le,le+8).map(Se=>Se===!0?"1":"0").join(""));return B.join(" ")}let Wh="",Xh=new Map;function Yh(){let N=[Wh,...Xh.values()].filter(B=>B!=="");fe.setAttribute("title",N.join(`
`))}function oc(N){qe.textContent=N.join(`
`),Wh=N.join(`
`),Yh()}function Hm(N){let B=[];if(N!==null&&typeof N=="object"&&typeof N.error!="string"){B.push(ie.ioDigitalOut(Gh(N.digital_out))),B.push(ie.ioDigitalIn(Gh(N.digital_in)));let le=Array.isArray(N.analog_in)?N.analog_in:[],Se=We=>Number.isFinite(Number(We))?Number(We).toFixed(3):"\u2014";B.push(ie.ioAnalogIn(Se(le[0]),Se(le[1]))),N.simulated===!0&&B.push(ie.ioSimInputNote)}else N!==null&&typeof N=="object"&&B.push(ie.ioFailed(N.error));oc(B)}let qh=new Map;function Vm(N,B){if(N===null||typeof N!="object")return;let le=String(B??N.set??""),Se=typeof N.error=="string"?ie.ioFailed(N.error):ie.ioRegisters(String(N.set??""),String(N.from??0),(Array.isArray(N.values)?N.values:[]).map(mt=>typeof mt=="boolean"?mt?"1":"0":String(mt??"\u2014")).join(" ")),We=qh.get(le);We===void 0&&(We=nt(l,"div","ursim-twin-io-row","data-ursim-twin-io-reg-row"),qh.set(le,We),U.appendChild(We)),We.textContent=Se,Xh.set(le,Se),Yh()}function ac(N){let B=zh==="real"?"real":N===!0?"sim":"idle",le=B==="real"?sc.length>0?ie.realModeBadge(sc.join("\u3001")):ie.realModeBadgeEmpty:B==="sim"?ie.simBadge:ie.modeBadgeIdle,Se=B==="real"?ie.realModeBadgeTitle:B==="sim"?ie.simBadgeTitle:ie.modeBadgeIdleTitle,We=`${B}\0${le}\0${Se}`;We!==Z&&(Z=We,O.setAttribute("data-ursim-twin-mode",B),O.textContent=le,O.setAttribute("title",Se),O.style.display="")}function $h(N){let B=N===!0?"true":"false";B!==$&&($=B,pe.setAttribute("data-ursim-twin-sim",B))}async function jh(){if(typeof a=="function")try{let B=await(await a(Ho,{cache:"no-store"})).json();if(u||B===null||typeof B!="object")return;ic=B.active===!0,Array.isArray(B.models)&&B.models.length>0&&(Bh=B.models.map(String)),zh=B.motion_mode==="real"?"real":"sim",sc=Array.isArray(B.real_robots)?B.real_robots.map(String):[],Oo=B.capabilities!==null&&typeof B.capabilities=="object"?B.capabilities:null,Fo=typeof B.restore_error=="string"?B.restore_error:"";let le=typeof B.model_id=="string"&&B.model_id!==""?B.model_id:String(B.model??"").toLowerCase();le!==""&&(Nt.model=le),typeof B.preset=="string"&&B.preset!==""&&(Nt.preset=B.preset),Number.isFinite(B.speed_scaling)&&(Nt.speed_scaling=B.speed_scaling),Xn(),ac(Yt)}catch{}}async function br(N){if(!(bs||typeof a!="function")){bs=!0,Vi.textContent="",Xn();try{let B=N?{enabled:!0,model:Nt.model,preset:Nt.preset,speed_scaling:Nt.speed_scaling}:{enabled:!1},Se=await(await a(Ho,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(B)})).json();if(u)return;if(Se===null||typeof Se!="object"||Se.ok!==!0)throw new Error(String(Se?.error??"\u5BBF\u4E3B\u62D2\u7EDD\u4E86\u8FD9\u6B21\u5207\u6362"));N&&typeof Se.model_id=="string"&&Se.model_id!==""&&(Nt.model=Se.model_id),e?.setIp?.(N?Fh:""),Bo=N,Yt=N}catch(B){u||(Yt=!1,Vi.textContent=ie.simFailed(B instanceof Error?B.message:String(B)))}finally{bs=!1,u||Xn()}}}async function Gm(){if(!(typeof a!="function"||u)&&(await jh(),!u)){if(ic===!0||Yt){Yt=!0,e?.setIp?.(Fh),Bo=!0,Xn();return}Nt.model=Um,Nt.preset=Oh,Nt.speed_scaling=Fm,Xn(),await br(!0)}}function Wm(){let N=Bo;if(N){try{e?.setIp?.("")}catch{}Bo=!1}if(!(!N&&!Yt&&ic!==!0)&&typeof a=="function")try{let B=a(Ho,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({enabled:!1}),keepalive:!0});B&&typeof B.catch=="function"&&B.catch(()=>{})}catch{}}Wt.addEventListener("change",()=>{Nt.model=String(Wt.value||Nt.model),Nt.preset=Oh,Yt?br(!0):Xn()}),Ht.addEventListener("change",()=>{Nt.preset=String(Ht.value||Nt.preset),Yt?br(!0):Xn()}),Vn.addEventListener("change",()=>{let N=Number(Vn.value);Nt.speed_scaling=Number.isFinite(N)&&N>0?N:1,Yt?br(!0):Xn()}),Xn(),c?Gm():jh();function Xm(N){N!==X?(X=N,pe.setAttribute("data-ursim-twin-connected",N?"true":"false"),Wn.style.display=N?"":"none",ye.style.display=N?"":"none",Q.style.display=N?"":"none",te.style.display=N?"":"none",N||(_=null,C=null,F=null,A=null,v=[],E=0,rt.setDrawRange(0,0),H.textContent="",Ie.textContent="",P.textContent="",P.setAttribute("data-ursim-twin-overlimit","false"),G.textContent="",V.textContent="",de.textContent="",ae.textContent="",ae.setAttribute("data-ursim-twin-risk","ok"),ae.setAttribute("title",""),J=null,W=null,ph(g?.root??null,[]),S.textContent="",S.style.display="none",we=null,ee=null,_e=null,Fe=-1/0,pe.setAttribute("data-ursim-twin-hazard","false"),$h(!1),ac(!1),q=-1/0),Ti(),Uo(),Tt()):N||Tt()}function Jh(){f?.fitTo?.(g?.root,Ye.reach?{minRadius:TM}:{}),Lp(ht,Pp(f?.currentFitRadius?.()))}function Kh(N,B){let le=Ao(B,N);return g?.applyFK?.(le),Array.isArray(le.tool0)&&(ht.matrix.fromArray(le.tool0),ht.matrixWorldNeedsUpdate=!0,Le.position.set(le.tool0[12],le.tool0[13],le.tool0[14]),Ye.force?xh(Le,R?.detail?.tcp_force):Le.visible=!1),g?.root&&(g.root.visible=!0,Te=N==null?null:Array.from(N).slice(0,6)),le}async function Ym(N){let B=++p,le=String(N).trim().toLowerCase(),Se=null;try{Se=await n(N,{armLinks:$l(Ql(N)?.links)??void 0})}catch(vn){!u&&B===p&&(et=vn instanceof Error?vn.message:String(vn),x="",w=le,T=o()+cM,Tt());return}if(!Se)return;if(u||B!==p){Se.dispose?.();return}et="",w="",T=0;let We=vr()?.scene;Se.root&&typeof Se.root=="object"&&(Se.root.name=Rm),We?.add?.(Se.root),g&&(Po(We,g.root),g.dispose?.()),BM(We,Se.root),g=Se,gh(Y),Y=null,k=null;try{Y=jp(g),We?.add?.(Y.root)}catch{Y=null}let mt=m;m=le,mt!==""&&mt!==m&&qm();let _t=Ql(m);_t&&Array.isArray(Te)?Kh(Te,_t):Se.root.visible=!1,Jh();let Cn=Jl(Ql(m)?.links);Cn!==null&&(ve.scale.setScalar(Cn),Ce.reach&&(Ce.reach.textContent=`${ie.layerReach} ${Cn.toFixed(2)} m`)),Ve=!0,Tt()}function qm(){_=null,C=null,A=null,v=[],E=0,rt.setDrawRange(0,0),Ve=!0}function $m(N,B){return Number.isFinite(N)?F===null||N<F.hostTs?(F={hostTs:N,localTs:B},{ts:B,reset:!0}):{ts:F.localTs+(N-F.hostTs),reset:!1}:{ts:B,reset:!1}}function jm(N){if(L)return;let B=N?.tcp;if(!Array.isArray(B)||B.length<3||!Number.isFinite(B[0]))return;let le=Number.isFinite(N.ts)?N.ts:E+1;E=le;let Se=Array.isArray(N?.q)&&N.q.length>=6?[...N.q]:void 0;v=nm(v,{tcp:[B[0],B[1],B[2]],ts:le,...Se===void 0?{}:{q:Se}},oM),v.length>Co&&(v=v.slice(v.length-Co))}function Jm(){let N=im(v),B=Math.min(N.length,Co),le=N.length-B,Se=sm(v.slice(le));for(let We=0;We<B;We++){let mt=N[le+We];lt[We*3]=mt[0],lt[We*3+1]=mt[1],lt[We*3+2]=mt[2];let _t=Se[We]??[1,1,1];Xt[We*3]=_t[0],Xt[We*3+1]=_t[1],Xt[We*3+2]=_t[2]}Oe.needsUpdate=!0,St.needsUpdate=!0,rt.setDrawRange(0,B)}function Km(N,B){let le=N?.tcp;if(Array.isArray(le)&&le.length>=3)return le;let Se=B?.tool0;return Array.isArray(Se)?[Se[12],Se[13],Se[14],0,0,0]:null}function Zm(N,B,le,Se,We){if(!(N-q>=aM))return;q=N;let mt=[B?.model??m,B?.ip].filter(Sn=>typeof Sn=="string"&&Sn!=="");H.textContent=mt.length===0?"":ie.identity(B?.model??m,B?.ip),y.setAttribute("title",H.textContent);let _t=Array.isArray(B?.ips)?B.ips.filter(Sn=>typeof Sn=="string"&&Sn!==""):[],Cn=typeof B?.ip=="string"?B.ip:"",vn=`${Cn}|${_t.join(",")}`;if(vn!==b){b=vn,be.textContent="";for(let Sn of _t){let wi=nt(l,"button","ursim-twin-layer-toggle","data-ursim-twin-robot");wi.type="button",wi.textContent=Sn,wi.setAttribute("aria-pressed",Sn===Cn?"true":"false"),wi.addEventListener("click",()=>{e?.setIp?.(Sn)}),be.appendChild(wi)}}let ri=typeof B?.pendingMotion?.summary=="string"?B.pendingMotion.summary:"";Ie.textContent=ri===""?"":`${ie.pendingPrefix}  ${ri}`,Ie.setAttribute("title",Ie.textContent);let bn=wM(le,We?.jointLimits);P.textContent=bn.length===0?bm(le):`${bm(le)}  ${ie.overLimit(`J${bn.join("/J")}`)}`,P.setAttribute("data-ursim-twin-overlimit",bn.length===0?"false":"true");let cn=qp({kin:We,joints:le,limits:We?.jointLimits??null,reach:Jl(We?.links)??null}),oi=cn===null?"":[cn.level==="at"?ie.riskAt:cn.level==="near"?ie.riskNear:ie.riskOk,ie.riskWrist(cn.wristDeg.toFixed(1)),cn.manip===null?"":ie.riskManip(cn.manip.toFixed(4)),cn.limitNear===!0?ie.riskLimit(cn.limitJoint,cn.limitDeg.toFixed(1)):""].filter(Boolean).join("  \xB7  ");oi!==J&&(J=oi,ae.textContent=oi,ae.setAttribute("title",oi===""?"":ie.riskTitle),ae.setAttribute("data-ursim-twin-risk",cn?.level??"ok"));let Ss=bn.join(",");Ss!==W&&(W=Ss,g!==null&&ph(g.root,bn)),P.setAttribute("title",P.textContent);let Sr=Km(B,Se);G.textContent=Sr?EM(Sr):"TCP  --",G.setAttribute("title",G.textContent);let In=UM(B?.detail);V.textContent=In.status,V.setAttribute("title",In.status),V.setAttribute("data-ursim-twin-hazard",In.hazard?"true":"false");let Mr=[In.temps,In.power,In.currents,In.tcpSpeed].filter(Boolean).join("   ");de.textContent=Mr,de.setAttribute("title",Mr),pe.setAttribute("data-ursim-twin-hazard",In.hazard?"true":"false"),B?.ip&&pe.setAttribute("data-ursim-twin-ip",String(B.ip)),Be.open===!0&&N-se>=Me&&(se=N,Vh(!1))}function Qm(N){let B=e?.getSnapshot?.()??{},le=B.connected===!0,Se=$e;$e=B.degraded===!0,Xm(le),Nm(N,B,le);let We=B?.feedStale===!0||ee!==null&&N-ee>Tm,mt=We===(B?.feedStale===!0)?B:{...B,feedStale:We};if(Do.sync(mt),!le)return;Se!==$e&&Tt();let _t=B.simulated===!0;_t!==Yt&&(Yt=_t,Xn(),Tt()),$h(_t),ac(_t);let Cn=Ih(B?.detail?.safety_mode);Cn!==K&&(K=Cn,Tt());let vn=String(B.model??"").trim(),ri=vn.toLowerCase();ri!==""&&ri!==x&&(ri===w&&N<T||(x=ri,Tt(),Ym(vn)));let bn=Ql(m||ri),cn=Array.isArray(B.q)&&B.q.length>=6?B.q:null,oi=null;if(bn&&cn){let Ss=$m(B.ts,N);Ss.reset&&(_=null,C=null);let Sr=Number.isFinite(B.ts);R=B;let In=!Sr||B.ts!==A||C===null;Sr&&(A=B.ts),In&&(_=C,C={q:cn.slice(),ts:Ss.ts},jm(B),Ve=!0,st=!1,bt=N+Mm(_,C)+64);let Mr=N>=bt,Sn=Wi!==null,wi=!Sn&&!In&&!Ve&&Mr&&st&&I!==null;if(wi)oi=I;else{let zo=Sn?Wi.slice():_?tm(_,C,N-Mm(_,C)):C.q.slice();oi=Kh(zo,bn),I=oi,st=Mr}if(Y){let zo=B?.pendingMotion,ko=zo?.kind==="joints"?zo.q:null,Qh=B?.detail?.target_q,Tr=wr=>Array.isArray(wr)&&wr.length===6&&wr.every(Number.isFinite),Ms=Tr(ko)?ko:Tr(Qh)?Qh:null,ed=Tr(B?.q)?B.q:null,tg=Ms!==null&&ed!==null&&Ms.some((wr,ng)=>Math.abs(wr-ed[ng])>xe);oe=Ms!==null&&(Tr(ko)||tg),oe?(Ms!==k&&(k=Ms,Y.applyFK(Ao(bn,Ms))),Y.setPending(Tr(ko))):k=null,pt()}wi||Jm(),Zm(N,B,cn,oi,bn)}Re&&yn(),(Ve||N<bt)&&(Lh(),Ve=!1)}function Zh(){if(!(u||ke))try{Qm(o()),z(o())}catch(N){No(`${mM}${N instanceof Error?N.message:String(N)}`)}finally{u||ke?d=null:d=s(Zh)}}Nh();function eg(){if(u)return;u=!0,Wm(),Do.dispose?.(),Wi=null,d!==null&&(r?.(d),d=null),Vt?.removeEventListener?.("resize",Mi),Vt?.removeEventListener?.("visibilitychange",Uh),pe.removeEventListener?.("pointerdown",j,!0),pe.removeEventListener?.("keydown",j,!0),jt?.(),gt?.disconnect?.(),gt=null;let N=f?.scene;g&&(Po(N,g.root),g.dispose?.(),g=null),Po(N,ht),Po(N,xn),gh(Y),Y=null;for(let B of[ve,ze,Ge,Le])em(B);for(f?.dispose?.(),Dp(ht),rt.dispose(),xn.material?.dispose?.(),v=[],_=null,C=null,F=null,f=null,pe.parentNode===i?i.removeChild(pe):pe.remove?.();pe.firstChild;)pe.removeChild(pe.firstChild)}return{dispose:eg}}var zM="ur-digital-twin-client",Im="127.0.0.1";function Pm(i,e=globalThis){return Im}function kM(i,e){let t=globalThis.document,n=Pm(e),s=od({ip:n,stream:!0}),r={loaded:!0,at:Date.now(),ip:n,state:s,entry:void 0,error:null};globalThis.__URSIM_TWIN__=r,i.logger?.info?.("[ursim-twin] client half loaded");let o;try{s.start(),o=fd({doc:t,onToggle:a=>{r.active=a},mountPanel:a=>Cm({container:a,state:s})}),r.entry=o,i.logger?.info?.(`[ursim-twin] mounted (ip=${n}, surface=right-dock)`)}catch(a){r.error=a instanceof Error?a.message:String(a),i.logger?.warn?.(`[ursim-twin] \u5BA2\u6237\u7AEF\u88C5\u914D\u5931\u8D25\uFF1A${r.error}`)}return()=>{try{o?.dispose?.()}catch{}try{s.stop()}catch{}o=void 0,delete globalThis.__URSIM_TWIN__}}
/*! Bundled license information:

three/build/three.core.js:
three/build/three.module.js:
  (**
   * @license
   * Copyright 2010-2025 Three.js Authors
   * SPDX-License-Identifier: MIT
   *)
*/
return module.exports; } });
//# sourceMappingURL=client.js.map
