window.__ModuleLoader__.load({ id: "dsh-nonead-ursim", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
var cc=Object.defineProperty;var dg=Object.getOwnPropertyDescriptor;var fg=Object.getOwnPropertyNames;var pg=Object.prototype.hasOwnProperty;var mg=(n,e)=>{for(var t in e)cc(n,t,{get:e[t],enumerable:!0})},gg=(n,e,t,i)=>{if(e&&typeof e=="object"||typeof e=="function")for(let s of fg(e))!pg.call(n,s)&&s!==t&&cc(n,s,{get:()=>e[s],enumerable:!(i=dg(e,s))||i.enumerable});return n};var _g=n=>gg(cc({},"__esModule",{value:!0}),n);var ZM={};mg(ZM,{SIM_IP:()=>km,apply:()=>KM,name:()=>JM,resolveRobotIp:()=>zm});module.exports=_g(ZM);var Es="/nonead-ursim/twin/state",id="/nonead-ursim/twin/asset";var sd="/nonead-ursim/twin/stream",Vo="/nonead-ursim/twin/sim",rd="/nonead-ursim/twin/jog";var xg="frame-error",yg="stale";function vg(n,e=1e3,t=3e4){let i=Number.isFinite(e)&&e>=0?e:1e3,s=Number.isFinite(t)&&t>0?t:3e4,r=Number.isFinite(n)&&n>0?Math.floor(n):1,o=i*2**Math.min(r-1,40);return Math.min(s,Math.max(i,Number.isFinite(o)?o:s))}function od(n={}){let e=n.EventSourceImpl??globalThis.EventSource,t=Number.isFinite(n.retryMs)&&n.retryMs>=0?n.retryMs:1e3,i=Number.isFinite(n.maxRetryMs)&&n.maxRetryMs>0?n.maxRetryMs:3e4,s=typeof n.setTimeoutImpl=="function"?n.setTimeoutImpl:globalThis.setTimeout,r=typeof n.clearTimeoutImpl=="function"?n.clearTimeoutImpl:globalThis.clearTimeout,o=new Set,a=null,c=null,l=0,h="idle",u=null,d=!0,f=0,g=0,y=0,m=(R={kind:"status"})=>{for(let w of o)try{w(u,R)}catch{}},p=()=>{c!==null&&(r(c),c=null);let R=a;a=null;try{R?.close?.()}catch{}},E=()=>{if(d)return;if(typeof e!="function"){h="unsupported",m({kind:"status"});return}h=l===0?"connecting":"retrying";let R;try{R=new e(n.url)}catch{T();return}a=R,R.addEventListener?.("open",()=>{h="open",m({kind:"status"})}),R.addEventListener?.("state",w=>{let C;try{C=JSON.parse(w?.data??"null")}catch{return}u=C,f+=1,l=0,h="open",m({kind:"state"})}),R.addEventListener?.(yg,w=>{y+=1,m({kind:"stale",...v(w)})}),R.addEventListener?.(xg,w=>{g+=1,m({kind:"frame-error",...v(w)})}),R.onerror=w=>{if(!d){if(typeof w?.data=="string"){g+=1,m({kind:"frame-error",...v(w)});return}p(),T()}}},T=()=>{if(d)return;l+=1;let R=vg(l,t,i);h="retrying",m({kind:"status"}),c!==null&&(r(c),c=null),c=s(()=>{c=null,E()},R)};function v(R){try{let w=JSON.parse(R?.data??"null");return w!==null&&typeof w=="object"?w:{}}catch{return{}}}return{subscribe(R){return o.add(R),()=>o.delete(R)},start(){d&&(d=!1,l=0,E())},stop(){d=!0,p(),h="idle"},poke(R=!1){return d||a!==null&&R!==!0?!1:(c!==null&&(r(c),c=null),p(),E(),!0)},getSnapshot:()=>u,getStatus:()=>h,getFrames:()=>f,getFrameErrors:()=>g,getStaleCount:()=>y}}function ad(n,e){let t=typeof n=="string"&&n!==""?n:"/nonead-ursim/twin/stream",i=typeof e=="string"?e.trim():"";return i===""?t:`${t}?ip=${encodeURIComponent(i)}`}function bg(n,e,t,i){return e?t:Math.min(i,Math.max(t,n*2))}function Sg(n){return`${n}${n.includes("?")?"&":"?"}detail=1`}function ld({fetchImpl:n=globalThis.fetch,ip:e,baseMs:t=100,maxMs:i=2e3,detailMs:s=2e3,now:r=()=>Date.now(),stream:o=!1,streamFactory:a}={}){let c=typeof e=="string"&&e.trim()!==""?e.trim():"",l=x=>x===""?Es:`${Es}?ip=${encodeURIComponent(x)}`,h=l(c),u=-1/0,d={connected:!1,model:"",q:[],tcp:[],ts:0,error:null,code:null,ips:[],ip:null,degraded:!1,detail:null,simulated:!1,pendingMotion:null,feedStale:!1,feedPendingMs:null},f=new Set,g=null,y=t,m=!0,p=0,E=null,T=null,v=null;function R(){v!==null&&(v(),v=null),T?.stop?.(),T=null}function w(){R(),T=(typeof a=="function"?a:od)({url:ad(sd,c)}),v=T.subscribe((P,U)=>{if(!m){if(U?.kind==="stale"||U?.kind==="frame-error"){d={...d,feedStale:!0,feedPendingMs:Number.isFinite(U?.pendingMs)?U.pendingMs:d.feedPendingMs},C();return}if(U?.kind==="status"){C();return}P!=null&&(L(P),C())}}),m||T.start()}let C=()=>{for(let x of f)try{x(d)}catch{}};function L(x){let P=x?.connected===!0;return d=P?{connected:!0,model:x.model,q:x.q,tcp:x.tcp,ts:x.ts,error:null,code:null,ips:[],ip:x.ip??null,degraded:x.degraded===!0,simulated:x.simulated===!0,detail:x.detail??d.detail??null,pendingMotion:x.pending_motion??null,feedStale:x.stale===!0,feedPendingMs:Number.isFinite(x.stale_ms)?x.stale_ms:null}:{...d,connected:!1,error:x?.reason??x?.error??"not connected",code:x?.code??null,ips:Array.isArray(x?.ips)?x.ips:[],ip:x?.ip??d.ip??null,degraded:!1,simulated:!1,pendingMotion:null,feedStale:!1,feedPendingMs:null},P}async function b(x){let P=!1,U=d.connected===!0&&r()-u>=Math.max(0,s);U&&(u=r());try{let $=typeof AbortController=="function"?new AbortController:null;E=$;let G=await(await n(U?Sg(h):h,$?{cache:"no-store",signal:$.signal}:void 0)).json();P=L(G)}catch($){if($ instanceof Error&&$.name==="AbortError")return;d={...d,connected:!1,error:$ instanceof Error?$.message:String($),code:null,degraded:!1},P=!1}finally{E=null}if(m||x!==p)return;C(),y=bg(y,P,t,i);let W=typeof document<"u"&&document.hidden===!0;g=setTimeout(()=>b(x),W?i:y)}return{subscribe(x){return f.add(x),()=>f.delete(x)},getSnapshot:()=>d,setIp(x){let P=typeof x=="string"?x.trim():"";if(P!==c){if(c=P,h=l(P),d={...d,connected:!1,model:"",q:[],tcp:[],ts:0,error:null,code:null,ips:[],ip:P===""?null:P,degraded:!1,detail:null,pendingMotion:null},C(),o){m||w();return}try{E?.abort?.()}catch{}E=null,m||b(++p)}},getIp:()=>c,getStreamHealth(){let x=T;return{mode:o?"stream":"poll",status:o?typeof x?.getStatus=="function"?x.getStatus():"idle":"polling",frames:typeof x?.getFrames=="function"?x.getFrames():0,frameErrors:typeof x?.getFrameErrors=="function"?x.getFrameErrors():0,stale:typeof x?.getStaleCount=="function"?x.getStaleCount():0,connected:d.connected===!0}},retryNow(x=!1){if(m)return!1;if(o)return T?.poke?.(x)===!0;g&&(clearTimeout(g),g=null);try{E?.abort?.()}catch{}return E=null,b(++p),!0},start(){if(m){if(m=!1,o){w();return}b(++p)}},stop(){if(m=!0,p++,o){R();return}g&&(clearTimeout(g),g=null);try{E?.abort?.()}catch{}E=null}}}var Go="__DSH_URSIM_TWIN_MUTATION_HUB__";function ws(){return typeof globalThis>"u"?void 0:globalThis}function Mg(n,e){if(typeof e=="function")return e;let t=n?.defaultView?.MutationObserver;if(typeof t=="function")return t;let i=ws()?.MutationObserver;return typeof i=="function"?i:void 0}function Tg(n,e){if(typeof e=="function")return e;let t=n?.defaultView;if(t&&typeof t.requestAnimationFrame=="function")return s=>t.requestAnimationFrame(s);let i=ws()?.requestAnimationFrame;return typeof i=="function"?s=>i(s):void 0}function Eg(n,e){if(typeof e=="function")return e;let t=n?.defaultView;if(t&&typeof t.cancelAnimationFrame=="function")return s=>t.cancelAnimationFrame(s);let i=ws()?.cancelAnimationFrame;return typeof i=="function"?s=>i(s):void 0}var Wo;function wg(){let n=ws();return n?n[Go]:Wo}function Ag(n){let e=ws();e?e[Go]=n:Wo=n}function Rg(n){let e=ws();e?e[Go]===n&&delete e[Go]:Wo===n&&(Wo=void 0)}function Cg({doc:n,options:e}){let t=Mg(n,e.MutationObserver),i=Tg(n,e.raf),s=Eg(n,e.caf),r=new Set,o={subscribers:r,pending:[],scheduled:!1,frame:void 0,observer:void 0,raf:i,caf:s},a=()=>{o.frame=void 0,o.scheduled=!1;let h=o.pending;o.pending=[];for(let u of[...r])if(r.has(u))try{u(h)}catch{}},c=()=>{if(!o.scheduled){if(o.scheduled=!0,typeof i=="function")try{o.frame=i(a);return}catch{}a()}},l=n?n.body??n.documentElement:void 0;if(typeof t=="function"&&l)try{o.observer=new t(h=>{for(let u of h)o.pending.push(u);c()}),o.observer.observe(l,{childList:!0,subtree:!0})}catch{o.observer=void 0}return o}function cd(n,e,t){let i=wg();i===void 0&&(i=Cg({doc:n,options:e}),i.observer&&Ag(i)),i.subscribers.add(t);let s=!0;return()=>{if(s&&(s=!1,i.subscribers.delete(t),!(i.subscribers.size>0))){try{i.observer?.disconnect?.()}catch{}if(i.frame!==void 0&&typeof i.caf=="function")try{i.caf(i.frame)}catch{}i.frame=void 0,i.scheduled=!1,i.pending=[],Rg(i)}}}var ud={statusDisconnected:"Roboter nicht verbunden",statusLoading:"Verbunden \xB7 Modell wird geladen\u2026",statusConnected:"Verbunden",statusFallbackSuffix:" (kein eingebautes Modell, vereinfachte Geometrie)",statusErrorPrefix:"Renderfehler: ",statusLoadFailed:"Modell konnte nicht geladen werden: ",statusLoadRetrying:" (neuer Versuch)",statusSwitchingModel:n=>`Wechsel zu ${n}\u2026`,statusNoWebgl:"WebGL ist hier nicht verf\xFCgbar: auf rein numerischen Modus umgeschaltet (Gelenkwinkel und TCP werden weiter aktualisiert)",statusIncomplete:"Der Roboter hat keinen vollst\xE4ndigen Satz Gelenkwinkel geliefert",statusContextLost:"3D-Kontext verloren (GPU-Reset) \u2013 Panel einklappen und wieder \xF6ffnen, um es zur\xFCckzuholen",statusSafetyHint:"Der Roboter hat m\xF6glicherweise angehalten; bitte das Teach-Pendant pr\xFCfen",disconnectNeverConnected:"Roboter nicht verbunden: ursim_connect war noch nie erfolgreich",disconnectReason:n=>`Roboter nicht verbunden${n?`: ${n}`:""}`,disconnectAmbiguous:n=>`Mehr als ein Roboter ist verbunden; bitte die Roboter-IP angeben${n}`,disconnectCandidates:n=>Array.isArray(n)&&n.length>0?` (Kandidaten: ${n.join(", ")})`:"",disconnectWorkerDown:n=>`Der UR-Steuerprozess ist nicht verf\xFCgbar${n?`: ${n}`:""} (ursim_ping pr\xFCft die Python-Abh\xE4ngigkeiten)`,disconnectReadFailed:n=>`Roboterstatus konnte nicht gelesen werden${n?`: ${n}`:""}`,jointsPrefix:"Gelenkwinkel (\xB0)",tcpPrefix:"TCP (m / Achsenwinkel rad)",queryFailed:"Abfrage fehlgeschlagen",detailStatusFailed:n=>`Statusabfrage fehlgeschlagen: ${n}`,detailSafety:n=>`Sicherheit ${n}`,detailRobotMode:n=>`Modus ${n}`,detailProgram:n=>`Programm ${n}`,detailSpeed:n=>`Geschwindigkeit ${n}`,detailRunning:"L\xE4uft",detailTempsPrefix:"Temp. (\xB0C)",detailTemps:n=>`Temp. (\xB0C) ${n}`,detailBus:(n,e)=>`Zwischenkreis ${n} V ${e} A`,overLimit:n=>`\u26A0 au\xDFerhalb des Limits ${n}`,safetyMode:{NORMAL:"Normal",REDUCED:"Reduziert",PROTECTIVE_STOP:"Schutzstopp",SAFEGUARD_STOP:"Sicherheitsstopp",EMERGENCY_STOP:"Notstopp",SYSTEM_EMERGENCY_STOP:"System-Notstopp",ROBOT_EMERGENCY_STOP:"Roboter-Notstopp",RECOVERY:"Wiederherstellung",VIOLATION:"Sicherheitsverletzung",FAULT:"Fehler",AUTOMATIC_MODE_SAFEGUARD_STOP:"Sicherheitsstopp im Automatikmodus",SYSTEM_THREE_POSITION_ENABLING_STOP:"Stopp durch Drei-Stellungs-Zustimmung"},robotMode:{POWER_OFF:"Ausgeschaltet",POWER_ON:"Eingeschaltet",IDLE:"Leerlauf",BACKDRIVE:"Backdrive",RUNNING:"L\xE4uft",BOOTING:"Startet",CONFIRM_SAFETY:"Sicherheit best\xE4tigen",DISCONNECTED:"Getrennt",NO_CONTROLLER:"Kein Controller"},programState:{STOPPED:"Gestoppt",PLAYING:"Wiedergabe",PAUSED:"Pausiert"},viewReset:"Ansicht zur\xFCcksetzen",viewIso:"Isometrisch",viewFront:"Vorne",viewSide:"Seite",viewTop:"Oben",identity:(n,e)=>`Roboter ${[n,e].filter(Boolean).join(" \xB7 ")}`,pendingPrefix:"Freigabe ausstehend",canvasLabel:"3D-Ansicht der Robotersimulation; Pfeiltasten wechseln die Ansicht",hudLabel:"Live-Messwerte des Roboters",layerReach:"Reichweite",layerBase:"Basis-Koordinatensystem",layerForce:"Kraft",layerGhost:"Zielpose",screenshot:"Screenshot",screenshotLabel:"Screenshot mit Wasserzeichen exportieren",trajectoryClear:"Bahn l\xF6schen",trajectoryPause:"Bahn pausieren",trajectoryResume:"Bahn fortsetzen",trajectoryExport:"Bahn exportieren",dockLabel:"NoneadURSim",dockDescription:"Live-Ansicht der Robotersimulation",dockCollapse:"Einklappen",simTitle:"Offline-Simulation",simToggleOn:"Simulation starten",simToggleOff:"Simulation stoppen",simUses:"Solange sie aktiv ist, steuert die KI dieses Modell hier: Bewegungs-Tools bewegen diesen virtuellen Roboter, ein echter Roboter bleibt unber\xFChrt.",simModelLabel:"Modell",simPresetLabel:"Startpose",simSpeedLabel:"Start-Geschwindigkeitsfaktor",simPresetZero:"Nullpose",simPresetUpright:"Aufrecht",simPresetReach:"Ausgestreckt",simBadge:"SIMULATION",simBadgeTitle:"Virtueller Roboter in Offline-Simulation \u2013 keine Messwerte eines echten Roboters, keine echte Bewegung",modeBadgeIdle:"NICHT VERBUNDEN",modeBadgeIdleTitle:"Keine Simulation l\xE4uft und kein Roboter ist verbunden \u2013 es wird nichts bewegt",realModeBadge:n=>`ECHTER MODUS \xB7 ${n}`,realModeBadgeEmpty:"ECHTER MODUS \xB7 Allow-Liste leer (alles wird abgelehnt)",realModeBadgeTitle:"Echter Roboter-Modus (motionMode: real): Befehle gehen an die Controller der Allow-Liste \u2013 das ist keine Simulation",detailCurrentsPrefix:"Strom (A)",detailTcpSpeed:n=>`TCP-Geschwindigkeit ${n} m/s`,detailEstimatedSuffix:" (gesch\xE4tzt)",simCapsSummary:"Was die Simulation kann und was nicht",simCapsBucket:(n,e)=>`${n}: ${e}`,simCapsCannot:n=>`nicht simuliert: ${n}`,simCapsMotion:"Bewegung",simCapsRead:"R\xFCckmeldung",simCapsIo:"E/A und Register",simCapsTelemetry:"Telemetrie",simRestoreFailed:n=>`Die vorherige Simulation konnte nicht wiederhergestellt werden: ${n} (hier einschalten, um es erneut zu versuchen)`,riskOk:"OK",riskNear:"\u26A0 nahe Singularit\xE4t",riskAt:"\u26A0 in Singularit\xE4t",riskWrist:n=>`Handgelenk ${n}\xB0`,riskManip:n=>`Manipulierbarkeit ${n}`,riskLimit:(n,e)=>`J${n} ist ${e}\xB0 von seinem Limit entfernt`,riskTitle:"Singularit\xE4tskriterien: Winkel von Gelenk 5 (geht gegen 0, wenn die Handgelenksachsen fluchten) + normierte Manipulierbarkeit |det J|/reach\xB3 + Abstand zu den Gelenklimits",ioSummary:"E/A und Register",ioDigitalOut:n=>`Digitalausgang ${n}`,ioDigitalIn:n=>`Digitaleingang ${n}`,ioAnalogIn:(n,e)=>`Analogeingang ${n} / ${e} V`,ioRegisters:(n,e,t)=>`${n}-Register [${e}\u2026] ${t}`,ioReading:"lese\u2026",ioFailed:n=>`Lesen fehlgeschlagen: ${n}`,ioSimInputNote:"Die Simulation hat keine Eingangsquelle: Eing\xE4nge bleiben 0, Register behalten ihre Anfangswerte.",simApplying:"Simulation wird gewechselt\u2026",simFailed:n=>`Wechsel der Simulation fehlgeschlagen: ${n}`,simUnsupported:"Die Simulation implementiert nur Kinematik (Bewegungs-Tools + Posen-R\xFCckmeldung); alle anderen Befehle melden \u201Ekeine Simulationssemantik\u201C.",simCollapseStops:"Beim Einklappen des Panels wird diese Simulation gestoppt.",simActiveStatus:n=>`Offline-Simulation \xB7 ${n}`,simWatermark:"Offline-Simulation (kein echter Roboter)",controlsTcpPosition:"TCP-Position (mm)",controlsTcpOrientation:"TCP-Orientierung (\xB0)",controlsHome:"Referenz",controlsHomeTitle:"Referenz: alle sechs Gelenke auf [0\xB0, -90\xB0, 0\xB0, -90\xB0, 0\xB0, 0\xB0]",controlsStepMm:"Schritt mm",controlsStepDeg:"Schritt \xB0",controlsStepMmOptionTitle:n=>`Schritt ${n} mm`,controlsStepDegOptionTitle:n=>`Schritt ${n}\xB0`,controlsFrame:"Bezugssystem",controlsFrameTitle:"Bezugssystem",controlsFrameTool:"Werkzeug",controlsFrameBase:"Basis",controlsFrameOptionTitle:n=>`Jog im ${n}-System`,controlsJogPositionTitle:(n,e,t,i)=>`${i} mm entlang der ${e}-Achse im ${n}-System (${t>0?"positiv":"negativ"})`,controlsJogRotateTitle:(n,e,t,i)=>`${i}\xB0 um die ${e}-Achse im ${n}-System drehen (${t>0?"positiv":"negativ"})`,controlsDisabledDisconnected:"Roboter nicht verbunden: Jog-Steuerung nicht verf\xFCgbar",controlsDisabledSimOnly:"Joggen funktioniert nur in der Offline-Simulation: f\xFCr einen echten Roboter die Tools verwenden (mit Freigabe)",controlsDisabledStale:"Der Datenstrom stockt: Steuerung pausiert und aktiviert sich automatisch wieder",controlsCommandFailed:n=>`Jog fehlgeschlagen: ${n}`,controlsToolPosition:"TCP-Pose",controlsToolPositionTitle:"TCP-Pose: X/Y/Z in mm, RX/RY/RZ in rad; Enter oder Fokusverlust sendet einen Pose-Befehl",controlsSummary:(n,e,t)=>`TCP: ${n}, ${e}, ${t} m`,controlsSummaryTitle:"Aktuelle TCP-Position (m)",controlsJoints:"Gelenke",controlsJointsTitle:"Schieberegler ziehen zeigt nur lokal an (kein Befehl); Loslassen sendet ein movej; \u25C0 \u25B6 in 1\xB0-Schritten",controlsJointStepTitle:(n,e)=>`Gelenk ${n}: ${e>0?"+1\xB0":"\u22121\xB0"}`,controlsJointBase:"Basis",controlsJointShoulder:"Schulter",controlsJointElbow:"Ellbogen",controlsJointWrist1:"Handgelenk 1",controlsJointWrist2:"Handgelenk 2",controlsJointWrist3:"Handgelenk 3",controlsJointValue:n=>`${n.toFixed(1)}\xB0`,controlsInvalidRollback:"Ung\xFCltiger Wert: auf den letzten Stand zur\xFCckgesetzt",controlsRejectedCommand:"Der Host hat diesen Befehl abgelehnt",controlsNoPoseData:"Noch keine Posen-Daten",controlsBusyRetry:"Der vorherige Befehl l\xE4uft noch: es wurde nichts gesendet, bitte erneut versuchen",controlsStopFailed:n=>`Stoppbefehl konnte nicht gesendet werden: ${n}`};var hd={statusDisconnected:"Robot no conectado",statusLoading:"Conectado \xB7 cargando modelo\u2026",statusConnected:"Conectado",statusFallbackSuffix:" (sin modelo integrado, usando geometr\xEDa aproximada)",statusErrorPrefix:"Error de renderizado: ",statusLoadFailed:"Error al cargar el modelo: ",statusLoadRetrying:" (reintentando)",statusSwitchingModel:n=>`cambiando a ${n}\u2026`,statusNoWebgl:"WebGL no est\xE1 disponible aqu\xED: se cambi\xF3 al modo solo num\xE9rico (los \xE1ngulos de articulaci\xF3n y el TCP siguen actualiz\xE1ndose)",statusIncomplete:"El robot no devolvi\xF3 un conjunto completo de \xE1ngulos de articulaci\xF3n",statusContextLost:"Se perdi\xF3 el contexto 3D (reinicio de GPU): contrae y vuelve a abrir el panel para recuperarlo",statusSafetyHint:"Es posible que el robot se haya detenido; revisa el teach pendant",disconnectNeverConnected:"Robot no conectado: ursim_connect nunca ha tenido \xE9xito",disconnectReason:n=>`Robot no conectado${n?`: ${n}`:""}`,disconnectAmbiguous:n=>`Hay m\xE1s de un robot conectado; especifica la IP del robot${n}`,disconnectCandidates:n=>Array.isArray(n)&&n.length>0?` (candidatos: ${n.join(", ")})`:"",disconnectWorkerDown:n=>`El proceso de control UR no est\xE1 disponible${n?`: ${n}`:""} (ejecuta ursim_ping para comprobar las dependencias de Python)`,disconnectReadFailed:n=>`No se pudo leer el estado del robot${n?`: ${n}`:""}`,jointsPrefix:"\xC1ngulos de articulaci\xF3n (\xB0)",tcpPrefix:"TCP (m / rad de eje-\xE1ngulo)",queryFailed:"consulta fallida",detailStatusFailed:n=>`Consulta de estado fallida: ${n}`,detailSafety:n=>`Seguridad ${n}`,detailRobotMode:n=>`Modo ${n}`,detailProgram:n=>`Programa ${n}`,detailSpeed:n=>`Velocidad ${n}`,detailRunning:"En ejecuci\xF3n",detailTempsPrefix:"Temp (\xB0C)",detailTemps:n=>`Temp (\xB0C) ${n}`,detailBus:(n,e)=>`Bus ${n} V ${e} A`,overLimit:n=>`\u26A0 fuera de l\xEDmite ${n}`,safetyMode:{NORMAL:"Normal",REDUCED:"Reducido",PROTECTIVE_STOP:"Parada protectora",SAFEGUARD_STOP:"Parada de seguridad",EMERGENCY_STOP:"Parada de emergencia",SYSTEM_EMERGENCY_STOP:"Parada de emergencia del sistema",ROBOT_EMERGENCY_STOP:"Parada de emergencia del robot",RECOVERY:"Recuperaci\xF3n",VIOLATION:"Violaci\xF3n de seguridad",FAULT:"Fallo",AUTOMATIC_MODE_SAFEGUARD_STOP:"Parada de seguridad en modo autom\xE1tico",SYSTEM_THREE_POSITION_ENABLING_STOP:"Parada por habilitaci\xF3n de tres posiciones"},robotMode:{POWER_OFF:"Apagado",POWER_ON:"Encendido",IDLE:"Inactivo",BACKDRIVE:"Retroaccionamiento",RUNNING:"En ejecuci\xF3n",BOOTING:"Arrancando",CONFIRM_SAFETY:"Confirmar seguridad",DISCONNECTED:"Desconectado",NO_CONTROLLER:"Sin controlador"},programState:{STOPPED:"Detenido",PLAYING:"Reproduciendo",PAUSED:"En pausa"},viewReset:"Restablecer vista",viewIso:"Isom\xE9trica",viewFront:"Frontal",viewSide:"Lateral",viewTop:"Superior",identity:(n,e)=>`Robot ${[n,e].filter(Boolean).join(" \xB7 ")}`,pendingPrefix:"Aprobaci\xF3n pendiente",canvasLabel:"Vista 3D de la simulaci\xF3n del robot; las teclas de flecha cambian la vista",hudLabel:"Lecturas en vivo del robot",layerReach:"Alcance",layerBase:"Sistema base",layerForce:"Fuerza",layerGhost:"Pose objetivo",screenshot:"Captura",screenshotLabel:"Exportar una captura con marca de agua",trajectoryClear:"Borrar trayectoria",trajectoryPause:"Pausar trayectoria",trajectoryResume:"Reanudar trayectoria",trajectoryExport:"Exportar trayectoria",dockLabel:"NoneadURSim",dockDescription:"Vista en vivo de la simulaci\xF3n del robot",dockCollapse:"Contraer",simTitle:"Simulaci\xF3n offline",simToggleOn:"Iniciar simulaci\xF3n",simToggleOff:"Detener simulaci\xF3n",simUses:"Mientras est\xE9 activa, la IA controla este modelo aqu\xED: las herramientas de movimiento mueven este robot virtual y ning\xFAn robot real se ve afectado.",simModelLabel:"Modelo",simPresetLabel:"Pose inicial",simSpeedLabel:"Escala de velocidad inicial",simPresetZero:"Pose cero",simPresetUpright:"Vertical",simPresetReach:"Extendido",simBadge:"SIMULACI\xD3N",simBadgeTitle:"Robot virtual en simulaci\xF3n offline: no es una lectura de robot real y no hay movimiento real",modeBadgeIdle:"SIN CONEXI\xD3N",modeBadgeIdleTitle:"No hay ninguna simulaci\xF3n en marcha ni robot conectado: nada se est\xE1 moviendo",realModeBadge:n=>`MODO REAL \xB7 ${n}`,realModeBadgeEmpty:"MODO REAL \xB7 lista de permitidos vac\xEDa (todo se rechaza)",realModeBadgeTitle:"Modo robot real (motionMode: real): los comandos van a los controladores de la lista de permitidos; esto no es una simulaci\xF3n",detailCurrentsPrefix:"Corriente (A)",detailTcpSpeed:n=>`Velocidad TCP ${n} m/s`,detailEstimatedSuffix:" (estimado)",simCapsSummary:"Qu\xE9 puede y qu\xE9 no puede hacer la simulaci\xF3n",simCapsBucket:(n,e)=>`${n}: ${e}`,simCapsCannot:n=>`no simulado: ${n}`,simCapsMotion:"Movimiento",simCapsRead:"Lectura",simCapsIo:"E/S y registros",simCapsTelemetry:"Telemetr\xEDa",simRestoreFailed:n=>`No se pudo restaurar la simulaci\xF3n anterior: ${n} (act\xEDvala aqu\xED para reintentar)`,riskOk:"OK",riskNear:"\u26A0 cerca de singularidad",riskAt:"\u26A0 en singularidad",riskWrist:n=>`mu\xF1eca ${n}\xB0`,riskManip:n=>`manipulabilidad ${n}`,riskLimit:(n,e)=>`J${n} est\xE1 a ${e}\xB0 de su l\xEDmite`,riskTitle:"Criterios de singularidad: \xE1ngulo de la articulaci\xF3n 5 (tiende a 0 cuando los ejes de la mu\xF1eca se alinean) + manipulabilidad normalizada |det J|/reach\xB3 + distancia a los l\xEDmites de articulaci\xF3n",ioSummary:"E/S y registros",ioDigitalOut:n=>`Salida digital ${n}`,ioDigitalIn:n=>`Entrada digital ${n}`,ioAnalogIn:(n,e)=>`Entrada anal\xF3gica ${n} / ${e} V`,ioRegisters:(n,e,t)=>`registros ${n} [${e}\u2026] ${t}`,ioReading:"leyendo\u2026",ioFailed:n=>`lectura fallida: ${n}`,ioSimInputNote:"La simulaci\xF3n no tiene fuente de entrada: las entradas permanecen en 0 y los registros en sus valores iniciales.",simApplying:"Cambiando de simulaci\xF3n\u2026",simFailed:n=>`Error al cambiar la simulaci\xF3n: ${n}`,simUnsupported:"La simulaci\xF3n solo implementa cinem\xE1tica (herramientas de movimiento + lectura de pose); cualquier otro comando responde \xABsin sem\xE1ntica de simulaci\xF3n\xBB.",simCollapseStops:"Contraer el panel detiene esta simulaci\xF3n.",simActiveStatus:n=>`Simulaci\xF3n offline \xB7 ${n}`,simWatermark:"Simulaci\xF3n offline (no es un robot real)",controlsTcpPosition:"Posici\xF3n TCP (mm)",controlsTcpOrientation:"Orientaci\xF3n TCP (\xB0)",controlsHome:"Origen",controlsHomeTitle:"Origen: las seis articulaciones a [0\xB0, -90\xB0, 0\xB0, -90\xB0, 0\xB0, 0\xB0]",controlsStepMm:"Paso mm",controlsStepDeg:"Paso \xB0",controlsStepMmOptionTitle:n=>`Paso ${n} mm`,controlsStepDegOptionTitle:n=>`Paso ${n}\xB0`,controlsFrame:"Sistema",controlsFrameTitle:"Sistema",controlsFrameTool:"Herramienta",controlsFrameBase:"Base",controlsFrameOptionTitle:n=>`Jog en el sistema ${n}`,controlsJogPositionTitle:(n,e,t,i)=>`Mover ${i} mm a lo largo del eje ${e} del sistema ${n} (direcci\xF3n ${t>0?"positiva":"negativa"})`,controlsJogRotateTitle:(n,e,t,i)=>`Girar ${i}\xB0 alrededor del eje ${e} del sistema ${n} (direcci\xF3n ${t>0?"positiva":"negativa"})`,controlsDisabledDisconnected:"Robot no conectado: los controles de jog no est\xE1n disponibles",controlsDisabledSimOnly:"El jog solo funciona en la simulaci\xF3n offline: usa las herramientas para un robot real (con aprobaci\xF3n)",controlsDisabledStale:"El flujo de datos se detuvo: los controles est\xE1n en pausa y se reactivan autom\xE1ticamente",controlsCommandFailed:n=>`Jog fallido: ${n}`,controlsToolPosition:"Pose TCP",controlsToolPositionTitle:"Pose TCP: X/Y/Z en mm, RX/RY/RZ en rad; pulsa Enter o sal del campo para enviar un comando de pose",controlsSummary:(n,e,t)=>`TCP: ${n}, ${e}, ${t} m`,controlsSummaryTitle:"Posici\xF3n TCP actual (m)",controlsJoints:"Articulaciones",controlsJointsTitle:"Arrastrar el control deslizante solo previsualiza en local (no env\xEDa nada); al soltar se env\xEDa un movej; \u25C0 \u25B6 avanzan 1\xB0",controlsJointStepTitle:(n,e)=>`Articulaci\xF3n ${n}: ${e>0?"+1\xB0":"\u22121\xB0"}`,controlsJointBase:"Base",controlsJointShoulder:"Hombro",controlsJointElbow:"Codo",controlsJointWrist1:"Mu\xF1eca 1",controlsJointWrist2:"Mu\xF1eca 2",controlsJointWrist3:"Mu\xF1eca 3",controlsJointValue:n=>`${n.toFixed(1)}\xB0`,controlsInvalidRollback:"Valor no v\xE1lido: se restaur\xF3 el \xFAltimo fotograma",controlsRejectedCommand:"El host rechaz\xF3 este comando",controlsNoPoseData:"Todav\xEDa no hay datos de pose",controlsBusyRetry:"El comando anterior sigue en curso: no se envi\xF3 nada, int\xE9ntalo de nuevo",controlsStopFailed:n=>`No se pudo enviar la orden de parada: ${n}`};var dd={statusDisconnected:"Robot non connect\xE9",statusLoading:"Connect\xE9 \xB7 chargement du mod\xE8le\u2026",statusConnected:"Connect\xE9",statusFallbackSuffix:" (pas de mod\xE8le int\xE9gr\xE9, g\xE9om\xE9trie approch\xE9e)",statusErrorPrefix:"Erreur de rendu : ",statusLoadFailed:"\xC9chec du chargement du mod\xE8le : ",statusLoadRetrying:" (nouvelle tentative)",statusSwitchingModel:n=>`passage au mod\xE8le ${n}\u2026`,statusNoWebgl:"WebGL indisponible ici : bascule en mode num\xE9rique seul (les angles d'articulation et le TCP continuent d'\xEAtre mis \xE0 jour)",statusIncomplete:"Le robot n'a pas renvoy\xE9 un jeu complet d'angles d'articulation",statusContextLost:"Contexte 3D perdu (r\xE9initialisation GPU) \u2014 replier puis rouvrir le panneau pour r\xE9cup\xE9rer",statusSafetyHint:"Le robot s'est peut-\xEAtre arr\xEAt\xE9 ; v\xE9rifiez le pupitre",disconnectNeverConnected:"Robot non connect\xE9 : ursim_connect n'a jamais abouti",disconnectReason:n=>`Robot non connect\xE9${n?` : ${n}`:""}`,disconnectAmbiguous:n=>`Plusieurs robots sont connect\xE9s ; pr\xE9cisez l'IP du robot${n}`,disconnectCandidates:n=>Array.isArray(n)&&n.length>0?` (candidats : ${n.join(", ")})`:"",disconnectWorkerDown:n=>`Le processus de contr\xF4le UR est indisponible${n?` : ${n}`:""} (lancez ursim_ping pour v\xE9rifier les d\xE9pendances Python)`,disconnectReadFailed:n=>`\xC9chec de la lecture de l'\xE9tat du robot${n?` : ${n}`:""}`,jointsPrefix:"Angles d'articulation (\xB0)",tcpPrefix:"TCP (m / rad axe-angle)",queryFailed:"\xE9chec de la requ\xEAte",detailStatusFailed:n=>`\xC9chec de la requ\xEAte d'\xE9tat : ${n}`,detailSafety:n=>`S\xE9curit\xE9 ${n}`,detailRobotMode:n=>`Mode ${n}`,detailProgram:n=>`Programme ${n}`,detailSpeed:n=>`Vitesse ${n}`,detailRunning:"En cours",detailTempsPrefix:"Temp (\xB0C)",detailTemps:n=>`Temp (\xB0C) ${n}`,detailBus:(n,e)=>`Bus ${n} V ${e} A`,overLimit:n=>`\u26A0 hors limite ${n}`,safetyMode:{NORMAL:"Normal",REDUCED:"R\xE9duit",PROTECTIVE_STOP:"Arr\xEAt protecteur",SAFEGUARD_STOP:"Arr\xEAt de s\xE9curit\xE9",EMERGENCY_STOP:"Arr\xEAt d'urgence",SYSTEM_EMERGENCY_STOP:"Arr\xEAt d'urgence syst\xE8me",ROBOT_EMERGENCY_STOP:"Arr\xEAt d'urgence robot",RECOVERY:"R\xE9cup\xE9ration",VIOLATION:"Violation de s\xE9curit\xE9",FAULT:"D\xE9faut",AUTOMATIC_MODE_SAFEGUARD_STOP:"Arr\xEAt de s\xE9curit\xE9 en mode automatique",SYSTEM_THREE_POSITION_ENABLING_STOP:"Arr\xEAt par validation trois positions"},robotMode:{POWER_OFF:"Hors tension",POWER_ON:"Sous tension",IDLE:"Au repos",BACKDRIVE:"Retour manuel",RUNNING:"En cours",BOOTING:"D\xE9marrage",CONFIRM_SAFETY:"Confirmer la s\xE9curit\xE9",DISCONNECTED:"D\xE9connect\xE9",NO_CONTROLLER:"Sans contr\xF4leur"},programState:{STOPPED:"Arr\xEAt\xE9",PLAYING:"En lecture",PAUSED:"En pause"},viewReset:"R\xE9initialiser la vue",viewIso:"Isom\xE9trique",viewFront:"Face",viewSide:"C\xF4t\xE9",viewTop:"Dessus",identity:(n,e)=>`Robot ${[n,e].filter(Boolean).join(" \xB7 ")}`,pendingPrefix:"Approbation en attente",canvasLabel:"Vue 3D de la simulation du robot ; les fl\xE8ches changent la vue",hudLabel:"Mesures du robot en direct",layerReach:"Port\xE9e",layerBase:"Rep\xE8re de base",layerForce:"Effort",layerGhost:"Pose cible",screenshot:"Capture",screenshotLabel:"Exporter une capture avec filigrane",trajectoryClear:"Effacer la trajectoire",trajectoryPause:"Suspendre la trajectoire",trajectoryResume:"Reprendre la trajectoire",trajectoryExport:"Exporter la trajectoire",dockLabel:"NoneadURSim",dockDescription:"Vue en direct de la simulation du robot",dockCollapse:"Replier",simTitle:"Simulation hors ligne",simToggleOn:"D\xE9marrer la simulation",simToggleOff:"Arr\xEAter la simulation",simUses:"Lorsqu'elle est active, l'IA pilote ce mod\xE8le ici : les outils de mouvement d\xE9placent ce robot virtuel et aucun robot r\xE9el n'est affect\xE9.",simModelLabel:"Mod\xE8le",simPresetLabel:"Pose de d\xE9part",simSpeedLabel:"\xC9chelle de vitesse initiale",simPresetZero:"Pose z\xE9ro",simPresetUpright:"Debout",simPresetReach:"\xC9tendu",simBadge:"SIMULATION",simBadgeTitle:"Robot virtuel en simulation hors ligne \u2014 pas une mesure de robot r\xE9el, aucun mouvement r\xE9el",modeBadgeIdle:"NON CONNECT\xC9",modeBadgeIdleTitle:"Aucune simulation en cours et aucun robot connect\xE9 \u2014 rien n'est pilot\xE9",realModeBadge:n=>`MODE R\xC9EL \xB7 ${n}`,realModeBadgeEmpty:"MODE R\xC9EL \xB7 liste d'autorisation vide (tout est refus\xE9)",realModeBadgeTitle:"Mode robot r\xE9el (motionMode: real) : les commandes vont aux contr\xF4leurs de la liste d'autorisation \u2014 ce n'est pas une simulation",detailCurrentsPrefix:"Courant (A)",detailTcpSpeed:n=>`Vitesse TCP ${n} m/s`,detailEstimatedSuffix:" (estim\xE9)",simCapsSummary:"Ce que la simulation peut faire et ne peut pas faire",simCapsBucket:(n,e)=>`${n} : ${e}`,simCapsCannot:n=>`non simul\xE9 : ${n}`,simCapsMotion:"Mouvement",simCapsRead:"Lecture",simCapsIo:"E/S et registres",simCapsTelemetry:"T\xE9l\xE9m\xE9trie",simRestoreFailed:n=>`La simulation pr\xE9c\xE9dente n'a pas pu \xEAtre restaur\xE9e : ${n} (activez-la ici pour r\xE9essayer)`,riskOk:"OK",riskNear:"\u26A0 proche d'une singularit\xE9",riskAt:"\u26A0 singularit\xE9",riskWrist:n=>`poignet ${n}\xB0`,riskManip:n=>`manipulabilit\xE9 ${n}`,riskLimit:(n,e)=>`J${n} est \xE0 ${e}\xB0 de sa limite`,riskTitle:"Crit\xE8res de singularit\xE9 : angle de l'articulation 5 (tend vers 0 quand les axes du poignet s'alignent) + manipulabilit\xE9 normalis\xE9e |det J|/reach\xB3 + distance aux limites d'articulation",ioSummary:"E/S et registres",ioDigitalOut:n=>`Sortie num\xE9rique ${n}`,ioDigitalIn:n=>`Entr\xE9e num\xE9rique ${n}`,ioAnalogIn:(n,e)=>`Entr\xE9e analogique ${n} / ${e} V`,ioRegisters:(n,e,t)=>`registres ${n} [${e}\u2026] ${t}`,ioReading:"lecture\u2026",ioFailed:n=>`\xE9chec de lecture : ${n}`,ioSimInputNote:"La simulation n'a aucune source d'entr\xE9e : les entr\xE9es restent \xE0 0 et les registres \xE0 leurs valeurs initiales.",simApplying:"Changement de simulation\u2026",simFailed:n=>`\xC9chec du changement de simulation : ${n}`,simUnsupported:"La simulation n'impl\xE9mente que la cin\xE9matique (outils de mouvement + lecture de pose) ; toute autre commande r\xE9pond \xAB pas de s\xE9mantique de simulation \xBB.",simCollapseStops:"Replier le panneau arr\xEAte cette simulation.",simActiveStatus:n=>`Simulation hors ligne \xB7 ${n}`,simWatermark:"Simulation hors ligne (pas un robot r\xE9el)",controlsTcpPosition:"Position TCP (mm)",controlsTcpOrientation:"Orientation TCP (\xB0)",controlsHome:"Origine",controlsHomeTitle:"Origine : les six articulations \xE0 [0\xB0, -90\xB0, 0\xB0, -90\xB0, 0\xB0, 0\xB0]",controlsStepMm:"Pas mm",controlsStepDeg:"Pas \xB0",controlsStepMmOptionTitle:n=>`Pas ${n} mm`,controlsStepDegOptionTitle:n=>`Pas ${n}\xB0`,controlsFrame:"Rep\xE8re",controlsFrameTitle:"Rep\xE8re",controlsFrameTool:"Outil",controlsFrameBase:"Base",controlsFrameOptionTitle:n=>`Jog dans le rep\xE8re ${n}`,controlsJogPositionTitle:(n,e,t,i)=>`D\xE9placer de ${i} mm selon l'axe ${e} du rep\xE8re ${n} (direction ${t>0?"positive":"n\xE9gative"})`,controlsJogRotateTitle:(n,e,t,i)=>`Tourner de ${i}\xB0 autour de l'axe ${e} du rep\xE8re ${n} (direction ${t>0?"positive":"n\xE9gative"})`,controlsDisabledDisconnected:"Robot non connect\xE9 : les commandes de jog sont indisponibles",controlsDisabledSimOnly:"Le jog ne fonctionne qu'en simulation hors ligne : utilisez les outils pour un robot r\xE9el (soumis \xE0 approbation)",controlsDisabledStale:"Le flux de donn\xE9es s'est interrompu : les commandes sont en pause et se r\xE9activent automatiquement",controlsCommandFailed:n=>`\xC9chec du jog : ${n}`,controlsToolPosition:"Pose TCP",controlsToolPositionTitle:"Pose TCP : X/Y/Z en mm, RX/RY/RZ en rad ; Entr\xE9e ou perte de focus envoie une commande de pose",controlsSummary:(n,e,t)=>`TCP : ${n}, ${e}, ${t} m`,controlsSummaryTitle:"Position TCP actuelle (m)",controlsJoints:"Articulations",controlsJointsTitle:"Glisser le curseur ne fait qu'un aper\xE7u local (aucune commande) ; rel\xE2cher envoie un movej ; \u25C0 \u25B6 avancent de 1\xB0",controlsJointStepTitle:(n,e)=>`Articulation ${n} : ${e>0?"+1\xB0":"\u22121\xB0"}`,controlsJointBase:"Base",controlsJointShoulder:"\xC9paule",controlsJointElbow:"Coude",controlsJointWrist1:"Poignet 1",controlsJointWrist2:"Poignet 2",controlsJointWrist3:"Poignet 3",controlsJointValue:n=>`${n.toFixed(1)}\xB0`,controlsInvalidRollback:"Valeur invalide : retour \xE0 la derni\xE8re image",controlsRejectedCommand:"L'h\xF4te a refus\xE9 cette commande",controlsNoPoseData:"Pas encore de donn\xE9es de pose",controlsBusyRetry:"La commande pr\xE9c\xE9dente est toujours en cours : rien n'a \xE9t\xE9 envoy\xE9, r\xE9essayez",controlsStopFailed:n=>`\xC9chec de l'envoi de l'ordre d'arr\xEAt : ${n}`};var fd={statusDisconnected:"\u30ED\u30DC\u30C3\u30C8\u672A\u63A5\u7D9A",statusLoading:"\u63A5\u7D9A\u6E08\u307F \xB7 \u30E2\u30C7\u30EB\u8AAD\u307F\u8FBC\u307F\u4E2D\u2026",statusConnected:"\u63A5\u7D9A\u6E08\u307F",statusFallbackSuffix:"\uFF08\u5185\u8535\u30E2\u30C7\u30EB\u306A\u3057\u3001\u8FD1\u4F3C\u5F62\u72B6\u3067\u8868\u793A\uFF09",statusErrorPrefix:"\u63CF\u753B\u30A8\u30E9\u30FC\uFF1A",statusLoadFailed:"\u30E2\u30C7\u30EB\u306E\u8AAD\u307F\u8FBC\u307F\u306B\u5931\u6557\uFF1A",statusLoadRetrying:"\uFF08\u518D\u8A66\u884C\u4E2D\uFF09",statusSwitchingModel:n=>`\u30E2\u30C7\u30EB ${n} \u306B\u5207\u66FF\u4E2D\u2026`,statusNoWebgl:"\u3053\u306E\u74B0\u5883\u3067\u306F WebGL \u304C\u4F7F\u3048\u307E\u305B\u3093\uFF1A\u6570\u5024\u306E\u307F\u306E\u30E2\u30FC\u30C9\u306B\u5207\u308A\u66FF\u3048\u307E\u3057\u305F\uFF08\u95A2\u7BC0\u89D2\u3068 TCP \u306F\u66F4\u65B0\u3055\u308C\u307E\u3059\uFF09",statusIncomplete:"\u30ED\u30DC\u30C3\u30C8\u304B\u3089\u5B8C\u5168\u306A\u95A2\u7BC0\u89D2\u304C\u8FD4\u308A\u307E\u305B\u3093\u3067\u3057\u305F",statusContextLost:"3D \u30B3\u30F3\u30C6\u30AD\u30B9\u30C8\u304C\u5931\u308F\u308C\u307E\u3057\u305F\uFF08GPU \u30EA\u30BB\u30C3\u30C8\uFF09\u2014 \u30D1\u30CD\u30EB\u3092\u305F\u305F\u3093\u3067\u958B\u304D\u76F4\u3059\u3068\u5FA9\u5E30\u3057\u307E\u3059",statusSafetyHint:"\u30ED\u30DC\u30C3\u30C8\u304C\u505C\u6B62\u3057\u305F\u53EF\u80FD\u6027\u304C\u3042\u308A\u307E\u3059\u3002\u30C6\u30A3\u30FC\u30C1\u30DA\u30F3\u30C0\u30F3\u30C8\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044",disconnectNeverConnected:"\u30ED\u30DC\u30C3\u30C8\u672A\u63A5\u7D9A\uFF1Aursim_connect \u304C\u307E\u3060\u4E00\u5EA6\u3082\u6210\u529F\u3057\u3066\u3044\u307E\u305B\u3093",disconnectReason:n=>`\u30ED\u30DC\u30C3\u30C8\u672A\u63A5\u7D9A${n?`\uFF1A${n}`:""}`,disconnectAmbiguous:n=>`\u8907\u6570\u306E\u30ED\u30DC\u30C3\u30C8\u304C\u63A5\u7D9A\u3055\u308C\u3066\u3044\u307E\u3059\u3002\u30ED\u30DC\u30C3\u30C8 IP \u3092\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044${n}`,disconnectCandidates:n=>Array.isArray(n)&&n.length>0?`\uFF08\u5019\u88DC\uFF1A${n.join("\u3001")}\uFF09`:"",disconnectWorkerDown:n=>`UR \u5236\u5FA1\u30D7\u30ED\u30BB\u30B9\u304C\u5229\u7528\u3067\u304D\u307E\u305B\u3093${n?`\uFF1A${n}`:""}\uFF08ursim_ping \u3067 Python \u4F9D\u5B58\u3092\u78BA\u8A8D\u3067\u304D\u307E\u3059\uFF09`,disconnectReadFailed:n=>`\u30ED\u30DC\u30C3\u30C8\u72B6\u614B\u306E\u8AAD\u307F\u53D6\u308A\u306B\u5931\u6557${n?`\uFF1A${n}`:""}`,jointsPrefix:"\u95A2\u7BC0\u89D2 (\xB0)",tcpPrefix:"TCP(\u30E1\u30FC\u30C8\u30EB/\u8EF8\u89D2\u30E9\u30B8\u30A2\u30F3)",queryFailed:"\u30AF\u30A8\u30EA\u5931\u6557",detailStatusFailed:n=>`\u72B6\u614B\u30AF\u30A8\u30EA\u5931\u6557\uFF1A${n}`,detailSafety:n=>`\u5B89\u5168 ${n}`,detailRobotMode:n=>`\u30E2\u30FC\u30C9 ${n}`,detailProgram:n=>`\u30D7\u30ED\u30B0\u30E9\u30E0 ${n}`,detailSpeed:n=>`\u901F\u5EA6 ${n}`,detailRunning:"\u5B9F\u884C\u4E2D",detailTempsPrefix:"\u6E29\u5EA6(\xB0C)",detailTemps:n=>`\u6E29\u5EA6(\xB0C)  ${n}`,detailBus:(n,e)=>`\u6BCD\u7DDA ${n} V  ${e} A`,overLimit:n=>`\u26A0 \u7BC4\u56F2\u5916 ${n}`,safetyMode:{NORMAL:"\u6B63\u5E38",REDUCED:"\u7E2E\u5C0F\u30E2\u30FC\u30C9",PROTECTIVE_STOP:"\u4FDD\u8B77\u505C\u6B62",SAFEGUARD_STOP:"\u30BB\u30FC\u30D5\u30AC\u30FC\u30C9\u505C\u6B62",EMERGENCY_STOP:"\u7DCA\u6025\u505C\u6B62",SYSTEM_EMERGENCY_STOP:"\u30B7\u30B9\u30C6\u30E0\u7DCA\u6025\u505C\u6B62",ROBOT_EMERGENCY_STOP:"\u30ED\u30DC\u30C3\u30C8\u7DCA\u6025\u505C\u6B62",RECOVERY:"\u5FA9\u5E30\u4E2D",VIOLATION:"\u5B89\u5168\u5236\u9650\u9055\u53CD",FAULT:"\u6545\u969C",AUTOMATIC_MODE_SAFEGUARD_STOP:"\u81EA\u52D5\u30E2\u30FC\u30C9 \u30BB\u30FC\u30D5\u30AC\u30FC\u30C9\u505C\u6B62",SYSTEM_THREE_POSITION_ENABLING_STOP:"3 \u4F4D\u7F6E\u30A4\u30CD\u30FC\u30D6\u30EB\u505C\u6B62"},robotMode:{POWER_OFF:"\u96FB\u6E90\u30AA\u30D5",POWER_ON:"\u96FB\u6E90\u30AA\u30F3",IDLE:"\u30A2\u30A4\u30C9\u30EB",BACKDRIVE:"\u30D0\u30C3\u30AF\u30C9\u30E9\u30A4\u30D6",RUNNING:"\u5B9F\u884C\u4E2D",BOOTING:"\u8D77\u52D5\u4E2D",CONFIRM_SAFETY:"\u5B89\u5168\u78BA\u8A8D",DISCONNECTED:"\u5207\u65AD",NO_CONTROLLER:"\u30B3\u30F3\u30C8\u30ED\u30FC\u30E9\u306A\u3057"},programState:{STOPPED:"\u505C\u6B62",PLAYING:"\u518D\u751F\u4E2D",PAUSED:"\u4E00\u6642\u505C\u6B62"},viewReset:"\u8996\u70B9\u30EA\u30BB\u30C3\u30C8",viewIso:"\u30A2\u30A4\u30BD\u30E1",viewFront:"\u6B63\u9762",viewSide:"\u5074\u9762",viewTop:"\u4E0A\u9762",identity:(n,e)=>`\u30ED\u30DC\u30C3\u30C8 ${[n,e].filter(Boolean).join(" \xB7 ")}`,pendingPrefix:"\u627F\u8A8D\u5F85\u3061",canvasLabel:"\u30ED\u30DC\u30C3\u30C8\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3\u306E 3D \u30D3\u30E5\u30FC\u3002\u77E2\u5370\u30AD\u30FC\u3067\u8996\u70B9\u3092\u5207\u308A\u66FF\u3048\u307E\u3059",hudLabel:"\u30ED\u30DC\u30C3\u30C8\u306E\u30E9\u30A4\u30D6\u8A08\u6E2C\u5024",layerReach:"\u30EA\u30FC\u30C1",layerBase:"\u30D9\u30FC\u30B9\u5EA7\u6A19\u7CFB",layerForce:"\u529B",layerGhost:"\u76EE\u6A19\u59FF\u52E2",screenshot:"\u30B9\u30AF\u30EA\u30FC\u30F3\u30B7\u30E7\u30C3\u30C8",screenshotLabel:"\u900F\u304B\u3057\u5165\u308A\u30B9\u30AF\u30EA\u30FC\u30F3\u30B7\u30E7\u30C3\u30C8\u3092\u66F8\u304D\u51FA\u3059",trajectoryClear:"\u8ECC\u8DE1\u3092\u30AF\u30EA\u30A2",trajectoryPause:"\u8ECC\u8DE1\u3092\u4E00\u6642\u505C\u6B62",trajectoryResume:"\u8ECC\u8DE1\u3092\u518D\u958B",trajectoryExport:"\u8ECC\u8DE1\u3092\u66F8\u304D\u51FA\u3059",dockLabel:"NoneadURSim",dockDescription:"\u30ED\u30DC\u30C3\u30C8\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3\u306E\u30E9\u30A4\u30D6\u30D3\u30E5\u30FC",dockCollapse:"\u305F\u305F\u3080",simTitle:"\u30AA\u30D5\u30E9\u30A4\u30F3\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3",simToggleOn:"\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3\u958B\u59CB",simToggleOff:"\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3\u505C\u6B62",simUses:"\u30AA\u30F3\u306B\u3059\u308B\u3068\u3001AI \u306F\u3053\u3053\u3067\u3053\u306E\u30E2\u30C7\u30EB\u3092\u52D5\u304B\u3057\u307E\u3059\uFF1A\u30E2\u30FC\u30B7\u30E7\u30F3\u7CFB\u30C4\u30FC\u30EB\u306F\u3053\u306E\u4EEE\u60F3\u30ED\u30DC\u30C3\u30C8\u3092\u52D5\u304B\u3057\u3001\u5B9F\u6A5F\u306B\u306F\u5F71\u97FF\u3057\u307E\u305B\u3093\u3002",simModelLabel:"\u30E2\u30C7\u30EB",simPresetLabel:"\u521D\u671F\u59FF\u52E2",simSpeedLabel:"\u521D\u671F\u901F\u5EA6\u500D\u7387",simPresetZero:"\u30BC\u30ED\u59FF\u52E2",simPresetUpright:"\u76F4\u7ACB",simPresetReach:"\u30EA\u30FC\u30C1",simBadge:"\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3",simBadgeTitle:"\u30AA\u30D5\u30E9\u30A4\u30F3\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3\u306E\u4EEE\u60F3\u30ED\u30DC\u30C3\u30C8 \u2014 \u5B9F\u6A5F\u306E\u8A08\u6E2C\u5024\u3067\u306F\u306A\u304F\u3001\u5B9F\u6A5F\u306F\u52D5\u304D\u307E\u305B\u3093",modeBadgeIdle:"\u672A\u63A5\u7D9A",modeBadgeIdleTitle:"\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3\u3082\u30ED\u30DC\u30C3\u30C8\u63A5\u7D9A\u3082\u3042\u308A\u307E\u305B\u3093 \u2014 \u4F55\u3082\u52D5\u3044\u3066\u3044\u307E\u305B\u3093",realModeBadge:n=>`\u5B9F\u6A5F\u30E2\u30FC\u30C9 \xB7 ${n}`,realModeBadgeEmpty:"\u5B9F\u6A5F\u30E2\u30FC\u30C9 \xB7 \u8A31\u53EF\u30EA\u30B9\u30C8\u304C\u7A7A\uFF08\u3059\u3079\u3066\u62D2\u5426\uFF09",realModeBadgeTitle:"\u5B9F\u6A5F\u30E2\u30FC\u30C9\uFF08motionMode: real\uFF09\uFF1A\u30B3\u30DE\u30F3\u30C9\u306F\u8A31\u53EF\u30EA\u30B9\u30C8\u306E\u30B3\u30F3\u30C8\u30ED\u30FC\u30E9\u306B\u9001\u3089\u308C\u307E\u3059 \u2014 \u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3\u3067\u306F\u3042\u308A\u307E\u305B\u3093",detailCurrentsPrefix:"\u96FB\u6D41 (A)",detailTcpSpeed:n=>`TCP \u901F\u5EA6 ${n} m/s`,detailEstimatedSuffix:"\uFF08\u63A8\u5B9A\uFF09",simCapsSummary:"\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3\u3067\u3067\u304D\u308B\u3053\u3068\u30FB\u3067\u304D\u306A\u3044\u3053\u3068",simCapsBucket:(n,e)=>`${n}\uFF1A${e}`,simCapsCannot:n=>`\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3\u5BFE\u8C61\u5916\uFF1A${n}`,simCapsMotion:"\u30E2\u30FC\u30B7\u30E7\u30F3",simCapsRead:"\u8AAD\u307F\u623B\u3057",simCapsIo:"I/O \u3068\u30EC\u30B8\u30B9\u30BF",simCapsTelemetry:"\u30C6\u30EC\u30E1\u30C8\u30EA",simRestoreFailed:n=>`\u524D\u56DE\u306E\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3\u3092\u5FA9\u5143\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\uFF1A${n}\uFF08\u3053\u3053\u3067\u30AA\u30F3\u306B\u3059\u308B\u3068\u518D\u8A66\u884C\u3057\u307E\u3059\uFF09`,riskOk:"OK",riskNear:"\u26A0 \u7279\u7570\u70B9\u306B\u8FD1\u3044",riskAt:"\u26A0 \u7279\u7570\u70B9",riskWrist:n=>`\u624B\u9996 ${n}\xB0`,riskManip:n=>`\u53EF\u64CD\u4F5C\u5EA6 ${n}`,riskLimit:(n,e)=>`J${n} \u306F\u9650\u754C\u307E\u3067 ${e}\xB0`,riskTitle:"\u7279\u7570\u70B9\u306E\u5224\u5B9A\uFF1A\u7B2C 5 \u95A2\u7BC0\u89D2\uFF08\u624B\u9996\u8EF8\u304C\u4E00\u76F4\u7DDA\u306B\u306A\u308B\u3068 0 \u306B\u8FD1\u3065\u304F\uFF09\uFF0B \u6B63\u898F\u5316\u53EF\u64CD\u4F5C\u5EA6 |det J|/reach\xB3 \uFF0B \u95A2\u7BC0\u9650\u754C\u307E\u3067\u306E\u8DDD\u96E2",ioSummary:"I/O \u3068\u30EC\u30B8\u30B9\u30BF",ioDigitalOut:n=>`\u30C7\u30B8\u30BF\u30EB\u51FA\u529B ${n}`,ioDigitalIn:n=>`\u30C7\u30B8\u30BF\u30EB\u5165\u529B ${n}`,ioAnalogIn:(n,e)=>`\u30A2\u30CA\u30ED\u30B0\u5165\u529B ${n} / ${e} V`,ioRegisters:(n,e,t)=>`${n} \u30EC\u30B8\u30B9\u30BF [${e}\u2026] ${t}`,ioReading:"\u8AAD\u307F\u53D6\u308A\u4E2D\u2026",ioFailed:n=>`\u8AAD\u307F\u53D6\u308A\u5931\u6557\uFF1A${n}`,ioSimInputNote:"\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3\u306B\u306F\u5165\u529B\u6E90\u304C\u3042\u308A\u307E\u305B\u3093\uFF1A\u5165\u529B\u306F 0 \u306E\u307E\u307E\u3001\u30EC\u30B8\u30B9\u30BF\u306F\u521D\u671F\u5024\u306E\u307E\u307E\u3067\u3059\u3002",simApplying:"\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3\u3092\u5207\u308A\u66FF\u3048\u4E2D\u2026",simFailed:n=>`\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3\u306E\u5207\u308A\u66FF\u3048\u306B\u5931\u6557\uFF1A${n}`,simUnsupported:"\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3\u306F\u904B\u52D5\u5B66\u306E\u307F\u5B9F\u88C5\u3057\u3066\u3044\u307E\u3059\uFF08\u30E2\u30FC\u30B7\u30E7\u30F3\u7CFB\u30C4\u30FC\u30EB\uFF0B\u59FF\u52E2\u306E\u8AAD\u307F\u623B\u3057\uFF09\u3002\u305D\u306E\u4ED6\u306E\u30B3\u30DE\u30F3\u30C9\u306F\u300C\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3\u610F\u5473\u8AD6\u306A\u3057\u300D\u3092\u8FD4\u3057\u307E\u3059\u3002",simCollapseStops:"\u30D1\u30CD\u30EB\u3092\u305F\u305F\u3080\u3068\u3053\u306E\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3\u306F\u505C\u6B62\u3057\u307E\u3059\u3002",simActiveStatus:n=>`\u30AA\u30D5\u30E9\u30A4\u30F3\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3 \xB7 ${n}`,simWatermark:"\u30AA\u30D5\u30E9\u30A4\u30F3\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3\uFF08\u5B9F\u6A5F\u3067\u306F\u3042\u308A\u307E\u305B\u3093\uFF09",controlsTcpPosition:"TCP \u4F4D\u7F6E (mm)",controlsTcpOrientation:"TCP \u59FF\u52E2 (\xB0)",controlsHome:"\u30DB\u30FC\u30E0",controlsHomeTitle:"\u30DB\u30FC\u30E0\uFF1A6 \u8EF8\u3059\u3079\u3066\u3092 [0\xB0, -90\xB0, 0\xB0, -90\xB0, 0\xB0, 0\xB0] \u306B",controlsStepMm:"\u30B9\u30C6\u30C3\u30D7 mm",controlsStepDeg:"\u30B9\u30C6\u30C3\u30D7 \xB0",controlsStepMmOptionTitle:n=>`\u30B9\u30C6\u30C3\u30D7 ${n} mm`,controlsStepDegOptionTitle:n=>`\u30B9\u30C6\u30C3\u30D7 ${n}\xB0`,controlsFrame:"\u5EA7\u6A19\u7CFB",controlsFrameTitle:"\u5EA7\u6A19\u7CFB",controlsFrameTool:"\u30C4\u30FC\u30EB",controlsFrameBase:"\u30D9\u30FC\u30B9",controlsFrameOptionTitle:n=>`${n}\u5EA7\u6A19\u7CFB\u3067\u30B8\u30E7\u30B0`,controlsJogPositionTitle:(n,e,t,i)=>`${n}\u5EA7\u6A19\u7CFB\u306E ${e} \u8EF8\u65B9\u5411\uFF08${t>0?"\u6B63":"\u8CA0"}\uFF09\u3078 ${i} mm \u79FB\u52D5`,controlsJogRotateTitle:(n,e,t,i)=>`${n}\u5EA7\u6A19\u7CFB\u306E ${e} \u8EF8\u307E\u308F\u308A\u306B ${i}\xB0 \u56DE\u8EE2\uFF08${t>0?"\u6B63":"\u8CA0"}\u65B9\u5411\uFF09`,controlsDisabledDisconnected:"\u30ED\u30DC\u30C3\u30C8\u672A\u63A5\u7D9A\uFF1A\u30B8\u30E7\u30B0\u64CD\u4F5C\u306F\u4F7F\u3048\u307E\u305B\u3093",controlsDisabledSimOnly:"\u30B8\u30E7\u30B0\u306F\u30AA\u30D5\u30E9\u30A4\u30F3\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3\u3067\u306E\u307F\u52D5\u4F5C\u3057\u307E\u3059\uFF1A\u5B9F\u6A5F\u3067\u306F\u30C4\u30FC\u30EB\u3092\u4F7F\u3063\u3066\u304F\u3060\u3055\u3044\uFF08\u627F\u8A8D\u4ED8\u304D\uFF09",controlsDisabledStale:"\u30C7\u30FC\u30BF\u30D5\u30A3\u30FC\u30C9\u304C\u505C\u6B62\u3057\u307E\u3057\u305F\uFF1A\u64CD\u4F5C\u306F\u4E00\u6642\u505C\u6B62\u3057\u3001\u81EA\u52D5\u3067\u5FA9\u5E30\u3057\u307E\u3059",controlsCommandFailed:n=>`\u30B8\u30E7\u30B0\u5931\u6557\uFF1A${n}`,controlsToolPosition:"TCP \u59FF\u52E2",controlsToolPositionTitle:"TCP \u59FF\u52E2\uFF1AX/Y/Z \u306F mm\u3001RX/RY/RZ \u306F\u30E9\u30B8\u30A2\u30F3\u3002Enter \u304B\u30D5\u30A9\u30FC\u30AB\u30B9\u5916\u3057\u3067 1 \u56DE\u306E\u59FF\u52E2\u30B3\u30DE\u30F3\u30C9\u3092\u9001\u4FE1",controlsSummary:(n,e,t)=>`TCP: ${n}, ${e}, ${t} m`,controlsSummaryTitle:"\u73FE\u5728\u306E TCP \u4F4D\u7F6E (m)",controlsJoints:"\u95A2\u7BC0",controlsJointsTitle:"\u30B9\u30E9\u30A4\u30C0\u30FC\u3092\u30C9\u30E9\u30C3\u30B0\u3057\u3066\u3082\u30ED\u30FC\u30AB\u30EB\u30D7\u30EC\u30D3\u30E5\u30FC\u306E\u307F\uFF08\u30B3\u30DE\u30F3\u30C9\u306F\u9001\u308A\u307E\u305B\u3093\uFF09\u3002\u96E2\u3059\u3068 movej \u3092 1 \u56DE\u9001\u4FE1\u3002\u25C0 \u25B6 \u306F 1\xB0 \u523B\u307F",controlsJointStepTitle:(n,e)=>`${n} \u95A2\u7BC0\uFF1A${e>0?"+1\xB0":"\u22121\xB0"}`,controlsJointBase:"\u30D9\u30FC\u30B9",controlsJointShoulder:"\u30B7\u30E7\u30EB\u30C0\u30FC",controlsJointElbow:"\u30A8\u30EB\u30DC\u30FC",controlsJointWrist1:"\u624B\u9996 1",controlsJointWrist2:"\u624B\u9996 2",controlsJointWrist3:"\u624B\u9996 3",controlsJointValue:n=>`${n.toFixed(1)}\xB0`,controlsInvalidRollback:"\u4E0D\u6B63\u306A\u5024\uFF1A\u6700\u65B0\u30D5\u30EC\u30FC\u30E0\u306B\u623B\u3057\u307E\u3057\u305F",controlsRejectedCommand:"\u30DB\u30B9\u30C8\u304C\u3053\u306E\u30B3\u30DE\u30F3\u30C9\u3092\u62D2\u5426\u3057\u307E\u3057\u305F",controlsNoPoseData:"\u59FF\u52E2\u30C7\u30FC\u30BF\u304C\u307E\u3060\u3042\u308A\u307E\u305B\u3093",controlsBusyRetry:"\u524D\u306E\u30B3\u30DE\u30F3\u30C9\u304C\u307E\u3060\u5B9F\u884C\u4E2D\u3067\u3059\uFF1A\u4F55\u3082\u9001\u3063\u3066\u3044\u307E\u305B\u3093\u3002\u3082\u3046\u4E00\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044",controlsStopFailed:n=>`\u505C\u6B62\u30B3\u30DE\u30F3\u30C9\u306E\u9001\u4FE1\u306B\u5931\u6557\uFF1A${n}`};var pd={statusDisconnected:"Rob\xF4 n\xE3o conectado",statusLoading:"Conectado \xB7 carregando modelo\u2026",statusConnected:"Conectado",statusFallbackSuffix:" (sem modelo embutido, usando geometria aproximada)",statusErrorPrefix:"Erro de renderiza\xE7\xE3o: ",statusLoadFailed:"Falha ao carregar o modelo: ",statusLoadRetrying:" (tentando novamente)",statusSwitchingModel:n=>`trocando para ${n}\u2026`,statusNoWebgl:"WebGL indispon\xEDvel aqui: alternado para o modo somente num\xE9rico (os \xE2ngulos das juntas e o TCP continuam atualizando)",statusIncomplete:"O rob\xF4 n\xE3o retornou um conjunto completo de \xE2ngulos das juntas",statusContextLost:"Contexto 3D perdido (rein\xEDcio da GPU) \u2014 recolha e reabra o painel para recuperar",statusSafetyHint:"O rob\xF4 pode ter parado; verifique o teach pendant",disconnectNeverConnected:"Rob\xF4 n\xE3o conectado: ursim_connect nunca foi bem-sucedido",disconnectReason:n=>`Rob\xF4 n\xE3o conectado${n?`: ${n}`:""}`,disconnectAmbiguous:n=>`H\xE1 mais de um rob\xF4 conectado; especifique o IP do rob\xF4${n}`,disconnectCandidates:n=>Array.isArray(n)&&n.length>0?` (candidatos: ${n.join(", ")})`:"",disconnectWorkerDown:n=>`O processo de controle UR est\xE1 indispon\xEDvel${n?`: ${n}`:""} (execute ursim_ping para verificar as depend\xEAncias de Python)`,disconnectReadFailed:n=>`Falha ao ler o estado do rob\xF4${n?`: ${n}`:""}`,jointsPrefix:"\xC2ngulos das juntas (\xB0)",tcpPrefix:"TCP (m / rad eixo-\xE2ngulo)",queryFailed:"falha na consulta",detailStatusFailed:n=>`Falha na consulta de estado: ${n}`,detailSafety:n=>`Seguran\xE7a ${n}`,detailRobotMode:n=>`Modo ${n}`,detailProgram:n=>`Programa ${n}`,detailSpeed:n=>`Velocidade ${n}`,detailRunning:"Em execu\xE7\xE3o",detailTempsPrefix:"Temp. (\xB0C)",detailTemps:n=>`Temp. (\xB0C) ${n}`,detailBus:(n,e)=>`Barramento ${n} V ${e} A`,overLimit:n=>`\u26A0 fora do limite ${n}`,safetyMode:{NORMAL:"Normal",REDUCED:"Reduzido",PROTECTIVE_STOP:"Parada protetiva",SAFEGUARD_STOP:"Parada de seguran\xE7a",EMERGENCY_STOP:"Parada de emerg\xEAncia",SYSTEM_EMERGENCY_STOP:"Parada de emerg\xEAncia do sistema",ROBOT_EMERGENCY_STOP:"Parada de emerg\xEAncia do rob\xF4",RECOVERY:"Recupera\xE7\xE3o",VIOLATION:"Viola\xE7\xE3o de seguran\xE7a",FAULT:"Falha",AUTOMATIC_MODE_SAFEGUARD_STOP:"Parada de seguran\xE7a em modo autom\xE1tico",SYSTEM_THREE_POSITION_ENABLING_STOP:"Parada por habilita\xE7\xE3o de tr\xEAs posi\xE7\xF5es"},robotMode:{POWER_OFF:"Desligado",POWER_ON:"Ligado",IDLE:"Ocioso",BACKDRIVE:"Retroacionamento",RUNNING:"Em execu\xE7\xE3o",BOOTING:"Inicializando",CONFIRM_SAFETY:"Confirmar seguran\xE7a",DISCONNECTED:"Desconectado",NO_CONTROLLER:"Sem controlador"},programState:{STOPPED:"Parado",PLAYING:"Reproduzindo",PAUSED:"Pausado"},viewReset:"Redefinir vista",viewIso:"Isom\xE9trica",viewFront:"Frontal",viewSide:"Lateral",viewTop:"Superior",identity:(n,e)=>`Rob\xF4 ${[n,e].filter(Boolean).join(" \xB7 ")}`,pendingPrefix:"Aguardando aprova\xE7\xE3o",canvasLabel:"Vista 3D da simula\xE7\xE3o do rob\xF4; as setas alternam a vista",hudLabel:"Leituras do rob\xF4 em tempo real",layerReach:"Alcance",layerBase:"Sistema base",layerForce:"For\xE7a",layerGhost:"Pose alvo",screenshot:"Captura de tela",screenshotLabel:"Exportar uma captura com marca d'\xE1gua",trajectoryClear:"Limpar trajet\xF3ria",trajectoryPause:"Pausar trajet\xF3ria",trajectoryResume:"Retomar trajet\xF3ria",trajectoryExport:"Exportar trajet\xF3ria",dockLabel:"NoneadURSim",dockDescription:"Vista da simula\xE7\xE3o do rob\xF4 em tempo real",dockCollapse:"Recolher",simTitle:"Simula\xE7\xE3o offline",simToggleOn:"Iniciar simula\xE7\xE3o",simToggleOff:"Parar simula\xE7\xE3o",simUses:"Enquanto estiver ativa, a IA controla este modelo aqui: as ferramentas de movimento movem este rob\xF4 virtual e nenhum rob\xF4 real \xE9 afetado.",simModelLabel:"Modelo",simPresetLabel:"Pose inicial",simSpeedLabel:"Escala de velocidade inicial",simPresetZero:"Pose zero",simPresetUpright:"Na vertical",simPresetReach:"Estendida",simBadge:"SIMULA\xC7\xC3O",simBadgeTitle:"Rob\xF4 virtual em simula\xE7\xE3o offline \u2014 n\xE3o \xE9 leitura de um rob\xF4 real e n\xE3o h\xE1 movimento real",modeBadgeIdle:"N\xC3O CONECTADO",modeBadgeIdleTitle:"Nenhuma simula\xE7\xE3o em andamento e nenhum rob\xF4 conectado \u2014 nada est\xE1 sendo comandado",realModeBadge:n=>`MODO REAL \xB7 ${n}`,realModeBadgeEmpty:"MODO REAL \xB7 lista de permitidos vazia (tudo \xE9 recusado)",realModeBadgeTitle:"Modo rob\xF4 real (motionMode: real): os comandos v\xE3o para os controladores da lista de permitidos \u2014 isto n\xE3o \xE9 uma simula\xE7\xE3o",detailCurrentsPrefix:"Corrente (A)",detailTcpSpeed:n=>`Velocidade TCP ${n} m/s`,detailEstimatedSuffix:" (estimado)",simCapsSummary:"O que a simula\xE7\xE3o pode e n\xE3o pode fazer",simCapsBucket:(n,e)=>`${n}: ${e}`,simCapsCannot:n=>`n\xE3o simulado: ${n}`,simCapsMotion:"Movimento",simCapsRead:"Leitura",simCapsIo:"E/S e registradores",simCapsTelemetry:"Telemetria",simRestoreFailed:n=>`N\xE3o foi poss\xEDvel restaurar a simula\xE7\xE3o anterior: ${n} (ative-a aqui para tentar novamente)`,riskOk:"OK",riskNear:"\u26A0 perto da singularidade",riskAt:"\u26A0 na singularidade",riskWrist:n=>`punho ${n}\xB0`,riskManip:n=>`manipulabilidade ${n}`,riskLimit:(n,e)=>`J${n} est\xE1 a ${e}\xB0 do limite`,riskTitle:"Crit\xE9rios de singularidade: \xE2ngulo da junta 5 (tende a 0 quando os eixos do punho se alinham) + manipulabilidade normalizada |det J|/reach\xB3 + dist\xE2ncia at\xE9 os limites das juntas",ioSummary:"E/S e registradores",ioDigitalOut:n=>`Sa\xEDda digital ${n}`,ioDigitalIn:n=>`Entrada digital ${n}`,ioAnalogIn:(n,e)=>`Entrada anal\xF3gica ${n} / ${e} V`,ioRegisters:(n,e,t)=>`registradores ${n} [${e}\u2026] ${t}`,ioReading:"lendo\u2026",ioFailed:n=>`falha na leitura: ${n}`,ioSimInputNote:"A simula\xE7\xE3o n\xE3o tem fonte de entrada: as entradas ficam em 0 e os registradores nos valores iniciais.",simApplying:"Trocando de simula\xE7\xE3o\u2026",simFailed:n=>`Falha ao trocar a simula\xE7\xE3o: ${n}`,simUnsupported:"A simula\xE7\xE3o implementa apenas cinem\xE1tica (ferramentas de movimento + leitura de pose); qualquer outro comando responde \xABsem sem\xE2ntica de simula\xE7\xE3o\xBB.",simCollapseStops:"Recolher o painel interrompe esta simula\xE7\xE3o.",simActiveStatus:n=>`Simula\xE7\xE3o offline \xB7 ${n}`,simWatermark:"Simula\xE7\xE3o offline (n\xE3o \xE9 um rob\xF4 real)",controlsTcpPosition:"Posi\xE7\xE3o TCP (mm)",controlsTcpOrientation:"Orienta\xE7\xE3o TCP (\xB0)",controlsHome:"Origem",controlsHomeTitle:"Origem: as seis juntas em [0\xB0, -90\xB0, 0\xB0, -90\xB0, 0\xB0, 0\xB0]",controlsStepMm:"Passo mm",controlsStepDeg:"Passo \xB0",controlsStepMmOptionTitle:n=>`Passo ${n} mm`,controlsStepDegOptionTitle:n=>`Passo ${n}\xB0`,controlsFrame:"Sistema",controlsFrameTitle:"Sistema",controlsFrameTool:"Ferramenta",controlsFrameBase:"Base",controlsFrameOptionTitle:n=>`Jog no sistema ${n}`,controlsJogPositionTitle:(n,e,t,i)=>`Mover ${i} mm ao longo do eixo ${e} no sistema ${n} (dire\xE7\xE3o ${t>0?"positiva":"negativa"})`,controlsJogRotateTitle:(n,e,t,i)=>`Girar ${i}\xB0 em torno do eixo ${e} no sistema ${n} (dire\xE7\xE3o ${t>0?"positiva":"negativa"})`,controlsDisabledDisconnected:"Rob\xF4 n\xE3o conectado: os controles de jog est\xE3o indispon\xEDveis",controlsDisabledSimOnly:"O jog funciona apenas na simula\xE7\xE3o offline: use as ferramentas para um rob\xF4 real (com aprova\xE7\xE3o)",controlsDisabledStale:"O fluxo de dados parou: os controles est\xE3o pausados e reativam automaticamente",controlsCommandFailed:n=>`Falha no jog: ${n}`,controlsToolPosition:"Pose TCP",controlsToolPositionTitle:"Pose TCP: X/Y/Z em mm, RX/RY/RZ em rad; Enter ou sair do campo envia um comando de pose",controlsSummary:(n,e,t)=>`TCP: ${n}, ${e}, ${t} m`,controlsSummaryTitle:"Posi\xE7\xE3o TCP atual (m)",controlsJoints:"Juntas",controlsJointsTitle:"Arrastar o controle deslizante apenas pr\xE9-visualiza localmente (nenhum comando \xE9 enviado); soltar envia um movej; \u25C0 \u25B6 avan\xE7am 1\xB0",controlsJointStepTitle:(n,e)=>`Junta ${n}: ${e>0?"+1\xB0":"\u22121\xB0"}`,controlsJointBase:"Base",controlsJointShoulder:"Ombro",controlsJointElbow:"Cotovelo",controlsJointWrist1:"Punho 1",controlsJointWrist2:"Punho 2",controlsJointWrist3:"Punho 3",controlsJointValue:n=>`${n.toFixed(1)}\xB0`,controlsInvalidRollback:"Valor inv\xE1lido: revertido para o \xFAltimo quadro",controlsRejectedCommand:"O host recusou este comando",controlsNoPoseData:"Ainda n\xE3o h\xE1 dados de pose",controlsBusyRetry:"O comando anterior ainda est\xE1 em andamento: nada foi enviado, tente novamente",controlsStopFailed:n=>`Falha ao enviar o comando de parada: ${n}`};var md={statusDisconnected:"\u0420\u043E\u0431\u043E\u0442 \u043D\u0435 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0451\u043D",statusLoading:"\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u043E \xB7 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043C\u043E\u0434\u0435\u043B\u0438\u2026",statusConnected:"\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u043E",statusFallbackSuffix:" (\u0432\u0441\u0442\u0440\u043E\u0435\u043D\u043D\u043E\u0439 \u043C\u043E\u0434\u0435\u043B\u0438 \u043D\u0435\u0442, \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0441\u044F \u0443\u043F\u0440\u043E\u0449\u0451\u043D\u043D\u0430\u044F \u0433\u0435\u043E\u043C\u0435\u0442\u0440\u0438\u044F)",statusErrorPrefix:"\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0442\u0440\u0438\u0441\u043E\u0432\u043A\u0438: ",statusLoadFailed:"\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u043C\u043E\u0434\u0435\u043B\u044C: ",statusLoadRetrying:" (\u043F\u043E\u0432\u0442\u043E\u0440)",statusSwitchingModel:n=>`\u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 \u043D\u0430 ${n}\u2026`,statusNoWebgl:"WebGL \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D: \u0432\u043A\u043B\u044E\u0447\u0451\u043D \u0440\u0435\u0436\u0438\u043C \u0442\u043E\u043B\u044C\u043A\u043E \u0447\u0438\u0441\u043B\u043E\u0432\u044B\u0445 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0439 (\u0443\u0433\u043B\u044B \u0441\u043E\u0447\u043B\u0435\u043D\u0435\u043D\u0438\u0439 \u0438 TCP \u043F\u0440\u043E\u0434\u043E\u043B\u0436\u0430\u044E\u0442 \u043E\u0431\u043D\u043E\u0432\u043B\u044F\u0442\u044C\u0441\u044F)",statusIncomplete:"\u0420\u043E\u0431\u043E\u0442 \u043D\u0435 \u0432\u0435\u0440\u043D\u0443\u043B \u043F\u043E\u043B\u043D\u044B\u0439 \u043D\u0430\u0431\u043E\u0440 \u0443\u0433\u043B\u043E\u0432 \u0441\u043E\u0447\u043B\u0435\u043D\u0435\u043D\u0438\u0439",statusContextLost:"\u041A\u043E\u043D\u0442\u0435\u043A\u0441\u0442 3D \u043F\u043E\u0442\u0435\u0440\u044F\u043D (\u0441\u0431\u0440\u043E\u0441 GPU) \u2014 \u0441\u0432\u0435\u0440\u043D\u0438\u0442\u0435 \u0438 \u0441\u043D\u043E\u0432\u0430 \u0440\u0430\u0437\u0432\u0435\u0440\u043D\u0438\u0442\u0435 \u043F\u0430\u043D\u0435\u043B\u044C, \u0447\u0442\u043E\u0431\u044B \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C",statusSafetyHint:"\u0412\u043E\u0437\u043C\u043E\u0436\u043D\u043E, \u0440\u043E\u0431\u043E\u0442 \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u043B\u0441\u044F; \u043F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u043F\u0443\u043B\u044C\u0442 \u043E\u0431\u0443\u0447\u0435\u043D\u0438\u044F",disconnectNeverConnected:"\u0420\u043E\u0431\u043E\u0442 \u043D\u0435 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0451\u043D: ursim_connect \u0435\u0449\u0451 \u043D\u0438 \u0440\u0430\u0437\u0443 \u043D\u0435 \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u043B\u0441\u044F \u0443\u0441\u043F\u0435\u0448\u043D\u043E",disconnectReason:n=>`\u0420\u043E\u0431\u043E\u0442 \u043D\u0435 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0451\u043D${n?`: ${n}`:""}`,disconnectAmbiguous:n=>`\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u043E \u043D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0440\u043E\u0431\u043E\u0442\u043E\u0432; \u0443\u043A\u0430\u0436\u0438\u0442\u0435 IP \u0440\u043E\u0431\u043E\u0442\u0430${n}`,disconnectCandidates:n=>Array.isArray(n)&&n.length>0?` (\u043A\u0430\u043D\u0434\u0438\u0434\u0430\u0442\u044B: ${n.join(", ")})`:"",disconnectWorkerDown:n=>`\u041F\u0440\u043E\u0446\u0435\u0441\u0441 \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F UR \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D${n?`: ${n}`:""} (\u0437\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u0435 ursim_ping, \u0447\u0442\u043E\u0431\u044B \u043F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u0437\u0430\u0432\u0438\u0441\u0438\u043C\u043E\u0441\u0442\u0438 Python)`,disconnectReadFailed:n=>`\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u0440\u043E\u0447\u0438\u0442\u0430\u0442\u044C \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435 \u0440\u043E\u0431\u043E\u0442\u0430${n?`: ${n}`:""}`,jointsPrefix:"\u0423\u0433\u043B\u044B \u0441\u043E\u0447\u043B\u0435\u043D\u0435\u043D\u0438\u0439 (\xB0)",tcpPrefix:"TCP (\u043C / \u0440\u0430\u0434 \u043E\u0441\u0438-\u0443\u0433\u043B\u0430)",queryFailed:"\u0437\u0430\u043F\u0440\u043E\u0441 \u043D\u0435 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D",detailStatusFailed:n=>`\u0417\u0430\u043F\u0440\u043E\u0441 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u044F \u043D\u0435 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D: ${n}`,detailSafety:n=>`\u0411\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E\u0441\u0442\u044C ${n}`,detailRobotMode:n=>`\u0420\u0435\u0436\u0438\u043C ${n}`,detailProgram:n=>`\u041F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0430 ${n}`,detailSpeed:n=>`\u0421\u043A\u043E\u0440\u043E\u0441\u0442\u044C ${n}`,detailRunning:"\u0412\u044B\u043F\u043E\u043B\u043D\u044F\u0435\u0442\u0441\u044F",detailTempsPrefix:"\u0422\u0435\u043C\u043F. (\xB0C)",detailTemps:n=>`\u0422\u0435\u043C\u043F. (\xB0C) ${n}`,detailBus:(n,e)=>`\u0428\u0438\u043D\u0430 ${n} \u0412 ${e} \u0410`,overLimit:n=>`\u26A0 \u0432\u044B\u0445\u043E\u0434 \u0437\u0430 \u043F\u0440\u0435\u0434\u0435\u043B ${n}`,safetyMode:{NORMAL:"\u041D\u043E\u0440\u043C\u0430",REDUCED:"\u041E\u0433\u0440\u0430\u043D\u0438\u0447\u0435\u043D\u043D\u044B\u0439",PROTECTIVE_STOP:"\u0417\u0430\u0449\u0438\u0442\u043D\u0430\u044F \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0430",SAFEGUARD_STOP:"\u041E\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0430 \u043F\u043E \u0437\u0430\u0449\u0438\u0442\u0435",EMERGENCY_STOP:"\u0410\u0432\u0430\u0440\u0438\u0439\u043D\u044B\u0439 \u043E\u0441\u0442\u0430\u043D\u043E\u0432",SYSTEM_EMERGENCY_STOP:"\u0421\u0438\u0441\u0442\u0435\u043C\u043D\u044B\u0439 \u0430\u0432\u0430\u0440\u0438\u0439\u043D\u044B\u0439 \u043E\u0441\u0442\u0430\u043D\u043E\u0432",ROBOT_EMERGENCY_STOP:"\u0410\u0432\u0430\u0440\u0438\u0439\u043D\u044B\u0439 \u043E\u0441\u0442\u0430\u043D\u043E\u0432 \u0440\u043E\u0431\u043E\u0442\u0430",RECOVERY:"\u0412\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0435",VIOLATION:"\u041D\u0430\u0440\u0443\u0448\u0435\u043D\u0438\u0435 \u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E\u0441\u0442\u0438",FAULT:"\u041D\u0435\u0438\u0441\u043F\u0440\u0430\u0432\u043D\u043E\u0441\u0442\u044C",AUTOMATIC_MODE_SAFEGUARD_STOP:"\u041E\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0430 \u043F\u043E \u0437\u0430\u0449\u0438\u0442\u0435 \u0432 \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u043E\u043C \u0440\u0435\u0436\u0438\u043C\u0435",SYSTEM_THREE_POSITION_ENABLING_STOP:"\u041E\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0430 \u043F\u043E \u0442\u0440\u0451\u0445\u043F\u043E\u0437\u0438\u0446\u0438\u043E\u043D\u043D\u043E\u043C\u0443 \u0440\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u0438\u044E"},robotMode:{POWER_OFF:"\u041F\u0438\u0442\u0430\u043D\u0438\u0435 \u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D\u043E",POWER_ON:"\u041F\u0438\u0442\u0430\u043D\u0438\u0435 \u0432\u043A\u043B\u044E\u0447\u0435\u043D\u043E",IDLE:"\u041E\u0436\u0438\u0434\u0430\u043D\u0438\u0435",BACKDRIVE:"\u041E\u0431\u0440\u0430\u0442\u043D\u044B\u0439 \u043F\u0440\u0438\u0432\u043E\u0434",RUNNING:"\u0412\u044B\u043F\u043E\u043B\u043D\u044F\u0435\u0442\u0441\u044F",BOOTING:"\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430",CONFIRM_SAFETY:"\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u0435 \u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E\u0441\u0442\u044C",DISCONNECTED:"\u041E\u0442\u043A\u043B\u044E\u0447\u0435\u043D\u043E",NO_CONTROLLER:"\u041D\u0435\u0442 \u043A\u043E\u043D\u0442\u0440\u043E\u043B\u043B\u0435\u0440\u0430"},programState:{STOPPED:"\u041E\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0430",PLAYING:"\u0412\u043E\u0441\u043F\u0440\u043E\u0438\u0437\u0432\u0435\u0434\u0435\u043D\u0438\u0435",PAUSED:"\u041F\u0430\u0443\u0437\u0430"},viewReset:"\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0432\u0438\u0434",viewIso:"\u0418\u0437\u043E\u043C\u0435\u0442\u0440\u0438\u044F",viewFront:"\u0421\u043F\u0435\u0440\u0435\u0434\u0438",viewSide:"\u0421\u0431\u043E\u043A\u0443",viewTop:"\u0421\u0432\u0435\u0440\u0445\u0443",identity:(n,e)=>`\u0420\u043E\u0431\u043E\u0442 ${[n,e].filter(Boolean).join(" \xB7 ")}`,pendingPrefix:"\u041E\u0436\u0438\u0434\u0430\u0435\u0442 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u044F",canvasLabel:"3D-\u0432\u0438\u0434 \u0441\u0438\u043C\u0443\u043B\u044F\u0446\u0438\u0438 \u0440\u043E\u0431\u043E\u0442\u0430; \u0441\u0442\u0440\u0435\u043B\u043A\u0438 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0430\u044E\u0442 \u0432\u0438\u0434",hudLabel:"\u041F\u043E\u043A\u0430\u0437\u0430\u043D\u0438\u044F \u0440\u043E\u0431\u043E\u0442\u0430 \u0432 \u0440\u0435\u0430\u043B\u044C\u043D\u043E\u043C \u0432\u0440\u0435\u043C\u0435\u043D\u0438",layerReach:"\u0417\u043E\u043D\u0430 \u0434\u043E\u0441\u044F\u0433\u0430\u0435\u043C\u043E\u0441\u0442\u0438",layerBase:"\u0411\u0430\u0437\u043E\u0432\u0430\u044F \u0441\u0438\u0441\u0442\u0435\u043C\u0430 \u043A\u043E\u043E\u0440\u0434\u0438\u043D\u0430\u0442",layerForce:"\u0421\u0438\u043B\u0430",layerGhost:"\u0426\u0435\u043B\u0435\u0432\u0430\u044F \u043F\u043E\u0437\u0430",screenshot:"\u0421\u043D\u0438\u043C\u043E\u043A",screenshotLabel:"\u042D\u043A\u0441\u043F\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0441\u043D\u0438\u043C\u043E\u043A \u0441 \u0432\u043E\u0434\u044F\u043D\u044B\u043C \u0437\u043D\u0430\u043A\u043E\u043C",trajectoryClear:"\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C \u0442\u0440\u0430\u0435\u043A\u0442\u043E\u0440\u0438\u044E",trajectoryPause:"\u041F\u0430\u0443\u0437\u0430 \u0442\u0440\u0430\u0435\u043A\u0442\u043E\u0440\u0438\u0438",trajectoryResume:"\u041F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u044C \u0442\u0440\u0430\u0435\u043A\u0442\u043E\u0440\u0438\u044E",trajectoryExport:"\u042D\u043A\u0441\u043F\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0442\u0440\u0430\u0435\u043A\u0442\u043E\u0440\u0438\u044E",dockLabel:"NoneadURSim",dockDescription:"\u0412\u0438\u0434 \u0441\u0438\u043C\u0443\u043B\u044F\u0446\u0438\u0438 \u0440\u043E\u0431\u043E\u0442\u0430 \u0432 \u0440\u0435\u0430\u043B\u044C\u043D\u043E\u043C \u0432\u0440\u0435\u043C\u0435\u043D\u0438",dockCollapse:"\u0421\u0432\u0435\u0440\u043D\u0443\u0442\u044C",simTitle:"\u0410\u0432\u0442\u043E\u043D\u043E\u043C\u043D\u0430\u044F \u0441\u0438\u043C\u0443\u043B\u044F\u0446\u0438\u044F",simToggleOn:"\u0417\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u044C \u0441\u0438\u043C\u0443\u043B\u044F\u0446\u0438\u044E",simToggleOff:"\u041E\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C \u0441\u0438\u043C\u0443\u043B\u044F\u0446\u0438\u044E",simUses:"\u041F\u043E\u043A\u0430 \u043E\u043D\u0430 \u0432\u043A\u043B\u044E\u0447\u0435\u043D\u0430, \u0418\u0418 \u0443\u043F\u0440\u0430\u0432\u043B\u044F\u0435\u0442 \u044D\u0442\u043E\u0439 \u043C\u043E\u0434\u0435\u043B\u044C\u044E \u043F\u0440\u044F\u043C\u043E \u0437\u0434\u0435\u0441\u044C: \u0438\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u044B \u0434\u0432\u0438\u0436\u0435\u043D\u0438\u044F \u0434\u0432\u0438\u0433\u0430\u044E\u0442 \u044D\u0442\u043E\u0433\u043E \u0432\u0438\u0440\u0442\u0443\u0430\u043B\u044C\u043D\u043E\u0433\u043E \u0440\u043E\u0431\u043E\u0442\u0430, \u0440\u0435\u0430\u043B\u044C\u043D\u044B\u0439 \u0440\u043E\u0431\u043E\u0442 \u043D\u0435 \u0437\u0430\u0442\u0440\u0430\u0433\u0438\u0432\u0430\u0435\u0442\u0441\u044F.",simModelLabel:"\u041C\u043E\u0434\u0435\u043B\u044C",simPresetLabel:"\u041D\u0430\u0447\u0430\u043B\u044C\u043D\u0430\u044F \u043F\u043E\u0437\u0430",simSpeedLabel:"\u041D\u0430\u0447\u0430\u043B\u044C\u043D\u044B\u0439 \u043C\u0430\u0441\u0448\u0442\u0430\u0431 \u0441\u043A\u043E\u0440\u043E\u0441\u0442\u0438",simPresetZero:"\u041D\u0443\u043B\u0435\u0432\u0430\u044F \u043F\u043E\u0437\u0430",simPresetUpright:"\u0412\u0435\u0440\u0442\u0438\u043A\u0430\u043B\u044C\u043D\u043E",simPresetReach:"\u0412\u044B\u0442\u044F\u043D\u0443\u0442\u043E",simBadge:"\u0421\u0418\u041C\u0423\u041B\u042F\u0426\u0418\u042F",simBadgeTitle:"\u0412\u0438\u0440\u0442\u0443\u0430\u043B\u044C\u043D\u044B\u0439 \u0440\u043E\u0431\u043E\u0442 \u0432 \u0430\u0432\u0442\u043E\u043D\u043E\u043C\u043D\u043E\u0439 \u0441\u0438\u043C\u0443\u043B\u044F\u0446\u0438\u0438 \u2014 \u044D\u0442\u043E \u043D\u0435 \u043F\u043E\u043A\u0430\u0437\u0430\u043D\u0438\u044F \u0440\u0435\u0430\u043B\u044C\u043D\u043E\u0433\u043E \u0440\u043E\u0431\u043E\u0442\u0430 \u0438 \u043D\u0435 \u0440\u0435\u0430\u043B\u044C\u043D\u043E\u0435 \u0434\u0432\u0438\u0436\u0435\u043D\u0438\u0435",modeBadgeIdle:"\u041D\u0415 \u041F\u041E\u0414\u041A\u041B\u042E\u0427\u0415\u041D\u041E",modeBadgeIdleTitle:"\u0421\u0438\u043C\u0443\u043B\u044F\u0446\u0438\u044F \u043D\u0435 \u0437\u0430\u043F\u0443\u0449\u0435\u043D\u0430 \u0438 \u0440\u043E\u0431\u043E\u0442 \u043D\u0435 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0451\u043D \u2014 \u043D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u0443\u043F\u0440\u0430\u0432\u043B\u044F\u0435\u0442\u0441\u044F",realModeBadge:n=>`\u0420\u0415\u0410\u041B\u042C\u041D\u042B\u0419 \u0420\u0415\u0416\u0418\u041C \xB7 ${n}`,realModeBadgeEmpty:"\u0420\u0415\u0410\u041B\u042C\u041D\u042B\u0419 \u0420\u0415\u0416\u0418\u041C \xB7 \u0441\u043F\u0438\u0441\u043E\u043A \u0440\u0430\u0437\u0440\u0435\u0448\u0451\u043D\u043D\u044B\u0445 \u043F\u0443\u0441\u0442 (\u0432\u0441\u0451 \u043E\u0442\u043A\u043B\u043E\u043D\u044F\u0435\u0442\u0441\u044F)",realModeBadgeTitle:"\u0420\u0435\u0436\u0438\u043C \u0440\u0435\u0430\u043B\u044C\u043D\u043E\u0433\u043E \u0440\u043E\u0431\u043E\u0442\u0430 (motionMode: real): \u043A\u043E\u043C\u0430\u043D\u0434\u044B \u0438\u0434\u0443\u0442 \u043A\u043E\u043D\u0442\u0440\u043E\u043B\u043B\u0435\u0440\u0430\u043C \u0438\u0437 \u0441\u043F\u0438\u0441\u043A\u0430 \u0440\u0430\u0437\u0440\u0435\u0448\u0451\u043D\u043D\u044B\u0445 \u2014 \u044D\u0442\u043E \u043D\u0435 \u0441\u0438\u043C\u0443\u043B\u044F\u0446\u0438\u044F",detailCurrentsPrefix:"\u0422\u043E\u043A (\u0410)",detailTcpSpeed:n=>`\u0421\u043A\u043E\u0440\u043E\u0441\u0442\u044C TCP ${n} \u043C/\u0441`,detailEstimatedSuffix:" (\u043E\u0446\u0435\u043D\u043A\u0430)",simCapsSummary:"\u0427\u0442\u043E \u0441\u0438\u043C\u0443\u043B\u044F\u0446\u0438\u044F \u043C\u043E\u0436\u0435\u0442 \u0438 \u0447\u0435\u0433\u043E \u043D\u0435 \u043C\u043E\u0436\u0435\u0442",simCapsBucket:(n,e)=>`${n}: ${e}`,simCapsCannot:n=>`\u043D\u0435 \u0441\u0438\u043C\u0443\u043B\u0438\u0440\u0443\u0435\u0442\u0441\u044F: ${n}`,simCapsMotion:"\u0414\u0432\u0438\u0436\u0435\u043D\u0438\u0435",simCapsRead:"\u041E\u0431\u0440\u0430\u0442\u043D\u043E\u0435 \u0447\u0442\u0435\u043D\u0438\u0435",simCapsIo:"\u0412/\u0412 \u0438 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u044B",simCapsTelemetry:"\u0422\u0435\u043B\u0435\u043C\u0435\u0442\u0440\u0438\u044F",simRestoreFailed:n=>`\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C \u043F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0443\u044E \u0441\u0438\u043C\u0443\u043B\u044F\u0446\u0438\u044E: ${n} (\u0432\u043A\u043B\u044E\u0447\u0438\u0442\u0435 \u0435\u0451 \u0437\u0434\u0435\u0441\u044C, \u0447\u0442\u043E\u0431\u044B \u043F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C)`,riskOk:"OK",riskNear:"\u26A0 \u0431\u043B\u0438\u0437\u043A\u043E \u043A \u0441\u0438\u043D\u0433\u0443\u043B\u044F\u0440\u043D\u043E\u0441\u0442\u0438",riskAt:"\u26A0 \u0441\u0438\u043D\u0433\u0443\u043B\u044F\u0440\u043D\u043E\u0441\u0442\u044C",riskWrist:n=>`\u0437\u0430\u043F\u044F\u0441\u0442\u044C\u0435 ${n}\xB0`,riskManip:n=>`\u043C\u0430\u043D\u0438\u043F\u0443\u043B\u0438\u0440\u0443\u0435\u043C\u043E\u0441\u0442\u044C ${n}`,riskLimit:(n,e)=>`J${n} \u0432 ${e}\xB0 \u043E\u0442 \u043F\u0440\u0435\u0434\u0435\u043B\u0430`,riskTitle:"\u041A\u0440\u0438\u0442\u0435\u0440\u0438\u0438 \u0441\u0438\u043D\u0433\u0443\u043B\u044F\u0440\u043D\u043E\u0441\u0442\u0438: \u0443\u0433\u043E\u043B 5-\u0433\u043E \u0441\u043E\u0447\u043B\u0435\u043D\u0435\u043D\u0438\u044F (\u0441\u0442\u0440\u0435\u043C\u0438\u0442\u0441\u044F \u043A 0, \u043A\u043E\u0433\u0434\u0430 \u043E\u0441\u0438 \u0437\u0430\u043F\u044F\u0441\u0442\u044C\u044F \u0432\u044B\u0441\u0442\u0440\u0430\u0438\u0432\u0430\u044E\u0442\u0441\u044F) + \u043D\u043E\u0440\u043C\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u0430\u044F \u043C\u0430\u043D\u0438\u043F\u0443\u043B\u0438\u0440\u0443\u0435\u043C\u043E\u0441\u0442\u044C |det J|/reach\xB3 + \u0440\u0430\u0441\u0441\u0442\u043E\u044F\u043D\u0438\u0435 \u0434\u043E \u043F\u0440\u0435\u0434\u0435\u043B\u043E\u0432 \u0441\u043E\u0447\u043B\u0435\u043D\u0435\u043D\u0438\u0439",ioSummary:"\u0412/\u0412 \u0438 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u044B",ioDigitalOut:n=>`\u0426\u0438\u0444\u0440\u043E\u0432\u043E\u0439 \u0432\u044B\u0445\u043E\u0434 ${n}`,ioDigitalIn:n=>`\u0426\u0438\u0444\u0440\u043E\u0432\u043E\u0439 \u0432\u0445\u043E\u0434 ${n}`,ioAnalogIn:(n,e)=>`\u0410\u043D\u0430\u043B\u043E\u0433\u043E\u0432\u044B\u0439 \u0432\u0445\u043E\u0434 ${n} / ${e} \u0412`,ioRegisters:(n,e,t)=>`\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u044B ${n} [${e}\u2026] ${t}`,ioReading:"\u0447\u0442\u0435\u043D\u0438\u0435\u2026",ioFailed:n=>`\u0447\u0442\u0435\u043D\u0438\u0435 \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C: ${n}`,ioSimInputNote:"\u0423 \u0441\u0438\u043C\u0443\u043B\u044F\u0446\u0438\u0438 \u043D\u0435\u0442 \u0438\u0441\u0442\u043E\u0447\u043D\u0438\u043A\u0430 \u0432\u0445\u043E\u0434\u043D\u044B\u0445 \u0441\u0438\u0433\u043D\u0430\u043B\u043E\u0432: \u0432\u0445\u043E\u0434\u044B \u043E\u0441\u0442\u0430\u044E\u0442\u0441\u044F 0, \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u044B \u2014 \u043D\u0430\u0447\u0430\u043B\u044C\u043D\u044B\u043C\u0438 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F\u043C\u0438.",simApplying:"\u041F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 \u0441\u0438\u043C\u0443\u043B\u044F\u0446\u0438\u0438\u2026",simFailed:n=>`\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0441\u0438\u043C\u0443\u043B\u044F\u0446\u0438\u044E: ${n}`,simUnsupported:"\u0421\u0438\u043C\u0443\u043B\u044F\u0446\u0438\u044F \u0440\u0435\u0430\u043B\u0438\u0437\u0443\u0435\u0442 \u0442\u043E\u043B\u044C\u043A\u043E \u043A\u0438\u043D\u0435\u043C\u0430\u0442\u0438\u043A\u0443 (\u0438\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u044B \u0434\u0432\u0438\u0436\u0435\u043D\u0438\u044F + \u0447\u0442\u0435\u043D\u0438\u0435 \u043F\u043E\u0437\u044B); \u043B\u044E\u0431\u0430\u044F \u0434\u0440\u0443\u0433\u0430\u044F \u043A\u043E\u043C\u0430\u043D\u0434\u0430 \u043E\u0442\u0432\u0435\u0447\u0430\u0435\u0442 \xAB\u043D\u0435\u0442 \u0441\u0435\u043C\u0430\u043D\u0442\u0438\u043A\u0438 \u0441\u0438\u043C\u0443\u043B\u044F\u0446\u0438\u0438\xBB.",simCollapseStops:"\u041F\u0440\u0438 \u0441\u0432\u043E\u0440\u0430\u0447\u0438\u0432\u0430\u043D\u0438\u0438 \u043F\u0430\u043D\u0435\u043B\u0438 \u044D\u0442\u0430 \u0441\u0438\u043C\u0443\u043B\u044F\u0446\u0438\u044F \u043E\u0441\u0442\u0430\u043D\u0430\u0432\u043B\u0438\u0432\u0430\u0435\u0442\u0441\u044F.",simActiveStatus:n=>`\u0410\u0432\u0442\u043E\u043D\u043E\u043C\u043D\u0430\u044F \u0441\u0438\u043C\u0443\u043B\u044F\u0446\u0438\u044F \xB7 ${n}`,simWatermark:"\u0410\u0432\u0442\u043E\u043D\u043E\u043C\u043D\u0430\u044F \u0441\u0438\u043C\u0443\u043B\u044F\u0446\u0438\u044F (\u043D\u0435 \u0440\u0435\u0430\u043B\u044C\u043D\u044B\u0439 \u0440\u043E\u0431\u043E\u0442)",controlsTcpPosition:"\u041F\u043E\u043B\u043E\u0436\u0435\u043D\u0438\u0435 TCP (\u043C\u043C)",controlsTcpOrientation:"\u041E\u0440\u0438\u0435\u043D\u0442\u0430\u0446\u0438\u044F TCP (\xB0)",controlsHome:"\u0414\u043E\u043C\u043E\u0439",controlsHomeTitle:"\u0414\u043E\u043C\u043E\u0439: \u0432\u0441\u0435 \u0448\u0435\u0441\u0442\u044C \u0441\u043E\u0447\u043B\u0435\u043D\u0435\u043D\u0438\u0439 \u0432 [0\xB0, -90\xB0, 0\xB0, -90\xB0, 0\xB0, 0\xB0]",controlsStepMm:"\u0428\u0430\u0433 \u043C\u043C",controlsStepDeg:"\u0428\u0430\u0433 \xB0",controlsStepMmOptionTitle:n=>`\u0428\u0430\u0433 ${n} \u043C\u043C`,controlsStepDegOptionTitle:n=>`\u0428\u0430\u0433 ${n}\xB0`,controlsFrame:"\u0421\u0438\u0441\u0442\u0435\u043C\u0430",controlsFrameTitle:"\u0421\u0438\u0441\u0442\u0435\u043C\u0430",controlsFrameTool:"\u0418\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442",controlsFrameBase:"\u0411\u0430\u0437\u0430",controlsFrameOptionTitle:n=>`\u0414\u0436\u043E\u0433 \u0432 \u0441\u0438\u0441\u0442\u0435\u043C\u0435 ${n}`,controlsJogPositionTitle:(n,e,t,i)=>`\u041F\u0435\u0440\u0435\u043C\u0435\u0441\u0442\u0438\u0442\u044C \u043D\u0430 ${i} \u043C\u043C \u0432\u0434\u043E\u043B\u044C \u043E\u0441\u0438 ${e} \u0432 \u0441\u0438\u0441\u0442\u0435\u043C\u0435 ${n} (${t>0?"\u043F\u043E\u043B\u043E\u0436\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0435":"\u043E\u0442\u0440\u0438\u0446\u0430\u0442\u0435\u043B\u044C\u043D\u043E\u0435"} \u043D\u0430\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435)`,controlsJogRotateTitle:(n,e,t,i)=>`\u041F\u043E\u0432\u0435\u0440\u043D\u0443\u0442\u044C \u043D\u0430 ${i}\xB0 \u0432\u043E\u043A\u0440\u0443\u0433 \u043E\u0441\u0438 ${e} \u0432 \u0441\u0438\u0441\u0442\u0435\u043C\u0435 ${n} (${t>0?"\u043F\u043E\u043B\u043E\u0436\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0435":"\u043E\u0442\u0440\u0438\u0446\u0430\u0442\u0435\u043B\u044C\u043D\u043E\u0435"} \u043D\u0430\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435)`,controlsDisabledDisconnected:"\u0420\u043E\u0431\u043E\u0442 \u043D\u0435 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0451\u043D: \u0434\u0436\u043E\u0433 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D",controlsDisabledSimOnly:"\u0414\u0436\u043E\u0433 \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u0442\u043E\u043B\u044C\u043A\u043E \u0432 \u0430\u0432\u0442\u043E\u043D\u043E\u043C\u043D\u043E\u0439 \u0441\u0438\u043C\u0443\u043B\u044F\u0446\u0438\u0438: \u0434\u043B\u044F \u0440\u0435\u0430\u043B\u044C\u043D\u043E\u0433\u043E \u0440\u043E\u0431\u043E\u0442\u0430 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435 \u0438\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u044B (\u0441 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u0435\u043C)",controlsDisabledStale:"\u041F\u043E\u0442\u043E\u043A \u0434\u0430\u043D\u043D\u044B\u0445 \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u043B\u0441\u044F: \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043F\u0440\u0438\u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043E \u0438 \u0432\u043A\u043B\u044E\u0447\u0438\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438",controlsCommandFailed:n=>`\u0414\u0436\u043E\u0433 \u043D\u0435 \u0443\u0434\u0430\u043B\u0441\u044F: ${n}`,controlsToolPosition:"\u041F\u043E\u0437\u0430 TCP",controlsToolPositionTitle:"\u041F\u043E\u0437\u0430 TCP: X/Y/Z \u0432 \u043C\u043C, RX/RY/RZ \u0432 \u0440\u0430\u0434; Enter \u0438\u043B\u0438 \u043F\u043E\u0442\u0435\u0440\u044F \u0444\u043E\u043A\u0443\u0441\u0430 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u044F\u0435\u0442 \u043E\u0434\u043D\u0443 \u043A\u043E\u043C\u0430\u043D\u0434\u0443 \u043F\u043E\u0437\u044B",controlsSummary:(n,e,t)=>`TCP: ${n}, ${e}, ${t} \u043C`,controlsSummaryTitle:"\u0422\u0435\u043A\u0443\u0449\u0435\u0435 \u043F\u043E\u043B\u043E\u0436\u0435\u043D\u0438\u0435 TCP (\u043C)",controlsJoints:"\u0421\u043E\u0447\u043B\u0435\u043D\u0435\u043D\u0438\u044F",controlsJointsTitle:"\u041F\u0435\u0440\u0435\u0442\u0430\u0441\u043A\u0438\u0432\u0430\u043D\u0438\u0435 \u043F\u043E\u043B\u0437\u0443\u043D\u043A\u0430 \u2014 \u0442\u043E\u043B\u044C\u043A\u043E \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0439 \u043F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440 (\u043A\u043E\u043C\u0430\u043D\u0434\u0430 \u043D\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u044F\u0435\u0442\u0441\u044F); \u043E\u0442\u043F\u0443\u0441\u043A\u0430\u043D\u0438\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u044F\u0435\u0442 \u043E\u0434\u0438\u043D movej; \u25C0 \u25B6 \u0448\u0430\u0433 1\xB0",controlsJointStepTitle:(n,e)=>`\u0421\u043E\u0447\u043B\u0435\u043D\u0435\u043D\u0438\u0435 ${n}: ${e>0?"+1\xB0":"\u22121\xB0"}`,controlsJointBase:"\u0411\u0430\u0437\u0430",controlsJointShoulder:"\u041F\u043B\u0435\u0447\u043E",controlsJointElbow:"\u041B\u043E\u043A\u043E\u0442\u044C",controlsJointWrist1:"\u0417\u0430\u043F\u044F\u0441\u0442\u044C\u0435 1",controlsJointWrist2:"\u0417\u0430\u043F\u044F\u0441\u0442\u044C\u0435 2",controlsJointWrist3:"\u0417\u0430\u043F\u044F\u0441\u0442\u044C\u0435 3",controlsJointValue:n=>`${n.toFixed(1)}\xB0`,controlsInvalidRollback:"\u041D\u0435\u0434\u043E\u043F\u0443\u0441\u0442\u0438\u043C\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435: \u0432\u043E\u0437\u0432\u0440\u0430\u0442 \u043A \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0435\u043C\u0443 \u043A\u0430\u0434\u0440\u0443",controlsRejectedCommand:"\u0425\u043E\u0441\u0442 \u043E\u0442\u043A\u043B\u043E\u043D\u0438\u043B \u044D\u0442\u0443 \u043A\u043E\u043C\u0430\u043D\u0434\u0443",controlsNoPoseData:"\u0414\u0430\u043D\u043D\u044B\u0445 \u043E \u043F\u043E\u0437\u0435 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442",controlsBusyRetry:"\u041F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0430\u044F \u043A\u043E\u043C\u0430\u043D\u0434\u0430 \u0435\u0449\u0451 \u0432\u044B\u043F\u043E\u043B\u043D\u044F\u0435\u0442\u0441\u044F: \u043D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E, \u043F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u0435 \u043F\u043E\u043F\u044B\u0442\u043A\u0443",controlsStopFailed:n=>`\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u043A\u043E\u043C\u0430\u043D\u0434\u0443 \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0438: ${n}`};var gd={statusDisconnected:"\u672A\u8FDE\u63A5\u673A\u5668\u4EBA",statusLoading:"\u5DF2\u8FDE\u63A5 \xB7 \u6B63\u5728\u52A0\u8F7D\u6A21\u578B\u2026",statusConnected:"\u5DF2\u8FDE\u63A5",statusFallbackSuffix:"\uFF08\u65E0\u5185\u7F6E\u6A21\u578B\uFF0C\u4F7F\u7528\u8FD1\u4F3C\u51E0\u4F55\u4F53\uFF09",statusErrorPrefix:"\u6E32\u67D3\u5F02\u5E38\uFF1A",statusLoadFailed:"\u6A21\u578B\u52A0\u8F7D\u5931\u8D25\uFF1A",statusLoadRetrying:"\uFF08\u6B63\u5728\u91CD\u8BD5\uFF09",statusSwitchingModel:n=>`\u5207\u6362\u578B\u53F7 ${n}\u2026`,statusNoWebgl:"\u5F53\u524D\u73AF\u5883\u4E0D\u652F\u6301 WebGL\uFF1A\u5DF2\u5207\u6362\u4E3A\u7EAF\u6570\u503C\u6A21\u5F0F\uFF08\u5173\u8282\u89D2\u4E0E TCP \u4ECD\u4F1A\u66F4\u65B0\uFF09",statusIncomplete:"\u673A\u5668\u4EBA\u672A\u8FD4\u56DE\u5B8C\u6574\u7684\u5173\u8282\u89D2",statusContextLost:"3D \u4E0A\u4E0B\u6587\u4E22\u5931\uFF08GPU \u91CD\u7F6E\uFF09\u2014\u2014 \u6536\u8D77\u5E76\u91CD\u65B0\u5C55\u5F00\u9762\u677F\u53EF\u6062\u590D",statusSafetyHint:"\u673A\u5668\u4EBA\u53EF\u80FD\u5DF2\u505C\u6B62\uFF0C\u8BF7\u68C0\u67E5\u793A\u6559\u5668",disconnectNeverConnected:"\u672A\u8FDE\u63A5\u673A\u5668\u4EBA\uFF1A\u8FD8\u6CA1\u6709\u6210\u529F\u6267\u884C\u8FC7 ursim_connect",disconnectReason:n=>`\u673A\u5668\u4EBA\u672A\u8FDE\u63A5${n?`\uFF1A${n}`:""}`,disconnectAmbiguous:n=>`\u68C0\u6D4B\u5230\u591A\u53F0\u5DF2\u8FDE\u63A5\u673A\u5668\u4EBA\uFF0C\u8BF7\u6307\u5B9A\u673A\u5668\u4EBA IP${n}`,disconnectCandidates:n=>Array.isArray(n)&&n.length>0?`\uFF08\u5019\u9009\uFF1A${n.join("\u3001")}\uFF09`:"",disconnectWorkerDown:n=>`UR \u63A7\u5236\u8FDB\u7A0B\u4E0D\u53EF\u7528${n?`\uFF1A${n}`:""}\uFF08\u53EF\u8FD0\u884C ursim_ping \u81EA\u68C0 Python \u4F9D\u8D56\uFF09`,disconnectReadFailed:n=>`\u8BFB\u53D6\u673A\u5668\u4EBA\u72B6\u6001\u5931\u8D25${n?`\uFF1A${n}`:""}`,jointsPrefix:"\u5173\u8282\u89D2 (\xB0)",tcpPrefix:"TCP(\u7C73/\u8F74\u89D2\u5F27\u5EA6)",queryFailed:"\u67E5\u8BE2\u5931\u8D25",detailStatusFailed:n=>`\u72B6\u6001\u67E5\u8BE2\u5931\u8D25\uFF1A${n}`,detailSafety:n=>`\u5B89\u5168 ${n}`,detailRobotMode:n=>`\u6A21\u5F0F ${n}`,detailProgram:n=>`\u7A0B\u5E8F ${n}`,detailSpeed:n=>`\u901F\u5EA6 ${n}`,detailRunning:"\u8FD0\u884C\u4E2D",detailTempsPrefix:"\u6E29\u5EA6(\xB0C)",detailTemps:n=>`\u6E29\u5EA6(\xB0C)  ${n}`,detailBus:(n,e)=>`\u6BCD\u7EBF ${n} V  ${e} A`,overLimit:n=>`\u26A0 \u8D85\u9650 ${n}`,safetyMode:{NORMAL:"\u6B63\u5E38",REDUCED:"\u7F29\u51CF\u6A21\u5F0F",PROTECTIVE_STOP:"\u4FDD\u62A4\u6027\u505C\u6B62",SAFEGUARD_STOP:"\u5B89\u5168\u505C\u6B62",EMERGENCY_STOP:"\u6025\u505C",SYSTEM_EMERGENCY_STOP:"\u7CFB\u7EDF\u6025\u505C",ROBOT_EMERGENCY_STOP:"\u673A\u5668\u4EBA\u6025\u505C",RECOVERY:"\u6062\u590D\u4E2D",VIOLATION:"\u8FDD\u53CD\u5B89\u5168\u9650\u5236",FAULT:"\u6545\u969C",AUTOMATIC_MODE_SAFEGUARD_STOP:"\u81EA\u52A8\u6A21\u5F0F\u5B89\u5168\u505C\u6B62",SYSTEM_THREE_POSITION_ENABLING_STOP:"\u4E09\u4F4D\u4F7F\u80FD\u505C\u6B62"},robotMode:{POWER_OFF:"\u5DF2\u4E0B\u7535",POWER_ON:"\u5DF2\u4E0A\u7535",IDLE:"\u7A7A\u95F2",BACKDRIVE:"\u62D6\u52A8",RUNNING:"\u8FD0\u884C\u4E2D",BOOTING:"\u542F\u52A8\u4E2D",CONFIRM_SAFETY:"\u5F85\u786E\u8BA4\u5B89\u5168",DISCONNECTED:"\u672A\u8FDE\u63A5",NO_CONTROLLER:"\u65E0\u63A7\u5236\u5668"},programState:{STOPPED:"\u5DF2\u505C\u6B62",PLAYING:"\u8FD0\u884C\u4E2D",PAUSED:"\u5DF2\u6682\u505C"},viewReset:"\u91CD\u7F6E\u89C6\u89D2",viewIso:"\u7B49\u8F74\u6D4B",viewFront:"\u524D\u89C6",viewSide:"\u4FA7\u89C6",viewTop:"\u4FEF\u89C6",identity:(n,e)=>`\u673A\u5668\u4EBA  ${[n,e].filter(Boolean).join("  \xB7  ")}`,pendingPrefix:"\u5F85\u5BA1\u6279",canvasLabel:"\u673A\u5668\u4EBA\u6570\u5B57\u4EFF\u771F 3D \u89C6\u56FE\uFF1B\u53EF\u7528\u65B9\u5411\u952E\u5207\u6362\u89C6\u89D2",hudLabel:"\u673A\u5668\u4EBA\u5B9E\u65F6\u8BFB\u6570",layerReach:"\u53EF\u8FBE\u8303\u56F4",layerBase:"\u57FA\u5EA7\u7CFB",layerForce:"\u53D7\u529B",layerGhost:"\u76EE\u6807\u59FF\u6001",screenshot:"\u622A\u56FE",screenshotLabel:"\u5BFC\u51FA\u5E26\u6C34\u5370\u7684\u622A\u56FE",trajectoryClear:"\u6E05\u8F68\u8FF9",trajectoryPause:"\u6682\u505C\u8F68\u8FF9",trajectoryResume:"\u7EE7\u7EED\u8BB0\u5F55",trajectoryExport:"\u5BFC\u51FA\u8F68\u8FF9",dockLabel:"NoneadURSim",dockDescription:"\u673A\u5668\u4EBA\u5B9E\u65F6\u4EFF\u771F\u89C6\u56FE",dockCollapse:"\u6536\u8D77",simTitle:"\u79BB\u7EBF\u4EFF\u771F",simToggleOn:"\u5F00\u542F\u4EFF\u771F",simToggleOff:"\u5173\u95ED\u4EFF\u771F",simUses:"\u5F00\u542F\u540E\u7531 AI \u76F4\u63A5\u9A71\u52A8\u8FD9\u91CC\u7684\u6A21\u578B\uFF1A\u8FD0\u52A8\u7C7B\u5DE5\u5177\u4F1A\u52A8\u8FD9\u53F0\u865A\u62DF\u673A\u5668\u4EBA\uFF0C\u771F\u673A\u4E0D\u53D7\u5F71\u54CD\u3002",simModelLabel:"\u578B\u53F7",simPresetLabel:"\u8D77\u59CB\u59FF\u6001",simSpeedLabel:"\u8D77\u59CB\u500D\u7387",simPresetZero:"\u5168\u96F6\u4F4D",simPresetUpright:"\u7AD6\u76F4\u6536\u62E2",simPresetReach:"\u4FA7\u4F38",simBadge:"\u4EFF\u771F",simBadgeTitle:"\u79BB\u7EBF\u4EFF\u771F\u4E2D\u7684\u865A\u62DF\u673A\u5668\u4EBA \u2014\u2014 \u4E0D\u662F\u771F\u673A\u8BFB\u6570\uFF0C\u4E0D\u4F1A\u6709\u771F\u673A\u52A8\u4F5C",modeBadgeIdle:"\u672A\u8FDE\u63A5",modeBadgeIdleTitle:"\u65E2\u6CA1\u6709\u8FD0\u884C\u4EFF\u771F\uFF0C\u4E5F\u6CA1\u6709\u8FDE\u63A5\u673A\u5668\u4EBA \u2014\u2014 \u5F53\u524D\u6CA1\u6709\u4EFB\u4F55\u4E1C\u897F\u4F1A\u88AB\u9A71\u52A8",realModeBadge:n=>`\u771F\u673A\u6A21\u5F0F \xB7 \u5141\u8BB8 ${n}`,realModeBadgeEmpty:"\u771F\u673A\u6A21\u5F0F \xB7 \u767D\u540D\u5355\u4E3A\u7A7A\uFF08\u5168\u90E8\u62D2\u7EDD\uFF09",realModeBadgeTitle:"\u771F\u673A\u6A21\u5F0F\uFF08motionMode: real\uFF09\uFF1A\u6307\u4EE4\u4F1A\u53D1\u5F80\u767D\u540D\u5355\u91CC\u7684\u771F\u63A7\u5236\u5668 \u2014\u2014 \u8FD9\u4E0D\u662F\u4EFF\u771F",detailCurrentsPrefix:"\u7535\u6D41(A)",detailTcpSpeed:n=>`TCP \u901F\u5EA6 ${n} m/s`,detailEstimatedSuffix:"\uFF08\u4F30\u7B97\uFF09",simCapsSummary:"\u4EFF\u771F\u80FD\u505A\u4EC0\u4E48 / \u4E0D\u80FD\u505A\u4EC0\u4E48",simCapsBucket:(n,e)=>`${n} ${e} \u9879`,simCapsCannot:n=>`\u4E0D\u652F\u6301 ${n} \u7C7B`,simCapsMotion:"\u8FD0\u52A8",simCapsRead:"\u8BFB\u56DE",simCapsIo:"I/O \u4E0E\u5BC4\u5B58\u5668",simCapsTelemetry:"\u9065\u6D4B",simRestoreFailed:n=>`\u4E0A\u6B21\u7684\u4EFF\u771F\u672A\u80FD\u6062\u590D\uFF1A${n}\uFF08\u53EF\u5728\u8FD9\u91CC\u91CD\u65B0\u5F00\u542F\uFF09`,riskOk:"\u6B63\u5E38",riskNear:"\u26A0 \u63A5\u8FD1\u5947\u5F02\u70B9",riskAt:"\u26A0 \u5947\u5F02\u70B9",riskWrist:n=>`\u8155 ${n}\xB0`,riskManip:n=>`\u53EF\u64CD\u4F5C\u5EA6 ${n}`,riskLimit:(n,e)=>`J${n} \u8DDD\u9650\u4F4D ${e}\xB0`,riskTitle:"\u5947\u5F02\u70B9\u5224\u636E\uFF1A\u7B2C 5 \u5173\u8282\u89D2\uFF08\u8155\u90E8\u5171\u7EBF\u65F6\u8D8B 0\uFF09+ \u5F52\u4E00\u5316\u53EF\u64CD\u4F5C\u5EA6 |det J|/\u81C2\u5C55\xB3 + \u79BB\u5173\u8282\u9650\u4F4D\u7684\u4F59\u91CF",ioSummary:"I/O \u4E0E\u5BC4\u5B58\u5668",ioDigitalOut:n=>`\u6570\u5B57\u8F93\u51FA  ${n}`,ioDigitalIn:n=>`\u6570\u5B57\u8F93\u5165  ${n}`,ioAnalogIn:(n,e)=>`\u6A21\u62DF\u8F93\u5165  ${n} / ${e} V`,ioRegisters:(n,e,t)=>`${n} \u5BC4\u5B58\u5668 [${e}\u2026]  ${t}`,ioReading:"\u8BFB\u53D6\u4E2D\u2026",ioFailed:n=>`\u8BFB\u53D6\u5931\u8D25\uFF1A${n}`,ioSimInputNote:"\u4EFF\u771F\u6CA1\u6709\u8F93\u5165\u4FE1\u53F7\u6E90\uFF1A\u8F93\u5165\u6052\u4E3A 0\uFF0C\u5BC4\u5B58\u5668\u6052\u4E3A\u521D\u503C\u3002",simApplying:"\u6B63\u5728\u5207\u6362\u4EFF\u771F\u2026",simFailed:n=>`\u4EFF\u771F\u5F00\u5173\u5931\u8D25\uFF1A${n}`,simUnsupported:"\u4EFF\u771F\u53EA\u5B9E\u73B0\u8FD0\u52A8\u5B66\uFF08\u8FD0\u52A8\u7C7B\u5DE5\u5177 + \u4F4D\u59FF\u8BFB\u56DE\uFF09\uFF1B\u5176\u4F59\u6307\u4EE4\u4F1A\u660E\u786E\u56DE\u62A5\u300C\u65E0\u4EFF\u771F\u8BED\u4E49\u300D\u3002",simCollapseStops:"\u6536\u8D77\u9762\u677F\u4F1A\u505C\u6B62\u8FD9\u53F0\u4EFF\u771F\u3002",simActiveStatus:n=>`\u79BB\u7EBF\u4EFF\u771F \xB7 ${n}`,simWatermark:"\u79BB\u7EBF\u4EFF\u771F\uFF08\u975E\u771F\u673A\uFF09",controlsTcpPosition:"TCP \u4F4D\u7F6E\uFF08mm\uFF09",controlsTcpOrientation:"TCP \u65B9\u5411\uFF08\xB0\uFF09",controlsHome:"\u56DE\u96F6",controlsHomeTitle:"\u56DE\u96F6\uFF1A\u516D\u5173\u8282\u5230 [0\xB0, -90\xB0, 0\xB0, -90\xB0, 0\xB0, 0\xB0]",controlsStepMm:"\u6B65\u957F mm",controlsStepDeg:"\u6B65\u957F \xB0",controlsStepMmOptionTitle:n=>`\u6B65\u957F ${n} mm`,controlsStepDegOptionTitle:n=>`\u6B65\u957F ${n}\xB0`,controlsFrame:"\u53C2\u8003\u7CFB",controlsFrameTitle:"\u5750\u6807\u7CFB",controlsFrameTool:"\u5DE5\u5177\u7CFB",controlsFrameBase:"\u57FA\u5EA7\u7CFB",controlsFrameOptionTitle:n=>`\u5207\u6362\u5230${n}\u70B9\u52A8`,controlsJogPositionTitle:(n,e,t,i)=>`\u6CBF${n} ${e} \u8F74${t>0?"\u6B63":"\u8D1F"}\u65B9\u5411\u79FB\u52A8 ${i} mm`,controlsJogRotateTitle:(n,e,t,i)=>`\u7ED5${n} ${e} \u8F74${t>0?"\u6B63":"\u8D1F"}\u65B9\u5411\u65CB\u8F6C ${i}\xB0`,controlsDisabledDisconnected:"\u672A\u8FDE\u63A5\u673A\u5668\u4EBA\uFF1A\u70B9\u52A8\u63A7\u4EF6\u4E0D\u53EF\u7528",controlsDisabledSimOnly:"\u4EC5\u79BB\u7EBF\u4EFF\u771F\u53EF\u70B9\u52A8\uFF1A\u771F\u673A\u8BF7\u7528\u5DE5\u5177\u8C03\u7528\uFF08\u53D7\u5BA1\u6279\u95E8\u7981\u4FDD\u62A4\uFF09",controlsDisabledStale:"\u6570\u636E\u901A\u9053\u505C\u6EDE\uFF1A\u63A7\u4EF6\u5DF2\u6682\u505C\uFF0C\u6062\u590D\u540E\u81EA\u52A8\u89E3\u7981",controlsCommandFailed:n=>`\u70B9\u52A8\u5931\u8D25\uFF1A${n}`,controlsToolPosition:"TCP \u4F4D\u59FF",controlsToolPositionTitle:"TCP \u4F4D\u59FF\uFF1AX/Y/Z \u5355\u4F4D mm\uFF0CRX/RY/RZ \u5355\u4F4D rad\uFF1B\u56DE\u8F66\u6216\u5931\u7126\u4E0B\u53D1\u4E00\u6761 pose",controlsSummary:(n,e,t)=>`TCP: ${n}, ${e}, ${t} m`,controlsSummaryTitle:"\u673A\u5668\u4EBA\u5F53\u524D TCP \u4F4D\u7F6E\uFF08\u7C73\uFF09",controlsJoints:"\u5173\u8282",controlsJointsTitle:"\u62D6\u52A8\u6ED1\u5757\u53EA\u5728\u672C\u5730\u9884\u89C8\uFF08\u4E0D\u53D1\u547D\u4EE4\uFF09\uFF0C\u677E\u624B\u624D\u4E0B\u53D1\u4E00\u6761 movej\uFF1B\u25C0 \u25B6 \u6BCF\u6B21 1\xB0",controlsJointStepTitle:(n,e)=>`${n} \u5173\u8282${e>0?"\u6B63\u5411":"\u8D1F\u5411"}\u5FAE\u8C03 1\xB0`,controlsJointBase:"\u673A\u5EA7",controlsJointShoulder:"\u80A9\u90E8",controlsJointElbow:"\u8098\u90E8",controlsJointWrist1:"\u624B\u8155 1",controlsJointWrist2:"\u624B\u8155 2",controlsJointWrist3:"\u624B\u8155 3",controlsJointValue:n=>`${n.toFixed(1)}\xB0`,controlsInvalidRollback:"\u6570\u503C\u65E0\u6548\uFF1A\u5DF2\u56DE\u6EDA\u5230\u6700\u65B0\u4E00\u5E27",controlsRejectedCommand:"\u5BBF\u4E3B\u62D2\u7EDD\u4E86\u8FD9\u6B21\u547D\u4EE4",controlsNoPoseData:"\u5C1A\u65E0\u4F4D\u59FF\u6570\u636E",controlsBusyRetry:"\u4E0A\u4E00\u6761\u547D\u4EE4\u8FD8\u5728\u98DE\u884C\u4E2D\uFF1A\u8FD9\u6B21\u6CA1\u6709\u4E0B\u53D1\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5",controlsStopFailed:n=>`\u505C\u6B62\u6307\u4EE4\u53D1\u9001\u5931\u8D25\uFF1A${n}`},Pg={statusDisconnected:"Robot not connected",statusLoading:"Connected \xB7 loading model\u2026",statusConnected:"Connected",statusFallbackSuffix:" (no built-in model, using approximate geometry)",statusErrorPrefix:"Render error: ",statusLoadFailed:"Model failed to load: ",statusLoadRetrying:" (retrying)",statusSwitchingModel:n=>`switching to ${n}\u2026`,statusNoWebgl:"WebGL is unavailable here: switched to numeric-only mode (joint angles and TCP keep updating)",statusIncomplete:"The robot did not return a full set of joint angles",statusContextLost:"3D context lost (GPU reset) \u2014 collapse and reopen the panel to recover",statusSafetyHint:"The robot may have stopped; check the teach pendant",disconnectNeverConnected:"Robot not connected: ursim_connect has never succeeded",disconnectReason:n=>`Robot not connected${n?`: ${n}`:""}`,disconnectAmbiguous:n=>`More than one robot is connected; specify the robot IP${n}`,disconnectCandidates:n=>Array.isArray(n)&&n.length>0?` (candidates: ${n.join(", ")})`:"",disconnectWorkerDown:n=>`The UR control process is unavailable${n?`: ${n}`:""} (run ursim_ping to check the Python dependencies)`,disconnectReadFailed:n=>`Failed to read the robot state${n?`: ${n}`:""}`,jointsPrefix:"Joint angles (\xB0)",tcpPrefix:"TCP (m / axis-angle rad)",queryFailed:"query failed",detailStatusFailed:n=>`Status query failed: ${n}`,detailSafety:n=>`Safety ${n}`,detailRobotMode:n=>`Mode ${n}`,detailProgram:n=>`Program ${n}`,detailSpeed:n=>`Speed ${n}`,detailRunning:"Running",detailTempsPrefix:"Temp (\xB0C)",detailTemps:n=>`Temp (\xB0C)  ${n}`,detailBus:(n,e)=>`Bus ${n} V  ${e} A`,overLimit:n=>`\u26A0 over limit ${n}`,safetyMode:{NORMAL:"Normal",REDUCED:"Reduced",PROTECTIVE_STOP:"Protective stop",SAFEGUARD_STOP:"Safeguard stop",EMERGENCY_STOP:"Emergency stop",SYSTEM_EMERGENCY_STOP:"System emergency stop",ROBOT_EMERGENCY_STOP:"Robot emergency stop",RECOVERY:"Recovery",VIOLATION:"Safety violation",FAULT:"Fault",AUTOMATIC_MODE_SAFEGUARD_STOP:"Automatic-mode safeguard stop",SYSTEM_THREE_POSITION_ENABLING_STOP:"Three-position enabling stop"},robotMode:{POWER_OFF:"Power off",POWER_ON:"Power on",IDLE:"Idle",BACKDRIVE:"Backdrive",RUNNING:"Running",BOOTING:"Booting",CONFIRM_SAFETY:"Confirm safety",DISCONNECTED:"Disconnected",NO_CONTROLLER:"No controller"},programState:{STOPPED:"Stopped",PLAYING:"Playing",PAUSED:"Paused"},viewReset:"Reset view",viewIso:"Isometric",viewFront:"Front",viewSide:"Side",viewTop:"Top",identity:(n,e)=>`Robot  ${[n,e].filter(Boolean).join("  \xB7  ")}`,pendingPrefix:"Pending approval",canvasLabel:"Robot simulation 3D view; arrow keys switch the view",hudLabel:"Live robot readouts",layerReach:"Reach",layerBase:"Base frame",layerForce:"Force",layerGhost:"Target pose",screenshot:"Screenshot",screenshotLabel:"Export a watermarked screenshot",trajectoryClear:"Clear path",trajectoryPause:"Pause path",trajectoryResume:"Resume path",trajectoryExport:"Export path",dockLabel:"NoneadURSim",dockDescription:"Live robot simulation view",dockCollapse:"Collapse",simTitle:"Offline simulation",simToggleOn:"Start simulation",simToggleOff:"Stop simulation",simUses:"While on, the AI drives the model right here: motion tools move this virtual robot and no real robot is affected.",simModelLabel:"Model",simPresetLabel:"Start pose",simSpeedLabel:"Start speed scaling",simPresetZero:"Zero pose",simPresetUpright:"Upright",simPresetReach:"Reach",simBadge:"SIMULATION",simBadgeTitle:"Virtual robot in offline simulation \u2014 not a real robot reading, no real motion",modeBadgeIdle:"NOT CONNECTED",modeBadgeIdleTitle:"No simulation is running and no robot is connected \u2014 nothing is being driven",realModeBadge:n=>`REAL MODE \xB7 ${n}`,realModeBadgeEmpty:"REAL MODE \xB7 allow-list empty (everything refused)",realModeBadgeTitle:"Real-robot mode (motionMode: real): commands go to the controllers in the allow-list \u2014 this is not a simulation",detailCurrentsPrefix:"Current (A)",detailTcpSpeed:n=>`TCP speed ${n} m/s`,detailEstimatedSuffix:" (estimated)",simCapsSummary:"What the simulation can and cannot do",simCapsBucket:(n,e)=>`${n}: ${e}`,simCapsCannot:n=>`not simulated: ${n}`,simCapsMotion:"Motion",simCapsRead:"Readback",simCapsIo:"I/O & registers",simCapsTelemetry:"Telemetry",simRestoreFailed:n=>`The previous simulation could not be restored: ${n} (switch it on here to retry)`,riskOk:"OK",riskNear:"\u26A0 near singularity",riskAt:"\u26A0 at singularity",riskWrist:n=>`wrist ${n}\xB0`,riskManip:n=>`manipulability ${n}`,riskLimit:(n,e)=>`J${n} is ${e}\xB0 from its limit`,riskTitle:"Singularity criteria: joint 5 angle (goes to 0 when the wrist axes line up) + normalised manipulability |det J|/reach\xB3 + distance to the joint limits",ioSummary:"I/O & registers",ioDigitalOut:n=>`Digital out  ${n}`,ioDigitalIn:n=>`Digital in   ${n}`,ioAnalogIn:(n,e)=>`Analog in    ${n} / ${e} V`,ioRegisters:(n,e,t)=>`${n} registers [${e}\u2026]  ${t}`,ioReading:"reading\u2026",ioFailed:n=>`read failed: ${n}`,ioSimInputNote:"The simulation has no input source: inputs stay 0 and registers stay at their initial values.",simApplying:"Switching simulation\u2026",simFailed:n=>`Simulation switch failed: ${n}`,simUnsupported:'The simulation implements kinematics only (motion tools + pose readback); every other command reports "no simulation semantics".',simCollapseStops:"Collapsing the panel stops this simulation.",simActiveStatus:n=>`Offline simulation \xB7 ${n}`,simWatermark:"Offline simulation (not a real robot)",controlsTcpPosition:"TCP position (mm)",controlsTcpOrientation:"TCP orientation (\xB0)",controlsHome:"Home",controlsHomeTitle:"Home: all six joints to [0\xB0, -90\xB0, 0\xB0, -90\xB0, 0\xB0, 0\xB0]",controlsStepMm:"Step mm",controlsStepDeg:"Step \xB0",controlsStepMmOptionTitle:n=>`Step ${n} mm`,controlsStepDegOptionTitle:n=>`Step ${n}\xB0`,controlsFrame:"Frame",controlsFrameTitle:"Frame",controlsFrameTool:"Tool",controlsFrameBase:"Base",controlsFrameOptionTitle:n=>`Jog in the ${n} frame`,controlsJogPositionTitle:(n,e,t,i)=>`Move ${i} mm along the ${n} ${e} axis (${t>0?"positive":"negative"} direction)`,controlsJogRotateTitle:(n,e,t,i)=>`Rotate ${i}\xB0 about the ${n} ${e} axis (${t>0?"positive":"negative"} direction)`,controlsDisabledDisconnected:"Robot not connected: jog controls are unavailable",controlsDisabledSimOnly:"Jogging works in the offline simulation only: use the tools for a real robot (guarded by approval)",controlsDisabledStale:"The data feed stalled: controls are paused and re-enable automatically",controlsCommandFailed:n=>`Jog failed: ${n}`,controlsToolPosition:"TCP pose",controlsToolPositionTitle:"TCP pose: X/Y/Z in mm, RX/RY/RZ in rad; press Enter or blur to send one pose command",controlsSummary:(n,e,t)=>`TCP: ${n}, ${e}, ${t} m`,controlsSummaryTitle:"Current TCP position (m)",controlsJoints:"Joints",controlsJointsTitle:"Dragging a slider previews locally only (no command); release sends one movej; \u25C0 \u25B6 step by 1\xB0",controlsJointStepTitle:(n,e)=>`${n} joint: ${e>0?"+1\xB0":"\u22121\xB0"}`,controlsJointBase:"Base",controlsJointShoulder:"Shoulder",controlsJointElbow:"Elbow",controlsJointWrist1:"Wrist 1",controlsJointWrist2:"Wrist 2",controlsJointWrist3:"Wrist 3",controlsJointValue:n=>`${n.toFixed(1)}\xB0`,controlsInvalidRollback:"Invalid value: rolled back to the latest frame",controlsRejectedCommand:"The host rejected this command",controlsNoPoseData:"No pose data yet",controlsBusyRetry:"The previous command is still in flight: nothing was sent, please retry",controlsStopFailed:n=>`Failed to send the stop command: ${n}`},Ig=Object.freeze(["zh","en","ja","es","fr","de","ru","pt"]),uc="zh",Lg=Object.freeze({zh:gd,en:Pg,ja:fd,es:hd,fr:dd,de:ud,ru:md,pt:pd});function Dg(n){if(typeof n!="string"||n.trim()==="")return uc;let e=n.trim().toLowerCase().split(/[-_]/u)[0];return Ig.includes(e)?e:uc}function Ng(n){return Lg[Dg(n)]??gd}function Og(n){let e=n??globalThis.navigator,i=globalThis.document?.documentElement?.lang;if(typeof i=="string"&&i.trim()!=="")return i;let s=globalThis.__DSH_LOCALE__,r=typeof s=="string"?s:s?.current;return typeof r=="string"&&r.trim()!==""?r:typeof e?.language=="string"&&e.language.trim()!==""?e.language:uc}function Fg(n){return Ng(Og(n))}function As(n){let e=(t,i)=>{let s=t[i];return s&&typeof s=="object"&&!Array.isArray(s)?new Proxy(s,{get:(r,o)=>r[o]}):s};return new Proxy({},{get:(t,i)=>e(Fg(n),i)})}var Ug='[data-sidebar-right-guide="true"]',hc="[data-sidebar-right-guide-entry]",Bg="[data-sidebar-right-tab]",xd="data-dsh-ursim-twin-right-entry",bT=`[${xd}]`,kg="data-dsh-ursim-twin-right-view",zg="data-dsh-ursim-twin-right-close",Hg="data-dsh-ursim-twin-right-panel",wr=As(),$o=wr.dockLabel,yd=wr.dockDescription,Vg=wr.dockLabel,vd='<svg width="26" height="26" viewBox="0 0 16 16" fill="none" stroke="#539CFA" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.6 13.4h8.8"/><path d="M5.4 13.4V9.9l4.9-3.2v3"/><path d="M9.5 9.7v1.5M11.1 9.7v1.5"/><circle cx="5.4" cy="9.9" r=".85"/><circle cx="10.3" cy="6.7" r=".85"/></svg>',Gg={boxSizing:"border-box",display:"flex",alignItems:"center",gap:"14px",width:"100%",padding:"14px 20px",border:"0.8px solid var(--dsw-alias-border-l3, rgba(0, 0, 0, 0.12))",borderRadius:"20px",background:"var(--dsw-alias-bg-layer-1, #ffffff)",color:"var(--dsw-alias-label-primary, #0f1115)",cursor:"pointer",font:"inherit",textAlign:"left"},Wg={display:"inline-flex",alignItems:"center",justifyContent:"center",flex:"none"},$g={display:"flex",flexDirection:"column",gap:"2px",minWidth:"0"},Xg={fontSize:"14px",fontWeight:"500",lineHeight:"20px"},Yg={fontSize:"12px",lineHeight:"18px",color:"var(--dsw-alias-label-tertiary, #6b7280)"},qg={boxSizing:"border-box",position:"relative",flex:"1 1 auto",minWidth:"0",minHeight:"0",display:"flex",flexDirection:"column",overflow:"hidden",background:"var(--dsw-alias-bg-base, #0d1117)"},jg={boxSizing:"border-box",display:"flex",alignItems:"center",gap:"8px",flex:"0 0 auto",padding:"8px 12px",borderBottom:"1px solid var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.24))",color:"var(--dsw-alias-label-primary, #e6edf3)",fontSize:"13px",fontWeight:"600"},Jg={flex:"1 1 auto",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},Kg={flex:"none",display:"inline-flex",alignItems:"center",justifyContent:"center",width:"22px",height:"22px",padding:"0",border:"none",borderRadius:"6px",background:"transparent",color:"inherit",cursor:"pointer",font:"inherit",fontSize:"13px",lineHeight:"1"},Zg={position:"relative",flex:"1 1 auto",minHeight:"0",overflow:"hidden"},Qg={boxShadow:"inset 0 0 0 1.5px var(--dsw-alias-brand-primary, #539CFA)"};function e0(){return typeof globalThis>"u"?void 0:globalThis}function mn(n,e){if(!(!n||!n.style))for(let t of Object.keys(e))n.style[t]=e[t]}function _d(n){return n?typeof n.isConnected=="boolean"?n.isConnected:n.parentElement!==null&&n.parentElement!==void 0:!1}function t0(n){let e=n.querySelector(hc);if(!e||typeof e.cloneNode!="function")return;let t;try{t=e.cloneNode(!0)}catch{return}if(!t||typeof t.querySelector!="function")return;for(let o of[...t.children??[]]){let a=String(o?.className??"");if(!/entryIcon|entryText/.test(a))try{o.remove?.()}catch{}}let i=t.querySelector('[class*="entryIcon"]');i&&(i.innerHTML=vd);let s=t.querySelector('[class*="entryTitle"]');s&&(s.textContent=$o);let r=t.querySelector('[class*="entryDescription"]');return r&&(r.textContent=yd),t.removeAttribute?.("data-sidebar-right-guide-entry"),t.removeAttribute?.("aria-keyshortcuts"),typeof t.className=="string"&&!t.className.includes("entry")&&(t.className="dsh-ursim-twin-right-entry"),t}function n0(n){let e=n.createElement("button");e.setAttribute("type","button"),typeof e.className=="string"&&(e.className="dsh-ursim-twin-right-entry"),mn(e,Gg);let t=n.createElement("span");t.setAttribute("aria-hidden","true"),t.innerHTML=vd,mn(t,Wg);let i=n.createElement("span");mn(i,$g);let s=n.createElement("span");s.textContent=$o,mn(s,Xg);let r=n.createElement("span");return r.textContent=yd,mn(r,Yg),i.appendChild(s),i.appendChild(r),e.appendChild(t),e.appendChild(i),e}function i0(n){let e=t0(n),t=e??n0(n);return t.setAttribute(xd,""),t.setAttribute("data-dsh-plugin","ur-digital-twin"),t.setAttribute("aria-label",$o),t.setAttribute("title",$o),t.setAttribute("aria-pressed","false"),{element:t,cloned:e!==void 0}}function bd({doc:n=e0()?.document,onToggle:e,mountPanel:t,MutationObserver:i,raf:s,caf:r}={}){if(!n||typeof n.createElement!="function"||typeof n.querySelector!="function")return{dispose(){},isActive:()=>!1,toggle(){},setActive(){}};let o={MutationObserver:i,raf:s,caf:r},a=!1,c=!1,l,h=!1,u,d,f,g,y,m=()=>{},p=()=>n.querySelector(Ug),E=()=>{if(a)return;let G=p();if(!G||typeof G.appendChild!="function")return;let Q=n.querySelector(hc),X=Q!==null&&typeof Q.cloneNode=="function",te=l!==void 0&&!h&&X;if(!(l!==void 0&&_d(l)&&!te)){if(te){try{l.removeEventListener?.("click",U)}catch{}try{l.remove?.()}catch{}l=void 0}if(l===void 0){let ue=i0(n);l=ue.element,h=ue.cloned,l.addEventListener("click",U)}b(),G.appendChild(l)}},T=()=>{let G=p();!G||g===G||(v(),g=G,y=G.style?.display??"",mn(G,{display:"none"}))},v=()=>{g&&(mn(g,{display:y??""}),g=void 0,y=void 0)},R=()=>{let G=p();if(!G||typeof G.closest!="function")return;let Q;try{Q=G.closest(Bg)}catch{return}return Q&&typeof Q.appendChild=="function"?Q:void 0},w=()=>{let G=n.createElement("div");G.setAttribute(kg,""),G.setAttribute("data-dsh-plugin","ur-digital-twin"),mn(G,qg);let Q=n.createElement("div");mn(Q,jg);let X=n.createElement("span");X.textContent=Vg,mn(X,Jg);let te=n.createElement("button");te.setAttribute("type","button"),te.setAttribute(zg,""),te.setAttribute("aria-label",wr.dockCollapse),te.setAttribute("title",wr.dockCollapse),te.textContent="\u2715",mn(te,Kg),te.addEventListener("click",W),Q.appendChild(X),Q.appendChild(te);let ue=n.createElement("div");return ue.setAttribute(Hg,""),mn(ue,Zg),G.appendChild(Q),G.appendChild(ue),d=ue,G},C=()=>{if(f){try{f.dispose?.()}catch{}f=void 0}if(u){try{u.remove?.()}catch{}u=void 0}d=void 0,v()},L=()=>{if(!(a||!c)){if(u&&!_d(u)&&C(),!u){let G=R();if(!G)return;u=w(),G.appendChild(u),T()}if(T(),!(f||typeof t!="function"||!d))try{f=t(d)??void 0}catch{f=void 0}}},b=()=>{l&&(l.setAttribute("aria-pressed",c?"true":"false"),c?l.setAttribute("data-active",""):l.removeAttribute("data-active"),mn(l,c?Qg:{boxShadow:""}))},x=G=>{if(a)return;let Q=G===!0;if(Q===c){Q&&L();return}if(c=Q,b(),c?L():C(),typeof e=="function")try{e(c)}catch{}},P=()=>x(!c);function U(G){G?.preventDefault?.(),P()}function W(G){G?.preventDefault?.(),x(!1)}let $=G=>{if(a||!c)return;let Q=G?.target;if(!Q||typeof Q.closest!="function"||Q===l||l?.contains?.(Q))return;let X=null;try{X=Q.closest(hc)}catch{X=null}X&&x(!1)},J=()=>{a||(E(),c&&(p()===null||p()===void 0?x(!1):L()))};return n.addEventListener?.("click",$,!0),m=cd(n,o,J),E(),{isActive:()=>c,toggle:P,setActive:x,dispose(){if(!a){a=!0;try{m()}catch{}m=()=>{};try{n.removeEventListener?.("click",$,!0)}catch{}try{l?.removeEventListener?.("click",U)}catch{}C();try{l?.remove?.()}catch{}l=void 0,c=!1}}}}var Ui={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},Bi={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},lf=0,Zc=1,cf=2;var Qc=1,uf=2,ei=3,Fn=0,zt=1,tn=2,bi=0,ji=1,eu=2,tu=3,nu=4,hf=5,Li=100,df=101,ff=102,pf=103,mf=104,gf=200,_f=201,xf=202,yf=203,ba=204,Sa=205,vf=206,bf=207,Sf=208,Mf=209,Tf=210,Ef=211,wf=212,Af=213,Rf=214,Va=0,Ga=1,Wa=2,Ji=3,$a=4,Xa=5,Ya=6,qa=7,ja=0,Cf=1,Pf=2,Si=0,If=1,Lf=2,Df=3,Ja=4,Nf=5,Of=6,Ff=7,Hc="attached",Uf="detached",iu=300,cs=301,us=302,Ka=303,Za=304,xo=306,Di=1e3,$n=1001,Ys=1002,qt=1003,Qa=1004;var hs=1005;var an=1006,rr=1007;var kn=1008;var zn=1009,su=1010,ru=1011,or=1012,el=1013,ki=1014,wn=1015,ar=1016,tl=1017,nl=1018,lr=1020,ou=35902,au=35899,lu=1021,cu=1022,xn=1023,qs=1026,cr=1027,il=1028,sl=1029,uu=1030,rl=1031;var ol=1033,yo=33776,vo=33777,bo=33778,So=33779,al=35840,ll=35841,cl=35842,ul=35843,hl=36196,dl=37492,fl=37496,pl=37808,ml=37809,gl=37810,_l=37811,xl=37812,yl=37813,vl=37814,bl=37815,Sl=37816,Ml=37817,Tl=37818,El=37819,wl=37820,Al=37821,Rl=36492,Cl=36494,Pl=36495,Il=36283,Ll=36284,Dl=36285,Nl=36286;var Ki=2300,Zi=2301,va=2302,Vc=2400,Gc=2401,Wc=2402,Bf=2500;var hu=0,Mo=1,ur=2,kf=3200,zf=3201;var Ol=0,Hf=1,Mi="",Bt="srgb",jt="srgb-linear",zr="linear",xt="srgb";var qi=7680;var $c=519,Vf=512,Gf=513,Wf=514,du=515,$f=516,Xf=517,Yf=518,qf=519,Ma=35044,Fl=35048;var fu="300 es",Nn=2e3,Hr=2001;var Yn=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){let i=this._listeners;return i===void 0?!1:i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){let i=this._listeners;if(i===void 0)return;let s=i[e];if(s!==void 0){let r=s.indexOf(t);r!==-1&&s.splice(r,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let i=t[e.type];if(i!==void 0){e.target=this;let s=i.slice(0);for(let r=0,o=s.length;r<o;r++)s[r].call(this,e);e.target=null}}},Jt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Sd=1234567,Br=Math.PI/180,Qi=180/Math.PI;function On(){let n=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Jt[n&255]+Jt[n>>8&255]+Jt[n>>16&255]+Jt[n>>24&255]+"-"+Jt[e&255]+Jt[e>>8&255]+"-"+Jt[e>>16&15|64]+Jt[e>>24&255]+"-"+Jt[t&63|128]+Jt[t>>8&255]+"-"+Jt[t>>16&255]+Jt[t>>24&255]+Jt[i&255]+Jt[i>>8&255]+Jt[i>>16&255]+Jt[i>>24&255]).toLowerCase()}function Qe(n,e,t){return Math.max(e,Math.min(t,n))}function pu(n,e){return(n%e+e)%e}function s0(n,e,t,i,s){return i+(n-e)*(s-i)/(t-e)}function r0(n,e,t){return n!==e?(t-n)/(e-n):0}function kr(n,e,t){return(1-t)*n+t*e}function o0(n,e,t,i){return kr(n,e,1-Math.exp(-t*i))}function a0(n,e=1){return e-Math.abs(pu(n,e*2)-e)}function l0(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*(3-2*n))}function c0(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*n*(n*(n*6-15)+10))}function u0(n,e){return n+Math.floor(Math.random()*(e-n+1))}function h0(n,e){return n+Math.random()*(e-n)}function d0(n){return n*(.5-Math.random())}function f0(n){n!==void 0&&(Sd=n);let e=Sd+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function p0(n){return n*Br}function m0(n){return n*Qi}function g0(n){return(n&n-1)===0&&n!==0}function _0(n){return Math.pow(2,Math.ceil(Math.log(n)/Math.LN2))}function x0(n){return Math.pow(2,Math.floor(Math.log(n)/Math.LN2))}function y0(n,e,t,i,s){let r=Math.cos,o=Math.sin,a=r(t/2),c=o(t/2),l=r((e+i)/2),h=o((e+i)/2),u=r((e-i)/2),d=o((e-i)/2),f=r((i-e)/2),g=o((i-e)/2);switch(s){case"XYX":n.set(a*h,c*u,c*d,a*l);break;case"YZY":n.set(c*d,a*h,c*u,a*l);break;case"ZXZ":n.set(c*u,c*d,a*h,a*l);break;case"XZX":n.set(a*h,c*g,c*f,a*l);break;case"YXY":n.set(c*f,a*h,c*g,a*l);break;case"ZYZ":n.set(c*g,c*f,a*h,a*l);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+s)}}function Dn(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("Invalid component type.")}}function _t(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("Invalid component type.")}}var To={DEG2RAD:Br,RAD2DEG:Qi,generateUUID:On,clamp:Qe,euclideanModulo:pu,mapLinear:s0,inverseLerp:r0,lerp:kr,damp:o0,pingpong:a0,smoothstep:l0,smootherstep:c0,randInt:u0,randFloat:h0,randFloatSpread:d0,seededRandom:f0,degToRad:p0,radToDeg:m0,isPowerOfTwo:g0,ceilPowerOfTwo:_0,floorPowerOfTwo:x0,setQuaternionFromProperEuler:y0,normalize:_t,denormalize:Dn},De=class n{constructor(e=0,t=0){n.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,i=this.y,s=e.elements;return this.x=s[0]*t+s[3]*i+s[6],this.y=s[1]*t+s[4]*i+s[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Qe(this.x,e.x,t.x),this.y=Qe(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=Qe(this.x,e,t),this.y=Qe(this.y,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Qe(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(Qe(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let i=Math.cos(t),s=Math.sin(t),r=this.x-e.x,o=this.y-e.y;return this.x=r*i-o*s+e.x,this.y=r*s+o*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},ln=class{constructor(e=0,t=0,i=0,s=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=s}static slerpFlat(e,t,i,s,r,o,a){let c=i[s+0],l=i[s+1],h=i[s+2],u=i[s+3],d=r[o+0],f=r[o+1],g=r[o+2],y=r[o+3];if(a===0){e[t+0]=c,e[t+1]=l,e[t+2]=h,e[t+3]=u;return}if(a===1){e[t+0]=d,e[t+1]=f,e[t+2]=g,e[t+3]=y;return}if(u!==y||c!==d||l!==f||h!==g){let m=1-a,p=c*d+l*f+h*g+u*y,E=p>=0?1:-1,T=1-p*p;if(T>Number.EPSILON){let R=Math.sqrt(T),w=Math.atan2(R,p*E);m=Math.sin(m*w)/R,a=Math.sin(a*w)/R}let v=a*E;if(c=c*m+d*v,l=l*m+f*v,h=h*m+g*v,u=u*m+y*v,m===1-a){let R=1/Math.sqrt(c*c+l*l+h*h+u*u);c*=R,l*=R,h*=R,u*=R}}e[t]=c,e[t+1]=l,e[t+2]=h,e[t+3]=u}static multiplyQuaternionsFlat(e,t,i,s,r,o){let a=i[s],c=i[s+1],l=i[s+2],h=i[s+3],u=r[o],d=r[o+1],f=r[o+2],g=r[o+3];return e[t]=a*g+h*u+c*f-l*d,e[t+1]=c*g+h*d+l*u-a*f,e[t+2]=l*g+h*f+a*d-c*u,e[t+3]=h*g-a*u-c*d-l*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,s){return this._x=e,this._y=t,this._z=i,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let i=e._x,s=e._y,r=e._z,o=e._order,a=Math.cos,c=Math.sin,l=a(i/2),h=a(s/2),u=a(r/2),d=c(i/2),f=c(s/2),g=c(r/2);switch(o){case"XYZ":this._x=d*h*u+l*f*g,this._y=l*f*u-d*h*g,this._z=l*h*g+d*f*u,this._w=l*h*u-d*f*g;break;case"YXZ":this._x=d*h*u+l*f*g,this._y=l*f*u-d*h*g,this._z=l*h*g-d*f*u,this._w=l*h*u+d*f*g;break;case"ZXY":this._x=d*h*u-l*f*g,this._y=l*f*u+d*h*g,this._z=l*h*g+d*f*u,this._w=l*h*u-d*f*g;break;case"ZYX":this._x=d*h*u-l*f*g,this._y=l*f*u+d*h*g,this._z=l*h*g-d*f*u,this._w=l*h*u+d*f*g;break;case"YZX":this._x=d*h*u+l*f*g,this._y=l*f*u+d*h*g,this._z=l*h*g-d*f*u,this._w=l*h*u-d*f*g;break;case"XZY":this._x=d*h*u-l*f*g,this._y=l*f*u-d*h*g,this._z=l*h*g+d*f*u,this._w=l*h*u+d*f*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let i=t/2,s=Math.sin(i);return this._x=e.x*s,this._y=e.y*s,this._z=e.z*s,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,i=t[0],s=t[4],r=t[8],o=t[1],a=t[5],c=t[9],l=t[2],h=t[6],u=t[10],d=i+a+u;if(d>0){let f=.5/Math.sqrt(d+1);this._w=.25/f,this._x=(h-c)*f,this._y=(r-l)*f,this._z=(o-s)*f}else if(i>a&&i>u){let f=2*Math.sqrt(1+i-a-u);this._w=(h-c)/f,this._x=.25*f,this._y=(s+o)/f,this._z=(r+l)/f}else if(a>u){let f=2*Math.sqrt(1+a-i-u);this._w=(r-l)/f,this._x=(s+o)/f,this._y=.25*f,this._z=(c+h)/f}else{let f=2*Math.sqrt(1+u-i-a);this._w=(o-s)/f,this._x=(r+l)/f,this._y=(c+h)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<1e-8?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Qe(this.dot(e),-1,1)))}rotateTowards(e,t){let i=this.angleTo(e);if(i===0)return this;let s=Math.min(1,t/i);return this.slerp(e,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let i=e._x,s=e._y,r=e._z,o=e._w,a=t._x,c=t._y,l=t._z,h=t._w;return this._x=i*h+o*a+s*l-r*c,this._y=s*h+o*c+r*a-i*l,this._z=r*h+o*l+i*c-s*a,this._w=o*h-i*a-s*c-r*l,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);let i=this._x,s=this._y,r=this._z,o=this._w,a=o*e._w+i*e._x+s*e._y+r*e._z;if(a<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,a=-a):this.copy(e),a>=1)return this._w=o,this._x=i,this._y=s,this._z=r,this;let c=1-a*a;if(c<=Number.EPSILON){let f=1-t;return this._w=f*o+t*this._w,this._x=f*i+t*this._x,this._y=f*s+t*this._y,this._z=f*r+t*this._z,this.normalize(),this}let l=Math.sqrt(c),h=Math.atan2(l,a),u=Math.sin((1-t)*h)/l,d=Math.sin(t*h)/l;return this._w=o*u+this._w*d,this._x=i*u+this._x*d,this._y=s*u+this._y*d,this._z=r*u+this._z*d,this._onChangeCallback(),this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),i=Math.random(),s=Math.sqrt(1-i),r=Math.sqrt(i);return this.set(s*Math.sin(e),s*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},D=class n{constructor(e=0,t=0,i=0){n.prototype.isVector3=!0,this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Md.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Md.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,i=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[3]*i+r[6]*s,this.y=r[1]*t+r[4]*i+r[7]*s,this.z=r[2]*t+r[5]*i+r[8]*s,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,i=this.y,s=this.z,r=e.elements,o=1/(r[3]*t+r[7]*i+r[11]*s+r[15]);return this.x=(r[0]*t+r[4]*i+r[8]*s+r[12])*o,this.y=(r[1]*t+r[5]*i+r[9]*s+r[13])*o,this.z=(r[2]*t+r[6]*i+r[10]*s+r[14])*o,this}applyQuaternion(e){let t=this.x,i=this.y,s=this.z,r=e.x,o=e.y,a=e.z,c=e.w,l=2*(o*s-a*i),h=2*(a*t-r*s),u=2*(r*i-o*t);return this.x=t+c*l+o*u-a*h,this.y=i+c*h+a*l-r*u,this.z=s+c*u+r*h-o*l,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,i=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[4]*i+r[8]*s,this.y=r[1]*t+r[5]*i+r[9]*s,this.z=r[2]*t+r[6]*i+r[10]*s,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Qe(this.x,e.x,t.x),this.y=Qe(this.y,e.y,t.y),this.z=Qe(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=Qe(this.x,e,t),this.y=Qe(this.y,e,t),this.z=Qe(this.z,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Qe(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let i=e.x,s=e.y,r=e.z,o=t.x,a=t.y,c=t.z;return this.x=s*c-r*a,this.y=r*o-i*c,this.z=i*a-s*o,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return dc.copy(this).projectOnVector(e),this.sub(dc)}reflect(e){return this.sub(dc.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(Qe(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y,s=this.z-e.z;return t*t+i*i+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){let s=Math.sin(t)*e;return this.x=s*Math.sin(i),this.y=Math.cos(t)*e,this.z=s*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),s=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=s,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,i=Math.sqrt(1-t*t);return this.x=i*Math.cos(e),this.y=t,this.z=i*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},dc=new D,Md=new ln,Je=class n{constructor(e,t,i,s,r,o,a,c,l){n.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,s,r,o,a,c,l)}set(e,t,i,s,r,o,a,c,l){let h=this.elements;return h[0]=e,h[1]=s,h[2]=a,h[3]=t,h[4]=r,h[5]=c,h[6]=i,h[7]=o,h[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,s=t.elements,r=this.elements,o=i[0],a=i[3],c=i[6],l=i[1],h=i[4],u=i[7],d=i[2],f=i[5],g=i[8],y=s[0],m=s[3],p=s[6],E=s[1],T=s[4],v=s[7],R=s[2],w=s[5],C=s[8];return r[0]=o*y+a*E+c*R,r[3]=o*m+a*T+c*w,r[6]=o*p+a*v+c*C,r[1]=l*y+h*E+u*R,r[4]=l*m+h*T+u*w,r[7]=l*p+h*v+u*C,r[2]=d*y+f*E+g*R,r[5]=d*m+f*T+g*w,r[8]=d*p+f*v+g*C,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[1],s=e[2],r=e[3],o=e[4],a=e[5],c=e[6],l=e[7],h=e[8];return t*o*h-t*a*l-i*r*h+i*a*c+s*r*l-s*o*c}invert(){let e=this.elements,t=e[0],i=e[1],s=e[2],r=e[3],o=e[4],a=e[5],c=e[6],l=e[7],h=e[8],u=h*o-a*l,d=a*c-h*r,f=l*r-o*c,g=t*u+i*d+s*f;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);let y=1/g;return e[0]=u*y,e[1]=(s*l-h*i)*y,e[2]=(a*i-s*o)*y,e[3]=d*y,e[4]=(h*t-s*c)*y,e[5]=(s*r-a*t)*y,e[6]=f*y,e[7]=(i*c-l*t)*y,e[8]=(o*t-i*r)*y,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,s,r,o,a){let c=Math.cos(r),l=Math.sin(r);return this.set(i*c,i*l,-i*(c*o+l*a)+o+e,-s*l,s*c,-s*(-l*o+c*a)+a+t,0,0,1),this}scale(e,t){return this.premultiply(fc.makeScale(e,t)),this}rotate(e){return this.premultiply(fc.makeRotation(-e)),this}translate(e,t){return this.premultiply(fc.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,i=e.elements;for(let s=0;s<9;s++)if(t[s]!==i[s])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}},fc=new Je;function mu(n){for(let e=n.length-1;e>=0;--e)if(n[e]>=65535)return!0;return!1}function js(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function jf(){let n=js("canvas");return n.style.display="block",n}var Td={};function Js(n){n in Td||(Td[n]=!0,console.warn(n))}function Jf(n,e,t){return new Promise(function(i,s){function r(){switch(n.clientWaitSync(e,n.SYNC_FLUSH_COMMANDS_BIT,0)){case n.WAIT_FAILED:s();break;case n.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:i()}}setTimeout(r,t)})}var Ed=new Je().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),wd=new Je().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function v0(){let n={enabled:!0,workingColorSpace:jt,spaces:{},convert:function(s,r,o){return this.enabled===!1||r===o||!r||!o||(this.spaces[r].transfer===xt&&(s.r=mi(s.r),s.g=mi(s.g),s.b=mi(s.b)),this.spaces[r].primaries!==this.spaces[o].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[o].fromXYZ)),this.spaces[o].transfer===xt&&(s.r=Xs(s.r),s.g=Xs(s.g),s.b=Xs(s.b))),s},workingToColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},colorSpaceToWorking:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===Mi?zr:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,o){return s.copy(this.spaces[r].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(s,r){return Js("THREE.ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),n.workingToColorSpace(s,r)},toWorkingColorSpace:function(s,r){return Js("THREE.ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),n.colorSpaceToWorking(s,r)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],i=[.3127,.329];return n.define({[jt]:{primaries:e,whitePoint:i,transfer:zr,toXYZ:Ed,fromXYZ:wd,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:Bt},outputColorSpaceConfig:{drawingBufferColorSpace:Bt}},[Bt]:{primaries:e,whitePoint:i,transfer:xt,toXYZ:Ed,fromXYZ:wd,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:Bt}}}),n}var at=v0();function mi(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function Xs(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}var Rs,Ta=class{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let i;if(e instanceof HTMLCanvasElement)i=e;else{Rs===void 0&&(Rs=js("canvas")),Rs.width=e.width,Rs.height=e.height;let s=Rs.getContext("2d");e instanceof ImageData?s.putImageData(e,0,0):s.drawImage(e,0,0,e.width,e.height),i=Rs}return i.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=js("canvas");t.width=e.width,t.height=e.height;let i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);let s=i.getImageData(0,0,e.width,e.height),r=s.data;for(let o=0;o<r.length;o++)r[o]=mi(r[o]/255)*255;return i.putImageData(s,0,0),t}else if(e.data){let t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(mi(t[i]/255)*255):t[i]=mi(t[i]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},b0=0,Ks=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:b0++}),this.uuid=On(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):t instanceof VideoFrame?e.set(t.displayHeight,t.displayWidth,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let i={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let o=0,a=s.length;o<a;o++)s[o].isDataTexture?r.push(pc(s[o].image)):r.push(pc(s[o]))}else r=pc(s);i.url=r}return t||(e.images[this.uuid]=i),i}};function pc(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?Ta.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}var S0=0,mc=new D,kt=class n extends Yn{constructor(e=n.DEFAULT_IMAGE,t=n.DEFAULT_MAPPING,i=$n,s=$n,r=an,o=kn,a=xn,c=zn,l=n.DEFAULT_ANISOTROPY,h=Mi){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:S0++}),this.uuid=On(),this.name="",this.source=new Ks(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=s,this.magFilter=r,this.minFilter=o,this.anisotropy=l,this.format=a,this.internalFormat=null,this.type=c,this.offset=new De(0,0),this.repeat=new De(1,1),this.center=new De(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Je,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0}get width(){return this.source.getSize(mc).x}get height(){return this.source.getSize(mc).y}get depth(){return this.source.getSize(mc).z}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let i=e[t];if(i===void 0){console.warn(`THREE.Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){console.warn(`THREE.Texture.setValues(): property '${t}' does not exist.`);continue}s&&i&&s.isVector2&&i.isVector2||s&&i&&s.isVector3&&i.isVector3||s&&i&&s.isMatrix3&&i.isMatrix3?s.copy(i):this[t]=i}}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let i={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==iu)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Di:e.x=e.x-Math.floor(e.x);break;case $n:e.x=e.x<0?0:1;break;case Ys:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case Di:e.y=e.y-Math.floor(e.y);break;case $n:e.y=e.y<0?0:1;break;case Ys:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};kt.DEFAULT_IMAGE=null;kt.DEFAULT_MAPPING=iu;kt.DEFAULT_ANISOTROPY=1;var ut=class n{constructor(e=0,t=0,i=0,s=1){n.prototype.isVector4=!0,this.x=e,this.y=t,this.z=i,this.w=s}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,s){return this.x=e,this.y=t,this.z=i,this.w=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,i=this.y,s=this.z,r=this.w,o=e.elements;return this.x=o[0]*t+o[4]*i+o[8]*s+o[12]*r,this.y=o[1]*t+o[5]*i+o[9]*s+o[13]*r,this.z=o[2]*t+o[6]*i+o[10]*s+o[14]*r,this.w=o[3]*t+o[7]*i+o[11]*s+o[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,s,r,c=e.elements,l=c[0],h=c[4],u=c[8],d=c[1],f=c[5],g=c[9],y=c[2],m=c[6],p=c[10];if(Math.abs(h-d)<.01&&Math.abs(u-y)<.01&&Math.abs(g-m)<.01){if(Math.abs(h+d)<.1&&Math.abs(u+y)<.1&&Math.abs(g+m)<.1&&Math.abs(l+f+p-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let T=(l+1)/2,v=(f+1)/2,R=(p+1)/2,w=(h+d)/4,C=(u+y)/4,L=(g+m)/4;return T>v&&T>R?T<.01?(i=0,s=.707106781,r=.707106781):(i=Math.sqrt(T),s=w/i,r=C/i):v>R?v<.01?(i=.707106781,s=0,r=.707106781):(s=Math.sqrt(v),i=w/s,r=L/s):R<.01?(i=.707106781,s=.707106781,r=0):(r=Math.sqrt(R),i=C/r,s=L/r),this.set(i,s,r,t),this}let E=Math.sqrt((m-g)*(m-g)+(u-y)*(u-y)+(d-h)*(d-h));return Math.abs(E)<.001&&(E=1),this.x=(m-g)/E,this.y=(u-y)/E,this.z=(d-h)/E,this.w=Math.acos((l+f+p-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Qe(this.x,e.x,t.x),this.y=Qe(this.y,e.y,t.y),this.z=Qe(this.z,e.z,t.z),this.w=Qe(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=Qe(this.x,e,t),this.y=Qe(this.y,e,t),this.z=Qe(this.z,e,t),this.w=Qe(this.w,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Qe(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Ea=class extends Yn{constructor(e=1,t=1,i={}){super(),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:an,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1},i),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=i.depth,this.scissor=new ut(0,0,e,t),this.scissorTest=!1,this.viewport=new ut(0,0,e,t);let s={width:e,height:t,depth:i.depth},r=new kt(s);this.textures=[];let o=i.count;for(let a=0;a<o;a++)this.textures[a]=r.clone(),this.textures[a].isRenderTargetTexture=!0,this.textures[a].renderTarget=this;this._setTextureOptions(i),this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=i.depthTexture,this.samples=i.samples,this.multiview=i.multiview}_setTextureOptions(e={}){let t={minFilter:an,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let i=0;i<this.textures.length;i++)this.textures[i].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),e!==null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,i=1){if(this.width!==e||this.height!==t||this.depth!==i){this.width=e,this.height=t,this.depth=i;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=e,this.textures[s].image.height=t,this.textures[s].image.depth=i,this.textures[s].isArrayTexture=this.textures[s].image.depth>1;this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,i=e.textures.length;t<i;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let s=Object.assign({},e.textures[t].image);this.textures[t].source=new Ks(s)}return this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},qn=class extends Ea{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}},Vr=class extends kt{constructor(e=null,t=1,i=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:s},this.magFilter=qt,this.minFilter=qt,this.wrapR=$n,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var wa=class extends kt{constructor(e=null,t=1,i=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:s},this.magFilter=qt,this.minFilter=qt,this.wrapR=$n,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var cn=class{constructor(e=new D(1/0,1/0,1/0),t=new D(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(Pn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(Pn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let i=Pn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let i=e.geometry;if(i!==void 0){let r=i.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let o=0,a=r.count;o<a;o++)e.isMesh===!0?e.getVertexPosition(o,Pn):Pn.fromBufferAttribute(r,o),Pn.applyMatrix4(e.matrixWorld),this.expandByPoint(Pn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Xo.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),Xo.copy(i.boundingBox)),Xo.applyMatrix4(e.matrixWorld),this.union(Xo)}let s=e.children;for(let r=0,o=s.length;r<o;r++)this.expandByObject(s[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Pn),Pn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Ar),Yo.subVectors(this.max,Ar),Cs.subVectors(e.a,Ar),Ps.subVectors(e.b,Ar),Is.subVectors(e.c,Ar),wi.subVectors(Ps,Cs),Ai.subVectors(Is,Ps),Wi.subVectors(Cs,Is);let t=[0,-wi.z,wi.y,0,-Ai.z,Ai.y,0,-Wi.z,Wi.y,wi.z,0,-wi.x,Ai.z,0,-Ai.x,Wi.z,0,-Wi.x,-wi.y,wi.x,0,-Ai.y,Ai.x,0,-Wi.y,Wi.x,0];return!gc(t,Cs,Ps,Is,Yo)||(t=[1,0,0,0,1,0,0,0,1],!gc(t,Cs,Ps,Is,Yo))?!1:(qo.crossVectors(wi,Ai),t=[qo.x,qo.y,qo.z],gc(t,Cs,Ps,Is,Yo))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Pn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Pn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(li[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),li[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),li[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),li[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),li[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),li[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),li[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),li[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(li),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},li=[new D,new D,new D,new D,new D,new D,new D,new D],Pn=new D,Xo=new cn,Cs=new D,Ps=new D,Is=new D,wi=new D,Ai=new D,Wi=new D,Ar=new D,Yo=new D,qo=new D,$i=new D;function gc(n,e,t,i,s){for(let r=0,o=n.length-3;r<=o;r+=3){$i.fromArray(n,r);let a=s.x*Math.abs($i.x)+s.y*Math.abs($i.y)+s.z*Math.abs($i.z),c=e.dot($i),l=t.dot($i),h=i.dot($i);if(Math.max(-Math.max(c,l,h),Math.min(c,l,h))>a)return!1}return!0}var M0=new cn,Rr=new D,_c=new D,Zt=class{constructor(e=new D,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let i=this.center;t!==void 0?i.copy(t):M0.setFromPoints(e).getCenter(i);let s=0;for(let r=0,o=e.length;r<o;r++)s=Math.max(s,i.distanceToSquared(e[r]));return this.radius=Math.sqrt(s),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Rr.subVectors(e,this.center);let t=Rr.lengthSq();if(t>this.radius*this.radius){let i=Math.sqrt(t),s=(i-this.radius)*.5;this.center.addScaledVector(Rr,s/i),this.radius+=s}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(_c.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Rr.copy(e.center).add(_c)),this.expandByPoint(Rr.copy(e.center).sub(_c))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},ci=new D,xc=new D,jo=new D,Ri=new D,yc=new D,Jo=new D,vc=new D,gi=class{constructor(e=new D,t=new D(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,ci)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=ci.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(ci.copy(this.origin).addScaledVector(this.direction,t),ci.distanceToSquared(e))}distanceSqToSegment(e,t,i,s){xc.copy(e).add(t).multiplyScalar(.5),jo.copy(t).sub(e).normalize(),Ri.copy(this.origin).sub(xc);let r=e.distanceTo(t)*.5,o=-this.direction.dot(jo),a=Ri.dot(this.direction),c=-Ri.dot(jo),l=Ri.lengthSq(),h=Math.abs(1-o*o),u,d,f,g;if(h>0)if(u=o*c-a,d=o*a-c,g=r*h,u>=0)if(d>=-g)if(d<=g){let y=1/h;u*=y,d*=y,f=u*(u+o*d+2*a)+d*(o*u+d+2*c)+l}else d=r,u=Math.max(0,-(o*d+a)),f=-u*u+d*(d+2*c)+l;else d=-r,u=Math.max(0,-(o*d+a)),f=-u*u+d*(d+2*c)+l;else d<=-g?(u=Math.max(0,-(-o*r+a)),d=u>0?-r:Math.min(Math.max(-r,-c),r),f=-u*u+d*(d+2*c)+l):d<=g?(u=0,d=Math.min(Math.max(-r,-c),r),f=d*(d+2*c)+l):(u=Math.max(0,-(o*r+a)),d=u>0?r:Math.min(Math.max(-r,-c),r),f=-u*u+d*(d+2*c)+l);else d=o>0?-r:r,u=Math.max(0,-(o*d+a)),f=-u*u+d*(d+2*c)+l;return i&&i.copy(this.origin).addScaledVector(this.direction,u),s&&s.copy(xc).addScaledVector(jo,d),f}intersectSphere(e,t){ci.subVectors(e.center,this.origin);let i=ci.dot(this.direction),s=ci.dot(ci)-i*i,r=e.radius*e.radius;if(s>r)return null;let o=Math.sqrt(r-s),a=i-o,c=i+o;return c<0?null:a<0?this.at(c,t):this.at(a,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){let i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,s,r,o,a,c,l=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,d=this.origin;return l>=0?(i=(e.min.x-d.x)*l,s=(e.max.x-d.x)*l):(i=(e.max.x-d.x)*l,s=(e.min.x-d.x)*l),h>=0?(r=(e.min.y-d.y)*h,o=(e.max.y-d.y)*h):(r=(e.max.y-d.y)*h,o=(e.min.y-d.y)*h),i>o||r>s||((r>i||isNaN(i))&&(i=r),(o<s||isNaN(s))&&(s=o),u>=0?(a=(e.min.z-d.z)*u,c=(e.max.z-d.z)*u):(a=(e.max.z-d.z)*u,c=(e.min.z-d.z)*u),i>c||a>s)||((a>i||i!==i)&&(i=a),(c<s||s!==s)&&(s=c),s<0)?null:this.at(i>=0?i:s,t)}intersectsBox(e){return this.intersectBox(e,ci)!==null}intersectTriangle(e,t,i,s,r){yc.subVectors(t,e),Jo.subVectors(i,e),vc.crossVectors(yc,Jo);let o=this.direction.dot(vc),a;if(o>0){if(s)return null;a=1}else if(o<0)a=-1,o=-o;else return null;Ri.subVectors(this.origin,e);let c=a*this.direction.dot(Jo.crossVectors(Ri,Jo));if(c<0)return null;let l=a*this.direction.dot(yc.cross(Ri));if(l<0||c+l>o)return null;let h=-a*Ri.dot(vc);return h<0?null:this.at(h/o,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},je=class n{constructor(e,t,i,s,r,o,a,c,l,h,u,d,f,g,y,m){n.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,s,r,o,a,c,l,h,u,d,f,g,y,m)}set(e,t,i,s,r,o,a,c,l,h,u,d,f,g,y,m){let p=this.elements;return p[0]=e,p[4]=t,p[8]=i,p[12]=s,p[1]=r,p[5]=o,p[9]=a,p[13]=c,p[2]=l,p[6]=h,p[10]=u,p[14]=d,p[3]=f,p[7]=g,p[11]=y,p[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new n().fromArray(this.elements)}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){let t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){let t=this.elements,i=e.elements,s=1/Ls.setFromMatrixColumn(e,0).length(),r=1/Ls.setFromMatrixColumn(e,1).length(),o=1/Ls.setFromMatrixColumn(e,2).length();return t[0]=i[0]*s,t[1]=i[1]*s,t[2]=i[2]*s,t[3]=0,t[4]=i[4]*r,t[5]=i[5]*r,t[6]=i[6]*r,t[7]=0,t[8]=i[8]*o,t[9]=i[9]*o,t[10]=i[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,i=e.x,s=e.y,r=e.z,o=Math.cos(i),a=Math.sin(i),c=Math.cos(s),l=Math.sin(s),h=Math.cos(r),u=Math.sin(r);if(e.order==="XYZ"){let d=o*h,f=o*u,g=a*h,y=a*u;t[0]=c*h,t[4]=-c*u,t[8]=l,t[1]=f+g*l,t[5]=d-y*l,t[9]=-a*c,t[2]=y-d*l,t[6]=g+f*l,t[10]=o*c}else if(e.order==="YXZ"){let d=c*h,f=c*u,g=l*h,y=l*u;t[0]=d+y*a,t[4]=g*a-f,t[8]=o*l,t[1]=o*u,t[5]=o*h,t[9]=-a,t[2]=f*a-g,t[6]=y+d*a,t[10]=o*c}else if(e.order==="ZXY"){let d=c*h,f=c*u,g=l*h,y=l*u;t[0]=d-y*a,t[4]=-o*u,t[8]=g+f*a,t[1]=f+g*a,t[5]=o*h,t[9]=y-d*a,t[2]=-o*l,t[6]=a,t[10]=o*c}else if(e.order==="ZYX"){let d=o*h,f=o*u,g=a*h,y=a*u;t[0]=c*h,t[4]=g*l-f,t[8]=d*l+y,t[1]=c*u,t[5]=y*l+d,t[9]=f*l-g,t[2]=-l,t[6]=a*c,t[10]=o*c}else if(e.order==="YZX"){let d=o*c,f=o*l,g=a*c,y=a*l;t[0]=c*h,t[4]=y-d*u,t[8]=g*u+f,t[1]=u,t[5]=o*h,t[9]=-a*h,t[2]=-l*h,t[6]=f*u+g,t[10]=d-y*u}else if(e.order==="XZY"){let d=o*c,f=o*l,g=a*c,y=a*l;t[0]=c*h,t[4]=-u,t[8]=l*h,t[1]=d*u+y,t[5]=o*h,t[9]=f*u-g,t[2]=g*u-f,t[6]=a*h,t[10]=y*u+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(T0,e,E0)}lookAt(e,t,i){let s=this.elements;return gn.subVectors(e,t),gn.lengthSq()===0&&(gn.z=1),gn.normalize(),Ci.crossVectors(i,gn),Ci.lengthSq()===0&&(Math.abs(i.z)===1?gn.x+=1e-4:gn.z+=1e-4,gn.normalize(),Ci.crossVectors(i,gn)),Ci.normalize(),Ko.crossVectors(gn,Ci),s[0]=Ci.x,s[4]=Ko.x,s[8]=gn.x,s[1]=Ci.y,s[5]=Ko.y,s[9]=gn.y,s[2]=Ci.z,s[6]=Ko.z,s[10]=gn.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,s=t.elements,r=this.elements,o=i[0],a=i[4],c=i[8],l=i[12],h=i[1],u=i[5],d=i[9],f=i[13],g=i[2],y=i[6],m=i[10],p=i[14],E=i[3],T=i[7],v=i[11],R=i[15],w=s[0],C=s[4],L=s[8],b=s[12],x=s[1],P=s[5],U=s[9],W=s[13],$=s[2],J=s[6],G=s[10],Q=s[14],X=s[3],te=s[7],ue=s[11],Ee=s[15];return r[0]=o*w+a*x+c*$+l*X,r[4]=o*C+a*P+c*J+l*te,r[8]=o*L+a*U+c*G+l*ue,r[12]=o*b+a*W+c*Q+l*Ee,r[1]=h*w+u*x+d*$+f*X,r[5]=h*C+u*P+d*J+f*te,r[9]=h*L+u*U+d*G+f*ue,r[13]=h*b+u*W+d*Q+f*Ee,r[2]=g*w+y*x+m*$+p*X,r[6]=g*C+y*P+m*J+p*te,r[10]=g*L+y*U+m*G+p*ue,r[14]=g*b+y*W+m*Q+p*Ee,r[3]=E*w+T*x+v*$+R*X,r[7]=E*C+T*P+v*J+R*te,r[11]=E*L+T*U+v*G+R*ue,r[15]=E*b+T*W+v*Q+R*Ee,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[4],s=e[8],r=e[12],o=e[1],a=e[5],c=e[9],l=e[13],h=e[2],u=e[6],d=e[10],f=e[14],g=e[3],y=e[7],m=e[11],p=e[15];return g*(+r*c*u-s*l*u-r*a*d+i*l*d+s*a*f-i*c*f)+y*(+t*c*f-t*l*d+r*o*d-s*o*f+s*l*h-r*c*h)+m*(+t*l*u-t*a*f-r*o*u+i*o*f+r*a*h-i*l*h)+p*(-s*a*h-t*c*u+t*a*d+s*o*u-i*o*d+i*c*h)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){let s=this.elements;return e.isVector3?(s[12]=e.x,s[13]=e.y,s[14]=e.z):(s[12]=e,s[13]=t,s[14]=i),this}invert(){let e=this.elements,t=e[0],i=e[1],s=e[2],r=e[3],o=e[4],a=e[5],c=e[6],l=e[7],h=e[8],u=e[9],d=e[10],f=e[11],g=e[12],y=e[13],m=e[14],p=e[15],E=u*m*l-y*d*l+y*c*f-a*m*f-u*c*p+a*d*p,T=g*d*l-h*m*l-g*c*f+o*m*f+h*c*p-o*d*p,v=h*y*l-g*u*l+g*a*f-o*y*f-h*a*p+o*u*p,R=g*u*c-h*y*c-g*a*d+o*y*d+h*a*m-o*u*m,w=t*E+i*T+s*v+r*R;if(w===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let C=1/w;return e[0]=E*C,e[1]=(y*d*r-u*m*r-y*s*f+i*m*f+u*s*p-i*d*p)*C,e[2]=(a*m*r-y*c*r+y*s*l-i*m*l-a*s*p+i*c*p)*C,e[3]=(u*c*r-a*d*r-u*s*l+i*d*l+a*s*f-i*c*f)*C,e[4]=T*C,e[5]=(h*m*r-g*d*r+g*s*f-t*m*f-h*s*p+t*d*p)*C,e[6]=(g*c*r-o*m*r-g*s*l+t*m*l+o*s*p-t*c*p)*C,e[7]=(o*d*r-h*c*r+h*s*l-t*d*l-o*s*f+t*c*f)*C,e[8]=v*C,e[9]=(g*u*r-h*y*r-g*i*f+t*y*f+h*i*p-t*u*p)*C,e[10]=(o*y*r-g*a*r+g*i*l-t*y*l-o*i*p+t*a*p)*C,e[11]=(h*a*r-o*u*r-h*i*l+t*u*l+o*i*f-t*a*f)*C,e[12]=R*C,e[13]=(h*y*s-g*u*s+g*i*d-t*y*d-h*i*m+t*u*m)*C,e[14]=(g*a*s-o*y*s-g*i*c+t*y*c+o*i*m-t*a*m)*C,e[15]=(o*u*s-h*a*s+h*i*c-t*u*c-o*i*d+t*a*d)*C,this}scale(e){let t=this.elements,i=e.x,s=e.y,r=e.z;return t[0]*=i,t[4]*=s,t[8]*=r,t[1]*=i,t[5]*=s,t[9]*=r,t[2]*=i,t[6]*=s,t[10]*=r,t[3]*=i,t[7]*=s,t[11]*=r,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],s=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,s))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let i=Math.cos(t),s=Math.sin(t),r=1-i,o=e.x,a=e.y,c=e.z,l=r*o,h=r*a;return this.set(l*o+i,l*a-s*c,l*c+s*a,0,l*a+s*c,h*a+i,h*c-s*o,0,l*c-s*a,h*c+s*o,r*c*c+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,s,r,o){return this.set(1,i,r,0,e,1,o,0,t,s,1,0,0,0,0,1),this}compose(e,t,i){let s=this.elements,r=t._x,o=t._y,a=t._z,c=t._w,l=r+r,h=o+o,u=a+a,d=r*l,f=r*h,g=r*u,y=o*h,m=o*u,p=a*u,E=c*l,T=c*h,v=c*u,R=i.x,w=i.y,C=i.z;return s[0]=(1-(y+p))*R,s[1]=(f+v)*R,s[2]=(g-T)*R,s[3]=0,s[4]=(f-v)*w,s[5]=(1-(d+p))*w,s[6]=(m+E)*w,s[7]=0,s[8]=(g+T)*C,s[9]=(m-E)*C,s[10]=(1-(d+y))*C,s[11]=0,s[12]=e.x,s[13]=e.y,s[14]=e.z,s[15]=1,this}decompose(e,t,i){let s=this.elements,r=Ls.set(s[0],s[1],s[2]).length(),o=Ls.set(s[4],s[5],s[6]).length(),a=Ls.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),e.x=s[12],e.y=s[13],e.z=s[14],In.copy(this);let l=1/r,h=1/o,u=1/a;return In.elements[0]*=l,In.elements[1]*=l,In.elements[2]*=l,In.elements[4]*=h,In.elements[5]*=h,In.elements[6]*=h,In.elements[8]*=u,In.elements[9]*=u,In.elements[10]*=u,t.setFromRotationMatrix(In),i.x=r,i.y=o,i.z=a,this}makePerspective(e,t,i,s,r,o,a=Nn,c=!1){let l=this.elements,h=2*r/(t-e),u=2*r/(i-s),d=(t+e)/(t-e),f=(i+s)/(i-s),g,y;if(c)g=r/(o-r),y=o*r/(o-r);else if(a===Nn)g=-(o+r)/(o-r),y=-2*o*r/(o-r);else if(a===Hr)g=-o/(o-r),y=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return l[0]=h,l[4]=0,l[8]=d,l[12]=0,l[1]=0,l[5]=u,l[9]=f,l[13]=0,l[2]=0,l[6]=0,l[10]=g,l[14]=y,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,i,s,r,o,a=Nn,c=!1){let l=this.elements,h=2/(t-e),u=2/(i-s),d=-(t+e)/(t-e),f=-(i+s)/(i-s),g,y;if(c)g=1/(o-r),y=o/(o-r);else if(a===Nn)g=-2/(o-r),y=-(o+r)/(o-r);else if(a===Hr)g=-1/(o-r),y=-r/(o-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return l[0]=h,l[4]=0,l[8]=0,l[12]=d,l[1]=0,l[5]=u,l[9]=0,l[13]=f,l[2]=0,l[6]=0,l[10]=g,l[14]=y,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){let t=this.elements,i=e.elements;for(let s=0;s<16;s++)if(t[s]!==i[s])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}},Ls=new D,In=new je,T0=new D(0,0,0),E0=new D(1,1,1),Ci=new D,Ko=new D,gn=new D,Ad=new je,Rd=new ln,En=class n{constructor(e=0,t=0,i=0,s=n.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=s}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,s=this._order){return this._x=e,this._y=t,this._z=i,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){let s=e.elements,r=s[0],o=s[4],a=s[8],c=s[1],l=s[5],h=s[9],u=s[2],d=s[6],f=s[10];switch(t){case"XYZ":this._y=Math.asin(Qe(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-h,f),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(d,l),this._z=0);break;case"YXZ":this._x=Math.asin(-Qe(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(a,f),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-u,r),this._z=0);break;case"ZXY":this._x=Math.asin(Qe(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,f),this._z=Math.atan2(-o,l)):(this._y=0,this._z=Math.atan2(c,r));break;case"ZYX":this._y=Math.asin(-Qe(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(c,r)):(this._x=0,this._z=Math.atan2(-o,l));break;case"YZX":this._z=Math.asin(Qe(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-h,l),this._y=Math.atan2(-u,r)):(this._x=0,this._y=Math.atan2(a,f));break;case"XZY":this._z=Math.asin(-Qe(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(d,l),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-h,f),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return Ad.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Ad,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Rd.setFromEuler(this),this.setFromQuaternion(Rd,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};En.DEFAULT_ORDER="XYZ";var Gr=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},w0=0,Cd=new D,Ds=new ln,ui=new je,Zo=new D,Cr=new D,A0=new D,R0=new ln,Pd=new D(1,0,0),Id=new D(0,1,0),Ld=new D(0,0,1),Dd={type:"added"},C0={type:"removed"},Ns={type:"childadded",child:null},bc={type:"childremoved",child:null},Mt=class n extends Yn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:w0++}),this.uuid=On(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=n.DEFAULT_UP.clone();let e=new D,t=new En,i=new ln,s=new D(1,1,1);function r(){i.setFromEuler(t,!1)}function o(){t.setFromQuaternion(i,void 0,!1)}t._onChange(r),i._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new je},normalMatrix:{value:new Je}}),this.matrix=new je,this.matrixWorld=new je,this.matrixAutoUpdate=n.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=n.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Gr,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Ds.setFromAxisAngle(e,t),this.quaternion.multiply(Ds),this}rotateOnWorldAxis(e,t){return Ds.setFromAxisAngle(e,t),this.quaternion.premultiply(Ds),this}rotateX(e){return this.rotateOnAxis(Pd,e)}rotateY(e){return this.rotateOnAxis(Id,e)}rotateZ(e){return this.rotateOnAxis(Ld,e)}translateOnAxis(e,t){return Cd.copy(e).applyQuaternion(this.quaternion),this.position.add(Cd.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Pd,e)}translateY(e){return this.translateOnAxis(Id,e)}translateZ(e){return this.translateOnAxis(Ld,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(ui.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?Zo.copy(e):Zo.set(e,t,i);let s=this.parent;this.updateWorldMatrix(!0,!1),Cr.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?ui.lookAt(Cr,Zo,this.up):ui.lookAt(Zo,Cr,this.up),this.quaternion.setFromRotationMatrix(ui),s&&(ui.extractRotation(s.matrixWorld),Ds.setFromRotationMatrix(ui),this.quaternion.premultiply(Ds.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Dd),Ns.child=e,this.dispatchEvent(Ns),Ns.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(C0),bc.child=e,this.dispatchEvent(bc),bc.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),ui.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),ui.multiply(e.parent.matrixWorld)),e.applyMatrix4(ui),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Dd),Ns.child=e,this.dispatchEvent(Ns),Ns.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,s=this.children.length;i<s;i++){let o=this.children[i].getObjectByProperty(e,t);if(o!==void 0)return o}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Cr,e,A0),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Cr,R0,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let i=0,s=t.length;i<s;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let i=0,s=t.length;i<s;i++)t[i].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let i=0,s=t.length;i<s;i++)t[i].updateMatrixWorld(e)}updateWorldMatrix(e,t){let i=this.parent;if(e===!0&&i!==null&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(e){let t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(a=>({...a,boundingBox:a.boundingBox?a.boundingBox.toJSON():void 0,boundingSphere:a.boundingSphere?a.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(a=>({...a})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(e),s.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function r(a,c){return a[c.uuid]===void 0&&(a[c.uuid]=c.toJSON(e)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(e.geometries,this.geometry);let a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){let c=a.shapes;if(Array.isArray(c))for(let l=0,h=c.length;l<h;l++){let u=c[l];r(e.shapes,u)}else r(e.shapes,c)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let a=[];for(let c=0,l=this.material.length;c<l;c++)a.push(r(e.materials,this.material[c]));s.material=a}else s.material=r(e.materials,this.material);if(this.children.length>0){s.children=[];for(let a=0;a<this.children.length;a++)s.children.push(this.children[a].toJSON(e).object)}if(this.animations.length>0){s.animations=[];for(let a=0;a<this.animations.length;a++){let c=this.animations[a];s.animations.push(r(e.animations,c))}}if(t){let a=o(e.geometries),c=o(e.materials),l=o(e.textures),h=o(e.images),u=o(e.shapes),d=o(e.skeletons),f=o(e.animations),g=o(e.nodes);a.length>0&&(i.geometries=a),c.length>0&&(i.materials=c),l.length>0&&(i.textures=l),h.length>0&&(i.images=h),u.length>0&&(i.shapes=u),d.length>0&&(i.skeletons=d),f.length>0&&(i.animations=f),g.length>0&&(i.nodes=g)}return i.object=s,i;function o(a){let c=[];for(let l in a){let h=a[l];delete h.metadata,c.push(h)}return c}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){let s=e.children[i];this.add(s.clone())}return this}};Mt.DEFAULT_UP=new D(0,1,0);Mt.DEFAULT_MATRIX_AUTO_UPDATE=!0;Mt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Ln=new D,hi=new D,Sc=new D,di=new D,Os=new D,Fs=new D,Nd=new D,Mc=new D,Tc=new D,Ec=new D,wc=new ut,Ac=new ut,Rc=new ut,pi=class n{constructor(e=new D,t=new D,i=new D){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,s){s.subVectors(i,t),Ln.subVectors(e,t),s.cross(Ln);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(e,t,i,s,r){Ln.subVectors(s,t),hi.subVectors(i,t),Sc.subVectors(e,t);let o=Ln.dot(Ln),a=Ln.dot(hi),c=Ln.dot(Sc),l=hi.dot(hi),h=hi.dot(Sc),u=o*l-a*a;if(u===0)return r.set(0,0,0),null;let d=1/u,f=(l*c-a*h)*d,g=(o*h-a*c)*d;return r.set(1-f-g,g,f)}static containsPoint(e,t,i,s){return this.getBarycoord(e,t,i,s,di)===null?!1:di.x>=0&&di.y>=0&&di.x+di.y<=1}static getInterpolation(e,t,i,s,r,o,a,c){return this.getBarycoord(e,t,i,s,di)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(r,di.x),c.addScaledVector(o,di.y),c.addScaledVector(a,di.z),c)}static getInterpolatedAttribute(e,t,i,s,r,o){return wc.setScalar(0),Ac.setScalar(0),Rc.setScalar(0),wc.fromBufferAttribute(e,t),Ac.fromBufferAttribute(e,i),Rc.fromBufferAttribute(e,s),o.setScalar(0),o.addScaledVector(wc,r.x),o.addScaledVector(Ac,r.y),o.addScaledVector(Rc,r.z),o}static isFrontFacing(e,t,i,s){return Ln.subVectors(i,t),hi.subVectors(e,t),Ln.cross(hi).dot(s)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,s){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[s]),this}setFromAttributeAndIndices(e,t,i,s){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,s),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Ln.subVectors(this.c,this.b),hi.subVectors(this.a,this.b),Ln.cross(hi).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return n.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return n.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,i,s,r){return n.getInterpolation(e,this.a,this.b,this.c,t,i,s,r)}containsPoint(e){return n.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return n.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let i=this.a,s=this.b,r=this.c,o,a;Os.subVectors(s,i),Fs.subVectors(r,i),Mc.subVectors(e,i);let c=Os.dot(Mc),l=Fs.dot(Mc);if(c<=0&&l<=0)return t.copy(i);Tc.subVectors(e,s);let h=Os.dot(Tc),u=Fs.dot(Tc);if(h>=0&&u<=h)return t.copy(s);let d=c*u-h*l;if(d<=0&&c>=0&&h<=0)return o=c/(c-h),t.copy(i).addScaledVector(Os,o);Ec.subVectors(e,r);let f=Os.dot(Ec),g=Fs.dot(Ec);if(g>=0&&f<=g)return t.copy(r);let y=f*l-c*g;if(y<=0&&l>=0&&g<=0)return a=l/(l-g),t.copy(i).addScaledVector(Fs,a);let m=h*g-f*u;if(m<=0&&u-h>=0&&f-g>=0)return Nd.subVectors(r,s),a=(u-h)/(u-h+(f-g)),t.copy(s).addScaledVector(Nd,a);let p=1/(m+y+d);return o=y*p,a=d*p,t.copy(i).addScaledVector(Os,o).addScaledVector(Fs,a)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},Kf={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Pi={h:0,s:0,l:0},Qo={h:0,s:0,l:0};function Cc(n,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?n+(e-n)*6*t:t<1/2?e:t<2/3?n+(e-n)*6*(2/3-t):n}var Ne=class{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){let s=e;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Bt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,at.colorSpaceToWorking(this,t),this}setRGB(e,t,i,s=at.workingColorSpace){return this.r=e,this.g=t,this.b=i,at.colorSpaceToWorking(this,s),this}setHSL(e,t,i,s=at.workingColorSpace){if(e=pu(e,1),t=Qe(t,0,1),i=Qe(i,0,1),t===0)this.r=this.g=this.b=i;else{let r=i<=.5?i*(1+t):i+t-i*t,o=2*i-r;this.r=Cc(o,r,e+1/3),this.g=Cc(o,r,e),this.b=Cc(o,r,e-1/3)}return at.colorSpaceToWorking(this,s),this}setStyle(e,t=Bt){function i(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(e)){let r,o=s[1],a=s[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(e)){let r=s[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(o===6)return this.setHex(parseInt(r,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Bt){let i=Kf[e.toLowerCase()];return i!==void 0?this.setHex(i,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=mi(e.r),this.g=mi(e.g),this.b=mi(e.b),this}copyLinearToSRGB(e){return this.r=Xs(e.r),this.g=Xs(e.g),this.b=Xs(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Bt){return at.workingToColorSpace(Kt.copy(this),e),Math.round(Qe(Kt.r*255,0,255))*65536+Math.round(Qe(Kt.g*255,0,255))*256+Math.round(Qe(Kt.b*255,0,255))}getHexString(e=Bt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=at.workingColorSpace){at.workingToColorSpace(Kt.copy(this),t);let i=Kt.r,s=Kt.g,r=Kt.b,o=Math.max(i,s,r),a=Math.min(i,s,r),c,l,h=(a+o)/2;if(a===o)c=0,l=0;else{let u=o-a;switch(l=h<=.5?u/(o+a):u/(2-o-a),o){case i:c=(s-r)/u+(s<r?6:0);break;case s:c=(r-i)/u+2;break;case r:c=(i-s)/u+4;break}c/=6}return e.h=c,e.s=l,e.l=h,e}getRGB(e,t=at.workingColorSpace){return at.workingToColorSpace(Kt.copy(this),t),e.r=Kt.r,e.g=Kt.g,e.b=Kt.b,e}getStyle(e=Bt){at.workingToColorSpace(Kt.copy(this),e);let t=Kt.r,i=Kt.g,s=Kt.b;return e!==Bt?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(s*255)})`}offsetHSL(e,t,i){return this.getHSL(Pi),this.setHSL(Pi.h+e,Pi.s+t,Pi.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(Pi),e.getHSL(Qo);let i=kr(Pi.h,Qo.h,t),s=kr(Pi.s,Qo.s,t),r=kr(Pi.l,Qo.l,t);return this.setHSL(i,s,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,i=this.g,s=this.b,r=e.elements;return this.r=r[0]*t+r[3]*i+r[6]*s,this.g=r[1]*t+r[4]*i+r[7]*s,this.b=r[2]*t+r[5]*i+r[8]*s,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Kt=new Ne;Ne.NAMES=Kf;var P0=0,Qt=class extends Yn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:P0++}),this.uuid=On(),this.name="",this.type="Material",this.blending=ji,this.side=Fn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=ba,this.blendDst=Sa,this.blendEquation=Li,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Ne(0,0,0),this.blendAlpha=0,this.depthFunc=Ji,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=$c,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=qi,this.stencilZFail=qi,this.stencilZPass=qi,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let i=e[t];if(i===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(i):s&&s.isVector3&&i&&i.isVector3?s.copy(i):this[t]=i}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let i={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(i.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(i.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==ji&&(i.blending=this.blending),this.side!==Fn&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==ba&&(i.blendSrc=this.blendSrc),this.blendDst!==Sa&&(i.blendDst=this.blendDst),this.blendEquation!==Li&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==Ji&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==$c&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==qi&&(i.stencilFail=this.stencilFail),this.stencilZFail!==qi&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==qi&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function s(r){let o=[];for(let a in r){let c=r[a];delete c.metadata,o.push(c)}return o}if(t){let r=s(e.textures),o=s(e.images);r.length>0&&(i.textures=r),o.length>0&&(i.images=o)}return i}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,i=null;if(t!==null){let s=t.length;i=new Array(s);for(let r=0;r!==s;++r)i[r]=t[r].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}},en=class extends Qt{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Ne(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new En,this.combine=ja,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}};var Pt=new D,ea=new De,I0=0,Dt=class{constructor(e,t,i=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:I0++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=Ma,this.updateRanges=[],this.gpuType=wn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[e+s]=t.array[i+s];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)ea.fromBufferAttribute(this,t),ea.applyMatrix3(e),this.setXY(t,ea.x,ea.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)Pt.fromBufferAttribute(this,t),Pt.applyMatrix3(e),this.setXYZ(t,Pt.x,Pt.y,Pt.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)Pt.fromBufferAttribute(this,t),Pt.applyMatrix4(e),this.setXYZ(t,Pt.x,Pt.y,Pt.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)Pt.fromBufferAttribute(this,t),Pt.applyNormalMatrix(e),this.setXYZ(t,Pt.x,Pt.y,Pt.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)Pt.fromBufferAttribute(this,t),Pt.transformDirection(e),this.setXYZ(t,Pt.x,Pt.y,Pt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=Dn(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=_t(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Dn(t,this.array)),t}setX(e,t){return this.normalized&&(t=_t(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Dn(t,this.array)),t}setY(e,t){return this.normalized&&(t=_t(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Dn(t,this.array)),t}setZ(e,t){return this.normalized&&(t=_t(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Dn(t,this.array)),t}setW(e,t){return this.normalized&&(t=_t(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=_t(t,this.array),i=_t(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,s){return e*=this.itemSize,this.normalized&&(t=_t(t,this.array),i=_t(i,this.array),s=_t(s,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=s,this}setXYZW(e,t,i,s,r){return e*=this.itemSize,this.normalized&&(t=_t(t,this.array),i=_t(i,this.array),s=_t(s,this.array),r=_t(r,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=s,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==Ma&&(e.usage=this.usage),e}};var Wr=class extends Dt{constructor(e,t,i){super(new Uint16Array(e),t,i)}};var $r=class extends Dt{constructor(e,t,i){super(new Uint32Array(e),t,i)}};var gt=class extends Dt{constructor(e,t,i){super(new Float32Array(e),t,i)}},L0=0,Mn=new je,Pc=new Mt,Us=new D,_n=new cn,Pr=new cn,$t=new D,Ct=class n extends Yn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:L0++}),this.uuid=On(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(mu(e)?$r:Wr)(e,1):this.index=e,this}setIndirect(e){return this.indirect=e,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let i=this.attributes.normal;if(i!==void 0){let r=new Je().getNormalMatrix(e);i.applyNormalMatrix(r),i.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(e),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return Mn.makeRotationFromQuaternion(e),this.applyMatrix4(Mn),this}rotateX(e){return Mn.makeRotationX(e),this.applyMatrix4(Mn),this}rotateY(e){return Mn.makeRotationY(e),this.applyMatrix4(Mn),this}rotateZ(e){return Mn.makeRotationZ(e),this.applyMatrix4(Mn),this}translate(e,t,i){return Mn.makeTranslation(e,t,i),this.applyMatrix4(Mn),this}scale(e,t,i){return Mn.makeScale(e,t,i),this.applyMatrix4(Mn),this}lookAt(e){return Pc.lookAt(e),Pc.updateMatrix(),this.applyMatrix4(Pc.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Us).negate(),this.translate(Us.x,Us.y,Us.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let i=[];for(let s=0,r=e.length;s<r;s++){let o=e[s];i.push(o.x,o.y,o.z||0)}this.setAttribute("position",new gt(i,3))}else{let i=Math.min(e.length,t.count);for(let s=0;s<i;s++){let r=e[s];t.setXYZ(s,r.x,r.y,r.z||0)}e.length>t.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new cn);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new D(-1/0,-1/0,-1/0),new D(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,s=t.length;i<s;i++){let r=t[i];_n.setFromBufferAttribute(r),this.morphTargetsRelative?($t.addVectors(this.boundingBox.min,_n.min),this.boundingBox.expandByPoint($t),$t.addVectors(this.boundingBox.max,_n.max),this.boundingBox.expandByPoint($t)):(this.boundingBox.expandByPoint(_n.min),this.boundingBox.expandByPoint(_n.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Zt);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new D,1/0);return}if(e){let i=this.boundingSphere.center;if(_n.setFromBufferAttribute(e),t)for(let r=0,o=t.length;r<o;r++){let a=t[r];Pr.setFromBufferAttribute(a),this.morphTargetsRelative?($t.addVectors(_n.min,Pr.min),_n.expandByPoint($t),$t.addVectors(_n.max,Pr.max),_n.expandByPoint($t)):(_n.expandByPoint(Pr.min),_n.expandByPoint(Pr.max))}_n.getCenter(i);let s=0;for(let r=0,o=e.count;r<o;r++)$t.fromBufferAttribute(e,r),s=Math.max(s,i.distanceToSquared($t));if(t)for(let r=0,o=t.length;r<o;r++){let a=t[r],c=this.morphTargetsRelative;for(let l=0,h=a.count;l<h;l++)$t.fromBufferAttribute(a,l),c&&(Us.fromBufferAttribute(e,l),$t.add(Us)),s=Math.max(s,i.distanceToSquared($t))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let i=t.position,s=t.normal,r=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Dt(new Float32Array(4*i.count),4));let o=this.getAttribute("tangent"),a=[],c=[];for(let L=0;L<i.count;L++)a[L]=new D,c[L]=new D;let l=new D,h=new D,u=new D,d=new De,f=new De,g=new De,y=new D,m=new D;function p(L,b,x){l.fromBufferAttribute(i,L),h.fromBufferAttribute(i,b),u.fromBufferAttribute(i,x),d.fromBufferAttribute(r,L),f.fromBufferAttribute(r,b),g.fromBufferAttribute(r,x),h.sub(l),u.sub(l),f.sub(d),g.sub(d);let P=1/(f.x*g.y-g.x*f.y);isFinite(P)&&(y.copy(h).multiplyScalar(g.y).addScaledVector(u,-f.y).multiplyScalar(P),m.copy(u).multiplyScalar(f.x).addScaledVector(h,-g.x).multiplyScalar(P),a[L].add(y),a[b].add(y),a[x].add(y),c[L].add(m),c[b].add(m),c[x].add(m))}let E=this.groups;E.length===0&&(E=[{start:0,count:e.count}]);for(let L=0,b=E.length;L<b;++L){let x=E[L],P=x.start,U=x.count;for(let W=P,$=P+U;W<$;W+=3)p(e.getX(W+0),e.getX(W+1),e.getX(W+2))}let T=new D,v=new D,R=new D,w=new D;function C(L){R.fromBufferAttribute(s,L),w.copy(R);let b=a[L];T.copy(b),T.sub(R.multiplyScalar(R.dot(b))).normalize(),v.crossVectors(w,b);let P=v.dot(c[L])<0?-1:1;o.setXYZW(L,T.x,T.y,T.z,P)}for(let L=0,b=E.length;L<b;++L){let x=E[L],P=x.start,U=x.count;for(let W=P,$=P+U;W<$;W+=3)C(e.getX(W+0)),C(e.getX(W+1)),C(e.getX(W+2))}}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0)i=new Dt(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let d=0,f=i.count;d<f;d++)i.setXYZ(d,0,0,0);let s=new D,r=new D,o=new D,a=new D,c=new D,l=new D,h=new D,u=new D;if(e)for(let d=0,f=e.count;d<f;d+=3){let g=e.getX(d+0),y=e.getX(d+1),m=e.getX(d+2);s.fromBufferAttribute(t,g),r.fromBufferAttribute(t,y),o.fromBufferAttribute(t,m),h.subVectors(o,r),u.subVectors(s,r),h.cross(u),a.fromBufferAttribute(i,g),c.fromBufferAttribute(i,y),l.fromBufferAttribute(i,m),a.add(h),c.add(h),l.add(h),i.setXYZ(g,a.x,a.y,a.z),i.setXYZ(y,c.x,c.y,c.z),i.setXYZ(m,l.x,l.y,l.z)}else for(let d=0,f=t.count;d<f;d+=3)s.fromBufferAttribute(t,d+0),r.fromBufferAttribute(t,d+1),o.fromBufferAttribute(t,d+2),h.subVectors(o,r),u.subVectors(s,r),h.cross(u),i.setXYZ(d+0,h.x,h.y,h.z),i.setXYZ(d+1,h.x,h.y,h.z),i.setXYZ(d+2,h.x,h.y,h.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)$t.fromBufferAttribute(e,t),$t.normalize(),e.setXYZ(t,$t.x,$t.y,$t.z)}toNonIndexed(){function e(a,c){let l=a.array,h=a.itemSize,u=a.normalized,d=new l.constructor(c.length*h),f=0,g=0;for(let y=0,m=c.length;y<m;y++){a.isInterleavedBufferAttribute?f=c[y]*a.data.stride+a.offset:f=c[y]*h;for(let p=0;p<h;p++)d[g++]=l[f++]}return new Dt(d,h,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new n,i=this.index.array,s=this.attributes;for(let a in s){let c=s[a],l=e(c,i);t.setAttribute(a,l)}let r=this.morphAttributes;for(let a in r){let c=[],l=r[a];for(let h=0,u=l.length;h<u;h++){let d=l[h],f=e(d,i);c.push(f)}t.morphAttributes[a]=c}t.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let a=0,c=o.length;a<c;a++){let l=o[a];t.addGroup(l.start,l.count,l.materialIndex)}return t}toJSON(){let e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){let c=this.parameters;for(let l in c)c[l]!==void 0&&(e[l]=c[l]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let i=this.attributes;for(let c in i){let l=i[c];e.data.attributes[c]=l.toJSON(e.data)}let s={},r=!1;for(let c in this.morphAttributes){let l=this.morphAttributes[c],h=[];for(let u=0,d=l.length;u<d;u++){let f=l[u];h.push(f.toJSON(e.data))}h.length>0&&(s[c]=h,r=!0)}r&&(e.data.morphAttributes=s,e.data.morphTargetsRelative=this.morphTargetsRelative);let o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));let a=this.boundingSphere;return a!==null&&(e.data.boundingSphere=a.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let i=e.index;i!==null&&this.setIndex(i.clone());let s=e.attributes;for(let l in s){let h=s[l];this.setAttribute(l,h.clone(t))}let r=e.morphAttributes;for(let l in r){let h=[],u=r[l];for(let d=0,f=u.length;d<f;d++)h.push(u[d].clone(t));this.morphAttributes[l]=h}this.morphTargetsRelative=e.morphTargetsRelative;let o=e.groups;for(let l=0,h=o.length;l<h;l++){let u=o[l];this.addGroup(u.start,u.count,u.materialIndex)}let a=e.boundingBox;a!==null&&(this.boundingBox=a.clone());let c=e.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},Od=new je,Xi=new gi,ta=new Zt,Fd=new D,na=new D,ia=new D,sa=new D,Ic=new D,ra=new D,Ud=new D,oa=new D,ht=class extends Mt{constructor(e=new Ct,t=new en){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let s=t[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(e,t){let i=this.geometry,s=i.attributes.position,r=i.morphAttributes.position,o=i.morphTargetsRelative;t.fromBufferAttribute(s,e);let a=this.morphTargetInfluences;if(r&&a){ra.set(0,0,0);for(let c=0,l=r.length;c<l;c++){let h=a[c],u=r[c];h!==0&&(Ic.fromBufferAttribute(u,e),o?ra.addScaledVector(Ic,h):ra.addScaledVector(Ic.sub(t),h))}t.add(ra)}return t}raycast(e,t){let i=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),ta.copy(i.boundingSphere),ta.applyMatrix4(r),Xi.copy(e.ray).recast(e.near),!(ta.containsPoint(Xi.origin)===!1&&(Xi.intersectSphere(ta,Fd)===null||Xi.origin.distanceToSquared(Fd)>(e.far-e.near)**2))&&(Od.copy(r).invert(),Xi.copy(e.ray).applyMatrix4(Od),!(i.boundingBox!==null&&Xi.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,Xi)))}_computeIntersections(e,t,i){let s,r=this.geometry,o=this.material,a=r.index,c=r.attributes.position,l=r.attributes.uv,h=r.attributes.uv1,u=r.attributes.normal,d=r.groups,f=r.drawRange;if(a!==null)if(Array.isArray(o))for(let g=0,y=d.length;g<y;g++){let m=d[g],p=o[m.materialIndex],E=Math.max(m.start,f.start),T=Math.min(a.count,Math.min(m.start+m.count,f.start+f.count));for(let v=E,R=T;v<R;v+=3){let w=a.getX(v),C=a.getX(v+1),L=a.getX(v+2);s=aa(this,p,e,i,l,h,u,w,C,L),s&&(s.faceIndex=Math.floor(v/3),s.face.materialIndex=m.materialIndex,t.push(s))}}else{let g=Math.max(0,f.start),y=Math.min(a.count,f.start+f.count);for(let m=g,p=y;m<p;m+=3){let E=a.getX(m),T=a.getX(m+1),v=a.getX(m+2);s=aa(this,o,e,i,l,h,u,E,T,v),s&&(s.faceIndex=Math.floor(m/3),t.push(s))}}else if(c!==void 0)if(Array.isArray(o))for(let g=0,y=d.length;g<y;g++){let m=d[g],p=o[m.materialIndex],E=Math.max(m.start,f.start),T=Math.min(c.count,Math.min(m.start+m.count,f.start+f.count));for(let v=E,R=T;v<R;v+=3){let w=v,C=v+1,L=v+2;s=aa(this,p,e,i,l,h,u,w,C,L),s&&(s.faceIndex=Math.floor(v/3),s.face.materialIndex=m.materialIndex,t.push(s))}}else{let g=Math.max(0,f.start),y=Math.min(c.count,f.start+f.count);for(let m=g,p=y;m<p;m+=3){let E=m,T=m+1,v=m+2;s=aa(this,o,e,i,l,h,u,E,T,v),s&&(s.faceIndex=Math.floor(m/3),t.push(s))}}}};function D0(n,e,t,i,s,r,o,a){let c;if(e.side===zt?c=i.intersectTriangle(o,r,s,!0,a):c=i.intersectTriangle(s,r,o,e.side===Fn,a),c===null)return null;oa.copy(a),oa.applyMatrix4(n.matrixWorld);let l=t.ray.origin.distanceTo(oa);return l<t.near||l>t.far?null:{distance:l,point:oa.clone(),object:n}}function aa(n,e,t,i,s,r,o,a,c,l){n.getVertexPosition(a,na),n.getVertexPosition(c,ia),n.getVertexPosition(l,sa);let h=D0(n,e,t,i,na,ia,sa,Ud);if(h){let u=new D;pi.getBarycoord(Ud,na,ia,sa,u),s&&(h.uv=pi.getInterpolatedAttribute(s,a,c,l,u,new De)),r&&(h.uv1=pi.getInterpolatedAttribute(r,a,c,l,u,new De)),o&&(h.normal=pi.getInterpolatedAttribute(o,a,c,l,u,new D),h.normal.dot(i.direction)>0&&h.normal.multiplyScalar(-1));let d={a,b:c,c:l,normal:new D,materialIndex:0};pi.getNormal(na,ia,sa,d.normal),h.face=d,h.barycoord=u}return h}var Ni=class n extends Ct{constructor(e=1,t=1,i=1,s=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:s,heightSegments:r,depthSegments:o};let a=this;s=Math.floor(s),r=Math.floor(r),o=Math.floor(o);let c=[],l=[],h=[],u=[],d=0,f=0;g("z","y","x",-1,-1,i,t,e,o,r,0),g("z","y","x",1,-1,i,t,-e,o,r,1),g("x","z","y",1,1,e,i,t,s,o,2),g("x","z","y",1,-1,e,i,-t,s,o,3),g("x","y","z",1,-1,e,t,i,s,r,4),g("x","y","z",-1,-1,e,t,-i,s,r,5),this.setIndex(c),this.setAttribute("position",new gt(l,3)),this.setAttribute("normal",new gt(h,3)),this.setAttribute("uv",new gt(u,2));function g(y,m,p,E,T,v,R,w,C,L,b){let x=v/C,P=R/L,U=v/2,W=R/2,$=w/2,J=C+1,G=L+1,Q=0,X=0,te=new D;for(let ue=0;ue<G;ue++){let Ee=ue*P-W;for(let Ve=0;Ve<J;Ve++){let qe=Ve*x-U;te[y]=qe*E,te[m]=Ee*T,te[p]=$,l.push(te.x,te.y,te.z),te[y]=0,te[m]=0,te[p]=w>0?1:-1,h.push(te.x,te.y,te.z),u.push(Ve/C),u.push(1-ue/L),Q+=1}}for(let ue=0;ue<L;ue++)for(let Ee=0;Ee<C;Ee++){let Ve=d+Ee+J*ue,qe=d+Ee+J*(ue+1),lt=d+(Ee+1)+J*(ue+1),Xe=d+(Ee+1)+J*ue;c.push(Ve,qe,Xe),c.push(qe,lt,Xe),X+=6}a.addGroup(f,X,b),f+=X,d+=Q}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};function ds(n){let e={};for(let t in n){e[t]={};for(let i in n[t]){let s=n[t][i];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=s.clone():Array.isArray(s)?e[t][i]=s.slice():e[t][i]=s}}return e}function nn(n){let e={};for(let t=0;t<n.length;t++){let i=ds(n[t]);for(let s in i)e[s]=i[s]}return e}function N0(n){let e=[];for(let t=0;t<n.length;t++)e.push(n[t].clone());return e}function gu(n){let e=n.getRenderTarget();return e===null?n.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:at.workingColorSpace}var Zf={clone:ds,merge:nn},O0=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,F0=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,Un=class extends Qt{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=O0,this.fragmentShader=F0,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=ds(e.uniforms),this.uniformsGroups=N0(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let s in this.uniforms){let o=this.uniforms[s].value;o&&o.isTexture?t.uniforms[s]={type:"t",value:o.toJSON(e).uuid}:o&&o.isColor?t.uniforms[s]={type:"c",value:o.getHex()}:o&&o.isVector2?t.uniforms[s]={type:"v2",value:o.toArray()}:o&&o.isVector3?t.uniforms[s]={type:"v3",value:o.toArray()}:o&&o.isVector4?t.uniforms[s]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?t.uniforms[s]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?t.uniforms[s]={type:"m4",value:o.toArray()}:t.uniforms[s]={value:o}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let i={};for(let s in this.extensions)this.extensions[s]===!0&&(i[s]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}},Xr=class extends Mt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new je,this.projectionMatrix=new je,this.projectionMatrixInverse=new je,this.coordinateSystem=Nn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},Ii=new D,Bd=new De,kd=new De,It=class extends Xr{constructor(e=50,t=1,i=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=s,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=Qi*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(Br*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Qi*2*Math.atan(Math.tan(Br*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,i){Ii.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Ii.x,Ii.y).multiplyScalar(-e/Ii.z),Ii.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(Ii.x,Ii.y).multiplyScalar(-e/Ii.z)}getViewSize(e,t){return this.getViewBounds(e,Bd,kd),t.subVectors(kd,Bd)}setViewOffset(e,t,i,s,r,o){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(Br*.5*this.fov)/this.zoom,i=2*t,s=this.aspect*i,r=-.5*s,o=this.view;if(this.view!==null&&this.view.enabled){let c=o.fullWidth,l=o.fullHeight;r+=o.offsetX*s/c,t-=o.offsetY*i/l,s*=o.width/c,i*=o.height/l}let a=this.filmOffset;a!==0&&(r+=e*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,t,t-i,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},Bs=-90,ks=1,Aa=class extends Mt{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new It(Bs,ks,e,t);s.layers=this.layers,this.add(s);let r=new It(Bs,ks,e,t);r.layers=this.layers,this.add(r);let o=new It(Bs,ks,e,t);o.layers=this.layers,this.add(o);let a=new It(Bs,ks,e,t);a.layers=this.layers,this.add(a);let c=new It(Bs,ks,e,t);c.layers=this.layers,this.add(c);let l=new It(Bs,ks,e,t);l.layers=this.layers,this.add(l)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[i,s,r,o,a,c]=t;for(let l of t)this.remove(l);if(e===Nn)i.up.set(0,1,0),i.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(e===Hr)i.up.set(0,-1,0),i.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let l of t)this.add(l),l.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:i,activeMipmapLevel:s}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[r,o,a,c,l,h]=this.children,u=e.getRenderTarget(),d=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;let y=i.texture.generateMipmaps;i.texture.generateMipmaps=!1,e.setRenderTarget(i,0,s),e.render(t,r),e.setRenderTarget(i,1,s),e.render(t,o),e.setRenderTarget(i,2,s),e.render(t,a),e.setRenderTarget(i,3,s),e.render(t,c),e.setRenderTarget(i,4,s),e.render(t,l),i.texture.generateMipmaps=y,e.setRenderTarget(i,5,s),e.render(t,h),e.setRenderTarget(u,d,f),e.xr.enabled=g,i.texture.needsPMREMUpdate=!0}},Yr=class extends kt{constructor(e=[],t=cs,i,s,r,o,a,c,l,h){super(e,t,i,s,r,o,a,c,l,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},Ra=class extends qn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let i={width:e,height:e,depth:1},s=[i,i,i,i,i,i];this.texture=new Yr(s),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let i={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},s=new Ni(5,5,5),r=new Un({name:"CubemapFromEquirect",uniforms:ds(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:zt,blending:bi});r.uniforms.tEquirect.value=t;let o=new ht(s,r),a=t.minFilter;return t.minFilter===kn&&(t.minFilter=an),new Aa(1,10,this).update(e,o),t.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(e,t=!0,i=!0,s=!0){let r=e.getRenderTarget();for(let o=0;o<6;o++)e.setRenderTarget(this,o),e.clear(t,i,s);e.setRenderTarget(r)}},Lt=class extends Mt{constructor(){super(),this.isGroup=!0,this.type="Group"}},U0={type:"move"},Zs=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Lt,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Lt,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new D,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new D),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Lt,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new D,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new D),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let s=null,r=null,o=null,a=this._targetRay,c=this._grip,l=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(l&&e.hand){o=!0;for(let y of e.hand.values()){let m=t.getJointPose(y,i),p=this._getHandJoint(l,y);m!==null&&(p.matrix.fromArray(m.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=m.radius),p.visible=m!==null}let h=l.joints["index-finger-tip"],u=l.joints["thumb-tip"],d=h.position.distanceTo(u.position),f=.02,g=.005;l.inputState.pinching&&d>f+g?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!l.inputState.pinching&&d<=f-g&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else c!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,i),r!==null&&(c.matrix.fromArray(r.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,r.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(r.linearVelocity)):c.hasLinearVelocity=!1,r.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(r.angularVelocity)):c.hasAngularVelocity=!1));a!==null&&(s=t.getPose(e.targetRaySpace,i),s===null&&r!==null&&(s=r),s!==null&&(a.matrix.fromArray(s.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,s.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(s.linearVelocity)):a.hasLinearVelocity=!1,s.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(s.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(U0)))}return a!==null&&(a.visible=s!==null),c!==null&&(c.visible=r!==null),l!==null&&(l.visible=o!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let i=new Lt;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}};var es=class extends Mt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new En,this.environmentIntensity=1,this.environmentRotation=new En,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}},ts=class{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e!==void 0?e.length/t:0,this.usage=Ma,this.updateRanges=[],this.version=0,this.uuid=On()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,i){e*=this.stride,i*=t.stride;for(let s=0,r=this.stride;s<r;s++)this.array[e+s]=t.array[i+s];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=On()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);let t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),i=new this.constructor(t,this.stride);return i.setUsage(this.usage),i}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){return e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=On()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}},on=new D,Oi=class n{constructor(e,t,i,s=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=e,this.itemSize=t,this.offset=i,this.normalized=s}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,i=this.data.count;t<i;t++)on.fromBufferAttribute(this,t),on.applyMatrix4(e),this.setXYZ(t,on.x,on.y,on.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)on.fromBufferAttribute(this,t),on.applyNormalMatrix(e),this.setXYZ(t,on.x,on.y,on.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)on.fromBufferAttribute(this,t),on.transformDirection(e),this.setXYZ(t,on.x,on.y,on.z);return this}getComponent(e,t){let i=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(i=Dn(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=_t(i,this.array)),this.data.array[e*this.data.stride+this.offset+t]=i,this}setX(e,t){return this.normalized&&(t=_t(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=_t(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=_t(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=_t(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=Dn(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=Dn(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=Dn(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=Dn(t,this.array)),t}setXY(e,t,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=_t(t,this.array),i=_t(i,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this}setXYZ(e,t,i,s){return e=e*this.data.stride+this.offset,this.normalized&&(t=_t(t,this.array),i=_t(i,this.array),s=_t(s,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this.data.array[e+2]=s,this}setXYZW(e,t,i,s,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=_t(t,this.array),i=_t(i,this.array),s=_t(s,this.array),r=_t(r,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this.data.array[e+2]=s,this.data.array[e+3]=r,this}clone(e){if(e===void 0){console.log("THREE.InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let i=0;i<this.count;i++){let s=i*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[s+r])}return new Dt(new this.array.constructor(t),this.itemSize,this.normalized)}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.clone(e)),new n(e.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){console.log("THREE.InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let i=0;i<this.count;i++){let s=i*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[s+r])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:t,normalized:this.normalized}}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}},Qs=class extends Qt{constructor(e){super(),this.isSpriteMaterial=!0,this.type="SpriteMaterial",this.color=new Ne(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.rotation=e.rotation,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},zs,Ir=new D,Hs=new D,Vs=new D,Gs=new De,Lr=new De,Qf=new je,la=new D,Dr=new D,ca=new D,zd=new De,Lc=new De,Hd=new De,qr=class extends Mt{constructor(e=new Qs){if(super(),this.isSprite=!0,this.type="Sprite",zs===void 0){zs=new Ct;let t=new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),i=new ts(t,5);zs.setIndex([0,1,2,0,2,3]),zs.setAttribute("position",new Oi(i,3,0,!1)),zs.setAttribute("uv",new Oi(i,2,3,!1))}this.geometry=zs,this.material=e,this.center=new De(.5,.5),this.count=1}raycast(e,t){e.camera===null&&console.error('THREE.Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.'),Hs.setFromMatrixScale(this.matrixWorld),Qf.copy(e.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(e.camera.matrixWorldInverse,this.matrixWorld),Vs.setFromMatrixPosition(this.modelViewMatrix),e.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&Hs.multiplyScalar(-Vs.z);let i=this.material.rotation,s,r;i!==0&&(r=Math.cos(i),s=Math.sin(i));let o=this.center;ua(la.set(-.5,-.5,0),Vs,o,Hs,s,r),ua(Dr.set(.5,-.5,0),Vs,o,Hs,s,r),ua(ca.set(.5,.5,0),Vs,o,Hs,s,r),zd.set(0,0),Lc.set(1,0),Hd.set(1,1);let a=e.ray.intersectTriangle(la,Dr,ca,!1,Ir);if(a===null&&(ua(Dr.set(-.5,.5,0),Vs,o,Hs,s,r),Lc.set(0,1),a=e.ray.intersectTriangle(la,ca,Dr,!1,Ir),a===null))return;let c=e.ray.origin.distanceTo(Ir);c<e.near||c>e.far||t.push({distance:c,point:Ir.clone(),uv:pi.getInterpolation(Ir,la,Dr,ca,zd,Lc,Hd,new De),face:null,object:this})}copy(e,t){return super.copy(e,t),e.center!==void 0&&this.center.copy(e.center),this.material=e.material,this}};function ua(n,e,t,i,s,r){Gs.subVectors(n,t).addScalar(.5).multiply(i),s!==void 0?(Lr.x=r*Gs.x-s*Gs.y,Lr.y=s*Gs.x+r*Gs.y):Lr.copy(Gs),n.copy(e),n.x+=Lr.x,n.y+=Lr.y,n.applyMatrix4(Qf)}var Vd=new D,Gd=new ut,Wd=new ut,B0=new D,$d=new je,ha=new D,Dc=new Zt,Xd=new je,Nc=new gi,jr=class extends ht{constructor(e,t){super(e,t),this.isSkinnedMesh=!0,this.type="SkinnedMesh",this.bindMode=Hc,this.bindMatrix=new je,this.bindMatrixInverse=new je,this.boundingBox=null,this.boundingSphere=null}computeBoundingBox(){let e=this.geometry;this.boundingBox===null&&(this.boundingBox=new cn),this.boundingBox.makeEmpty();let t=e.getAttribute("position");for(let i=0;i<t.count;i++)this.getVertexPosition(i,ha),this.boundingBox.expandByPoint(ha)}computeBoundingSphere(){let e=this.geometry;this.boundingSphere===null&&(this.boundingSphere=new Zt),this.boundingSphere.makeEmpty();let t=e.getAttribute("position");for(let i=0;i<t.count;i++)this.getVertexPosition(i,ha),this.boundingSphere.expandByPoint(ha)}copy(e,t){return super.copy(e,t),this.bindMode=e.bindMode,this.bindMatrix.copy(e.bindMatrix),this.bindMatrixInverse.copy(e.bindMatrixInverse),this.skeleton=e.skeleton,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}raycast(e,t){let i=this.material,s=this.matrixWorld;i!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Dc.copy(this.boundingSphere),Dc.applyMatrix4(s),e.ray.intersectsSphere(Dc)!==!1&&(Xd.copy(s).invert(),Nc.copy(e.ray).applyMatrix4(Xd),!(this.boundingBox!==null&&Nc.intersectsBox(this.boundingBox)===!1)&&this._computeIntersections(e,t,Nc)))}getVertexPosition(e,t){return super.getVertexPosition(e,t),this.applyBoneTransform(e,t),t}bind(e,t){this.skeleton=e,t===void 0&&(this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),t=this.matrixWorld),this.bindMatrix.copy(t),this.bindMatrixInverse.copy(t).invert()}pose(){this.skeleton.pose()}normalizeSkinWeights(){let e=new ut,t=this.geometry.attributes.skinWeight;for(let i=0,s=t.count;i<s;i++){e.fromBufferAttribute(t,i);let r=1/e.manhattanLength();r!==1/0?e.multiplyScalar(r):e.set(1,0,0,0),t.setXYZW(i,e.x,e.y,e.z,e.w)}}updateMatrixWorld(e){super.updateMatrixWorld(e),this.bindMode===Hc?this.bindMatrixInverse.copy(this.matrixWorld).invert():this.bindMode===Uf?this.bindMatrixInverse.copy(this.bindMatrix).invert():console.warn("THREE.SkinnedMesh: Unrecognized bindMode: "+this.bindMode)}applyBoneTransform(e,t){let i=this.skeleton,s=this.geometry;Gd.fromBufferAttribute(s.attributes.skinIndex,e),Wd.fromBufferAttribute(s.attributes.skinWeight,e),Vd.copy(t).applyMatrix4(this.bindMatrix),t.set(0,0,0);for(let r=0;r<4;r++){let o=Wd.getComponent(r);if(o!==0){let a=Gd.getComponent(r);$d.multiplyMatrices(i.bones[a].matrixWorld,i.boneInverses[a]),t.addScaledVector(B0.copy(Vd).applyMatrix4($d),o)}}return t.applyMatrix4(this.bindMatrixInverse)}},er=class extends Mt{constructor(){super(),this.isBone=!0,this.type="Bone"}},Jr=class extends kt{constructor(e=null,t=1,i=1,s,r,o,a,c,l=qt,h=qt,u,d){super(null,o,a,c,l,h,s,r,u,d),this.isDataTexture=!0,this.image={data:e,width:t,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},Yd=new je,k0=new je,Kr=class n{constructor(e=[],t=[]){this.uuid=On(),this.bones=e.slice(0),this.boneInverses=t,this.boneMatrices=null,this.boneTexture=null,this.init()}init(){let e=this.bones,t=this.boneInverses;if(this.boneMatrices=new Float32Array(e.length*16),t.length===0)this.calculateInverses();else if(e.length!==t.length){console.warn("THREE.Skeleton: Number of inverse bone matrices does not match amount of bones."),this.boneInverses=[];for(let i=0,s=this.bones.length;i<s;i++)this.boneInverses.push(new je)}}calculateInverses(){this.boneInverses.length=0;for(let e=0,t=this.bones.length;e<t;e++){let i=new je;this.bones[e]&&i.copy(this.bones[e].matrixWorld).invert(),this.boneInverses.push(i)}}pose(){for(let e=0,t=this.bones.length;e<t;e++){let i=this.bones[e];i&&i.matrixWorld.copy(this.boneInverses[e]).invert()}for(let e=0,t=this.bones.length;e<t;e++){let i=this.bones[e];i&&(i.parent&&i.parent.isBone?(i.matrix.copy(i.parent.matrixWorld).invert(),i.matrix.multiply(i.matrixWorld)):i.matrix.copy(i.matrixWorld),i.matrix.decompose(i.position,i.quaternion,i.scale))}}update(){let e=this.bones,t=this.boneInverses,i=this.boneMatrices,s=this.boneTexture;for(let r=0,o=e.length;r<o;r++){let a=e[r]?e[r].matrixWorld:k0;Yd.multiplyMatrices(a,t[r]),Yd.toArray(i,r*16)}s!==null&&(s.needsUpdate=!0)}clone(){return new n(this.bones,this.boneInverses)}computeBoneTexture(){let e=Math.sqrt(this.bones.length*4);e=Math.ceil(e/4)*4,e=Math.max(e,4);let t=new Float32Array(e*e*4);t.set(this.boneMatrices);let i=new Jr(t,e,e,xn,wn);return i.needsUpdate=!0,this.boneMatrices=t,this.boneTexture=i,this}getBoneByName(e){for(let t=0,i=this.bones.length;t<i;t++){let s=this.bones[t];if(s.name===e)return s}}dispose(){this.boneTexture!==null&&(this.boneTexture.dispose(),this.boneTexture=null)}fromJSON(e,t){this.uuid=e.uuid;for(let i=0,s=e.bones.length;i<s;i++){let r=e.bones[i],o=t[r];o===void 0&&(console.warn("THREE.Skeleton: No bone found with UUID:",r),o=new er),this.bones.push(o),this.boneInverses.push(new je().fromArray(e.boneInverses[i]))}return this.init(),this}toJSON(){let e={metadata:{version:4.7,type:"Skeleton",generator:"Skeleton.toJSON"},bones:[],boneInverses:[]};e.uuid=this.uuid;let t=this.bones,i=this.boneInverses;for(let s=0,r=t.length;s<r;s++){let o=t[s];e.bones.push(o.uuid);let a=i[s];e.boneInverses.push(a.toArray())}return e}},Fi=class extends Dt{constructor(e,t,i,s=1){super(e,t,i),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},Ws=new je,qd=new je,da=[],jd=new cn,z0=new je,Nr=new ht,Or=new Zt,ns=class extends ht{constructor(e,t,i){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new Fi(new Float32Array(i*16),16),this.instanceColor=null,this.morphTexture=null,this.count=i,this.boundingBox=null,this.boundingSphere=null;for(let s=0;s<i;s++)this.setMatrixAt(s,z0)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new cn),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let i=0;i<t;i++)this.getMatrixAt(i,Ws),jd.copy(e.boundingBox).applyMatrix4(Ws),this.boundingBox.union(jd)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new Zt),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let i=0;i<t;i++)this.getMatrixAt(i,Ws),Or.copy(e.boundingSphere).applyMatrix4(Ws),this.boundingSphere.union(Or)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let i=t.morphTargetInfluences,s=this.morphTexture.source.data.data,r=i.length+1,o=e*r+1;for(let a=0;a<i.length;a++)i[a]=s[o+a]}raycast(e,t){let i=this.matrixWorld,s=this.count;if(Nr.geometry=this.geometry,Nr.material=this.material,Nr.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Or.copy(this.boundingSphere),Or.applyMatrix4(i),e.ray.intersectsSphere(Or)!==!1))for(let r=0;r<s;r++){this.getMatrixAt(r,Ws),qd.multiplyMatrices(i,Ws),Nr.matrixWorld=qd,Nr.raycast(e,da);for(let o=0,a=da.length;o<a;o++){let c=da[o];c.instanceId=r,c.object=this,t.push(c)}da.length=0}}setColorAt(e,t){this.instanceColor===null&&(this.instanceColor=new Fi(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3)}setMatrixAt(e,t){t.toArray(this.instanceMatrix.array,e*16)}setMorphAt(e,t){let i=t.morphTargetInfluences,s=i.length+1;this.morphTexture===null&&(this.morphTexture=new Jr(new Float32Array(s*this.count),s,this.count,il,wn));let r=this.morphTexture.source.data.data,o=0;for(let l=0;l<i.length;l++)o+=i[l];let a=this.geometry.morphTargetsRelative?1:1-o,c=s*e;r[c]=a,r.set(i,c+1)}updateMorphTargets(){}dispose(){this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}},Oc=new D,H0=new D,V0=new Je,Tn=class{constructor(e=new D(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,s){return this.normal.set(e,t,i),this.constant=s,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){let s=Oc.subVectors(i,t).cross(H0.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(s,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){let i=e.delta(Oc),s=this.normal.dot(i);if(s===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let r=-(e.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:t.copy(e.start).addScaledVector(i,r)}intersectsLine(e){let t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let i=t||V0.getNormalMatrix(e),s=this.coplanarPoint(Oc).applyMatrix4(e),r=this.normal.applyMatrix3(i).normalize();return this.constant=-s.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}},Yi=new Zt,G0=new De(.5,.5),fa=new D,tr=class{constructor(e=new Tn,t=new Tn,i=new Tn,s=new Tn,r=new Tn,o=new Tn){this.planes=[e,t,i,s,r,o]}set(e,t,i,s,r,o){let a=this.planes;return a[0].copy(e),a[1].copy(t),a[2].copy(i),a[3].copy(s),a[4].copy(r),a[5].copy(o),this}copy(e){let t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=Nn,i=!1){let s=this.planes,r=e.elements,o=r[0],a=r[1],c=r[2],l=r[3],h=r[4],u=r[5],d=r[6],f=r[7],g=r[8],y=r[9],m=r[10],p=r[11],E=r[12],T=r[13],v=r[14],R=r[15];if(s[0].setComponents(l-o,f-h,p-g,R-E).normalize(),s[1].setComponents(l+o,f+h,p+g,R+E).normalize(),s[2].setComponents(l+a,f+u,p+y,R+T).normalize(),s[3].setComponents(l-a,f-u,p-y,R-T).normalize(),i)s[4].setComponents(c,d,m,v).normalize(),s[5].setComponents(l-c,f-d,p-m,R-v).normalize();else if(s[4].setComponents(l-c,f-d,p-m,R-v).normalize(),t===Nn)s[5].setComponents(l+c,f+d,p+m,R+v).normalize();else if(t===Hr)s[5].setComponents(c,d,m,v).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Yi.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Yi.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Yi)}intersectsSprite(e){Yi.center.set(0,0,0);let t=G0.distanceTo(e.center);return Yi.radius=.7071067811865476+t,Yi.applyMatrix4(e.matrixWorld),this.intersectsSphere(Yi)}intersectsSphere(e){let t=this.planes,i=e.center,s=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(i)<s)return!1;return!0}intersectsBox(e){let t=this.planes;for(let i=0;i<6;i++){let s=t[i];if(fa.x=s.normal.x>0?e.max.x:e.min.x,fa.y=s.normal.y>0?e.max.y:e.min.y,fa.z=s.normal.z>0?e.max.z:e.min.z,s.distanceToPoint(fa)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var Bn=class extends Qt{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Ne(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}},Ca=new D,Pa=new D,Jd=new je,Fr=new gi,pa=new Zt,Fc=new D,Kd=new D,jn=class extends Mt{constructor(e=new Ct,t=new Bn){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[0];for(let s=1,r=t.count;s<r;s++)Ca.fromBufferAttribute(t,s-1),Pa.fromBufferAttribute(t,s),i[s]=i[s-1],i[s]+=Ca.distanceTo(Pa);e.setAttribute("lineDistance",new gt(i,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){let i=this.geometry,s=this.matrixWorld,r=e.params.Line.threshold,o=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),pa.copy(i.boundingSphere),pa.applyMatrix4(s),pa.radius+=r,e.ray.intersectsSphere(pa)===!1)return;Jd.copy(s).invert(),Fr.copy(e.ray).applyMatrix4(Jd);let a=r/((this.scale.x+this.scale.y+this.scale.z)/3),c=a*a,l=this.isLineSegments?2:1,h=i.index,d=i.attributes.position;if(h!==null){let f=Math.max(0,o.start),g=Math.min(h.count,o.start+o.count);for(let y=f,m=g-1;y<m;y+=l){let p=h.getX(y),E=h.getX(y+1),T=ma(this,e,Fr,c,p,E,y);T&&t.push(T)}if(this.isLineLoop){let y=h.getX(g-1),m=h.getX(f),p=ma(this,e,Fr,c,y,m,g-1);p&&t.push(p)}}else{let f=Math.max(0,o.start),g=Math.min(d.count,o.start+o.count);for(let y=f,m=g-1;y<m;y+=l){let p=ma(this,e,Fr,c,y,y+1,y);p&&t.push(p)}if(this.isLineLoop){let y=ma(this,e,Fr,c,g-1,f,g-1);y&&t.push(y)}}}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let s=t[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}};function ma(n,e,t,i,s,r,o){let a=n.geometry.attributes.position;if(Ca.fromBufferAttribute(a,s),Pa.fromBufferAttribute(a,r),t.distanceSqToSegment(Ca,Pa,Fc,Kd)>i)return;Fc.applyMatrix4(n.matrixWorld);let l=e.ray.origin.distanceTo(Fc);if(!(l<e.near||l>e.far))return{distance:l,point:Kd.clone().applyMatrix4(n.matrixWorld),index:o,face:null,faceIndex:null,barycoord:null,object:n}}var Zd=new D,Qd=new D,is=class extends jn{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[];for(let s=0,r=t.count;s<r;s+=2)Zd.fromBufferAttribute(t,s),Qd.fromBufferAttribute(t,s+1),i[s]=s===0?0:i[s-1],i[s+1]=i[s]+Zd.distanceTo(Qd);e.setAttribute("lineDistance",new gt(i,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}},Zr=class extends jn{constructor(e,t){super(e,t),this.isLineLoop=!0,this.type="LineLoop"}},nr=class extends Qt{constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new Ne(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},ef=new je,Xc=new gi,ga=new Zt,_a=new D,Qr=class extends Mt{constructor(e=new Ct,t=new nr){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,t){let i=this.geometry,s=this.matrixWorld,r=e.params.Points.threshold,o=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),ga.copy(i.boundingSphere),ga.applyMatrix4(s),ga.radius+=r,e.ray.intersectsSphere(ga)===!1)return;ef.copy(s).invert(),Xc.copy(e.ray).applyMatrix4(ef);let a=r/((this.scale.x+this.scale.y+this.scale.z)/3),c=a*a,l=i.index,u=i.attributes.position;if(l!==null){let d=Math.max(0,o.start),f=Math.min(l.count,o.start+o.count);for(let g=d,y=f;g<y;g++){let m=l.getX(g);_a.fromBufferAttribute(u,m),tf(_a,m,c,s,e,t,this)}}else{let d=Math.max(0,o.start),f=Math.min(u.count,o.start+o.count);for(let g=d,y=f;g<y;g++)_a.fromBufferAttribute(u,g),tf(_a,g,c,s,e,t,this)}}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let s=t[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}};function tf(n,e,t,i,s,r,o){let a=Xc.distanceSqToPoint(n);if(a<t){let c=new D;Xc.closestPointToPoint(n,c),c.applyMatrix4(i);let l=s.ray.origin.distanceTo(c);if(l<s.near||l>s.far)return;r.push({distance:l,distanceToRay:Math.sqrt(a),point:c,index:e,face:null,faceIndex:null,barycoord:null,object:o})}}var eo=class extends kt{constructor(e,t,i,s,r,o,a,c,l){super(e,t,i,s,r,o,a,c,l),this.isCanvasTexture=!0,this.needsUpdate=!0}},to=class extends kt{constructor(e,t,i=ki,s,r,o,a=qt,c=qt,l,h=qs,u=1){if(h!==qs&&h!==cr)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let d={width:e,height:t,depth:u};super(d,s,r,o,a,c,h,i,l),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Ks(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}},no=class extends kt{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}},io=class n extends Ct{constructor(e=1,t=1,i=4,s=8,r=1){super(),this.type="CapsuleGeometry",this.parameters={radius:e,height:t,capSegments:i,radialSegments:s,heightSegments:r},t=Math.max(0,t),i=Math.max(1,Math.floor(i)),s=Math.max(3,Math.floor(s)),r=Math.max(1,Math.floor(r));let o=[],a=[],c=[],l=[],h=t/2,u=Math.PI/2*e,d=t,f=2*u+d,g=i*2+r,y=s+1,m=new D,p=new D;for(let E=0;E<=g;E++){let T=0,v=0,R=0,w=0;if(E<=i){let b=E/i,x=b*Math.PI/2;v=-h-e*Math.cos(x),R=e*Math.sin(x),w=-e*Math.cos(x),T=b*u}else if(E<=i+r){let b=(E-i)/r;v=-h+b*t,R=e,w=0,T=u+b*d}else{let b=(E-i-r)/i,x=b*Math.PI/2;v=h+e*Math.sin(x),R=e*Math.cos(x),w=e*Math.sin(x),T=u+d+b*u}let C=Math.max(0,Math.min(1,T/f)),L=0;E===0?L=.5/s:E===g&&(L=-.5/s);for(let b=0;b<=s;b++){let x=b/s,P=x*Math.PI*2,U=Math.sin(P),W=Math.cos(P);p.x=-R*W,p.y=v,p.z=R*U,a.push(p.x,p.y,p.z),m.set(-R*W,w,R*U),m.normalize(),c.push(m.x,m.y,m.z),l.push(x+L,C)}if(E>0){let b=(E-1)*y;for(let x=0;x<s;x++){let P=b+x,U=b+x+1,W=E*y+x,$=E*y+x+1;o.push(P,U,W),o.push(U,$,W)}}}this.setIndex(o),this.setAttribute("position",new gt(a,3)),this.setAttribute("normal",new gt(c,3)),this.setAttribute("uv",new gt(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radius,e.height,e.capSegments,e.radialSegments,e.heightSegments)}};var Ia=class n extends Ct{constructor(e=1,t=1,i=1,s=32,r=1,o=!1,a=0,c=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:i,radialSegments:s,heightSegments:r,openEnded:o,thetaStart:a,thetaLength:c};let l=this;s=Math.floor(s),r=Math.floor(r);let h=[],u=[],d=[],f=[],g=0,y=[],m=i/2,p=0;E(),o===!1&&(e>0&&T(!0),t>0&&T(!1)),this.setIndex(h),this.setAttribute("position",new gt(u,3)),this.setAttribute("normal",new gt(d,3)),this.setAttribute("uv",new gt(f,2));function E(){let v=new D,R=new D,w=0,C=(t-e)/i;for(let L=0;L<=r;L++){let b=[],x=L/r,P=x*(t-e)+e;for(let U=0;U<=s;U++){let W=U/s,$=W*c+a,J=Math.sin($),G=Math.cos($);R.x=P*J,R.y=-x*i+m,R.z=P*G,u.push(R.x,R.y,R.z),v.set(J,C,G).normalize(),d.push(v.x,v.y,v.z),f.push(W,1-x),b.push(g++)}y.push(b)}for(let L=0;L<s;L++)for(let b=0;b<r;b++){let x=y[b][L],P=y[b+1][L],U=y[b+1][L+1],W=y[b][L+1];(e>0||b!==0)&&(h.push(x,P,W),w+=3),(t>0||b!==r-1)&&(h.push(P,U,W),w+=3)}l.addGroup(p,w,0),p+=w}function T(v){let R=g,w=new De,C=new D,L=0,b=v===!0?e:t,x=v===!0?1:-1;for(let U=1;U<=s;U++)u.push(0,m*x,0),d.push(0,x,0),f.push(.5,.5),g++;let P=g;for(let U=0;U<=s;U++){let $=U/s*c+a,J=Math.cos($),G=Math.sin($);C.x=b*G,C.y=m*x,C.z=b*J,u.push(C.x,C.y,C.z),d.push(0,x,0),w.x=J*.5+.5,w.y=G*.5*x+.5,f.push(w.x,w.y),g++}for(let U=0;U<s;U++){let W=R+U,$=P+U;v===!0?h.push($,$+1,W):h.push($+1,$,W),L+=3}l.addGroup(p,L,v===!0?1:2),p+=L}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},La=class n extends Ia{constructor(e=1,t=1,i=32,s=1,r=!1,o=0,a=Math.PI*2){super(0,e,t,i,s,r,o,a),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:i,heightSegments:s,openEnded:r,thetaStart:o,thetaLength:a}}static fromJSON(e){return new n(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}};var so=class n extends Ct{constructor(e=1,t=1,i=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:s};let r=e/2,o=t/2,a=Math.floor(i),c=Math.floor(s),l=a+1,h=c+1,u=e/a,d=t/c,f=[],g=[],y=[],m=[];for(let p=0;p<h;p++){let E=p*d-o;for(let T=0;T<l;T++){let v=T*u-r;g.push(v,-E,0),y.push(0,0,1),m.push(T/a),m.push(1-p/c)}}for(let p=0;p<c;p++)for(let E=0;E<a;E++){let T=E+l*p,v=E+l*(p+1),R=E+1+l*(p+1),w=E+1+l*p;f.push(T,v,w),f.push(v,R,w)}this.setIndex(f),this.setAttribute("position",new gt(g,3)),this.setAttribute("normal",new gt(y,3)),this.setAttribute("uv",new gt(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.widthSegments,e.heightSegments)}};var ss=class n extends Ct{constructor(e=1,t=32,i=16,s=0,r=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:i,phiStart:s,phiLength:r,thetaStart:o,thetaLength:a},t=Math.max(3,Math.floor(t)),i=Math.max(2,Math.floor(i));let c=Math.min(o+a,Math.PI),l=0,h=[],u=new D,d=new D,f=[],g=[],y=[],m=[];for(let p=0;p<=i;p++){let E=[],T=p/i,v=0;p===0&&o===0?v=.5/t:p===i&&c===Math.PI&&(v=-.5/t);for(let R=0;R<=t;R++){let w=R/t;u.x=-e*Math.cos(s+w*r)*Math.sin(o+T*a),u.y=e*Math.cos(o+T*a),u.z=e*Math.sin(s+w*r)*Math.sin(o+T*a),g.push(u.x,u.y,u.z),d.copy(u).normalize(),y.push(d.x,d.y,d.z),m.push(w+v,1-T),E.push(l++)}h.push(E)}for(let p=0;p<i;p++)for(let E=0;E<t;E++){let T=h[p][E+1],v=h[p][E],R=h[p+1][E],w=h[p+1][E+1];(p!==0||o>0)&&f.push(T,v,w),(p!==i-1||c<Math.PI)&&f.push(v,R,w)}this.setIndex(f),this.setAttribute("position",new gt(g,3)),this.setAttribute("normal",new gt(y,3)),this.setAttribute("uv",new gt(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}};var hn=class extends Qt{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new Ne(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Ne(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Ol,this.normalScale=new De(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new En,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},dn=class extends hn{constructor(e){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new De(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return Qe(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(t){this.ior=(1+.4*t)/(1-.4*t)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new Ne(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new Ne(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new Ne(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._sheen=0,this._transmission=0,this.setValues(e)}get anisotropy(){return this._anisotropy}set anisotropy(e){this._anisotropy>0!=e>0&&this.version++,this._anisotropy=e}get clearcoat(){return this._clearcoat}set clearcoat(e){this._clearcoat>0!=e>0&&this.version++,this._clearcoat=e}get iridescence(){return this._iridescence}set iridescence(e){this._iridescence>0!=e>0&&this.version++,this._iridescence=e}get dispersion(){return this._dispersion}set dispersion(e){this._dispersion>0!=e>0&&this.version++,this._dispersion=e}get sheen(){return this._sheen}set sheen(e){this._sheen>0!=e>0&&this.version++,this._sheen=e}get transmission(){return this._transmission}set transmission(e){this._transmission>0!=e>0&&this.version++,this._transmission=e}copy(e){return super.copy(e),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=e.anisotropy,this.anisotropyRotation=e.anisotropyRotation,this.anisotropyMap=e.anisotropyMap,this.clearcoat=e.clearcoat,this.clearcoatMap=e.clearcoatMap,this.clearcoatRoughness=e.clearcoatRoughness,this.clearcoatRoughnessMap=e.clearcoatRoughnessMap,this.clearcoatNormalMap=e.clearcoatNormalMap,this.clearcoatNormalScale.copy(e.clearcoatNormalScale),this.dispersion=e.dispersion,this.ior=e.ior,this.iridescence=e.iridescence,this.iridescenceMap=e.iridescenceMap,this.iridescenceIOR=e.iridescenceIOR,this.iridescenceThicknessRange=[...e.iridescenceThicknessRange],this.iridescenceThicknessMap=e.iridescenceThicknessMap,this.sheen=e.sheen,this.sheenColor.copy(e.sheenColor),this.sheenColorMap=e.sheenColorMap,this.sheenRoughness=e.sheenRoughness,this.sheenRoughnessMap=e.sheenRoughnessMap,this.transmission=e.transmission,this.transmissionMap=e.transmissionMap,this.thickness=e.thickness,this.thicknessMap=e.thicknessMap,this.attenuationDistance=e.attenuationDistance,this.attenuationColor.copy(e.attenuationColor),this.specularIntensity=e.specularIntensity,this.specularIntensityMap=e.specularIntensityMap,this.specularColor.copy(e.specularColor),this.specularColorMap=e.specularColorMap,this}};var ro=class extends Qt{constructor(e){super(),this.isMeshLambertMaterial=!0,this.type="MeshLambertMaterial",this.color=new Ne(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Ne(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Ol,this.normalScale=new De(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new En,this.combine=ja,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},Da=class extends Qt{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=kf,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},Na=class extends Qt{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function xa(n,e){return!n||n.constructor===e?n:typeof e.BYTES_PER_ELEMENT=="number"?new e(n):Array.prototype.slice.call(n)}function W0(n){return ArrayBuffer.isView(n)&&!(n instanceof DataView)}function $0(n){function e(s,r){return n[s]-n[r]}let t=n.length,i=new Array(t);for(let s=0;s!==t;++s)i[s]=s;return i.sort(e),i}function nf(n,e,t){let i=n.length,s=new n.constructor(i);for(let r=0,o=0;o!==i;++r){let a=t[r]*e;for(let c=0;c!==e;++c)s[o++]=n[a+c]}return s}function ep(n,e,t,i){let s=1,r=n[0];for(;r!==void 0&&r[i]===void 0;)r=n[s++];if(r===void 0)return;let o=r[i];if(o!==void 0)if(Array.isArray(o))do o=r[i],o!==void 0&&(e.push(r.time),t.push(...o)),r=n[s++];while(r!==void 0);else if(o.toArray!==void 0)do o=r[i],o!==void 0&&(e.push(r.time),o.toArray(t,t.length)),r=n[s++];while(r!==void 0);else do o=r[i],o!==void 0&&(e.push(r.time),t.push(o)),r=n[s++];while(r!==void 0)}var _i=class{constructor(e,t,i,s){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new t.constructor(i),this.sampleValues=t,this.valueSize=i,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,i=this._cachedIndex,s=t[i],r=t[i-1];n:{e:{let o;t:{i:if(!(e<s)){for(let a=i+2;;){if(s===void 0){if(e<r)break i;return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}if(i===a)break;if(r=s,s=t[++i],e<s)break e}o=t.length;break t}if(!(e>=r)){let a=t[1];e<a&&(i=2,r=a);for(let c=i-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===c)break;if(s=r,r=t[--i-1],e>=r)break e}o=i,i=0;break t}break n}for(;i<o;){let a=i+o>>>1;e<t[a]?o=a:i=a+1}if(s=t[i],r=t[i-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}this._cachedIndex=i,this.intervalChanged_(i,r,s)}return this.interpolate_(i,r,e,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,i=this.sampleValues,s=this.valueSize,r=e*s;for(let o=0;o!==s;++o)t[o]=i[r+o];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},Oa=class extends _i{constructor(e,t,i,s){super(e,t,i,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Vc,endingEnd:Vc}}intervalChanged_(e,t,i){let s=this.parameterPositions,r=e-2,o=e+1,a=s[r],c=s[o];if(a===void 0)switch(this.getSettings_().endingStart){case Gc:r=e,a=2*t-i;break;case Wc:r=s.length-2,a=t+s[r]-s[r+1];break;default:r=e,a=i}if(c===void 0)switch(this.getSettings_().endingEnd){case Gc:o=e,c=2*i-t;break;case Wc:o=1,c=i+s[1]-s[0];break;default:o=e-1,c=t}let l=(i-t)*.5,h=this.valueSize;this._weightPrev=l/(t-a),this._weightNext=l/(c-i),this._offsetPrev=r*h,this._offsetNext=o*h}interpolate_(e,t,i,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=e*a,l=c-a,h=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,f=this._weightNext,g=(i-t)/(s-t),y=g*g,m=y*g,p=-d*m+2*d*y-d*g,E=(1+d)*m+(-1.5-2*d)*y+(-.5+d)*g+1,T=(-1-f)*m+(1.5+f)*y+.5*g,v=f*m-f*y;for(let R=0;R!==a;++R)r[R]=p*o[h+R]+E*o[l+R]+T*o[c+R]+v*o[u+R];return r}},Fa=class extends _i{constructor(e,t,i,s){super(e,t,i,s)}interpolate_(e,t,i,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=e*a,l=c-a,h=(i-t)/(s-t),u=1-h;for(let d=0;d!==a;++d)r[d]=o[l+d]*u+o[c+d]*h;return r}},Ua=class extends _i{constructor(e,t,i,s){super(e,t,i,s)}interpolate_(e){return this.copySampleValue_(e-1)}},fn=class{constructor(e,t,i,s){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=xa(t,this.TimeBufferType),this.values=xa(i,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,i;if(t.toJSON!==this.toJSON)i=t.toJSON(e);else{i={name:e.name,times:xa(e.times,Array),values:xa(e.values,Array)};let s=e.getInterpolation();s!==e.DefaultInterpolation&&(i.interpolation=s)}return i.type=e.ValueTypeName,i}InterpolantFactoryMethodDiscrete(e){return new Ua(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new Fa(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new Oa(this.times,this.values,this.getValueSize(),e)}setInterpolation(e){let t;switch(e){case Ki:t=this.InterpolantFactoryMethodDiscrete;break;case Zi:t=this.InterpolantFactoryMethodLinear;break;case va:t=this.InterpolantFactoryMethodSmooth;break}if(t===void 0){let i="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(i);return console.warn("THREE.KeyframeTrack:",i),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Ki;case this.InterpolantFactoryMethodLinear:return Zi;case this.InterpolantFactoryMethodSmooth:return va}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let i=0,s=t.length;i!==s;++i)t[i]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let i=0,s=t.length;i!==s;++i)t[i]*=e}return this}trim(e,t){let i=this.times,s=i.length,r=0,o=s-1;for(;r!==s&&i[r]<e;)++r;for(;o!==-1&&i[o]>t;)--o;if(++o,r!==0||o!==s){r>=o&&(o=Math.max(o,1),r=o-1);let a=this.getValueSize();this.times=i.slice(r,o),this.values=this.values.slice(r*a,o*a)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),e=!1);let i=this.times,s=this.values,r=i.length;r===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),e=!1);let o=null;for(let a=0;a!==r;a++){let c=i[a];if(typeof c=="number"&&isNaN(c)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,a,c),e=!1;break}if(o!==null&&o>c){console.error("THREE.KeyframeTrack: Out of order keys.",this,a,c,o),e=!1;break}o=c}if(s!==void 0&&W0(s))for(let a=0,c=s.length;a!==c;++a){let l=s[a];if(isNaN(l)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,a,l),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),i=this.getValueSize(),s=this.getInterpolation()===va,r=e.length-1,o=1;for(let a=1;a<r;++a){let c=!1,l=e[a],h=e[a+1];if(l!==h&&(a!==1||l!==e[0]))if(s)c=!0;else{let u=a*i,d=u-i,f=u+i;for(let g=0;g!==i;++g){let y=t[u+g];if(y!==t[d+g]||y!==t[f+g]){c=!0;break}}}if(c){if(a!==o){e[o]=e[a];let u=a*i,d=o*i;for(let f=0;f!==i;++f)t[d+f]=t[u+f]}++o}}if(r>0){e[o]=e[r];for(let a=r*i,c=o*i,l=0;l!==i;++l)t[c+l]=t[a+l];++o}return o!==e.length?(this.times=e.slice(0,o),this.values=t.slice(0,o*i)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),i=this.constructor,s=new i(this.name,e,t);return s.createInterpolant=this.createInterpolant,s}};fn.prototype.ValueTypeName="";fn.prototype.TimeBufferType=Float32Array;fn.prototype.ValueBufferType=Float32Array;fn.prototype.DefaultInterpolation=Zi;var xi=class extends fn{constructor(e,t,i){super(e,t,i)}};xi.prototype.ValueTypeName="bool";xi.prototype.ValueBufferType=Array;xi.prototype.DefaultInterpolation=Ki;xi.prototype.InterpolantFactoryMethodLinear=void 0;xi.prototype.InterpolantFactoryMethodSmooth=void 0;var oo=class extends fn{constructor(e,t,i,s){super(e,t,i,s)}};oo.prototype.ValueTypeName="color";var Jn=class extends fn{constructor(e,t,i,s){super(e,t,i,s)}};Jn.prototype.ValueTypeName="number";var Ba=class extends _i{constructor(e,t,i,s){super(e,t,i,s)}interpolate_(e,t,i,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=(i-t)/(s-t),l=e*a;for(let h=l+a;l!==h;l+=4)ln.slerpFlat(r,0,o,l-a,o,l,c);return r}},Kn=class extends fn{constructor(e,t,i,s){super(e,t,i,s)}InterpolantFactoryMethodLinear(e){return new Ba(this.times,this.values,this.getValueSize(),e)}};Kn.prototype.ValueTypeName="quaternion";Kn.prototype.InterpolantFactoryMethodSmooth=void 0;var yi=class extends fn{constructor(e,t,i){super(e,t,i)}};yi.prototype.ValueTypeName="string";yi.prototype.ValueBufferType=Array;yi.prototype.DefaultInterpolation=Ki;yi.prototype.InterpolantFactoryMethodLinear=void 0;yi.prototype.InterpolantFactoryMethodSmooth=void 0;var Zn=class extends fn{constructor(e,t,i,s){super(e,t,i,s)}};Zn.prototype.ValueTypeName="vector";var ao=class{constructor(e="",t=-1,i=[],s=Bf){this.name=e,this.tracks=i,this.duration=t,this.blendMode=s,this.uuid=On(),this.userData={},this.duration<0&&this.resetDuration()}static parse(e){let t=[],i=e.tracks,s=1/(e.fps||1);for(let o=0,a=i.length;o!==a;++o)t.push(Y0(i[o]).scale(s));let r=new this(e.name,e.duration,t,e.blendMode);return r.uuid=e.uuid,r.userData=JSON.parse(e.userData||"{}"),r}static toJSON(e){let t=[],i=e.tracks,s={name:e.name,duration:e.duration,tracks:t,uuid:e.uuid,blendMode:e.blendMode,userData:JSON.stringify(e.userData)};for(let r=0,o=i.length;r!==o;++r)t.push(fn.toJSON(i[r]));return s}static CreateFromMorphTargetSequence(e,t,i,s){let r=t.length,o=[];for(let a=0;a<r;a++){let c=[],l=[];c.push((a+r-1)%r,a,(a+1)%r),l.push(0,1,0);let h=$0(c);c=nf(c,1,h),l=nf(l,1,h),!s&&c[0]===0&&(c.push(r),l.push(l[0])),o.push(new Jn(".morphTargetInfluences["+t[a].name+"]",c,l).scale(1/i))}return new this(e,-1,o)}static findByName(e,t){let i=e;if(!Array.isArray(e)){let s=e;i=s.geometry&&s.geometry.animations||s.animations}for(let s=0;s<i.length;s++)if(i[s].name===t)return i[s];return null}static CreateClipsFromMorphTargetSequences(e,t,i){let s={},r=/^([\w-]*?)([\d]+)$/;for(let a=0,c=e.length;a<c;a++){let l=e[a],h=l.name.match(r);if(h&&h.length>1){let u=h[1],d=s[u];d||(s[u]=d=[]),d.push(l)}}let o=[];for(let a in s)o.push(this.CreateFromMorphTargetSequence(a,s[a],t,i));return o}static parseAnimation(e,t){if(console.warn("THREE.AnimationClip: parseAnimation() is deprecated and will be removed with r185"),!e)return console.error("THREE.AnimationClip: No animation in JSONLoader data."),null;let i=function(u,d,f,g,y){if(f.length!==0){let m=[],p=[];ep(f,m,p,g),m.length!==0&&y.push(new u(d,m,p))}},s=[],r=e.name||"default",o=e.fps||30,a=e.blendMode,c=e.length||-1,l=e.hierarchy||[];for(let u=0;u<l.length;u++){let d=l[u].keys;if(!(!d||d.length===0))if(d[0].morphTargets){let f={},g;for(g=0;g<d.length;g++)if(d[g].morphTargets)for(let y=0;y<d[g].morphTargets.length;y++)f[d[g].morphTargets[y]]=-1;for(let y in f){let m=[],p=[];for(let E=0;E!==d[g].morphTargets.length;++E){let T=d[g];m.push(T.time),p.push(T.morphTarget===y?1:0)}s.push(new Jn(".morphTargetInfluence["+y+"]",m,p))}c=f.length*o}else{let f=".bones["+t[u].name+"]";i(Zn,f+".position",d,"pos",s),i(Kn,f+".quaternion",d,"rot",s),i(Zn,f+".scale",d,"scl",s)}}return s.length===0?null:new this(r,c,s,a)}resetDuration(){let e=this.tracks,t=0;for(let i=0,s=e.length;i!==s;++i){let r=this.tracks[i];t=Math.max(t,r.times[r.times.length-1])}return this.duration=t,this}trim(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].trim(0,this.duration);return this}validate(){let e=!0;for(let t=0;t<this.tracks.length;t++)e=e&&this.tracks[t].validate();return e}optimize(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].optimize();return this}clone(){let e=[];for(let i=0;i<this.tracks.length;i++)e.push(this.tracks[i].clone());let t=new this.constructor(this.name,this.duration,e,this.blendMode);return t.userData=JSON.parse(JSON.stringify(this.userData)),t}toJSON(){return this.constructor.toJSON(this)}};function X0(n){switch(n.toLowerCase()){case"scalar":case"double":case"float":case"number":case"integer":return Jn;case"vector":case"vector2":case"vector3":case"vector4":return Zn;case"color":return oo;case"quaternion":return Kn;case"bool":case"boolean":return xi;case"string":return yi}throw new Error("THREE.KeyframeTrack: Unsupported typeName: "+n)}function Y0(n){if(n.type===void 0)throw new Error("THREE.KeyframeTrack: track type undefined, can not parse");let e=X0(n.type);if(n.times===void 0){let t=[],i=[];ep(n.keys,t,i,"value"),n.times=t,n.values=i}return e.parse!==void 0?e.parse(n):new e(n.name,n.times,n.values,n.interpolation)}var Xn={enabled:!1,files:{},add:function(n,e){this.enabled!==!1&&(this.files[n]=e)},get:function(n){if(this.enabled!==!1)return this.files[n]},remove:function(n){delete this.files[n]},clear:function(){this.files={}}},ka=class{constructor(e,t,i){let s=this,r=!1,o=0,a=0,c,l=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=i,this.abortController=new AbortController,this.itemStart=function(h){a++,r===!1&&s.onStart!==void 0&&s.onStart(h,o,a),r=!0},this.itemEnd=function(h){o++,s.onProgress!==void 0&&s.onProgress(h,o,a),o===a&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(h){s.onError!==void 0&&s.onError(h)},this.resolveURL=function(h){return c?c(h):h},this.setURLModifier=function(h){return c=h,this},this.addHandler=function(h,u){return l.push(h,u),this},this.removeHandler=function(h){let u=l.indexOf(h);return u!==-1&&l.splice(u,2),this},this.getHandler=function(h){for(let u=0,d=l.length;u<d;u+=2){let f=l[u],g=l[u+1];if(f.global&&(f.lastIndex=0),f.test(h))return g}return null},this.abort=function(){return this.abortController.abort(),this.abortController=new AbortController,this}}},tp=new ka,Qn=class{constructor(e){this.manager=e!==void 0?e:tp,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){let i=this;return new Promise(function(s,r){i.load(e,s,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}};Qn.DEFAULT_MATERIAL_NAME="__DEFAULT";var fi={},Yc=class extends Error{constructor(e,t){super(e),this.response=t}},ir=class extends Qn{constructor(e){super(e),this.mimeType="",this.responseType="",this._abortController=new AbortController}load(e,t,i,s){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let r=Xn.get(`file:${e}`);if(r!==void 0)return this.manager.itemStart(e),setTimeout(()=>{t&&t(r),this.manager.itemEnd(e)},0),r;if(fi[e]!==void 0){fi[e].push({onLoad:t,onProgress:i,onError:s});return}fi[e]=[],fi[e].push({onLoad:t,onProgress:i,onError:s});let o=new Request(e,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin",signal:typeof AbortSignal.any=="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal}),a=this.mimeType,c=this.responseType;fetch(o).then(l=>{if(l.status===200||l.status===0){if(l.status===0&&console.warn("THREE.FileLoader: HTTP Status 0 received."),typeof ReadableStream>"u"||l.body===void 0||l.body.getReader===void 0)return l;let h=fi[e],u=l.body.getReader(),d=l.headers.get("X-File-Size")||l.headers.get("Content-Length"),f=d?parseInt(d):0,g=f!==0,y=0,m=new ReadableStream({start(p){E();function E(){u.read().then(({done:T,value:v})=>{if(T)p.close();else{y+=v.byteLength;let R=new ProgressEvent("progress",{lengthComputable:g,loaded:y,total:f});for(let w=0,C=h.length;w<C;w++){let L=h[w];L.onProgress&&L.onProgress(R)}p.enqueue(v),E()}},T=>{p.error(T)})}}});return new Response(m)}else throw new Yc(`fetch for "${l.url}" responded with ${l.status}: ${l.statusText}`,l)}).then(l=>{switch(c){case"arraybuffer":return l.arrayBuffer();case"blob":return l.blob();case"document":return l.text().then(h=>new DOMParser().parseFromString(h,a));case"json":return l.json();default:if(a==="")return l.text();{let u=/charset="?([^;"\s]*)"?/i.exec(a),d=u&&u[1]?u[1].toLowerCase():void 0,f=new TextDecoder(d);return l.arrayBuffer().then(g=>f.decode(g))}}}).then(l=>{Xn.add(`file:${e}`,l);let h=fi[e];delete fi[e];for(let u=0,d=h.length;u<d;u++){let f=h[u];f.onLoad&&f.onLoad(l)}}).catch(l=>{let h=fi[e];if(h===void 0)throw this.manager.itemError(e),l;delete fi[e];for(let u=0,d=h.length;u<d;u++){let f=h[u];f.onError&&f.onError(l)}this.manager.itemError(e)}).finally(()=>{this.manager.itemEnd(e)}),this.manager.itemStart(e)}setResponseType(e){return this.responseType=e,this}setMimeType(e){return this.mimeType=e,this}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}};var $s=new WeakMap,za=class extends Qn{constructor(e){super(e)}load(e,t,i,s){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let r=this,o=Xn.get(`image:${e}`);if(o!==void 0){if(o.complete===!0)r.manager.itemStart(e),setTimeout(function(){t&&t(o),r.manager.itemEnd(e)},0);else{let u=$s.get(o);u===void 0&&(u=[],$s.set(o,u)),u.push({onLoad:t,onError:s})}return o}let a=js("img");function c(){h(),t&&t(this);let u=$s.get(this)||[];for(let d=0;d<u.length;d++){let f=u[d];f.onLoad&&f.onLoad(this)}$s.delete(this),r.manager.itemEnd(e)}function l(u){h(),s&&s(u),Xn.remove(`image:${e}`);let d=$s.get(this)||[];for(let f=0;f<d.length;f++){let g=d[f];g.onError&&g.onError(u)}$s.delete(this),r.manager.itemError(e),r.manager.itemEnd(e)}function h(){a.removeEventListener("load",c,!1),a.removeEventListener("error",l,!1)}return a.addEventListener("load",c,!1),a.addEventListener("error",l,!1),e.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(a.crossOrigin=this.crossOrigin),Xn.add(`image:${e}`,a),r.manager.itemStart(e),a.src=e,a}};var lo=class extends Qn{constructor(e){super(e)}load(e,t,i,s){let r=new kt,o=new za(this.manager);return o.setCrossOrigin(this.crossOrigin),o.setPath(this.path),o.load(e,function(a){r.image=a,r.needsUpdate=!0,t!==void 0&&t(r)},i,s),r}},rs=class extends Mt{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new Ne(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(t.object.target=this.target.uuid),t}};var Uc=new je,sf=new D,rf=new D,co=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new De(512,512),this.mapType=zn,this.map=null,this.mapPass=null,this.matrix=new je,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new tr,this._frameExtents=new De(1,1),this._viewportCount=1,this._viewports=[new ut(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera,i=this.matrix;sf.setFromMatrixPosition(e.matrixWorld),t.position.copy(sf),rf.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(rf),t.updateMatrixWorld(),Uc.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Uc,t.coordinateSystem,t.reversedDepth),t.reversedDepth?i.set(.5,0,0,.5,0,.5,0,.5,0,0,1,0,0,0,0,1):i.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),i.multiply(Uc)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},qc=class extends co{constructor(){super(new It(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1,this.aspect=1}updateMatrices(e){let t=this.camera,i=Qi*2*e.angle*this.focus,s=this.mapSize.width/this.mapSize.height*this.aspect,r=e.distance||t.far;(i!==t.fov||s!==t.aspect||r!==t.far)&&(t.fov=i,t.aspect=s,t.far=r,t.updateProjectionMatrix()),super.updateMatrices(e)}copy(e){return super.copy(e),this.focus=e.focus,this}},uo=class extends rs{constructor(e,t,i=0,s=Math.PI/3,r=0,o=2){super(e,t),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(Mt.DEFAULT_UP),this.updateMatrix(),this.target=new Mt,this.distance=i,this.angle=s,this.penumbra=r,this.decay=o,this.map=null,this.shadow=new qc}get power(){return this.intensity*Math.PI}set power(e){this.intensity=e/Math.PI}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.angle=e.angle,this.penumbra=e.penumbra,this.decay=e.decay,this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}},of=new je,Ur=new D,Bc=new D,jc=class extends co{constructor(){super(new It(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new De(4,2),this._viewportCount=6,this._viewports=[new ut(2,1,1,1),new ut(0,1,1,1),new ut(3,1,1,1),new ut(1,1,1,1),new ut(3,0,1,1),new ut(1,0,1,1)],this._cubeDirections=[new D(1,0,0),new D(-1,0,0),new D(0,0,1),new D(0,0,-1),new D(0,1,0),new D(0,-1,0)],this._cubeUps=[new D(0,1,0),new D(0,1,0),new D(0,1,0),new D(0,1,0),new D(0,0,1),new D(0,0,-1)]}updateMatrices(e,t=0){let i=this.camera,s=this.matrix,r=e.distance||i.far;r!==i.far&&(i.far=r,i.updateProjectionMatrix()),Ur.setFromMatrixPosition(e.matrixWorld),i.position.copy(Ur),Bc.copy(i.position),Bc.add(this._cubeDirections[t]),i.up.copy(this._cubeUps[t]),i.lookAt(Bc),i.updateMatrixWorld(),s.makeTranslation(-Ur.x,-Ur.y,-Ur.z),of.multiplyMatrices(i.projectionMatrix,i.matrixWorldInverse),this._frustum.setFromProjectionMatrix(of,i.coordinateSystem,i.reversedDepth)}},os=class extends rs{constructor(e,t,i=0,s=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=i,this.decay=s,this.shadow=new jc}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}},as=class extends Xr{constructor(e=-1,t=1,i=1,s=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=s,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,s,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=i-e,o=i+e,a=s+t,c=s-t;if(this.view!==null&&this.view.enabled){let l=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=l*this.view.offsetX,o=r+l*this.view.width,a-=h*this.view.offsetY,c=a-h*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,c,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},Jc=class extends co{constructor(){super(new as(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},ls=class extends rs{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Mt.DEFAULT_UP),this.updateMatrix(),this.target=new Mt,this.shadow=new Jc}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}},ho=class extends rs{constructor(e,t){super(e,t),this.isAmbientLight=!0,this.type="AmbientLight"}};var vi=class{static extractUrlBase(e){let t=e.lastIndexOf("/");return t===-1?"./":e.slice(0,t+1)}static resolveURL(e,t){return typeof e!="string"||e===""?"":(/^https?:\/\//i.test(t)&&/^\//.test(e)&&(t=t.replace(/(^https?:\/\/[^\/]+).*/i,"$1")),/^(https?:)?\/\//i.test(e)||/^data:.*,.*$/i.test(e)||/^blob:.*$/i.test(e)?e:t+e)}};var kc=new WeakMap,fo=class extends Qn{constructor(e){super(e),this.isImageBitmapLoader=!0,typeof createImageBitmap>"u"&&console.warn("THREE.ImageBitmapLoader: createImageBitmap() not supported."),typeof fetch>"u"&&console.warn("THREE.ImageBitmapLoader: fetch() not supported."),this.options={premultiplyAlpha:"none"},this._abortController=new AbortController}setOptions(e){return this.options=e,this}load(e,t,i,s){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let r=this,o=Xn.get(`image-bitmap:${e}`);if(o!==void 0){if(r.manager.itemStart(e),o.then){o.then(l=>{if(kc.has(o)===!0)s&&s(kc.get(o)),r.manager.itemError(e),r.manager.itemEnd(e);else return t&&t(l),r.manager.itemEnd(e),l});return}return setTimeout(function(){t&&t(o),r.manager.itemEnd(e)},0),o}let a={};a.credentials=this.crossOrigin==="anonymous"?"same-origin":"include",a.headers=this.requestHeader,a.signal=typeof AbortSignal.any=="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal;let c=fetch(e,a).then(function(l){return l.blob()}).then(function(l){return createImageBitmap(l,Object.assign(r.options,{colorSpaceConversion:"none"}))}).then(function(l){return Xn.add(`image-bitmap:${e}`,l),t&&t(l),r.manager.itemEnd(e),l}).catch(function(l){s&&s(l),kc.set(c,l),Xn.remove(`image-bitmap:${e}`),r.manager.itemError(e),r.manager.itemEnd(e)});Xn.add(`image-bitmap:${e}`,c),r.manager.itemStart(e)}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}};var Ha=class extends It{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}};var _u="\\[\\]\\.:\\/",q0=new RegExp("["+_u+"]","g"),xu="[^"+_u+"]",j0="[^"+_u.replace("\\.","")+"]",J0=/((?:WC+[\/:])*)/.source.replace("WC",xu),K0=/(WCOD+)?/.source.replace("WCOD",j0),Z0=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",xu),Q0=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",xu),e_=new RegExp("^"+J0+K0+Z0+Q0+"$"),t_=["material","materials","bones","map"],Kc=class{constructor(e,t,i){let s=i||St.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,s)}getValue(e,t){this.bind();let i=this._targetGroup.nCachedObjects_,s=this._bindings[i];s!==void 0&&s.getValue(e,t)}setValue(e,t){let i=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=i.length;s!==r;++s)i[s].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].unbind()}},St=class n{constructor(e,t,i){this.path=t,this.parsedPath=i||n.parseTrackName(t),this.node=n.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,i){return e&&e.isAnimationObjectGroup?new n.Composite(e,t,i):new n(e,t,i)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(q0,"")}static parseTrackName(e){let t=e_.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);let i={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},s=i.nodeName&&i.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=i.nodeName.substring(s+1);t_.indexOf(r)!==-1&&(i.nodeName=i.nodeName.substring(0,s),i.objectName=r)}if(i.propertyName===null||i.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return i}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let i=e.skeleton.getBoneByName(t);if(i!==void 0)return i}if(e.children){let i=function(r){for(let o=0;o<r.length;o++){let a=r[o];if(a.name===t||a.uuid===t)return a;let c=i(a.children);if(c)return c}return null},s=i(e.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)e[t++]=i[s]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,i=t.objectName,s=t.propertyName,r=t.propertyIndex;if(e||(e=n.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(i){let l=t.objectIndex;switch(i){case"materials":if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let h=0;h<e.length;h++)if(e[h].name===l){l=h;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[i]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[i]}if(l!==void 0){if(e[l]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[l]}}let o=e[s];if(o===void 0){let l=t.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+l+"."+s+" but it wasn't found.",e);return}let a=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?a=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(a=this.Versioning.MatrixWorldNeedsUpdate);let c=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!e.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}c=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=r}else o.fromArray!==void 0&&o.toArray!==void 0?(c=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(c=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=s;this.getValue=this.GetterByBindingType[c],this.setValue=this.SetterByBindingTypeAndVersioning[c][a]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};St.Composite=Kc;St.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};St.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};St.prototype.GetterByBindingType=[St.prototype._getValue_direct,St.prototype._getValue_array,St.prototype._getValue_arrayElement,St.prototype._getValue_toArray];St.prototype.SetterByBindingTypeAndVersioning=[[St.prototype._setValue_direct,St.prototype._setValue_direct_setNeedsUpdate,St.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[St.prototype._setValue_array,St.prototype._setValue_array_setNeedsUpdate,St.prototype._setValue_array_setMatrixWorldNeedsUpdate],[St.prototype._setValue_arrayElement,St.prototype._setValue_arrayElement_setNeedsUpdate,St.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[St.prototype._setValue_fromArray,St.prototype._setValue_fromArray_setNeedsUpdate,St.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var MT=new Float32Array(1);var sr=class{constructor(e=1,t=0,i=0){this.radius=e,this.phi=t,this.theta=i}set(e,t,i){return this.radius=e,this.phi=t,this.theta=i,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){return this.phi=Qe(this.phi,1e-6,Math.PI-1e-6),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,i){return this.radius=Math.sqrt(e*e+t*t+i*i),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,i),this.phi=Math.acos(Qe(t/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}};var po=class extends is{constructor(e=10,t=10,i=4473924,s=8947848){i=new Ne(i),s=new Ne(s);let r=t/2,o=e/t,a=e/2,c=[],l=[];for(let d=0,f=0,g=-a;d<=t;d++,g+=o){c.push(-a,0,g,a,0,g),c.push(g,0,-a,g,0,a);let y=d===r?i:s;y.toArray(l,f),f+=3,y.toArray(l,f),f+=3,y.toArray(l,f),f+=3,y.toArray(l,f),f+=3}let h=new Ct;h.setAttribute("position",new gt(c,3)),h.setAttribute("color",new gt(l,3));let u=new Bn({vertexColors:!0,toneMapped:!1});super(h,u),this.type="GridHelper"}dispose(){this.geometry.dispose(),this.material.dispose()}};var af=new D,ya,zc,mo=class extends Mt{constructor(e=new D(0,0,1),t=new D(0,0,0),i=1,s=16776960,r=i*.2,o=r*.2){super(),this.type="ArrowHelper",ya===void 0&&(ya=new Ct,ya.setAttribute("position",new gt([0,0,0,0,1,0],3)),zc=new La(.5,1,5,1),zc.translate(0,-.5,0)),this.position.copy(t),this.line=new jn(ya,new Bn({color:s,toneMapped:!1})),this.line.matrixAutoUpdate=!1,this.add(this.line),this.cone=new ht(zc,new en({color:s,toneMapped:!1})),this.cone.matrixAutoUpdate=!1,this.add(this.cone),this.setDirection(e),this.setLength(i,r,o)}setDirection(e){if(e.y>.99999)this.quaternion.set(0,0,0,1);else if(e.y<-.99999)this.quaternion.set(1,0,0,0);else{af.set(e.z,0,-e.x).normalize();let t=Math.acos(e.y);this.quaternion.setFromAxisAngle(af,t)}}setLength(e,t=e*.2,i=t*.2){this.line.scale.set(1,Math.max(1e-4,e-t),1),this.line.updateMatrix(),this.cone.scale.set(i,t,i),this.cone.position.y=e,this.cone.updateMatrix()}setColor(e){this.line.material.color.set(e),this.cone.material.color.set(e)}copy(e){return super.copy(e,!1),this.line.copy(e.line),this.cone.copy(e.cone),this}dispose(){this.line.geometry.dispose(),this.line.material.dispose(),this.cone.geometry.dispose(),this.cone.material.dispose()}},go=class extends is{constructor(e=1){let t=[0,0,0,e,0,0,0,0,0,0,e,0,0,0,0,0,0,e],i=[1,0,0,1,.6,0,0,1,0,.6,1,0,0,0,1,0,.6,1],s=new Ct;s.setAttribute("position",new gt(t,3)),s.setAttribute("color",new gt(i,3));let r=new Bn({vertexColors:!0,toneMapped:!1});super(s,r),this.type="AxesHelper"}setColors(e,t,i){let s=new Ne,r=this.geometry.attributes.color.array;return s.set(e),s.toArray(r,0),s.toArray(r,3),s.set(t),s.toArray(r,6),s.toArray(r,9),s.set(i),s.toArray(r,12),s.toArray(r,15),this.geometry.attributes.color.needsUpdate=!0,this}dispose(){this.geometry.dispose(),this.material.dispose()}};var _o=class extends Yn{constructor(e,t=null){super(),this.object=e,this.domElement=t,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(e){if(e===void 0){console.warn("THREE.Controls: connect() now requires an element.");return}this.domElement!==null&&this.disconnect(),this.domElement=e}disconnect(){}dispose(){}update(){}};function yu(n,e,t,i){let s=n_(i);switch(t){case lu:return n*e;case il:return n*e/s.components*s.byteLength;case sl:return n*e/s.components*s.byteLength;case uu:return n*e*2/s.components*s.byteLength;case rl:return n*e*2/s.components*s.byteLength;case cu:return n*e*3/s.components*s.byteLength;case xn:return n*e*4/s.components*s.byteLength;case ol:return n*e*4/s.components*s.byteLength;case yo:case vo:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case bo:case So:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case ll:case ul:return Math.max(n,16)*Math.max(e,8)/4;case al:case cl:return Math.max(n,8)*Math.max(e,8)/2;case hl:case dl:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case fl:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case pl:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case ml:return Math.floor((n+4)/5)*Math.floor((e+3)/4)*16;case gl:return Math.floor((n+4)/5)*Math.floor((e+4)/5)*16;case _l:return Math.floor((n+5)/6)*Math.floor((e+4)/5)*16;case xl:return Math.floor((n+5)/6)*Math.floor((e+5)/6)*16;case yl:return Math.floor((n+7)/8)*Math.floor((e+4)/5)*16;case vl:return Math.floor((n+7)/8)*Math.floor((e+5)/6)*16;case bl:return Math.floor((n+7)/8)*Math.floor((e+7)/8)*16;case Sl:return Math.floor((n+9)/10)*Math.floor((e+4)/5)*16;case Ml:return Math.floor((n+9)/10)*Math.floor((e+5)/6)*16;case Tl:return Math.floor((n+9)/10)*Math.floor((e+7)/8)*16;case El:return Math.floor((n+9)/10)*Math.floor((e+9)/10)*16;case wl:return Math.floor((n+11)/12)*Math.floor((e+9)/10)*16;case Al:return Math.floor((n+11)/12)*Math.floor((e+11)/12)*16;case Rl:case Cl:case Pl:return Math.ceil(n/4)*Math.ceil(e/4)*16;case Il:case Ll:return Math.ceil(n/4)*Math.ceil(e/4)*8;case Dl:case Nl:return Math.ceil(n/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function n_(n){switch(n){case zn:case su:return{byteLength:1,components:1};case or:case ru:case ar:return{byteLength:2,components:1};case tl:case nl:return{byteLength:2,components:4};case ki:case el:case wn:return{byteLength:4,components:1};case ou:case au:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${n}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"180"}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="180");function Ep(){let n=null,e=!1,t=null,i=null;function s(r,o){t(r,o),i=n.requestAnimationFrame(s)}return{start:function(){e!==!0&&t!==null&&(i=n.requestAnimationFrame(s),e=!0)},stop:function(){n.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){n=r}}}function s_(n){let e=new WeakMap;function t(a,c){let l=a.array,h=a.usage,u=l.byteLength,d=n.createBuffer();n.bindBuffer(c,d),n.bufferData(c,l,h),a.onUploadCallback();let f;if(l instanceof Float32Array)f=n.FLOAT;else if(typeof Float16Array<"u"&&l instanceof Float16Array)f=n.HALF_FLOAT;else if(l instanceof Uint16Array)a.isFloat16BufferAttribute?f=n.HALF_FLOAT:f=n.UNSIGNED_SHORT;else if(l instanceof Int16Array)f=n.SHORT;else if(l instanceof Uint32Array)f=n.UNSIGNED_INT;else if(l instanceof Int32Array)f=n.INT;else if(l instanceof Int8Array)f=n.BYTE;else if(l instanceof Uint8Array)f=n.UNSIGNED_BYTE;else if(l instanceof Uint8ClampedArray)f=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+l);return{buffer:d,type:f,bytesPerElement:l.BYTES_PER_ELEMENT,version:a.version,size:u}}function i(a,c,l){let h=c.array,u=c.updateRanges;if(n.bindBuffer(l,a),u.length===0)n.bufferSubData(l,0,h);else{u.sort((f,g)=>f.start-g.start);let d=0;for(let f=1;f<u.length;f++){let g=u[d],y=u[f];y.start<=g.start+g.count+1?g.count=Math.max(g.count,y.start+y.count-g.start):(++d,u[d]=y)}u.length=d+1;for(let f=0,g=u.length;f<g;f++){let y=u[f];n.bufferSubData(l,y.start*h.BYTES_PER_ELEMENT,h,y.start,y.count)}c.clearUpdateRanges()}c.onUploadCallback()}function s(a){return a.isInterleavedBufferAttribute&&(a=a.data),e.get(a)}function r(a){a.isInterleavedBufferAttribute&&(a=a.data);let c=e.get(a);c&&(n.deleteBuffer(c.buffer),e.delete(a))}function o(a,c){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){let h=e.get(a);(!h||h.version<a.version)&&e.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}let l=e.get(a);if(l===void 0)e.set(a,t(a,c));else if(l.version<a.version){if(l.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(l.buffer,a,c),l.version=a.version}}return{get:s,remove:r,update:o}}var r_=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,o_=`#ifdef USE_ALPHAHASH
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
#endif`,a_=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,l_=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,c_=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,u_=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,h_=`#ifdef USE_AOMAP
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
#endif`,d_=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,f_=`#ifdef USE_BATCHING
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
#endif`,p_=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,m_=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,g_=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,__=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,x_=`#ifdef USE_IRIDESCENCE
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
#endif`,y_=`#ifdef USE_BUMPMAP
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
#endif`,v_=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,b_=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,S_=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,M_=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,T_=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,E_=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,w_=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,A_=`#if defined( USE_COLOR_ALPHA )
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
#endif`,R_=`#define PI 3.141592653589793
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
} // validated`,C_=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,P_=`vec3 transformedNormal = objectNormal;
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
#endif`,I_=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,L_=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,D_=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,N_=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,O_="gl_FragColor = linearToOutputTexel( gl_FragColor );",F_=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,U_=`#ifdef USE_ENVMAP
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
#endif`,B_=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,k_=`#ifdef USE_ENVMAP
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
#endif`,z_=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,H_=`#ifdef USE_ENVMAP
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
#endif`,V_=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,G_=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,W_=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,$_=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,X_=`#ifdef USE_GRADIENTMAP
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
}`,Y_=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,q_=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,j_=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,J_=`uniform bool receiveShadow;
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
#endif`,K_=`#ifdef USE_ENVMAP
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
#endif`,Z_=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Q_=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,ex=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,tx=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,nx=`PhysicalMaterial material;
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
#endif`,ix=`struct PhysicalMaterial {
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
}`,sx=`
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
#endif`,rx=`#if defined( RE_IndirectDiffuse )
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
#endif`,ox=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,ax=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,lx=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,cx=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,ux=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,hx=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,dx=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,fx=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,px=`#if defined( USE_POINTS_UV )
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
#endif`,mx=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,gx=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,_x=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,xx=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,yx=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,vx=`#ifdef USE_MORPHTARGETS
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
#endif`,bx=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Sx=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,Mx=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,Tx=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Ex=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,wx=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Ax=`#ifdef USE_NORMALMAP
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
#endif`,Rx=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Cx=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Px=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Ix=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Lx=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Dx=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,Nx=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Ox=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Fx=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Ux=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Bx=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,kx=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,zx=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,Hx=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,Vx=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,Gx=`float getShadowMask() {
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
}`,Wx=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,$x=`#ifdef USE_SKINNING
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
#endif`,Xx=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Yx=`#ifdef USE_SKINNING
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
#endif`,qx=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,jx=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Jx=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Kx=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,Zx=`#ifdef USE_TRANSMISSION
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
#endif`,Qx=`#ifdef USE_TRANSMISSION
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
#endif`,ey=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,ty=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,ny=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,iy=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,sy=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,ry=`uniform sampler2D t2D;
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
}`,oy=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,ay=`#ifdef ENVMAP_TYPE_CUBE
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
}`,ly=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,cy=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,uy=`#include <common>
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
}`,hy=`#if DEPTH_PACKING == 3200
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
}`,dy=`#define DISTANCE
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
}`,fy=`#define DISTANCE
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
}`,py=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,my=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,gy=`uniform float scale;
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
}`,_y=`uniform vec3 diffuse;
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
}`,xy=`#include <common>
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
}`,yy=`uniform vec3 diffuse;
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
}`,vy=`#define LAMBERT
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
}`,by=`#define LAMBERT
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
}`,Sy=`#define MATCAP
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
}`,My=`#define MATCAP
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
}`,Ty=`#define NORMAL
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
}`,Ey=`#define NORMAL
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
}`,wy=`#define PHONG
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
}`,Ay=`#define PHONG
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
}`,Ry=`#define STANDARD
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
}`,Cy=`#define STANDARD
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
}`,Py=`#define TOON
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
}`,Iy=`#define TOON
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
}`,Ly=`uniform float size;
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
}`,Dy=`uniform vec3 diffuse;
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
}`,Ny=`#include <common>
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
}`,Oy=`uniform vec3 color;
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
}`,Fy=`uniform float rotation;
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
}`,Uy=`uniform vec3 diffuse;
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
}`,Ke={alphahash_fragment:r_,alphahash_pars_fragment:o_,alphamap_fragment:a_,alphamap_pars_fragment:l_,alphatest_fragment:c_,alphatest_pars_fragment:u_,aomap_fragment:h_,aomap_pars_fragment:d_,batching_pars_vertex:f_,batching_vertex:p_,begin_vertex:m_,beginnormal_vertex:g_,bsdfs:__,iridescence_fragment:x_,bumpmap_pars_fragment:y_,clipping_planes_fragment:v_,clipping_planes_pars_fragment:b_,clipping_planes_pars_vertex:S_,clipping_planes_vertex:M_,color_fragment:T_,color_pars_fragment:E_,color_pars_vertex:w_,color_vertex:A_,common:R_,cube_uv_reflection_fragment:C_,defaultnormal_vertex:P_,displacementmap_pars_vertex:I_,displacementmap_vertex:L_,emissivemap_fragment:D_,emissivemap_pars_fragment:N_,colorspace_fragment:O_,colorspace_pars_fragment:F_,envmap_fragment:U_,envmap_common_pars_fragment:B_,envmap_pars_fragment:k_,envmap_pars_vertex:z_,envmap_physical_pars_fragment:K_,envmap_vertex:H_,fog_vertex:V_,fog_pars_vertex:G_,fog_fragment:W_,fog_pars_fragment:$_,gradientmap_pars_fragment:X_,lightmap_pars_fragment:Y_,lights_lambert_fragment:q_,lights_lambert_pars_fragment:j_,lights_pars_begin:J_,lights_toon_fragment:Z_,lights_toon_pars_fragment:Q_,lights_phong_fragment:ex,lights_phong_pars_fragment:tx,lights_physical_fragment:nx,lights_physical_pars_fragment:ix,lights_fragment_begin:sx,lights_fragment_maps:rx,lights_fragment_end:ox,logdepthbuf_fragment:ax,logdepthbuf_pars_fragment:lx,logdepthbuf_pars_vertex:cx,logdepthbuf_vertex:ux,map_fragment:hx,map_pars_fragment:dx,map_particle_fragment:fx,map_particle_pars_fragment:px,metalnessmap_fragment:mx,metalnessmap_pars_fragment:gx,morphinstance_vertex:_x,morphcolor_vertex:xx,morphnormal_vertex:yx,morphtarget_pars_vertex:vx,morphtarget_vertex:bx,normal_fragment_begin:Sx,normal_fragment_maps:Mx,normal_pars_fragment:Tx,normal_pars_vertex:Ex,normal_vertex:wx,normalmap_pars_fragment:Ax,clearcoat_normal_fragment_begin:Rx,clearcoat_normal_fragment_maps:Cx,clearcoat_pars_fragment:Px,iridescence_pars_fragment:Ix,opaque_fragment:Lx,packing:Dx,premultiplied_alpha_fragment:Nx,project_vertex:Ox,dithering_fragment:Fx,dithering_pars_fragment:Ux,roughnessmap_fragment:Bx,roughnessmap_pars_fragment:kx,shadowmap_pars_fragment:zx,shadowmap_pars_vertex:Hx,shadowmap_vertex:Vx,shadowmask_pars_fragment:Gx,skinbase_vertex:Wx,skinning_pars_vertex:$x,skinning_vertex:Xx,skinnormal_vertex:Yx,specularmap_fragment:qx,specularmap_pars_fragment:jx,tonemapping_fragment:Jx,tonemapping_pars_fragment:Kx,transmission_fragment:Zx,transmission_pars_fragment:Qx,uv_pars_fragment:ey,uv_pars_vertex:ty,uv_vertex:ny,worldpos_vertex:iy,background_vert:sy,background_frag:ry,backgroundCube_vert:oy,backgroundCube_frag:ay,cube_vert:ly,cube_frag:cy,depth_vert:uy,depth_frag:hy,distanceRGBA_vert:dy,distanceRGBA_frag:fy,equirect_vert:py,equirect_frag:my,linedashed_vert:gy,linedashed_frag:_y,meshbasic_vert:xy,meshbasic_frag:yy,meshlambert_vert:vy,meshlambert_frag:by,meshmatcap_vert:Sy,meshmatcap_frag:My,meshnormal_vert:Ty,meshnormal_frag:Ey,meshphong_vert:wy,meshphong_frag:Ay,meshphysical_vert:Ry,meshphysical_frag:Cy,meshtoon_vert:Py,meshtoon_frag:Iy,points_vert:Ly,points_frag:Dy,shadow_vert:Ny,shadow_frag:Oy,sprite_vert:Fy,sprite_frag:Uy},ye={common:{diffuse:{value:new Ne(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Je},alphaMap:{value:null},alphaMapTransform:{value:new Je},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Je}},envmap:{envMap:{value:null},envMapRotation:{value:new Je},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Je}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Je}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Je},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Je},normalScale:{value:new De(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Je},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Je}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Je}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Je}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Ne(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Ne(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Je},alphaTest:{value:0},uvTransform:{value:new Je}},sprite:{diffuse:{value:new Ne(16777215)},opacity:{value:1},center:{value:new De(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Je},alphaMap:{value:null},alphaMapTransform:{value:new Je},alphaTest:{value:0}}},ti={basic:{uniforms:nn([ye.common,ye.specularmap,ye.envmap,ye.aomap,ye.lightmap,ye.fog]),vertexShader:Ke.meshbasic_vert,fragmentShader:Ke.meshbasic_frag},lambert:{uniforms:nn([ye.common,ye.specularmap,ye.envmap,ye.aomap,ye.lightmap,ye.emissivemap,ye.bumpmap,ye.normalmap,ye.displacementmap,ye.fog,ye.lights,{emissive:{value:new Ne(0)}}]),vertexShader:Ke.meshlambert_vert,fragmentShader:Ke.meshlambert_frag},phong:{uniforms:nn([ye.common,ye.specularmap,ye.envmap,ye.aomap,ye.lightmap,ye.emissivemap,ye.bumpmap,ye.normalmap,ye.displacementmap,ye.fog,ye.lights,{emissive:{value:new Ne(0)},specular:{value:new Ne(1118481)},shininess:{value:30}}]),vertexShader:Ke.meshphong_vert,fragmentShader:Ke.meshphong_frag},standard:{uniforms:nn([ye.common,ye.envmap,ye.aomap,ye.lightmap,ye.emissivemap,ye.bumpmap,ye.normalmap,ye.displacementmap,ye.roughnessmap,ye.metalnessmap,ye.fog,ye.lights,{emissive:{value:new Ne(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ke.meshphysical_vert,fragmentShader:Ke.meshphysical_frag},toon:{uniforms:nn([ye.common,ye.aomap,ye.lightmap,ye.emissivemap,ye.bumpmap,ye.normalmap,ye.displacementmap,ye.gradientmap,ye.fog,ye.lights,{emissive:{value:new Ne(0)}}]),vertexShader:Ke.meshtoon_vert,fragmentShader:Ke.meshtoon_frag},matcap:{uniforms:nn([ye.common,ye.bumpmap,ye.normalmap,ye.displacementmap,ye.fog,{matcap:{value:null}}]),vertexShader:Ke.meshmatcap_vert,fragmentShader:Ke.meshmatcap_frag},points:{uniforms:nn([ye.points,ye.fog]),vertexShader:Ke.points_vert,fragmentShader:Ke.points_frag},dashed:{uniforms:nn([ye.common,ye.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ke.linedashed_vert,fragmentShader:Ke.linedashed_frag},depth:{uniforms:nn([ye.common,ye.displacementmap]),vertexShader:Ke.depth_vert,fragmentShader:Ke.depth_frag},normal:{uniforms:nn([ye.common,ye.bumpmap,ye.normalmap,ye.displacementmap,{opacity:{value:1}}]),vertexShader:Ke.meshnormal_vert,fragmentShader:Ke.meshnormal_frag},sprite:{uniforms:nn([ye.sprite,ye.fog]),vertexShader:Ke.sprite_vert,fragmentShader:Ke.sprite_frag},background:{uniforms:{uvTransform:{value:new Je},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ke.background_vert,fragmentShader:Ke.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Je}},vertexShader:Ke.backgroundCube_vert,fragmentShader:Ke.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ke.cube_vert,fragmentShader:Ke.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ke.equirect_vert,fragmentShader:Ke.equirect_frag},distanceRGBA:{uniforms:nn([ye.common,ye.displacementmap,{referencePosition:{value:new D},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ke.distanceRGBA_vert,fragmentShader:Ke.distanceRGBA_frag},shadow:{uniforms:nn([ye.lights,ye.fog,{color:{value:new Ne(0)},opacity:{value:1}}]),vertexShader:Ke.shadow_vert,fragmentShader:Ke.shadow_frag}};ti.physical={uniforms:nn([ti.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Je},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Je},clearcoatNormalScale:{value:new De(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Je},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Je},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Je},sheen:{value:0},sheenColor:{value:new Ne(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Je},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Je},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Je},transmissionSamplerSize:{value:new De},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Je},attenuationDistance:{value:0},attenuationColor:{value:new Ne(0)},specularColor:{value:new Ne(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Je},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Je},anisotropyVector:{value:new De},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Je}}]),vertexShader:Ke.meshphysical_vert,fragmentShader:Ke.meshphysical_frag};var Ul={r:0,b:0,g:0},fs=new En,By=new je;function ky(n,e,t,i,s,r,o){let a=new Ne(0),c=r===!0?0:1,l,h,u=null,d=0,f=null;function g(T){let v=T.isScene===!0?T.background:null;return v&&v.isTexture&&(v=(T.backgroundBlurriness>0?t:e).get(v)),v}function y(T){let v=!1,R=g(T);R===null?p(a,c):R&&R.isColor&&(p(R,1),v=!0);let w=n.xr.getEnvironmentBlendMode();w==="additive"?i.buffers.color.setClear(0,0,0,1,o):w==="alpha-blend"&&i.buffers.color.setClear(0,0,0,0,o),(n.autoClear||v)&&(i.buffers.depth.setTest(!0),i.buffers.depth.setMask(!0),i.buffers.color.setMask(!0),n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil))}function m(T,v){let R=g(v);R&&(R.isCubeTexture||R.mapping===xo)?(h===void 0&&(h=new ht(new Ni(1,1,1),new Un({name:"BackgroundCubeMaterial",uniforms:ds(ti.backgroundCube.uniforms),vertexShader:ti.backgroundCube.vertexShader,fragmentShader:ti.backgroundCube.fragmentShader,side:zt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(w,C,L){this.matrixWorld.copyPosition(L.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(h)),fs.copy(v.backgroundRotation),fs.x*=-1,fs.y*=-1,fs.z*=-1,R.isCubeTexture&&R.isRenderTargetTexture===!1&&(fs.y*=-1,fs.z*=-1),h.material.uniforms.envMap.value=R,h.material.uniforms.flipEnvMap.value=R.isCubeTexture&&R.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=v.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=v.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(By.makeRotationFromEuler(fs)),h.material.toneMapped=at.getTransfer(R.colorSpace)!==xt,(u!==R||d!==R.version||f!==n.toneMapping)&&(h.material.needsUpdate=!0,u=R,d=R.version,f=n.toneMapping),h.layers.enableAll(),T.unshift(h,h.geometry,h.material,0,0,null)):R&&R.isTexture&&(l===void 0&&(l=new ht(new so(2,2),new Un({name:"BackgroundMaterial",uniforms:ds(ti.background.uniforms),vertexShader:ti.background.vertexShader,fragmentShader:ti.background.fragmentShader,side:Fn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(l)),l.material.uniforms.t2D.value=R,l.material.uniforms.backgroundIntensity.value=v.backgroundIntensity,l.material.toneMapped=at.getTransfer(R.colorSpace)!==xt,R.matrixAutoUpdate===!0&&R.updateMatrix(),l.material.uniforms.uvTransform.value.copy(R.matrix),(u!==R||d!==R.version||f!==n.toneMapping)&&(l.material.needsUpdate=!0,u=R,d=R.version,f=n.toneMapping),l.layers.enableAll(),T.unshift(l,l.geometry,l.material,0,0,null))}function p(T,v){T.getRGB(Ul,gu(n)),i.buffers.color.setClear(Ul.r,Ul.g,Ul.b,v,o)}function E(){h!==void 0&&(h.geometry.dispose(),h.material.dispose(),h=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return a},setClearColor:function(T,v=1){a.set(T),c=v,p(a,c)},getClearAlpha:function(){return c},setClearAlpha:function(T){c=T,p(a,c)},render:y,addToRenderList:m,dispose:E}}function zy(n,e){let t=n.getParameter(n.MAX_VERTEX_ATTRIBS),i={},s=d(null),r=s,o=!1;function a(x,P,U,W,$){let J=!1,G=u(W,U,P);r!==G&&(r=G,l(r.object)),J=f(x,W,U,$),J&&g(x,W,U,$),$!==null&&e.update($,n.ELEMENT_ARRAY_BUFFER),(J||o)&&(o=!1,v(x,P,U,W),$!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,e.get($).buffer))}function c(){return n.createVertexArray()}function l(x){return n.bindVertexArray(x)}function h(x){return n.deleteVertexArray(x)}function u(x,P,U){let W=U.wireframe===!0,$=i[x.id];$===void 0&&($={},i[x.id]=$);let J=$[P.id];J===void 0&&(J={},$[P.id]=J);let G=J[W];return G===void 0&&(G=d(c()),J[W]=G),G}function d(x){let P=[],U=[],W=[];for(let $=0;$<t;$++)P[$]=0,U[$]=0,W[$]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:P,enabledAttributes:U,attributeDivisors:W,object:x,attributes:{},index:null}}function f(x,P,U,W){let $=r.attributes,J=P.attributes,G=0,Q=U.getAttributes();for(let X in Q)if(Q[X].location>=0){let ue=$[X],Ee=J[X];if(Ee===void 0&&(X==="instanceMatrix"&&x.instanceMatrix&&(Ee=x.instanceMatrix),X==="instanceColor"&&x.instanceColor&&(Ee=x.instanceColor)),ue===void 0||ue.attribute!==Ee||Ee&&ue.data!==Ee.data)return!0;G++}return r.attributesNum!==G||r.index!==W}function g(x,P,U,W){let $={},J=P.attributes,G=0,Q=U.getAttributes();for(let X in Q)if(Q[X].location>=0){let ue=J[X];ue===void 0&&(X==="instanceMatrix"&&x.instanceMatrix&&(ue=x.instanceMatrix),X==="instanceColor"&&x.instanceColor&&(ue=x.instanceColor));let Ee={};Ee.attribute=ue,ue&&ue.data&&(Ee.data=ue.data),$[X]=Ee,G++}r.attributes=$,r.attributesNum=G,r.index=W}function y(){let x=r.newAttributes;for(let P=0,U=x.length;P<U;P++)x[P]=0}function m(x){p(x,0)}function p(x,P){let U=r.newAttributes,W=r.enabledAttributes,$=r.attributeDivisors;U[x]=1,W[x]===0&&(n.enableVertexAttribArray(x),W[x]=1),$[x]!==P&&(n.vertexAttribDivisor(x,P),$[x]=P)}function E(){let x=r.newAttributes,P=r.enabledAttributes;for(let U=0,W=P.length;U<W;U++)P[U]!==x[U]&&(n.disableVertexAttribArray(U),P[U]=0)}function T(x,P,U,W,$,J,G){G===!0?n.vertexAttribIPointer(x,P,U,$,J):n.vertexAttribPointer(x,P,U,W,$,J)}function v(x,P,U,W){y();let $=W.attributes,J=U.getAttributes(),G=P.defaultAttributeValues;for(let Q in J){let X=J[Q];if(X.location>=0){let te=$[Q];if(te===void 0&&(Q==="instanceMatrix"&&x.instanceMatrix&&(te=x.instanceMatrix),Q==="instanceColor"&&x.instanceColor&&(te=x.instanceColor)),te!==void 0){let ue=te.normalized,Ee=te.itemSize,Ve=e.get(te);if(Ve===void 0)continue;let qe=Ve.buffer,lt=Ve.type,Xe=Ve.bytesPerElement,K=lt===n.INT||lt===n.UNSIGNED_INT||te.gpuType===el;if(te.isInterleavedBufferAttribute){let Z=te.data,xe=Z.stride,Le=te.offset;if(Z.isInstancedInterleavedBuffer){for(let we=0;we<X.locationSize;we++)p(X.location+we,Z.meshPerAttribute);x.isInstancedMesh!==!0&&W._maxInstanceCount===void 0&&(W._maxInstanceCount=Z.meshPerAttribute*Z.count)}else for(let we=0;we<X.locationSize;we++)m(X.location+we);n.bindBuffer(n.ARRAY_BUFFER,qe);for(let we=0;we<X.locationSize;we++)T(X.location+we,Ee/X.locationSize,lt,ue,xe*Xe,(Le+Ee/X.locationSize*we)*Xe,K)}else{if(te.isInstancedBufferAttribute){for(let Z=0;Z<X.locationSize;Z++)p(X.location+Z,te.meshPerAttribute);x.isInstancedMesh!==!0&&W._maxInstanceCount===void 0&&(W._maxInstanceCount=te.meshPerAttribute*te.count)}else for(let Z=0;Z<X.locationSize;Z++)m(X.location+Z);n.bindBuffer(n.ARRAY_BUFFER,qe);for(let Z=0;Z<X.locationSize;Z++)T(X.location+Z,Ee/X.locationSize,lt,ue,Ee*Xe,Ee/X.locationSize*Z*Xe,K)}}else if(G!==void 0){let ue=G[Q];if(ue!==void 0)switch(ue.length){case 2:n.vertexAttrib2fv(X.location,ue);break;case 3:n.vertexAttrib3fv(X.location,ue);break;case 4:n.vertexAttrib4fv(X.location,ue);break;default:n.vertexAttrib1fv(X.location,ue)}}}}E()}function R(){L();for(let x in i){let P=i[x];for(let U in P){let W=P[U];for(let $ in W)h(W[$].object),delete W[$];delete P[U]}delete i[x]}}function w(x){if(i[x.id]===void 0)return;let P=i[x.id];for(let U in P){let W=P[U];for(let $ in W)h(W[$].object),delete W[$];delete P[U]}delete i[x.id]}function C(x){for(let P in i){let U=i[P];if(U[x.id]===void 0)continue;let W=U[x.id];for(let $ in W)h(W[$].object),delete W[$];delete U[x.id]}}function L(){b(),o=!0,r!==s&&(r=s,l(r.object))}function b(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:a,reset:L,resetDefaultState:b,dispose:R,releaseStatesOfGeometry:w,releaseStatesOfProgram:C,initAttributes:y,enableAttribute:m,disableUnusedAttributes:E}}function Hy(n,e,t){let i;function s(l){i=l}function r(l,h){n.drawArrays(i,l,h),t.update(h,i,1)}function o(l,h,u){u!==0&&(n.drawArraysInstanced(i,l,h,u),t.update(h,i,u))}function a(l,h,u){if(u===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,l,0,h,0,u);let f=0;for(let g=0;g<u;g++)f+=h[g];t.update(f,i,1)}function c(l,h,u,d){if(u===0)return;let f=e.get("WEBGL_multi_draw");if(f===null)for(let g=0;g<l.length;g++)o(l[g],h[g],d[g]);else{f.multiDrawArraysInstancedWEBGL(i,l,0,h,0,d,0,u);let g=0;for(let y=0;y<u;y++)g+=h[y]*d[y];t.update(g,i,1)}}this.setMode=s,this.render=r,this.renderInstances=o,this.renderMultiDraw=a,this.renderMultiDrawInstances=c}function Vy(n,e,t,i){let s;function r(){if(s!==void 0)return s;if(e.has("EXT_texture_filter_anisotropic")===!0){let C=e.get("EXT_texture_filter_anisotropic");s=n.getParameter(C.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function o(C){return!(C!==xn&&i.convert(C)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(C){let L=C===ar&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(C!==zn&&i.convert(C)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_TYPE)&&C!==wn&&!L)}function c(C){if(C==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";C="mediump"}return C==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let l=t.precision!==void 0?t.precision:"highp",h=c(l);h!==l&&(console.warn("THREE.WebGLRenderer:",l,"not supported, using",h,"instead."),l=h);let u=t.logarithmicDepthBuffer===!0,d=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control"),f=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),g=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),y=n.getParameter(n.MAX_TEXTURE_SIZE),m=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),p=n.getParameter(n.MAX_VERTEX_ATTRIBS),E=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),T=n.getParameter(n.MAX_VARYING_VECTORS),v=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),R=g>0,w=n.getParameter(n.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:a,precision:l,logarithmicDepthBuffer:u,reversedDepthBuffer:d,maxTextures:f,maxVertexTextures:g,maxTextureSize:y,maxCubemapSize:m,maxAttributes:p,maxVertexUniforms:E,maxVaryings:T,maxFragmentUniforms:v,vertexTextures:R,maxSamples:w}}function Gy(n){let e=this,t=null,i=0,s=!1,r=!1,o=new Tn,a=new Je,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(u,d){let f=u.length!==0||d||i!==0||s;return s=d,i=u.length,f},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(u,d){t=h(u,d,0)},this.setState=function(u,d,f){let g=u.clippingPlanes,y=u.clipIntersection,m=u.clipShadows,p=n.get(u);if(!s||g===null||g.length===0||r&&!m)r?h(null):l();else{let E=r?0:i,T=E*4,v=p.clippingState||null;c.value=v,v=h(g,d,T,f);for(let R=0;R!==T;++R)v[R]=t[R];p.clippingState=v,this.numIntersection=y?this.numPlanes:0,this.numPlanes+=E}};function l(){c.value!==t&&(c.value=t,c.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function h(u,d,f,g){let y=u!==null?u.length:0,m=null;if(y!==0){if(m=c.value,g!==!0||m===null){let p=f+y*4,E=d.matrixWorldInverse;a.getNormalMatrix(E),(m===null||m.length<p)&&(m=new Float32Array(p));for(let T=0,v=f;T!==y;++T,v+=4)o.copy(u[T]).applyMatrix4(E,a),o.normal.toArray(m,v),m[v+3]=o.constant}c.value=m,c.needsUpdate=!0}return e.numPlanes=y,e.numIntersection=0,m}}function Wy(n){let e=new WeakMap;function t(o,a){return a===Ka?o.mapping=cs:a===Za&&(o.mapping=us),o}function i(o){if(o&&o.isTexture){let a=o.mapping;if(a===Ka||a===Za)if(e.has(o)){let c=e.get(o).texture;return t(c,o.mapping)}else{let c=o.image;if(c&&c.height>0){let l=new Ra(c.height);return l.fromEquirectangularTexture(n,o),e.set(o,l),o.addEventListener("dispose",s),t(l.texture,o.mapping)}else return null}}return o}function s(o){let a=o.target;a.removeEventListener("dispose",s);let c=e.get(a);c!==void 0&&(e.delete(a),c.dispose())}function r(){e=new WeakMap}return{get:i,dispose:r}}var dr=4,np=[.125,.215,.35,.446,.526,.582],gs=20,vu=new as,ip=new Ne,bu=null,Su=0,Mu=0,Tu=!1,ms=(1+Math.sqrt(5))/2,hr=1/ms,sp=[new D(-ms,hr,0),new D(ms,hr,0),new D(-hr,0,ms),new D(hr,0,ms),new D(0,ms,-hr),new D(0,ms,hr),new D(-1,1,-1),new D(1,1,-1),new D(-1,1,1),new D(1,1,1)],$y=new D,pr=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,i=.1,s=100,r={}){let{size:o=256,position:a=$y}=r;bu=this._renderer.getRenderTarget(),Su=this._renderer.getActiveCubeFace(),Mu=this._renderer.getActiveMipmapLevel(),Tu=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(o);let c=this._allocateTargets();return c.depthBuffer=!0,this._sceneToCubeUV(e,i,s,c,a),t>0&&this._blur(c,0,0,t),this._applyPMREM(c),this._cleanup(c),c}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=ap(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=op(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(bu,Su,Mu),this._renderer.xr.enabled=Tu,e.scissorTest=!1,Bl(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===cs||e.mapping===us?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),bu=this._renderer.getRenderTarget(),Su=this._renderer.getActiveCubeFace(),Mu=this._renderer.getActiveMipmapLevel(),Tu=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:an,minFilter:an,generateMipmaps:!1,type:ar,format:xn,colorSpace:jt,depthBuffer:!1},s=rp(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=rp(e,t,i);let{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=Xy(r)),this._blurMaterial=Yy(r,e,t)}return s}_compileMaterial(e){let t=new ht(this._lodPlanes[0],e);this._renderer.compile(t,vu)}_sceneToCubeUV(e,t,i,s,r){let c=new It(90,1,t,i),l=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],u=this._renderer,d=u.autoClear,f=u.toneMapping;u.getClearColor(ip),u.toneMapping=Si,u.autoClear=!1,u.state.buffers.depth.getReversed()&&(u.setRenderTarget(s),u.clearDepth(),u.setRenderTarget(null));let y=new en({name:"PMREM.Background",side:zt,depthWrite:!1,depthTest:!1}),m=new ht(new Ni,y),p=!1,E=e.background;E?E.isColor&&(y.color.copy(E),e.background=null,p=!0):(y.color.copy(ip),p=!0);for(let T=0;T<6;T++){let v=T%3;v===0?(c.up.set(0,l[T],0),c.position.set(r.x,r.y,r.z),c.lookAt(r.x+h[T],r.y,r.z)):v===1?(c.up.set(0,0,l[T]),c.position.set(r.x,r.y,r.z),c.lookAt(r.x,r.y+h[T],r.z)):(c.up.set(0,l[T],0),c.position.set(r.x,r.y,r.z),c.lookAt(r.x,r.y,r.z+h[T]));let R=this._cubeSize;Bl(s,v*R,T>2?R:0,R,R),u.setRenderTarget(s),p&&u.render(m,c),u.render(e,c)}m.geometry.dispose(),m.material.dispose(),u.toneMapping=f,u.autoClear=d,e.background=E}_textureToCubeUV(e,t){let i=this._renderer,s=e.mapping===cs||e.mapping===us;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=ap()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=op());let r=s?this._cubemapMaterial:this._equirectMaterial,o=new ht(this._lodPlanes[0],r),a=r.uniforms;a.envMap.value=e;let c=this._cubeSize;Bl(t,0,0,3*c,2*c),i.setRenderTarget(t),i.render(o,vu)}_applyPMREM(e){let t=this._renderer,i=t.autoClear;t.autoClear=!1;let s=this._lodPlanes.length;for(let r=1;r<s;r++){let o=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),a=sp[(s-r-1)%sp.length];this._blur(e,r-1,r,o,a)}t.autoClear=i}_blur(e,t,i,s,r){let o=this._pingPongRenderTarget;this._halfBlur(e,o,t,i,s,"latitudinal",r),this._halfBlur(o,e,i,i,s,"longitudinal",r)}_halfBlur(e,t,i,s,r,o,a){let c=this._renderer,l=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let h=3,u=new ht(this._lodPlanes[s],l),d=l.uniforms,f=this._sizeLods[i]-1,g=isFinite(r)?Math.PI/(2*f):2*Math.PI/(2*gs-1),y=r/g,m=isFinite(r)?1+Math.floor(h*y):gs;m>gs&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${gs}`);let p=[],E=0;for(let C=0;C<gs;++C){let L=C/y,b=Math.exp(-L*L/2);p.push(b),C===0?E+=b:C<m&&(E+=2*b)}for(let C=0;C<p.length;C++)p[C]=p[C]/E;d.envMap.value=e.texture,d.samples.value=m,d.weights.value=p,d.latitudinal.value=o==="latitudinal",a&&(d.poleAxis.value=a);let{_lodMax:T}=this;d.dTheta.value=g,d.mipInt.value=T-i;let v=this._sizeLods[s],R=3*v*(s>T-dr?s-T+dr:0),w=4*(this._cubeSize-v);Bl(t,R,w,3*v,2*v),c.setRenderTarget(t),c.render(u,vu)}};function Xy(n){let e=[],t=[],i=[],s=n,r=n-dr+1+np.length;for(let o=0;o<r;o++){let a=Math.pow(2,s);t.push(a);let c=1/a;o>n-dr?c=np[o-n+dr-1]:o===0&&(c=0),i.push(c);let l=1/(a-2),h=-l,u=1+l,d=[h,h,u,h,u,u,h,h,u,u,h,u],f=6,g=6,y=3,m=2,p=1,E=new Float32Array(y*g*f),T=new Float32Array(m*g*f),v=new Float32Array(p*g*f);for(let w=0;w<f;w++){let C=w%3*2/3-1,L=w>2?0:-1,b=[C,L,0,C+2/3,L,0,C+2/3,L+1,0,C,L,0,C+2/3,L+1,0,C,L+1,0];E.set(b,y*g*w),T.set(d,m*g*w);let x=[w,w,w,w,w,w];v.set(x,p*g*w)}let R=new Ct;R.setAttribute("position",new Dt(E,y)),R.setAttribute("uv",new Dt(T,m)),R.setAttribute("faceIndex",new Dt(v,p)),e.push(R),s>dr&&s--}return{lodPlanes:e,sizeLods:t,sigmas:i}}function rp(n,e,t){let i=new qn(n,e,t);return i.texture.mapping=xo,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function Bl(n,e,t,i,s){n.viewport.set(e,t,i,s),n.scissor.set(e,t,i,s)}function Yy(n,e,t){let i=new Float32Array(gs),s=new D(0,1,0);return new Un({name:"SphericalGaussianBlur",defines:{n:gs,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:Nu(),fragmentShader:`

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
		`,blending:bi,depthTest:!1,depthWrite:!1})}function op(){return new Un({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Nu(),fragmentShader:`

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
		`,blending:bi,depthTest:!1,depthWrite:!1})}function ap(){return new Un({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Nu(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:bi,depthTest:!1,depthWrite:!1})}function Nu(){return`

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
	`}function qy(n){let e=new WeakMap,t=null;function i(a){if(a&&a.isTexture){let c=a.mapping,l=c===Ka||c===Za,h=c===cs||c===us;if(l||h){let u=e.get(a),d=u!==void 0?u.texture.pmremVersion:0;if(a.isRenderTargetTexture&&a.pmremVersion!==d)return t===null&&(t=new pr(n)),u=l?t.fromEquirectangular(a,u):t.fromCubemap(a,u),u.texture.pmremVersion=a.pmremVersion,e.set(a,u),u.texture;if(u!==void 0)return u.texture;{let f=a.image;return l&&f&&f.height>0||h&&f&&s(f)?(t===null&&(t=new pr(n)),u=l?t.fromEquirectangular(a):t.fromCubemap(a),u.texture.pmremVersion=a.pmremVersion,e.set(a,u),a.addEventListener("dispose",r),u.texture):null}}}return a}function s(a){let c=0,l=6;for(let h=0;h<l;h++)a[h]!==void 0&&c++;return c===l}function r(a){let c=a.target;c.removeEventListener("dispose",r);let l=e.get(c);l!==void 0&&(e.delete(c),l.dispose())}function o(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:i,dispose:o}}function jy(n){let e={};function t(i){if(e[i]!==void 0)return e[i];let s;switch(i){case"WEBGL_depth_texture":s=n.getExtension("WEBGL_depth_texture")||n.getExtension("MOZ_WEBGL_depth_texture")||n.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=n.getExtension("EXT_texture_filter_anisotropic")||n.getExtension("MOZ_EXT_texture_filter_anisotropic")||n.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=n.getExtension("WEBGL_compressed_texture_s3tc")||n.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=n.getExtension("WEBGL_compressed_texture_pvrtc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=n.getExtension(i)}return e[i]=s,s}return{has:function(i){return t(i)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(i){let s=t(i);return s===null&&Js("THREE.WebGLRenderer: "+i+" extension not supported."),s}}}function Jy(n,e,t,i){let s={},r=new WeakMap;function o(u){let d=u.target;d.index!==null&&e.remove(d.index);for(let g in d.attributes)e.remove(d.attributes[g]);d.removeEventListener("dispose",o),delete s[d.id];let f=r.get(d);f&&(e.remove(f),r.delete(d)),i.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,t.memory.geometries--}function a(u,d){return s[d.id]===!0||(d.addEventListener("dispose",o),s[d.id]=!0,t.memory.geometries++),d}function c(u){let d=u.attributes;for(let f in d)e.update(d[f],n.ARRAY_BUFFER)}function l(u){let d=[],f=u.index,g=u.attributes.position,y=0;if(f!==null){let E=f.array;y=f.version;for(let T=0,v=E.length;T<v;T+=3){let R=E[T+0],w=E[T+1],C=E[T+2];d.push(R,w,w,C,C,R)}}else if(g!==void 0){let E=g.array;y=g.version;for(let T=0,v=E.length/3-1;T<v;T+=3){let R=T+0,w=T+1,C=T+2;d.push(R,w,w,C,C,R)}}else return;let m=new(mu(d)?$r:Wr)(d,1);m.version=y;let p=r.get(u);p&&e.remove(p),r.set(u,m)}function h(u){let d=r.get(u);if(d){let f=u.index;f!==null&&d.version<f.version&&l(u)}else l(u);return r.get(u)}return{get:a,update:c,getWireframeAttribute:h}}function Ky(n,e,t){let i;function s(d){i=d}let r,o;function a(d){r=d.type,o=d.bytesPerElement}function c(d,f){n.drawElements(i,f,r,d*o),t.update(f,i,1)}function l(d,f,g){g!==0&&(n.drawElementsInstanced(i,f,r,d*o,g),t.update(f,i,g))}function h(d,f,g){if(g===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,f,0,r,d,0,g);let m=0;for(let p=0;p<g;p++)m+=f[p];t.update(m,i,1)}function u(d,f,g,y){if(g===0)return;let m=e.get("WEBGL_multi_draw");if(m===null)for(let p=0;p<d.length;p++)l(d[p]/o,f[p],y[p]);else{m.multiDrawElementsInstancedWEBGL(i,f,0,r,d,0,y,0,g);let p=0;for(let E=0;E<g;E++)p+=f[E]*y[E];t.update(p,i,1)}}this.setMode=s,this.setIndex=a,this.render=c,this.renderInstances=l,this.renderMultiDraw=h,this.renderMultiDrawInstances=u}function Zy(n){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(r,o,a){switch(t.calls++,o){case n.TRIANGLES:t.triangles+=a*(r/3);break;case n.LINES:t.lines+=a*(r/2);break;case n.LINE_STRIP:t.lines+=a*(r-1);break;case n.LINE_LOOP:t.lines+=a*r;break;case n.POINTS:t.points+=a*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function s(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:s,update:i}}function Qy(n,e,t){let i=new WeakMap,s=new ut;function r(o,a,c){let l=o.morphTargetInfluences,h=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,u=h!==void 0?h.length:0,d=i.get(a);if(d===void 0||d.count!==u){let b=function(){C.dispose(),i.delete(a),a.removeEventListener("dispose",b)};d!==void 0&&d.texture.dispose();let f=a.morphAttributes.position!==void 0,g=a.morphAttributes.normal!==void 0,y=a.morphAttributes.color!==void 0,m=a.morphAttributes.position||[],p=a.morphAttributes.normal||[],E=a.morphAttributes.color||[],T=0;f===!0&&(T=1),g===!0&&(T=2),y===!0&&(T=3);let v=a.attributes.position.count*T,R=1;v>e.maxTextureSize&&(R=Math.ceil(v/e.maxTextureSize),v=e.maxTextureSize);let w=new Float32Array(v*R*4*u),C=new Vr(w,v,R,u);C.type=wn,C.needsUpdate=!0;let L=T*4;for(let x=0;x<u;x++){let P=m[x],U=p[x],W=E[x],$=v*R*4*x;for(let J=0;J<P.count;J++){let G=J*L;f===!0&&(s.fromBufferAttribute(P,J),w[$+G+0]=s.x,w[$+G+1]=s.y,w[$+G+2]=s.z,w[$+G+3]=0),g===!0&&(s.fromBufferAttribute(U,J),w[$+G+4]=s.x,w[$+G+5]=s.y,w[$+G+6]=s.z,w[$+G+7]=0),y===!0&&(s.fromBufferAttribute(W,J),w[$+G+8]=s.x,w[$+G+9]=s.y,w[$+G+10]=s.z,w[$+G+11]=W.itemSize===4?s.w:1)}}d={count:u,texture:C,size:new De(v,R)},i.set(a,d),a.addEventListener("dispose",b)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)c.getUniforms().setValue(n,"morphTexture",o.morphTexture,t);else{let f=0;for(let y=0;y<l.length;y++)f+=l[y];let g=a.morphTargetsRelative?1:1-f;c.getUniforms().setValue(n,"morphTargetBaseInfluence",g),c.getUniforms().setValue(n,"morphTargetInfluences",l)}c.getUniforms().setValue(n,"morphTargetsTexture",d.texture,t),c.getUniforms().setValue(n,"morphTargetsTextureSize",d.size)}return{update:r}}function ev(n,e,t,i){let s=new WeakMap;function r(c){let l=i.render.frame,h=c.geometry,u=e.get(c,h);if(s.get(u)!==l&&(e.update(u),s.set(u,l)),c.isInstancedMesh&&(c.hasEventListener("dispose",a)===!1&&c.addEventListener("dispose",a),s.get(c)!==l&&(t.update(c.instanceMatrix,n.ARRAY_BUFFER),c.instanceColor!==null&&t.update(c.instanceColor,n.ARRAY_BUFFER),s.set(c,l))),c.isSkinnedMesh){let d=c.skeleton;s.get(d)!==l&&(d.update(),s.set(d,l))}return u}function o(){s=new WeakMap}function a(c){let l=c.target;l.removeEventListener("dispose",a),t.remove(l.instanceMatrix),l.instanceColor!==null&&t.remove(l.instanceColor)}return{update:r,dispose:o}}var wp=new kt,lp=new to(1,1),Ap=new Vr,Rp=new wa,Cp=new Yr,cp=[],up=[],hp=new Float32Array(16),dp=new Float32Array(9),fp=new Float32Array(4);function mr(n,e,t){let i=n[0];if(i<=0||i>0)return n;let s=e*t,r=cp[s];if(r===void 0&&(r=new Float32Array(s),cp[s]=r),e!==0){i.toArray(r,0);for(let o=1,a=0;o!==e;++o)a+=t,n[o].toArray(r,a)}return r}function Ht(n,e){if(n.length!==e.length)return!1;for(let t=0,i=n.length;t<i;t++)if(n[t]!==e[t])return!1;return!0}function Vt(n,e){for(let t=0,i=e.length;t<i;t++)n[t]=e[t]}function Hl(n,e){let t=up[e];t===void 0&&(t=new Int32Array(e),up[e]=t);for(let i=0;i!==e;++i)t[i]=n.allocateTextureUnit();return t}function tv(n,e){let t=this.cache;t[0]!==e&&(n.uniform1f(this.addr,e),t[0]=e)}function nv(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Ht(t,e))return;n.uniform2fv(this.addr,e),Vt(t,e)}}function iv(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(n.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Ht(t,e))return;n.uniform3fv(this.addr,e),Vt(t,e)}}function sv(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Ht(t,e))return;n.uniform4fv(this.addr,e),Vt(t,e)}}function rv(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Ht(t,e))return;n.uniformMatrix2fv(this.addr,!1,e),Vt(t,e)}else{if(Ht(t,i))return;fp.set(i),n.uniformMatrix2fv(this.addr,!1,fp),Vt(t,i)}}function ov(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Ht(t,e))return;n.uniformMatrix3fv(this.addr,!1,e),Vt(t,e)}else{if(Ht(t,i))return;dp.set(i),n.uniformMatrix3fv(this.addr,!1,dp),Vt(t,i)}}function av(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Ht(t,e))return;n.uniformMatrix4fv(this.addr,!1,e),Vt(t,e)}else{if(Ht(t,i))return;hp.set(i),n.uniformMatrix4fv(this.addr,!1,hp),Vt(t,i)}}function lv(n,e){let t=this.cache;t[0]!==e&&(n.uniform1i(this.addr,e),t[0]=e)}function cv(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Ht(t,e))return;n.uniform2iv(this.addr,e),Vt(t,e)}}function uv(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Ht(t,e))return;n.uniform3iv(this.addr,e),Vt(t,e)}}function hv(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Ht(t,e))return;n.uniform4iv(this.addr,e),Vt(t,e)}}function dv(n,e){let t=this.cache;t[0]!==e&&(n.uniform1ui(this.addr,e),t[0]=e)}function fv(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Ht(t,e))return;n.uniform2uiv(this.addr,e),Vt(t,e)}}function pv(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Ht(t,e))return;n.uniform3uiv(this.addr,e),Vt(t,e)}}function mv(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Ht(t,e))return;n.uniform4uiv(this.addr,e),Vt(t,e)}}function gv(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s);let r;this.type===n.SAMPLER_2D_SHADOW?(lp.compareFunction=du,r=lp):r=wp,t.setTexture2D(e||r,s)}function _v(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),t.setTexture3D(e||Rp,s)}function xv(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),t.setTextureCube(e||Cp,s)}function yv(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),t.setTexture2DArray(e||Ap,s)}function vv(n){switch(n){case 5126:return tv;case 35664:return nv;case 35665:return iv;case 35666:return sv;case 35674:return rv;case 35675:return ov;case 35676:return av;case 5124:case 35670:return lv;case 35667:case 35671:return cv;case 35668:case 35672:return uv;case 35669:case 35673:return hv;case 5125:return dv;case 36294:return fv;case 36295:return pv;case 36296:return mv;case 35678:case 36198:case 36298:case 36306:case 35682:return gv;case 35679:case 36299:case 36307:return _v;case 35680:case 36300:case 36308:case 36293:return xv;case 36289:case 36303:case 36311:case 36292:return yv}}function bv(n,e){n.uniform1fv(this.addr,e)}function Sv(n,e){let t=mr(e,this.size,2);n.uniform2fv(this.addr,t)}function Mv(n,e){let t=mr(e,this.size,3);n.uniform3fv(this.addr,t)}function Tv(n,e){let t=mr(e,this.size,4);n.uniform4fv(this.addr,t)}function Ev(n,e){let t=mr(e,this.size,4);n.uniformMatrix2fv(this.addr,!1,t)}function wv(n,e){let t=mr(e,this.size,9);n.uniformMatrix3fv(this.addr,!1,t)}function Av(n,e){let t=mr(e,this.size,16);n.uniformMatrix4fv(this.addr,!1,t)}function Rv(n,e){n.uniform1iv(this.addr,e)}function Cv(n,e){n.uniform2iv(this.addr,e)}function Pv(n,e){n.uniform3iv(this.addr,e)}function Iv(n,e){n.uniform4iv(this.addr,e)}function Lv(n,e){n.uniform1uiv(this.addr,e)}function Dv(n,e){n.uniform2uiv(this.addr,e)}function Nv(n,e){n.uniform3uiv(this.addr,e)}function Ov(n,e){n.uniform4uiv(this.addr,e)}function Fv(n,e,t){let i=this.cache,s=e.length,r=Hl(t,s);Ht(i,r)||(n.uniform1iv(this.addr,r),Vt(i,r));for(let o=0;o!==s;++o)t.setTexture2D(e[o]||wp,r[o])}function Uv(n,e,t){let i=this.cache,s=e.length,r=Hl(t,s);Ht(i,r)||(n.uniform1iv(this.addr,r),Vt(i,r));for(let o=0;o!==s;++o)t.setTexture3D(e[o]||Rp,r[o])}function Bv(n,e,t){let i=this.cache,s=e.length,r=Hl(t,s);Ht(i,r)||(n.uniform1iv(this.addr,r),Vt(i,r));for(let o=0;o!==s;++o)t.setTextureCube(e[o]||Cp,r[o])}function kv(n,e,t){let i=this.cache,s=e.length,r=Hl(t,s);Ht(i,r)||(n.uniform1iv(this.addr,r),Vt(i,r));for(let o=0;o!==s;++o)t.setTexture2DArray(e[o]||Ap,r[o])}function zv(n){switch(n){case 5126:return bv;case 35664:return Sv;case 35665:return Mv;case 35666:return Tv;case 35674:return Ev;case 35675:return wv;case 35676:return Av;case 5124:case 35670:return Rv;case 35667:case 35671:return Cv;case 35668:case 35672:return Pv;case 35669:case 35673:return Iv;case 5125:return Lv;case 36294:return Dv;case 36295:return Nv;case 36296:return Ov;case 35678:case 36198:case 36298:case 36306:case 35682:return Fv;case 35679:case 36299:case 36307:return Uv;case 35680:case 36300:case 36308:case 36293:return Bv;case 36289:case 36303:case 36311:case 36292:return kv}}var wu=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.setValue=vv(t.type)}},Au=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=zv(t.type)}},Ru=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,i){let s=this.seq;for(let r=0,o=s.length;r!==o;++r){let a=s[r];a.setValue(e,t[a.id],i)}}},Eu=/(\w+)(\])?(\[|\.)?/g;function pp(n,e){n.seq.push(e),n.map[e.id]=e}function Hv(n,e,t){let i=n.name,s=i.length;for(Eu.lastIndex=0;;){let r=Eu.exec(i),o=Eu.lastIndex,a=r[1],c=r[2]==="]",l=r[3];if(c&&(a=a|0),l===void 0||l==="["&&o+2===s){pp(t,l===void 0?new wu(a,n,e):new Au(a,n,e));break}else{let u=t.map[a];u===void 0&&(u=new Ru(a),pp(t,u)),t=u}}}var fr=class{constructor(e,t){this.seq=[],this.map={};let i=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let s=0;s<i;++s){let r=e.getActiveUniform(t,s),o=e.getUniformLocation(t,r.name);Hv(r,o,this)}}setValue(e,t,i,s){let r=this.map[t];r!==void 0&&r.setValue(e,i,s)}setOptional(e,t,i){let s=t[i];s!==void 0&&this.setValue(e,i,s)}static upload(e,t,i,s){for(let r=0,o=t.length;r!==o;++r){let a=t[r],c=i[a.id];c.needsUpdate!==!1&&a.setValue(e,c.value,s)}}static seqWithValue(e,t){let i=[];for(let s=0,r=e.length;s!==r;++s){let o=e[s];o.id in t&&i.push(o)}return i}};function mp(n,e,t){let i=n.createShader(e);return n.shaderSource(i,t),n.compileShader(i),i}var Vv=37297,Gv=0;function Wv(n,e){let t=n.split(`
`),i=[],s=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let o=s;o<r;o++){let a=o+1;i.push(`${a===e?">":" "} ${a}: ${t[o]}`)}return i.join(`
`)}var gp=new Je;function $v(n){at._getMatrix(gp,at.workingColorSpace,n);let e=`mat3( ${gp.elements.map(t=>t.toFixed(4))} )`;switch(at.getTransfer(n)){case zr:return[e,"LinearTransferOETF"];case xt:return[e,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",n),[e,"LinearTransferOETF"]}}function _p(n,e,t){let i=n.getShaderParameter(e,n.COMPILE_STATUS),r=(n.getShaderInfoLog(e)||"").trim();if(i&&r==="")return"";let o=/ERROR: 0:(\d+)/.exec(r);if(o){let a=parseInt(o[1]);return t.toUpperCase()+`

`+r+`

`+Wv(n.getShaderSource(e),a)}else return r}function Xv(n,e){let t=$v(e);return[`vec4 ${n}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}function Yv(n,e){let t;switch(e){case If:t="Linear";break;case Lf:t="Reinhard";break;case Df:t="Cineon";break;case Ja:t="ACESFilmic";break;case Of:t="AgX";break;case Ff:t="Neutral";break;case Nf:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+n+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var kl=new D;function qv(){at.getLuminanceCoefficients(kl);let n=kl.x.toFixed(4),e=kl.y.toFixed(4),t=kl.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${n}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function jv(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",n.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Eo).join(`
`)}function Jv(n){let e=[];for(let t in n){let i=n[t];i!==!1&&e.push("#define "+t+" "+i)}return e.join(`
`)}function Kv(n,e){let t={},i=n.getProgramParameter(e,n.ACTIVE_ATTRIBUTES);for(let s=0;s<i;s++){let r=n.getActiveAttrib(e,s),o=r.name,a=1;r.type===n.FLOAT_MAT2&&(a=2),r.type===n.FLOAT_MAT3&&(a=3),r.type===n.FLOAT_MAT4&&(a=4),t[o]={type:r.type,location:n.getAttribLocation(e,o),locationSize:a}}return t}function Eo(n){return n!==""}function xp(n,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return n.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function yp(n,e){return n.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var Zv=/^[ \t]*#include +<([\w\d./]+)>/gm;function Cu(n){return n.replace(Zv,eb)}var Qv=new Map;function eb(n,e){let t=Ke[e];if(t===void 0){let i=Qv.get(e);if(i!==void 0)t=Ke[i],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("Can not resolve #include <"+e+">")}return Cu(t)}var tb=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function vp(n){return n.replace(tb,nb)}function nb(n,e,t,i){let s="";for(let r=parseInt(e);r<parseInt(t);r++)s+=i.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function bp(n){let e=`precision ${n.precision} float;
	precision ${n.precision} int;
	precision ${n.precision} sampler2D;
	precision ${n.precision} samplerCube;
	precision ${n.precision} sampler3D;
	precision ${n.precision} sampler2DArray;
	precision ${n.precision} sampler2DShadow;
	precision ${n.precision} samplerCubeShadow;
	precision ${n.precision} sampler2DArrayShadow;
	precision ${n.precision} isampler2D;
	precision ${n.precision} isampler3D;
	precision ${n.precision} isamplerCube;
	precision ${n.precision} isampler2DArray;
	precision ${n.precision} usampler2D;
	precision ${n.precision} usampler3D;
	precision ${n.precision} usamplerCube;
	precision ${n.precision} usampler2DArray;
	`;return n.precision==="highp"?e+=`
#define HIGH_PRECISION`:n.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:n.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function ib(n){let e="SHADOWMAP_TYPE_BASIC";return n.shadowMapType===Qc?e="SHADOWMAP_TYPE_PCF":n.shadowMapType===uf?e="SHADOWMAP_TYPE_PCF_SOFT":n.shadowMapType===ei&&(e="SHADOWMAP_TYPE_VSM"),e}function sb(n){let e="ENVMAP_TYPE_CUBE";if(n.envMap)switch(n.envMapMode){case cs:case us:e="ENVMAP_TYPE_CUBE";break;case xo:e="ENVMAP_TYPE_CUBE_UV";break}return e}function rb(n){let e="ENVMAP_MODE_REFLECTION";if(n.envMap)switch(n.envMapMode){case us:e="ENVMAP_MODE_REFRACTION";break}return e}function ob(n){let e="ENVMAP_BLENDING_NONE";if(n.envMap)switch(n.combine){case ja:e="ENVMAP_BLENDING_MULTIPLY";break;case Cf:e="ENVMAP_BLENDING_MIX";break;case Pf:e="ENVMAP_BLENDING_ADD";break}return e}function ab(n){let e=n.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:i,maxMip:t}}function lb(n,e,t,i){let s=n.getContext(),r=t.defines,o=t.vertexShader,a=t.fragmentShader,c=ib(t),l=sb(t),h=rb(t),u=ob(t),d=ab(t),f=jv(t),g=Jv(r),y=s.createProgram(),m,p,E=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(Eo).join(`
`),m.length>0&&(m+=`
`),p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(Eo).join(`
`),p.length>0&&(p+=`
`)):(m=[bp(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Eo).join(`
`),p=[bp(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+l:"",t.envMap?"#define "+h:"",t.envMap?"#define "+u:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor||t.batchingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==Si?"#define TONE_MAPPING":"",t.toneMapping!==Si?Ke.tonemapping_pars_fragment:"",t.toneMapping!==Si?Yv("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Ke.colorspace_pars_fragment,Xv("linearToOutputTexel",t.outputColorSpace),qv(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(Eo).join(`
`)),o=Cu(o),o=xp(o,t),o=yp(o,t),a=Cu(a),a=xp(a,t),a=yp(a,t),o=vp(o),a=vp(a),t.isRawShaderMaterial!==!0&&(E=`#version 300 es
`,m=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,p=["#define varying in",t.glslVersion===fu?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===fu?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);let T=E+m+o,v=E+p+a,R=mp(s,s.VERTEX_SHADER,T),w=mp(s,s.FRAGMENT_SHADER,v);s.attachShader(y,R),s.attachShader(y,w),t.index0AttributeName!==void 0?s.bindAttribLocation(y,0,t.index0AttributeName):t.morphTargets===!0&&s.bindAttribLocation(y,0,"position"),s.linkProgram(y);function C(P){if(n.debug.checkShaderErrors){let U=s.getProgramInfoLog(y)||"",W=s.getShaderInfoLog(R)||"",$=s.getShaderInfoLog(w)||"",J=U.trim(),G=W.trim(),Q=$.trim(),X=!0,te=!0;if(s.getProgramParameter(y,s.LINK_STATUS)===!1)if(X=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(s,y,R,w);else{let ue=_p(s,R,"vertex"),Ee=_p(s,w,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(y,s.VALIDATE_STATUS)+`

Material Name: `+P.name+`
Material Type: `+P.type+`

Program Info Log: `+J+`
`+ue+`
`+Ee)}else J!==""?console.warn("THREE.WebGLProgram: Program Info Log:",J):(G===""||Q==="")&&(te=!1);te&&(P.diagnostics={runnable:X,programLog:J,vertexShader:{log:G,prefix:m},fragmentShader:{log:Q,prefix:p}})}s.deleteShader(R),s.deleteShader(w),L=new fr(s,y),b=Kv(s,y)}let L;this.getUniforms=function(){return L===void 0&&C(this),L};let b;this.getAttributes=function(){return b===void 0&&C(this),b};let x=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return x===!1&&(x=s.getProgramParameter(y,Vv)),x},this.destroy=function(){i.releaseStatesOfProgram(this),s.deleteProgram(y),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=Gv++,this.cacheKey=e,this.usedTimes=1,this.program=y,this.vertexShader=R,this.fragmentShader=w,this}var cb=0,Pu=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){let t=e.vertexShader,i=e.fragmentShader,s=this._getShaderStage(t),r=this._getShaderStage(i),o=this._getShaderCacheForMaterial(e);return o.has(s)===!1&&(o.add(s),s.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,i=t.get(e);return i===void 0&&(i=new Set,t.set(e,i)),i}_getShaderStage(e){let t=this.shaderCache,i=t.get(e);return i===void 0&&(i=new Iu(e),t.set(e,i)),i}},Iu=class{constructor(e){this.id=cb++,this.code=e,this.usedTimes=0}};function ub(n,e,t,i,s,r,o){let a=new Gr,c=new Pu,l=new Set,h=[],u=s.logarithmicDepthBuffer,d=s.vertexTextures,f=s.precision,g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function y(b){return l.add(b),b===0?"uv":`uv${b}`}function m(b,x,P,U,W){let $=U.fog,J=W.geometry,G=b.isMeshStandardMaterial?U.environment:null,Q=(b.isMeshStandardMaterial?t:e).get(b.envMap||G),X=Q&&Q.mapping===xo?Q.image.height:null,te=g[b.type];b.precision!==null&&(f=s.getMaxPrecision(b.precision),f!==b.precision&&console.warn("THREE.WebGLProgram.getParameters:",b.precision,"not supported, using",f,"instead."));let ue=J.morphAttributes.position||J.morphAttributes.normal||J.morphAttributes.color,Ee=ue!==void 0?ue.length:0,Ve=0;J.morphAttributes.position!==void 0&&(Ve=1),J.morphAttributes.normal!==void 0&&(Ve=2),J.morphAttributes.color!==void 0&&(Ve=3);let qe,lt,Xe,K;if(te){let Ze=ti[te];qe=Ze.vertexShader,lt=Ze.fragmentShader}else qe=b.vertexShader,lt=b.fragmentShader,c.update(b),Xe=c.getVertexShaderID(b),K=c.getFragmentShaderID(b);let Z=n.getRenderTarget(),xe=n.state.buffers.depth.getReversed(),Le=W.isInstancedMesh===!0,we=W.isBatchedMesh===!0,Ge=!!b.map,At=!!b.matcap,I=!!Q,it=!!b.aoMap,Fe=!!b.lightMap,me=!!b.bumpMap,fe=!!b.normalMap,tt=!!b.displacementMap,de=!!b.emissiveMap,Ce=!!b.metalnessMap,pt=!!b.roughnessMap,j=b.anisotropy>0,S=b.clearcoat>0,_=b.dispersion>0,F=b.iridescence>0,A=b.sheen>0,B=b.transmission>0,z=j&&!!b.anisotropyMap,ce=S&&!!b.clearcoatMap,ne=S&&!!b.clearcoatNormalMap,be=S&&!!b.clearcoatRoughnessMap,Pe=F&&!!b.iridescenceMap,ae=F&&!!b.iridescenceThicknessMap,pe=A&&!!b.sheenColorMap,ke=A&&!!b.sheenRoughnessMap,Ae=!!b.specularMap,ge=!!b.specularColorMap,$e=!!b.specularIntensityMap,O=B&&!!b.transmissionMap,le=B&&!!b.thicknessMap,he=!!b.gradientMap,Me=!!b.alphaMap,re=b.alphaTest>0,ee=!!b.alphaHash,Te=!!b.extensions,We=Si;b.toneMapped&&(Z===null||Z.isXRRenderTarget===!0)&&(We=n.toneMapping);let dt={shaderID:te,shaderType:b.type,shaderName:b.name,vertexShader:qe,fragmentShader:lt,defines:b.defines,customVertexShaderID:Xe,customFragmentShaderID:K,isRawShaderMaterial:b.isRawShaderMaterial===!0,glslVersion:b.glslVersion,precision:f,batching:we,batchingColor:we&&W._colorsTexture!==null,instancing:Le,instancingColor:Le&&W.instanceColor!==null,instancingMorph:Le&&W.morphTexture!==null,supportsVertexTextures:d,outputColorSpace:Z===null?n.outputColorSpace:Z.isXRRenderTarget===!0?Z.texture.colorSpace:jt,alphaToCoverage:!!b.alphaToCoverage,map:Ge,matcap:At,envMap:I,envMapMode:I&&Q.mapping,envMapCubeUVHeight:X,aoMap:it,lightMap:Fe,bumpMap:me,normalMap:fe,displacementMap:d&&tt,emissiveMap:de,normalMapObjectSpace:fe&&b.normalMapType===Hf,normalMapTangentSpace:fe&&b.normalMapType===Ol,metalnessMap:Ce,roughnessMap:pt,anisotropy:j,anisotropyMap:z,clearcoat:S,clearcoatMap:ce,clearcoatNormalMap:ne,clearcoatRoughnessMap:be,dispersion:_,iridescence:F,iridescenceMap:Pe,iridescenceThicknessMap:ae,sheen:A,sheenColorMap:pe,sheenRoughnessMap:ke,specularMap:Ae,specularColorMap:ge,specularIntensityMap:$e,transmission:B,transmissionMap:O,thicknessMap:le,gradientMap:he,opaque:b.transparent===!1&&b.blending===ji&&b.alphaToCoverage===!1,alphaMap:Me,alphaTest:re,alphaHash:ee,combine:b.combine,mapUv:Ge&&y(b.map.channel),aoMapUv:it&&y(b.aoMap.channel),lightMapUv:Fe&&y(b.lightMap.channel),bumpMapUv:me&&y(b.bumpMap.channel),normalMapUv:fe&&y(b.normalMap.channel),displacementMapUv:tt&&y(b.displacementMap.channel),emissiveMapUv:de&&y(b.emissiveMap.channel),metalnessMapUv:Ce&&y(b.metalnessMap.channel),roughnessMapUv:pt&&y(b.roughnessMap.channel),anisotropyMapUv:z&&y(b.anisotropyMap.channel),clearcoatMapUv:ce&&y(b.clearcoatMap.channel),clearcoatNormalMapUv:ne&&y(b.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:be&&y(b.clearcoatRoughnessMap.channel),iridescenceMapUv:Pe&&y(b.iridescenceMap.channel),iridescenceThicknessMapUv:ae&&y(b.iridescenceThicknessMap.channel),sheenColorMapUv:pe&&y(b.sheenColorMap.channel),sheenRoughnessMapUv:ke&&y(b.sheenRoughnessMap.channel),specularMapUv:Ae&&y(b.specularMap.channel),specularColorMapUv:ge&&y(b.specularColorMap.channel),specularIntensityMapUv:$e&&y(b.specularIntensityMap.channel),transmissionMapUv:O&&y(b.transmissionMap.channel),thicknessMapUv:le&&y(b.thicknessMap.channel),alphaMapUv:Me&&y(b.alphaMap.channel),vertexTangents:!!J.attributes.tangent&&(fe||j),vertexColors:b.vertexColors,vertexAlphas:b.vertexColors===!0&&!!J.attributes.color&&J.attributes.color.itemSize===4,pointsUvs:W.isPoints===!0&&!!J.attributes.uv&&(Ge||Me),fog:!!$,useFog:b.fog===!0,fogExp2:!!$&&$.isFogExp2,flatShading:b.flatShading===!0&&b.wireframe===!1,sizeAttenuation:b.sizeAttenuation===!0,logarithmicDepthBuffer:u,reversedDepthBuffer:xe,skinning:W.isSkinnedMesh===!0,morphTargets:J.morphAttributes.position!==void 0,morphNormals:J.morphAttributes.normal!==void 0,morphColors:J.morphAttributes.color!==void 0,morphTargetsCount:Ee,morphTextureStride:Ve,numDirLights:x.directional.length,numPointLights:x.point.length,numSpotLights:x.spot.length,numSpotLightMaps:x.spotLightMap.length,numRectAreaLights:x.rectArea.length,numHemiLights:x.hemi.length,numDirLightShadows:x.directionalShadowMap.length,numPointLightShadows:x.pointShadowMap.length,numSpotLightShadows:x.spotShadowMap.length,numSpotLightShadowsWithMaps:x.numSpotLightShadowsWithMaps,numLightProbes:x.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:b.dithering,shadowMapEnabled:n.shadowMap.enabled&&P.length>0,shadowMapType:n.shadowMap.type,toneMapping:We,decodeVideoTexture:Ge&&b.map.isVideoTexture===!0&&at.getTransfer(b.map.colorSpace)===xt,decodeVideoTextureEmissive:de&&b.emissiveMap.isVideoTexture===!0&&at.getTransfer(b.emissiveMap.colorSpace)===xt,premultipliedAlpha:b.premultipliedAlpha,doubleSided:b.side===tn,flipSided:b.side===zt,useDepthPacking:b.depthPacking>=0,depthPacking:b.depthPacking||0,index0AttributeName:b.index0AttributeName,extensionClipCullDistance:Te&&b.extensions.clipCullDistance===!0&&i.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Te&&b.extensions.multiDraw===!0||we)&&i.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:i.has("KHR_parallel_shader_compile"),customProgramCacheKey:b.customProgramCacheKey()};return dt.vertexUv1s=l.has(1),dt.vertexUv2s=l.has(2),dt.vertexUv3s=l.has(3),l.clear(),dt}function p(b){let x=[];if(b.shaderID?x.push(b.shaderID):(x.push(b.customVertexShaderID),x.push(b.customFragmentShaderID)),b.defines!==void 0)for(let P in b.defines)x.push(P),x.push(b.defines[P]);return b.isRawShaderMaterial===!1&&(E(x,b),T(x,b),x.push(n.outputColorSpace)),x.push(b.customProgramCacheKey),x.join()}function E(b,x){b.push(x.precision),b.push(x.outputColorSpace),b.push(x.envMapMode),b.push(x.envMapCubeUVHeight),b.push(x.mapUv),b.push(x.alphaMapUv),b.push(x.lightMapUv),b.push(x.aoMapUv),b.push(x.bumpMapUv),b.push(x.normalMapUv),b.push(x.displacementMapUv),b.push(x.emissiveMapUv),b.push(x.metalnessMapUv),b.push(x.roughnessMapUv),b.push(x.anisotropyMapUv),b.push(x.clearcoatMapUv),b.push(x.clearcoatNormalMapUv),b.push(x.clearcoatRoughnessMapUv),b.push(x.iridescenceMapUv),b.push(x.iridescenceThicknessMapUv),b.push(x.sheenColorMapUv),b.push(x.sheenRoughnessMapUv),b.push(x.specularMapUv),b.push(x.specularColorMapUv),b.push(x.specularIntensityMapUv),b.push(x.transmissionMapUv),b.push(x.thicknessMapUv),b.push(x.combine),b.push(x.fogExp2),b.push(x.sizeAttenuation),b.push(x.morphTargetsCount),b.push(x.morphAttributeCount),b.push(x.numDirLights),b.push(x.numPointLights),b.push(x.numSpotLights),b.push(x.numSpotLightMaps),b.push(x.numHemiLights),b.push(x.numRectAreaLights),b.push(x.numDirLightShadows),b.push(x.numPointLightShadows),b.push(x.numSpotLightShadows),b.push(x.numSpotLightShadowsWithMaps),b.push(x.numLightProbes),b.push(x.shadowMapType),b.push(x.toneMapping),b.push(x.numClippingPlanes),b.push(x.numClipIntersection),b.push(x.depthPacking)}function T(b,x){a.disableAll(),x.supportsVertexTextures&&a.enable(0),x.instancing&&a.enable(1),x.instancingColor&&a.enable(2),x.instancingMorph&&a.enable(3),x.matcap&&a.enable(4),x.envMap&&a.enable(5),x.normalMapObjectSpace&&a.enable(6),x.normalMapTangentSpace&&a.enable(7),x.clearcoat&&a.enable(8),x.iridescence&&a.enable(9),x.alphaTest&&a.enable(10),x.vertexColors&&a.enable(11),x.vertexAlphas&&a.enable(12),x.vertexUv1s&&a.enable(13),x.vertexUv2s&&a.enable(14),x.vertexUv3s&&a.enable(15),x.vertexTangents&&a.enable(16),x.anisotropy&&a.enable(17),x.alphaHash&&a.enable(18),x.batching&&a.enable(19),x.dispersion&&a.enable(20),x.batchingColor&&a.enable(21),x.gradientMap&&a.enable(22),b.push(a.mask),a.disableAll(),x.fog&&a.enable(0),x.useFog&&a.enable(1),x.flatShading&&a.enable(2),x.logarithmicDepthBuffer&&a.enable(3),x.reversedDepthBuffer&&a.enable(4),x.skinning&&a.enable(5),x.morphTargets&&a.enable(6),x.morphNormals&&a.enable(7),x.morphColors&&a.enable(8),x.premultipliedAlpha&&a.enable(9),x.shadowMapEnabled&&a.enable(10),x.doubleSided&&a.enable(11),x.flipSided&&a.enable(12),x.useDepthPacking&&a.enable(13),x.dithering&&a.enable(14),x.transmission&&a.enable(15),x.sheen&&a.enable(16),x.opaque&&a.enable(17),x.pointsUvs&&a.enable(18),x.decodeVideoTexture&&a.enable(19),x.decodeVideoTextureEmissive&&a.enable(20),x.alphaToCoverage&&a.enable(21),b.push(a.mask)}function v(b){let x=g[b.type],P;if(x){let U=ti[x];P=Zf.clone(U.uniforms)}else P=b.uniforms;return P}function R(b,x){let P;for(let U=0,W=h.length;U<W;U++){let $=h[U];if($.cacheKey===x){P=$,++P.usedTimes;break}}return P===void 0&&(P=new lb(n,x,b,r),h.push(P)),P}function w(b){if(--b.usedTimes===0){let x=h.indexOf(b);h[x]=h[h.length-1],h.pop(),b.destroy()}}function C(b){c.remove(b)}function L(){c.dispose()}return{getParameters:m,getProgramCacheKey:p,getUniforms:v,acquireProgram:R,releaseProgram:w,releaseShaderCache:C,programs:h,dispose:L}}function hb(){let n=new WeakMap;function e(o){return n.has(o)}function t(o){let a=n.get(o);return a===void 0&&(a={},n.set(o,a)),a}function i(o){n.delete(o)}function s(o,a,c){n.get(o)[a]=c}function r(){n=new WeakMap}return{has:e,get:t,remove:i,update:s,dispose:r}}function db(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.material.id!==e.material.id?n.material.id-e.material.id:n.z!==e.z?n.z-e.z:n.id-e.id}function Sp(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.z!==e.z?e.z-n.z:n.id-e.id}function Mp(){let n=[],e=0,t=[],i=[],s=[];function r(){e=0,t.length=0,i.length=0,s.length=0}function o(u,d,f,g,y,m){let p=n[e];return p===void 0?(p={id:u.id,object:u,geometry:d,material:f,groupOrder:g,renderOrder:u.renderOrder,z:y,group:m},n[e]=p):(p.id=u.id,p.object=u,p.geometry=d,p.material=f,p.groupOrder=g,p.renderOrder=u.renderOrder,p.z=y,p.group=m),e++,p}function a(u,d,f,g,y,m){let p=o(u,d,f,g,y,m);f.transmission>0?i.push(p):f.transparent===!0?s.push(p):t.push(p)}function c(u,d,f,g,y,m){let p=o(u,d,f,g,y,m);f.transmission>0?i.unshift(p):f.transparent===!0?s.unshift(p):t.unshift(p)}function l(u,d){t.length>1&&t.sort(u||db),i.length>1&&i.sort(d||Sp),s.length>1&&s.sort(d||Sp)}function h(){for(let u=e,d=n.length;u<d;u++){let f=n[u];if(f.id===null)break;f.id=null,f.object=null,f.geometry=null,f.material=null,f.group=null}}return{opaque:t,transmissive:i,transparent:s,init:r,push:a,unshift:c,finish:h,sort:l}}function fb(){let n=new WeakMap;function e(i,s){let r=n.get(i),o;return r===void 0?(o=new Mp,n.set(i,[o])):s>=r.length?(o=new Mp,r.push(o)):o=r[s],o}function t(){n=new WeakMap}return{get:e,dispose:t}}function pb(){let n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new D,color:new Ne};break;case"SpotLight":t={position:new D,direction:new D,color:new Ne,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new D,color:new Ne,distance:0,decay:0};break;case"HemisphereLight":t={direction:new D,skyColor:new Ne,groundColor:new Ne};break;case"RectAreaLight":t={color:new Ne,position:new D,halfWidth:new D,halfHeight:new D};break}return n[e.id]=t,t}}}function mb(){let n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new De};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new De};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new De,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[e.id]=t,t}}}var gb=0;function _b(n,e){return(e.castShadow?2:0)-(n.castShadow?2:0)+(e.map?1:0)-(n.map?1:0)}function xb(n){let e=new pb,t=mb(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)i.probe.push(new D);let s=new D,r=new je,o=new je;function a(l){let h=0,u=0,d=0;for(let b=0;b<9;b++)i.probe[b].set(0,0,0);let f=0,g=0,y=0,m=0,p=0,E=0,T=0,v=0,R=0,w=0,C=0;l.sort(_b);for(let b=0,x=l.length;b<x;b++){let P=l[b],U=P.color,W=P.intensity,$=P.distance,J=P.shadow&&P.shadow.map?P.shadow.map.texture:null;if(P.isAmbientLight)h+=U.r*W,u+=U.g*W,d+=U.b*W;else if(P.isLightProbe){for(let G=0;G<9;G++)i.probe[G].addScaledVector(P.sh.coefficients[G],W);C++}else if(P.isDirectionalLight){let G=e.get(P);if(G.color.copy(P.color).multiplyScalar(P.intensity),P.castShadow){let Q=P.shadow,X=t.get(P);X.shadowIntensity=Q.intensity,X.shadowBias=Q.bias,X.shadowNormalBias=Q.normalBias,X.shadowRadius=Q.radius,X.shadowMapSize=Q.mapSize,i.directionalShadow[f]=X,i.directionalShadowMap[f]=J,i.directionalShadowMatrix[f]=P.shadow.matrix,E++}i.directional[f]=G,f++}else if(P.isSpotLight){let G=e.get(P);G.position.setFromMatrixPosition(P.matrixWorld),G.color.copy(U).multiplyScalar(W),G.distance=$,G.coneCos=Math.cos(P.angle),G.penumbraCos=Math.cos(P.angle*(1-P.penumbra)),G.decay=P.decay,i.spot[y]=G;let Q=P.shadow;if(P.map&&(i.spotLightMap[R]=P.map,R++,Q.updateMatrices(P),P.castShadow&&w++),i.spotLightMatrix[y]=Q.matrix,P.castShadow){let X=t.get(P);X.shadowIntensity=Q.intensity,X.shadowBias=Q.bias,X.shadowNormalBias=Q.normalBias,X.shadowRadius=Q.radius,X.shadowMapSize=Q.mapSize,i.spotShadow[y]=X,i.spotShadowMap[y]=J,v++}y++}else if(P.isRectAreaLight){let G=e.get(P);G.color.copy(U).multiplyScalar(W),G.halfWidth.set(P.width*.5,0,0),G.halfHeight.set(0,P.height*.5,0),i.rectArea[m]=G,m++}else if(P.isPointLight){let G=e.get(P);if(G.color.copy(P.color).multiplyScalar(P.intensity),G.distance=P.distance,G.decay=P.decay,P.castShadow){let Q=P.shadow,X=t.get(P);X.shadowIntensity=Q.intensity,X.shadowBias=Q.bias,X.shadowNormalBias=Q.normalBias,X.shadowRadius=Q.radius,X.shadowMapSize=Q.mapSize,X.shadowCameraNear=Q.camera.near,X.shadowCameraFar=Q.camera.far,i.pointShadow[g]=X,i.pointShadowMap[g]=J,i.pointShadowMatrix[g]=P.shadow.matrix,T++}i.point[g]=G,g++}else if(P.isHemisphereLight){let G=e.get(P);G.skyColor.copy(P.color).multiplyScalar(W),G.groundColor.copy(P.groundColor).multiplyScalar(W),i.hemi[p]=G,p++}}m>0&&(n.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=ye.LTC_FLOAT_1,i.rectAreaLTC2=ye.LTC_FLOAT_2):(i.rectAreaLTC1=ye.LTC_HALF_1,i.rectAreaLTC2=ye.LTC_HALF_2)),i.ambient[0]=h,i.ambient[1]=u,i.ambient[2]=d;let L=i.hash;(L.directionalLength!==f||L.pointLength!==g||L.spotLength!==y||L.rectAreaLength!==m||L.hemiLength!==p||L.numDirectionalShadows!==E||L.numPointShadows!==T||L.numSpotShadows!==v||L.numSpotMaps!==R||L.numLightProbes!==C)&&(i.directional.length=f,i.spot.length=y,i.rectArea.length=m,i.point.length=g,i.hemi.length=p,i.directionalShadow.length=E,i.directionalShadowMap.length=E,i.pointShadow.length=T,i.pointShadowMap.length=T,i.spotShadow.length=v,i.spotShadowMap.length=v,i.directionalShadowMatrix.length=E,i.pointShadowMatrix.length=T,i.spotLightMatrix.length=v+R-w,i.spotLightMap.length=R,i.numSpotLightShadowsWithMaps=w,i.numLightProbes=C,L.directionalLength=f,L.pointLength=g,L.spotLength=y,L.rectAreaLength=m,L.hemiLength=p,L.numDirectionalShadows=E,L.numPointShadows=T,L.numSpotShadows=v,L.numSpotMaps=R,L.numLightProbes=C,i.version=gb++)}function c(l,h){let u=0,d=0,f=0,g=0,y=0,m=h.matrixWorldInverse;for(let p=0,E=l.length;p<E;p++){let T=l[p];if(T.isDirectionalLight){let v=i.directional[u];v.direction.setFromMatrixPosition(T.matrixWorld),s.setFromMatrixPosition(T.target.matrixWorld),v.direction.sub(s),v.direction.transformDirection(m),u++}else if(T.isSpotLight){let v=i.spot[f];v.position.setFromMatrixPosition(T.matrixWorld),v.position.applyMatrix4(m),v.direction.setFromMatrixPosition(T.matrixWorld),s.setFromMatrixPosition(T.target.matrixWorld),v.direction.sub(s),v.direction.transformDirection(m),f++}else if(T.isRectAreaLight){let v=i.rectArea[g];v.position.setFromMatrixPosition(T.matrixWorld),v.position.applyMatrix4(m),o.identity(),r.copy(T.matrixWorld),r.premultiply(m),o.extractRotation(r),v.halfWidth.set(T.width*.5,0,0),v.halfHeight.set(0,T.height*.5,0),v.halfWidth.applyMatrix4(o),v.halfHeight.applyMatrix4(o),g++}else if(T.isPointLight){let v=i.point[d];v.position.setFromMatrixPosition(T.matrixWorld),v.position.applyMatrix4(m),d++}else if(T.isHemisphereLight){let v=i.hemi[y];v.direction.setFromMatrixPosition(T.matrixWorld),v.direction.transformDirection(m),y++}}}return{setup:a,setupView:c,state:i}}function Tp(n){let e=new xb(n),t=[],i=[];function s(h){l.camera=h,t.length=0,i.length=0}function r(h){t.push(h)}function o(h){i.push(h)}function a(){e.setup(t)}function c(h){e.setupView(t,h)}let l={lightsArray:t,shadowsArray:i,camera:null,lights:e,transmissionRenderTarget:{}};return{init:s,state:l,setupLights:a,setupLightsView:c,pushLight:r,pushShadow:o}}function yb(n){let e=new WeakMap;function t(s,r=0){let o=e.get(s),a;return o===void 0?(a=new Tp(n),e.set(s,[a])):r>=o.length?(a=new Tp(n),o.push(a)):a=o[r],a}function i(){e=new WeakMap}return{get:t,dispose:i}}var vb=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,bb=`uniform sampler2D shadow_pass;
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
}`;function Sb(n,e,t){let i=new tr,s=new De,r=new De,o=new ut,a=new Da({depthPacking:zf}),c=new Na,l={},h=t.maxTextureSize,u={[Fn]:zt,[zt]:Fn,[tn]:tn},d=new Un({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new De},radius:{value:4}},vertexShader:vb,fragmentShader:bb}),f=d.clone();f.defines.HORIZONTAL_PASS=1;let g=new Ct;g.setAttribute("position",new Dt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let y=new ht(g,d),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Qc;let p=this.type;this.render=function(w,C,L){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||w.length===0)return;let b=n.getRenderTarget(),x=n.getActiveCubeFace(),P=n.getActiveMipmapLevel(),U=n.state;U.setBlending(bi),U.buffers.depth.getReversed()===!0?U.buffers.color.setClear(0,0,0,0):U.buffers.color.setClear(1,1,1,1),U.buffers.depth.setTest(!0),U.setScissorTest(!1);let W=p!==ei&&this.type===ei,$=p===ei&&this.type!==ei;for(let J=0,G=w.length;J<G;J++){let Q=w[J],X=Q.shadow;if(X===void 0){console.warn("THREE.WebGLShadowMap:",Q,"has no shadow.");continue}if(X.autoUpdate===!1&&X.needsUpdate===!1)continue;s.copy(X.mapSize);let te=X.getFrameExtents();if(s.multiply(te),r.copy(X.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(r.x=Math.floor(h/te.x),s.x=r.x*te.x,X.mapSize.x=r.x),s.y>h&&(r.y=Math.floor(h/te.y),s.y=r.y*te.y,X.mapSize.y=r.y)),X.map===null||W===!0||$===!0){let Ee=this.type!==ei?{minFilter:qt,magFilter:qt}:{};X.map!==null&&X.map.dispose(),X.map=new qn(s.x,s.y,Ee),X.map.texture.name=Q.name+".shadowMap",X.camera.updateProjectionMatrix()}n.setRenderTarget(X.map),n.clear();let ue=X.getViewportCount();for(let Ee=0;Ee<ue;Ee++){let Ve=X.getViewport(Ee);o.set(r.x*Ve.x,r.y*Ve.y,r.x*Ve.z,r.y*Ve.w),U.viewport(o),X.updateMatrices(Q,Ee),i=X.getFrustum(),v(C,L,X.camera,Q,this.type)}X.isPointLightShadow!==!0&&this.type===ei&&E(X,L),X.needsUpdate=!1}p=this.type,m.needsUpdate=!1,n.setRenderTarget(b,x,P)};function E(w,C){let L=e.update(y);d.defines.VSM_SAMPLES!==w.blurSamples&&(d.defines.VSM_SAMPLES=w.blurSamples,f.defines.VSM_SAMPLES=w.blurSamples,d.needsUpdate=!0,f.needsUpdate=!0),w.mapPass===null&&(w.mapPass=new qn(s.x,s.y)),d.uniforms.shadow_pass.value=w.map.texture,d.uniforms.resolution.value=w.mapSize,d.uniforms.radius.value=w.radius,n.setRenderTarget(w.mapPass),n.clear(),n.renderBufferDirect(C,null,L,d,y,null),f.uniforms.shadow_pass.value=w.mapPass.texture,f.uniforms.resolution.value=w.mapSize,f.uniforms.radius.value=w.radius,n.setRenderTarget(w.map),n.clear(),n.renderBufferDirect(C,null,L,f,y,null)}function T(w,C,L,b){let x=null,P=L.isPointLight===!0?w.customDistanceMaterial:w.customDepthMaterial;if(P!==void 0)x=P;else if(x=L.isPointLight===!0?c:a,n.localClippingEnabled&&C.clipShadows===!0&&Array.isArray(C.clippingPlanes)&&C.clippingPlanes.length!==0||C.displacementMap&&C.displacementScale!==0||C.alphaMap&&C.alphaTest>0||C.map&&C.alphaTest>0||C.alphaToCoverage===!0){let U=x.uuid,W=C.uuid,$=l[U];$===void 0&&($={},l[U]=$);let J=$[W];J===void 0&&(J=x.clone(),$[W]=J,C.addEventListener("dispose",R)),x=J}if(x.visible=C.visible,x.wireframe=C.wireframe,b===ei?x.side=C.shadowSide!==null?C.shadowSide:C.side:x.side=C.shadowSide!==null?C.shadowSide:u[C.side],x.alphaMap=C.alphaMap,x.alphaTest=C.alphaToCoverage===!0?.5:C.alphaTest,x.map=C.map,x.clipShadows=C.clipShadows,x.clippingPlanes=C.clippingPlanes,x.clipIntersection=C.clipIntersection,x.displacementMap=C.displacementMap,x.displacementScale=C.displacementScale,x.displacementBias=C.displacementBias,x.wireframeLinewidth=C.wireframeLinewidth,x.linewidth=C.linewidth,L.isPointLight===!0&&x.isMeshDistanceMaterial===!0){let U=n.properties.get(x);U.light=L}return x}function v(w,C,L,b,x){if(w.visible===!1)return;if(w.layers.test(C.layers)&&(w.isMesh||w.isLine||w.isPoints)&&(w.castShadow||w.receiveShadow&&x===ei)&&(!w.frustumCulled||i.intersectsObject(w))){w.modelViewMatrix.multiplyMatrices(L.matrixWorldInverse,w.matrixWorld);let W=e.update(w),$=w.material;if(Array.isArray($)){let J=W.groups;for(let G=0,Q=J.length;G<Q;G++){let X=J[G],te=$[X.materialIndex];if(te&&te.visible){let ue=T(w,te,b,x);w.onBeforeShadow(n,w,C,L,W,ue,X),n.renderBufferDirect(L,null,W,ue,w,X),w.onAfterShadow(n,w,C,L,W,ue,X)}}}else if($.visible){let J=T(w,$,b,x);w.onBeforeShadow(n,w,C,L,W,J,null),n.renderBufferDirect(L,null,W,J,w,null),w.onAfterShadow(n,w,C,L,W,J,null)}}let U=w.children;for(let W=0,$=U.length;W<$;W++)v(U[W],C,L,b,x)}function R(w){w.target.removeEventListener("dispose",R);for(let L in l){let b=l[L],x=w.target.uuid;x in b&&(b[x].dispose(),delete b[x])}}}var Mb={[Va]:Ga,[Wa]:Ya,[$a]:qa,[Ji]:Xa,[Ga]:Va,[Ya]:Wa,[qa]:$a,[Xa]:Ji};function Tb(n,e){function t(){let O=!1,le=new ut,he=null,Me=new ut(0,0,0,0);return{setMask:function(re){he!==re&&!O&&(n.colorMask(re,re,re,re),he=re)},setLocked:function(re){O=re},setClear:function(re,ee,Te,We,dt){dt===!0&&(re*=We,ee*=We,Te*=We),le.set(re,ee,Te,We),Me.equals(le)===!1&&(n.clearColor(re,ee,Te,We),Me.copy(le))},reset:function(){O=!1,he=null,Me.set(-1,0,0,0)}}}function i(){let O=!1,le=!1,he=null,Me=null,re=null;return{setReversed:function(ee){if(le!==ee){let Te=e.get("EXT_clip_control");ee?Te.clipControlEXT(Te.LOWER_LEFT_EXT,Te.ZERO_TO_ONE_EXT):Te.clipControlEXT(Te.LOWER_LEFT_EXT,Te.NEGATIVE_ONE_TO_ONE_EXT),le=ee;let We=re;re=null,this.setClear(We)}},getReversed:function(){return le},setTest:function(ee){ee?Z(n.DEPTH_TEST):xe(n.DEPTH_TEST)},setMask:function(ee){he!==ee&&!O&&(n.depthMask(ee),he=ee)},setFunc:function(ee){if(le&&(ee=Mb[ee]),Me!==ee){switch(ee){case Va:n.depthFunc(n.NEVER);break;case Ga:n.depthFunc(n.ALWAYS);break;case Wa:n.depthFunc(n.LESS);break;case Ji:n.depthFunc(n.LEQUAL);break;case $a:n.depthFunc(n.EQUAL);break;case Xa:n.depthFunc(n.GEQUAL);break;case Ya:n.depthFunc(n.GREATER);break;case qa:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}Me=ee}},setLocked:function(ee){O=ee},setClear:function(ee){re!==ee&&(le&&(ee=1-ee),n.clearDepth(ee),re=ee)},reset:function(){O=!1,he=null,Me=null,re=null,le=!1}}}function s(){let O=!1,le=null,he=null,Me=null,re=null,ee=null,Te=null,We=null,dt=null;return{setTest:function(Ze){O||(Ze?Z(n.STENCIL_TEST):xe(n.STENCIL_TEST))},setMask:function(Ze){le!==Ze&&!O&&(n.stencilMask(Ze),le=Ze)},setFunc:function(Ze,Nt,Wt){(he!==Ze||Me!==Nt||re!==Wt)&&(n.stencilFunc(Ze,Nt,Wt),he=Ze,Me=Nt,re=Wt)},setOp:function(Ze,Nt,Wt){(ee!==Ze||Te!==Nt||We!==Wt)&&(n.stencilOp(Ze,Nt,Wt),ee=Ze,Te=Nt,We=Wt)},setLocked:function(Ze){O=Ze},setClear:function(Ze){dt!==Ze&&(n.clearStencil(Ze),dt=Ze)},reset:function(){O=!1,le=null,he=null,Me=null,re=null,ee=null,Te=null,We=null,dt=null}}}let r=new t,o=new i,a=new s,c=new WeakMap,l=new WeakMap,h={},u={},d=new WeakMap,f=[],g=null,y=!1,m=null,p=null,E=null,T=null,v=null,R=null,w=null,C=new Ne(0,0,0),L=0,b=!1,x=null,P=null,U=null,W=null,$=null,J=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS),G=!1,Q=0,X=n.getParameter(n.VERSION);X.indexOf("WebGL")!==-1?(Q=parseFloat(/^WebGL (\d)/.exec(X)[1]),G=Q>=1):X.indexOf("OpenGL ES")!==-1&&(Q=parseFloat(/^OpenGL ES (\d)/.exec(X)[1]),G=Q>=2);let te=null,ue={},Ee=n.getParameter(n.SCISSOR_BOX),Ve=n.getParameter(n.VIEWPORT),qe=new ut().fromArray(Ee),lt=new ut().fromArray(Ve);function Xe(O,le,he,Me){let re=new Uint8Array(4),ee=n.createTexture();n.bindTexture(O,ee),n.texParameteri(O,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(O,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let Te=0;Te<he;Te++)O===n.TEXTURE_3D||O===n.TEXTURE_2D_ARRAY?n.texImage3D(le,0,n.RGBA,1,1,Me,0,n.RGBA,n.UNSIGNED_BYTE,re):n.texImage2D(le+Te,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,re);return ee}let K={};K[n.TEXTURE_2D]=Xe(n.TEXTURE_2D,n.TEXTURE_2D,1),K[n.TEXTURE_CUBE_MAP]=Xe(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),K[n.TEXTURE_2D_ARRAY]=Xe(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),K[n.TEXTURE_3D]=Xe(n.TEXTURE_3D,n.TEXTURE_3D,1,1),r.setClear(0,0,0,1),o.setClear(1),a.setClear(0),Z(n.DEPTH_TEST),o.setFunc(Ji),me(!1),fe(Zc),Z(n.CULL_FACE),it(bi);function Z(O){h[O]!==!0&&(n.enable(O),h[O]=!0)}function xe(O){h[O]!==!1&&(n.disable(O),h[O]=!1)}function Le(O,le){return u[O]!==le?(n.bindFramebuffer(O,le),u[O]=le,O===n.DRAW_FRAMEBUFFER&&(u[n.FRAMEBUFFER]=le),O===n.FRAMEBUFFER&&(u[n.DRAW_FRAMEBUFFER]=le),!0):!1}function we(O,le){let he=f,Me=!1;if(O){he=d.get(le),he===void 0&&(he=[],d.set(le,he));let re=O.textures;if(he.length!==re.length||he[0]!==n.COLOR_ATTACHMENT0){for(let ee=0,Te=re.length;ee<Te;ee++)he[ee]=n.COLOR_ATTACHMENT0+ee;he.length=re.length,Me=!0}}else he[0]!==n.BACK&&(he[0]=n.BACK,Me=!0);Me&&n.drawBuffers(he)}function Ge(O){return g!==O?(n.useProgram(O),g=O,!0):!1}let At={[Li]:n.FUNC_ADD,[df]:n.FUNC_SUBTRACT,[ff]:n.FUNC_REVERSE_SUBTRACT};At[pf]=n.MIN,At[mf]=n.MAX;let I={[gf]:n.ZERO,[_f]:n.ONE,[xf]:n.SRC_COLOR,[ba]:n.SRC_ALPHA,[Tf]:n.SRC_ALPHA_SATURATE,[Sf]:n.DST_COLOR,[vf]:n.DST_ALPHA,[yf]:n.ONE_MINUS_SRC_COLOR,[Sa]:n.ONE_MINUS_SRC_ALPHA,[Mf]:n.ONE_MINUS_DST_COLOR,[bf]:n.ONE_MINUS_DST_ALPHA,[Ef]:n.CONSTANT_COLOR,[wf]:n.ONE_MINUS_CONSTANT_COLOR,[Af]:n.CONSTANT_ALPHA,[Rf]:n.ONE_MINUS_CONSTANT_ALPHA};function it(O,le,he,Me,re,ee,Te,We,dt,Ze){if(O===bi){y===!0&&(xe(n.BLEND),y=!1);return}if(y===!1&&(Z(n.BLEND),y=!0),O!==hf){if(O!==m||Ze!==b){if((p!==Li||v!==Li)&&(n.blendEquation(n.FUNC_ADD),p=Li,v=Li),Ze)switch(O){case ji:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case eu:n.blendFunc(n.ONE,n.ONE);break;case tu:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case nu:n.blendFuncSeparate(n.DST_COLOR,n.ONE_MINUS_SRC_ALPHA,n.ZERO,n.ONE);break;default:console.error("THREE.WebGLState: Invalid blending: ",O);break}else switch(O){case ji:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case eu:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE,n.ONE,n.ONE);break;case tu:console.error("THREE.WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case nu:console.error("THREE.WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:console.error("THREE.WebGLState: Invalid blending: ",O);break}E=null,T=null,R=null,w=null,C.set(0,0,0),L=0,m=O,b=Ze}return}re=re||le,ee=ee||he,Te=Te||Me,(le!==p||re!==v)&&(n.blendEquationSeparate(At[le],At[re]),p=le,v=re),(he!==E||Me!==T||ee!==R||Te!==w)&&(n.blendFuncSeparate(I[he],I[Me],I[ee],I[Te]),E=he,T=Me,R=ee,w=Te),(We.equals(C)===!1||dt!==L)&&(n.blendColor(We.r,We.g,We.b,dt),C.copy(We),L=dt),m=O,b=!1}function Fe(O,le){O.side===tn?xe(n.CULL_FACE):Z(n.CULL_FACE);let he=O.side===zt;le&&(he=!he),me(he),O.blending===ji&&O.transparent===!1?it(bi):it(O.blending,O.blendEquation,O.blendSrc,O.blendDst,O.blendEquationAlpha,O.blendSrcAlpha,O.blendDstAlpha,O.blendColor,O.blendAlpha,O.premultipliedAlpha),o.setFunc(O.depthFunc),o.setTest(O.depthTest),o.setMask(O.depthWrite),r.setMask(O.colorWrite);let Me=O.stencilWrite;a.setTest(Me),Me&&(a.setMask(O.stencilWriteMask),a.setFunc(O.stencilFunc,O.stencilRef,O.stencilFuncMask),a.setOp(O.stencilFail,O.stencilZFail,O.stencilZPass)),de(O.polygonOffset,O.polygonOffsetFactor,O.polygonOffsetUnits),O.alphaToCoverage===!0?Z(n.SAMPLE_ALPHA_TO_COVERAGE):xe(n.SAMPLE_ALPHA_TO_COVERAGE)}function me(O){x!==O&&(O?n.frontFace(n.CW):n.frontFace(n.CCW),x=O)}function fe(O){O!==lf?(Z(n.CULL_FACE),O!==P&&(O===Zc?n.cullFace(n.BACK):O===cf?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):xe(n.CULL_FACE),P=O}function tt(O){O!==U&&(G&&n.lineWidth(O),U=O)}function de(O,le,he){O?(Z(n.POLYGON_OFFSET_FILL),(W!==le||$!==he)&&(n.polygonOffset(le,he),W=le,$=he)):xe(n.POLYGON_OFFSET_FILL)}function Ce(O){O?Z(n.SCISSOR_TEST):xe(n.SCISSOR_TEST)}function pt(O){O===void 0&&(O=n.TEXTURE0+J-1),te!==O&&(n.activeTexture(O),te=O)}function j(O,le,he){he===void 0&&(te===null?he=n.TEXTURE0+J-1:he=te);let Me=ue[he];Me===void 0&&(Me={type:void 0,texture:void 0},ue[he]=Me),(Me.type!==O||Me.texture!==le)&&(te!==he&&(n.activeTexture(he),te=he),n.bindTexture(O,le||K[O]),Me.type=O,Me.texture=le)}function S(){let O=ue[te];O!==void 0&&O.type!==void 0&&(n.bindTexture(O.type,null),O.type=void 0,O.texture=void 0)}function _(){try{n.compressedTexImage2D(...arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function F(){try{n.compressedTexImage3D(...arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function A(){try{n.texSubImage2D(...arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function B(){try{n.texSubImage3D(...arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function z(){try{n.compressedTexSubImage2D(...arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function ce(){try{n.compressedTexSubImage3D(...arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function ne(){try{n.texStorage2D(...arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function be(){try{n.texStorage3D(...arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function Pe(){try{n.texImage2D(...arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function ae(){try{n.texImage3D(...arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function pe(O){qe.equals(O)===!1&&(n.scissor(O.x,O.y,O.z,O.w),qe.copy(O))}function ke(O){lt.equals(O)===!1&&(n.viewport(O.x,O.y,O.z,O.w),lt.copy(O))}function Ae(O,le){let he=l.get(le);he===void 0&&(he=new WeakMap,l.set(le,he));let Me=he.get(O);Me===void 0&&(Me=n.getUniformBlockIndex(le,O.name),he.set(O,Me))}function ge(O,le){let Me=l.get(le).get(O);c.get(le)!==Me&&(n.uniformBlockBinding(le,Me,O.__bindingPointIndex),c.set(le,Me))}function $e(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),o.setReversed(!1),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),h={},te=null,ue={},u={},d=new WeakMap,f=[],g=null,y=!1,m=null,p=null,E=null,T=null,v=null,R=null,w=null,C=new Ne(0,0,0),L=0,b=!1,x=null,P=null,U=null,W=null,$=null,qe.set(0,0,n.canvas.width,n.canvas.height),lt.set(0,0,n.canvas.width,n.canvas.height),r.reset(),o.reset(),a.reset()}return{buffers:{color:r,depth:o,stencil:a},enable:Z,disable:xe,bindFramebuffer:Le,drawBuffers:we,useProgram:Ge,setBlending:it,setMaterial:Fe,setFlipSided:me,setCullFace:fe,setLineWidth:tt,setPolygonOffset:de,setScissorTest:Ce,activeTexture:pt,bindTexture:j,unbindTexture:S,compressedTexImage2D:_,compressedTexImage3D:F,texImage2D:Pe,texImage3D:ae,updateUBOMapping:Ae,uniformBlockBinding:ge,texStorage2D:ne,texStorage3D:be,texSubImage2D:A,texSubImage3D:B,compressedTexSubImage2D:z,compressedTexSubImage3D:ce,scissor:pe,viewport:ke,reset:$e}}function Eb(n,e,t,i,s,r,o){let a=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),l=new De,h=new WeakMap,u,d=new WeakMap,f=!1;try{f=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(S,_){return f?new OffscreenCanvas(S,_):js("canvas")}function y(S,_,F){let A=1,B=j(S);if((B.width>F||B.height>F)&&(A=F/Math.max(B.width,B.height)),A<1)if(typeof HTMLImageElement<"u"&&S instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&S instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&S instanceof ImageBitmap||typeof VideoFrame<"u"&&S instanceof VideoFrame){let z=Math.floor(A*B.width),ce=Math.floor(A*B.height);u===void 0&&(u=g(z,ce));let ne=_?g(z,ce):u;return ne.width=z,ne.height=ce,ne.getContext("2d").drawImage(S,0,0,z,ce),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+B.width+"x"+B.height+") to ("+z+"x"+ce+")."),ne}else return"data"in S&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+B.width+"x"+B.height+")."),S;return S}function m(S){return S.generateMipmaps}function p(S){n.generateMipmap(S)}function E(S){return S.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:S.isWebGL3DRenderTarget?n.TEXTURE_3D:S.isWebGLArrayRenderTarget||S.isCompressedArrayTexture?n.TEXTURE_2D_ARRAY:n.TEXTURE_2D}function T(S,_,F,A,B=!1){if(S!==null){if(n[S]!==void 0)return n[S];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+S+"'")}let z=_;if(_===n.RED&&(F===n.FLOAT&&(z=n.R32F),F===n.HALF_FLOAT&&(z=n.R16F),F===n.UNSIGNED_BYTE&&(z=n.R8)),_===n.RED_INTEGER&&(F===n.UNSIGNED_BYTE&&(z=n.R8UI),F===n.UNSIGNED_SHORT&&(z=n.R16UI),F===n.UNSIGNED_INT&&(z=n.R32UI),F===n.BYTE&&(z=n.R8I),F===n.SHORT&&(z=n.R16I),F===n.INT&&(z=n.R32I)),_===n.RG&&(F===n.FLOAT&&(z=n.RG32F),F===n.HALF_FLOAT&&(z=n.RG16F),F===n.UNSIGNED_BYTE&&(z=n.RG8)),_===n.RG_INTEGER&&(F===n.UNSIGNED_BYTE&&(z=n.RG8UI),F===n.UNSIGNED_SHORT&&(z=n.RG16UI),F===n.UNSIGNED_INT&&(z=n.RG32UI),F===n.BYTE&&(z=n.RG8I),F===n.SHORT&&(z=n.RG16I),F===n.INT&&(z=n.RG32I)),_===n.RGB_INTEGER&&(F===n.UNSIGNED_BYTE&&(z=n.RGB8UI),F===n.UNSIGNED_SHORT&&(z=n.RGB16UI),F===n.UNSIGNED_INT&&(z=n.RGB32UI),F===n.BYTE&&(z=n.RGB8I),F===n.SHORT&&(z=n.RGB16I),F===n.INT&&(z=n.RGB32I)),_===n.RGBA_INTEGER&&(F===n.UNSIGNED_BYTE&&(z=n.RGBA8UI),F===n.UNSIGNED_SHORT&&(z=n.RGBA16UI),F===n.UNSIGNED_INT&&(z=n.RGBA32UI),F===n.BYTE&&(z=n.RGBA8I),F===n.SHORT&&(z=n.RGBA16I),F===n.INT&&(z=n.RGBA32I)),_===n.RGB&&(F===n.UNSIGNED_INT_5_9_9_9_REV&&(z=n.RGB9_E5),F===n.UNSIGNED_INT_10F_11F_11F_REV&&(z=n.R11F_G11F_B10F)),_===n.RGBA){let ce=B?zr:at.getTransfer(A);F===n.FLOAT&&(z=n.RGBA32F),F===n.HALF_FLOAT&&(z=n.RGBA16F),F===n.UNSIGNED_BYTE&&(z=ce===xt?n.SRGB8_ALPHA8:n.RGBA8),F===n.UNSIGNED_SHORT_4_4_4_4&&(z=n.RGBA4),F===n.UNSIGNED_SHORT_5_5_5_1&&(z=n.RGB5_A1)}return(z===n.R16F||z===n.R32F||z===n.RG16F||z===n.RG32F||z===n.RGBA16F||z===n.RGBA32F)&&e.get("EXT_color_buffer_float"),z}function v(S,_){let F;return S?_===null||_===ki||_===lr?F=n.DEPTH24_STENCIL8:_===wn?F=n.DEPTH32F_STENCIL8:_===or&&(F=n.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):_===null||_===ki||_===lr?F=n.DEPTH_COMPONENT24:_===wn?F=n.DEPTH_COMPONENT32F:_===or&&(F=n.DEPTH_COMPONENT16),F}function R(S,_){return m(S)===!0||S.isFramebufferTexture&&S.minFilter!==qt&&S.minFilter!==an?Math.log2(Math.max(_.width,_.height))+1:S.mipmaps!==void 0&&S.mipmaps.length>0?S.mipmaps.length:S.isCompressedTexture&&Array.isArray(S.image)?_.mipmaps.length:1}function w(S){let _=S.target;_.removeEventListener("dispose",w),L(_),_.isVideoTexture&&h.delete(_)}function C(S){let _=S.target;_.removeEventListener("dispose",C),x(_)}function L(S){let _=i.get(S);if(_.__webglInit===void 0)return;let F=S.source,A=d.get(F);if(A){let B=A[_.__cacheKey];B.usedTimes--,B.usedTimes===0&&b(S),Object.keys(A).length===0&&d.delete(F)}i.remove(S)}function b(S){let _=i.get(S);n.deleteTexture(_.__webglTexture);let F=S.source,A=d.get(F);delete A[_.__cacheKey],o.memory.textures--}function x(S){let _=i.get(S);if(S.depthTexture&&(S.depthTexture.dispose(),i.remove(S.depthTexture)),S.isWebGLCubeRenderTarget)for(let A=0;A<6;A++){if(Array.isArray(_.__webglFramebuffer[A]))for(let B=0;B<_.__webglFramebuffer[A].length;B++)n.deleteFramebuffer(_.__webglFramebuffer[A][B]);else n.deleteFramebuffer(_.__webglFramebuffer[A]);_.__webglDepthbuffer&&n.deleteRenderbuffer(_.__webglDepthbuffer[A])}else{if(Array.isArray(_.__webglFramebuffer))for(let A=0;A<_.__webglFramebuffer.length;A++)n.deleteFramebuffer(_.__webglFramebuffer[A]);else n.deleteFramebuffer(_.__webglFramebuffer);if(_.__webglDepthbuffer&&n.deleteRenderbuffer(_.__webglDepthbuffer),_.__webglMultisampledFramebuffer&&n.deleteFramebuffer(_.__webglMultisampledFramebuffer),_.__webglColorRenderbuffer)for(let A=0;A<_.__webglColorRenderbuffer.length;A++)_.__webglColorRenderbuffer[A]&&n.deleteRenderbuffer(_.__webglColorRenderbuffer[A]);_.__webglDepthRenderbuffer&&n.deleteRenderbuffer(_.__webglDepthRenderbuffer)}let F=S.textures;for(let A=0,B=F.length;A<B;A++){let z=i.get(F[A]);z.__webglTexture&&(n.deleteTexture(z.__webglTexture),o.memory.textures--),i.remove(F[A])}i.remove(S)}let P=0;function U(){P=0}function W(){let S=P;return S>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+S+" texture units while this GPU supports only "+s.maxTextures),P+=1,S}function $(S){let _=[];return _.push(S.wrapS),_.push(S.wrapT),_.push(S.wrapR||0),_.push(S.magFilter),_.push(S.minFilter),_.push(S.anisotropy),_.push(S.internalFormat),_.push(S.format),_.push(S.type),_.push(S.generateMipmaps),_.push(S.premultiplyAlpha),_.push(S.flipY),_.push(S.unpackAlignment),_.push(S.colorSpace),_.join()}function J(S,_){let F=i.get(S);if(S.isVideoTexture&&Ce(S),S.isRenderTargetTexture===!1&&S.isExternalTexture!==!0&&S.version>0&&F.__version!==S.version){let A=S.image;if(A===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(A.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{K(F,S,_);return}}else S.isExternalTexture&&(F.__webglTexture=S.sourceTexture?S.sourceTexture:null);t.bindTexture(n.TEXTURE_2D,F.__webglTexture,n.TEXTURE0+_)}function G(S,_){let F=i.get(S);if(S.isRenderTargetTexture===!1&&S.version>0&&F.__version!==S.version){K(F,S,_);return}t.bindTexture(n.TEXTURE_2D_ARRAY,F.__webglTexture,n.TEXTURE0+_)}function Q(S,_){let F=i.get(S);if(S.isRenderTargetTexture===!1&&S.version>0&&F.__version!==S.version){K(F,S,_);return}t.bindTexture(n.TEXTURE_3D,F.__webglTexture,n.TEXTURE0+_)}function X(S,_){let F=i.get(S);if(S.version>0&&F.__version!==S.version){Z(F,S,_);return}t.bindTexture(n.TEXTURE_CUBE_MAP,F.__webglTexture,n.TEXTURE0+_)}let te={[Di]:n.REPEAT,[$n]:n.CLAMP_TO_EDGE,[Ys]:n.MIRRORED_REPEAT},ue={[qt]:n.NEAREST,[Qa]:n.NEAREST_MIPMAP_NEAREST,[hs]:n.NEAREST_MIPMAP_LINEAR,[an]:n.LINEAR,[rr]:n.LINEAR_MIPMAP_NEAREST,[kn]:n.LINEAR_MIPMAP_LINEAR},Ee={[Vf]:n.NEVER,[qf]:n.ALWAYS,[Gf]:n.LESS,[du]:n.LEQUAL,[Wf]:n.EQUAL,[Yf]:n.GEQUAL,[$f]:n.GREATER,[Xf]:n.NOTEQUAL};function Ve(S,_){if(_.type===wn&&e.has("OES_texture_float_linear")===!1&&(_.magFilter===an||_.magFilter===rr||_.magFilter===hs||_.magFilter===kn||_.minFilter===an||_.minFilter===rr||_.minFilter===hs||_.minFilter===kn)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),n.texParameteri(S,n.TEXTURE_WRAP_S,te[_.wrapS]),n.texParameteri(S,n.TEXTURE_WRAP_T,te[_.wrapT]),(S===n.TEXTURE_3D||S===n.TEXTURE_2D_ARRAY)&&n.texParameteri(S,n.TEXTURE_WRAP_R,te[_.wrapR]),n.texParameteri(S,n.TEXTURE_MAG_FILTER,ue[_.magFilter]),n.texParameteri(S,n.TEXTURE_MIN_FILTER,ue[_.minFilter]),_.compareFunction&&(n.texParameteri(S,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(S,n.TEXTURE_COMPARE_FUNC,Ee[_.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(_.magFilter===qt||_.minFilter!==hs&&_.minFilter!==kn||_.type===wn&&e.has("OES_texture_float_linear")===!1)return;if(_.anisotropy>1||i.get(_).__currentAnisotropy){let F=e.get("EXT_texture_filter_anisotropic");n.texParameterf(S,F.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(_.anisotropy,s.getMaxAnisotropy())),i.get(_).__currentAnisotropy=_.anisotropy}}}function qe(S,_){let F=!1;S.__webglInit===void 0&&(S.__webglInit=!0,_.addEventListener("dispose",w));let A=_.source,B=d.get(A);B===void 0&&(B={},d.set(A,B));let z=$(_);if(z!==S.__cacheKey){B[z]===void 0&&(B[z]={texture:n.createTexture(),usedTimes:0},o.memory.textures++,F=!0),B[z].usedTimes++;let ce=B[S.__cacheKey];ce!==void 0&&(B[S.__cacheKey].usedTimes--,ce.usedTimes===0&&b(_)),S.__cacheKey=z,S.__webglTexture=B[z].texture}return F}function lt(S,_,F){return Math.floor(Math.floor(S/F)/_)}function Xe(S,_,F,A){let z=S.updateRanges;if(z.length===0)t.texSubImage2D(n.TEXTURE_2D,0,0,0,_.width,_.height,F,A,_.data);else{z.sort((ae,pe)=>ae.start-pe.start);let ce=0;for(let ae=1;ae<z.length;ae++){let pe=z[ce],ke=z[ae],Ae=pe.start+pe.count,ge=lt(ke.start,_.width,4),$e=lt(pe.start,_.width,4);ke.start<=Ae+1&&ge===$e&&lt(ke.start+ke.count-1,_.width,4)===ge?pe.count=Math.max(pe.count,ke.start+ke.count-pe.start):(++ce,z[ce]=ke)}z.length=ce+1;let ne=n.getParameter(n.UNPACK_ROW_LENGTH),be=n.getParameter(n.UNPACK_SKIP_PIXELS),Pe=n.getParameter(n.UNPACK_SKIP_ROWS);n.pixelStorei(n.UNPACK_ROW_LENGTH,_.width);for(let ae=0,pe=z.length;ae<pe;ae++){let ke=z[ae],Ae=Math.floor(ke.start/4),ge=Math.ceil(ke.count/4),$e=Ae%_.width,O=Math.floor(Ae/_.width),le=ge,he=1;n.pixelStorei(n.UNPACK_SKIP_PIXELS,$e),n.pixelStorei(n.UNPACK_SKIP_ROWS,O),t.texSubImage2D(n.TEXTURE_2D,0,$e,O,le,he,F,A,_.data)}S.clearUpdateRanges(),n.pixelStorei(n.UNPACK_ROW_LENGTH,ne),n.pixelStorei(n.UNPACK_SKIP_PIXELS,be),n.pixelStorei(n.UNPACK_SKIP_ROWS,Pe)}}function K(S,_,F){let A=n.TEXTURE_2D;(_.isDataArrayTexture||_.isCompressedArrayTexture)&&(A=n.TEXTURE_2D_ARRAY),_.isData3DTexture&&(A=n.TEXTURE_3D);let B=qe(S,_),z=_.source;t.bindTexture(A,S.__webglTexture,n.TEXTURE0+F);let ce=i.get(z);if(z.version!==ce.__version||B===!0){t.activeTexture(n.TEXTURE0+F);let ne=at.getPrimaries(at.workingColorSpace),be=_.colorSpace===Mi?null:at.getPrimaries(_.colorSpace),Pe=_.colorSpace===Mi||ne===be?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,_.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,_.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,Pe);let ae=y(_.image,!1,s.maxTextureSize);ae=pt(_,ae);let pe=r.convert(_.format,_.colorSpace),ke=r.convert(_.type),Ae=T(_.internalFormat,pe,ke,_.colorSpace,_.isVideoTexture);Ve(A,_);let ge,$e=_.mipmaps,O=_.isVideoTexture!==!0,le=ce.__version===void 0||B===!0,he=z.dataReady,Me=R(_,ae);if(_.isDepthTexture)Ae=v(_.format===cr,_.type),le&&(O?t.texStorage2D(n.TEXTURE_2D,1,Ae,ae.width,ae.height):t.texImage2D(n.TEXTURE_2D,0,Ae,ae.width,ae.height,0,pe,ke,null));else if(_.isDataTexture)if($e.length>0){O&&le&&t.texStorage2D(n.TEXTURE_2D,Me,Ae,$e[0].width,$e[0].height);for(let re=0,ee=$e.length;re<ee;re++)ge=$e[re],O?he&&t.texSubImage2D(n.TEXTURE_2D,re,0,0,ge.width,ge.height,pe,ke,ge.data):t.texImage2D(n.TEXTURE_2D,re,Ae,ge.width,ge.height,0,pe,ke,ge.data);_.generateMipmaps=!1}else O?(le&&t.texStorage2D(n.TEXTURE_2D,Me,Ae,ae.width,ae.height),he&&Xe(_,ae,pe,ke)):t.texImage2D(n.TEXTURE_2D,0,Ae,ae.width,ae.height,0,pe,ke,ae.data);else if(_.isCompressedTexture)if(_.isCompressedArrayTexture){O&&le&&t.texStorage3D(n.TEXTURE_2D_ARRAY,Me,Ae,$e[0].width,$e[0].height,ae.depth);for(let re=0,ee=$e.length;re<ee;re++)if(ge=$e[re],_.format!==xn)if(pe!==null)if(O){if(he)if(_.layerUpdates.size>0){let Te=yu(ge.width,ge.height,_.format,_.type);for(let We of _.layerUpdates){let dt=ge.data.subarray(We*Te/ge.data.BYTES_PER_ELEMENT,(We+1)*Te/ge.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,re,0,0,We,ge.width,ge.height,1,pe,dt)}_.clearLayerUpdates()}else t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,re,0,0,0,ge.width,ge.height,ae.depth,pe,ge.data)}else t.compressedTexImage3D(n.TEXTURE_2D_ARRAY,re,Ae,ge.width,ge.height,ae.depth,0,ge.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else O?he&&t.texSubImage3D(n.TEXTURE_2D_ARRAY,re,0,0,0,ge.width,ge.height,ae.depth,pe,ke,ge.data):t.texImage3D(n.TEXTURE_2D_ARRAY,re,Ae,ge.width,ge.height,ae.depth,0,pe,ke,ge.data)}else{O&&le&&t.texStorage2D(n.TEXTURE_2D,Me,Ae,$e[0].width,$e[0].height);for(let re=0,ee=$e.length;re<ee;re++)ge=$e[re],_.format!==xn?pe!==null?O?he&&t.compressedTexSubImage2D(n.TEXTURE_2D,re,0,0,ge.width,ge.height,pe,ge.data):t.compressedTexImage2D(n.TEXTURE_2D,re,Ae,ge.width,ge.height,0,ge.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):O?he&&t.texSubImage2D(n.TEXTURE_2D,re,0,0,ge.width,ge.height,pe,ke,ge.data):t.texImage2D(n.TEXTURE_2D,re,Ae,ge.width,ge.height,0,pe,ke,ge.data)}else if(_.isDataArrayTexture)if(O){if(le&&t.texStorage3D(n.TEXTURE_2D_ARRAY,Me,Ae,ae.width,ae.height,ae.depth),he)if(_.layerUpdates.size>0){let re=yu(ae.width,ae.height,_.format,_.type);for(let ee of _.layerUpdates){let Te=ae.data.subarray(ee*re/ae.data.BYTES_PER_ELEMENT,(ee+1)*re/ae.data.BYTES_PER_ELEMENT);t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,ee,ae.width,ae.height,1,pe,ke,Te)}_.clearLayerUpdates()}else t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,ae.width,ae.height,ae.depth,pe,ke,ae.data)}else t.texImage3D(n.TEXTURE_2D_ARRAY,0,Ae,ae.width,ae.height,ae.depth,0,pe,ke,ae.data);else if(_.isData3DTexture)O?(le&&t.texStorage3D(n.TEXTURE_3D,Me,Ae,ae.width,ae.height,ae.depth),he&&t.texSubImage3D(n.TEXTURE_3D,0,0,0,0,ae.width,ae.height,ae.depth,pe,ke,ae.data)):t.texImage3D(n.TEXTURE_3D,0,Ae,ae.width,ae.height,ae.depth,0,pe,ke,ae.data);else if(_.isFramebufferTexture){if(le)if(O)t.texStorage2D(n.TEXTURE_2D,Me,Ae,ae.width,ae.height);else{let re=ae.width,ee=ae.height;for(let Te=0;Te<Me;Te++)t.texImage2D(n.TEXTURE_2D,Te,Ae,re,ee,0,pe,ke,null),re>>=1,ee>>=1}}else if($e.length>0){if(O&&le){let re=j($e[0]);t.texStorage2D(n.TEXTURE_2D,Me,Ae,re.width,re.height)}for(let re=0,ee=$e.length;re<ee;re++)ge=$e[re],O?he&&t.texSubImage2D(n.TEXTURE_2D,re,0,0,pe,ke,ge):t.texImage2D(n.TEXTURE_2D,re,Ae,pe,ke,ge);_.generateMipmaps=!1}else if(O){if(le){let re=j(ae);t.texStorage2D(n.TEXTURE_2D,Me,Ae,re.width,re.height)}he&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,pe,ke,ae)}else t.texImage2D(n.TEXTURE_2D,0,Ae,pe,ke,ae);m(_)&&p(A),ce.__version=z.version,_.onUpdate&&_.onUpdate(_)}S.__version=_.version}function Z(S,_,F){if(_.image.length!==6)return;let A=qe(S,_),B=_.source;t.bindTexture(n.TEXTURE_CUBE_MAP,S.__webglTexture,n.TEXTURE0+F);let z=i.get(B);if(B.version!==z.__version||A===!0){t.activeTexture(n.TEXTURE0+F);let ce=at.getPrimaries(at.workingColorSpace),ne=_.colorSpace===Mi?null:at.getPrimaries(_.colorSpace),be=_.colorSpace===Mi||ce===ne?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,_.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,_.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,be);let Pe=_.isCompressedTexture||_.image[0].isCompressedTexture,ae=_.image[0]&&_.image[0].isDataTexture,pe=[];for(let ee=0;ee<6;ee++)!Pe&&!ae?pe[ee]=y(_.image[ee],!0,s.maxCubemapSize):pe[ee]=ae?_.image[ee].image:_.image[ee],pe[ee]=pt(_,pe[ee]);let ke=pe[0],Ae=r.convert(_.format,_.colorSpace),ge=r.convert(_.type),$e=T(_.internalFormat,Ae,ge,_.colorSpace),O=_.isVideoTexture!==!0,le=z.__version===void 0||A===!0,he=B.dataReady,Me=R(_,ke);Ve(n.TEXTURE_CUBE_MAP,_);let re;if(Pe){O&&le&&t.texStorage2D(n.TEXTURE_CUBE_MAP,Me,$e,ke.width,ke.height);for(let ee=0;ee<6;ee++){re=pe[ee].mipmaps;for(let Te=0;Te<re.length;Te++){let We=re[Te];_.format!==xn?Ae!==null?O?he&&t.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ee,Te,0,0,We.width,We.height,Ae,We.data):t.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ee,Te,$e,We.width,We.height,0,We.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):O?he&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ee,Te,0,0,We.width,We.height,Ae,ge,We.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ee,Te,$e,We.width,We.height,0,Ae,ge,We.data)}}}else{if(re=_.mipmaps,O&&le){re.length>0&&Me++;let ee=j(pe[0]);t.texStorage2D(n.TEXTURE_CUBE_MAP,Me,$e,ee.width,ee.height)}for(let ee=0;ee<6;ee++)if(ae){O?he&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ee,0,0,0,pe[ee].width,pe[ee].height,Ae,ge,pe[ee].data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ee,0,$e,pe[ee].width,pe[ee].height,0,Ae,ge,pe[ee].data);for(let Te=0;Te<re.length;Te++){let dt=re[Te].image[ee].image;O?he&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ee,Te+1,0,0,dt.width,dt.height,Ae,ge,dt.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ee,Te+1,$e,dt.width,dt.height,0,Ae,ge,dt.data)}}else{O?he&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ee,0,0,0,Ae,ge,pe[ee]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ee,0,$e,Ae,ge,pe[ee]);for(let Te=0;Te<re.length;Te++){let We=re[Te];O?he&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ee,Te+1,0,0,Ae,ge,We.image[ee]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ee,Te+1,$e,Ae,ge,We.image[ee])}}}m(_)&&p(n.TEXTURE_CUBE_MAP),z.__version=B.version,_.onUpdate&&_.onUpdate(_)}S.__version=_.version}function xe(S,_,F,A,B,z){let ce=r.convert(F.format,F.colorSpace),ne=r.convert(F.type),be=T(F.internalFormat,ce,ne,F.colorSpace),Pe=i.get(_),ae=i.get(F);if(ae.__renderTarget=_,!Pe.__hasExternalTextures){let pe=Math.max(1,_.width>>z),ke=Math.max(1,_.height>>z);B===n.TEXTURE_3D||B===n.TEXTURE_2D_ARRAY?t.texImage3D(B,z,be,pe,ke,_.depth,0,ce,ne,null):t.texImage2D(B,z,be,pe,ke,0,ce,ne,null)}t.bindFramebuffer(n.FRAMEBUFFER,S),de(_)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,A,B,ae.__webglTexture,0,tt(_)):(B===n.TEXTURE_2D||B>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&B<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,A,B,ae.__webglTexture,z),t.bindFramebuffer(n.FRAMEBUFFER,null)}function Le(S,_,F){if(n.bindRenderbuffer(n.RENDERBUFFER,S),_.depthBuffer){let A=_.depthTexture,B=A&&A.isDepthTexture?A.type:null,z=v(_.stencilBuffer,B),ce=_.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ne=tt(_);de(_)?a.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,ne,z,_.width,_.height):F?n.renderbufferStorageMultisample(n.RENDERBUFFER,ne,z,_.width,_.height):n.renderbufferStorage(n.RENDERBUFFER,z,_.width,_.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,ce,n.RENDERBUFFER,S)}else{let A=_.textures;for(let B=0;B<A.length;B++){let z=A[B],ce=r.convert(z.format,z.colorSpace),ne=r.convert(z.type),be=T(z.internalFormat,ce,ne,z.colorSpace),Pe=tt(_);F&&de(_)===!1?n.renderbufferStorageMultisample(n.RENDERBUFFER,Pe,be,_.width,_.height):de(_)?a.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,Pe,be,_.width,_.height):n.renderbufferStorage(n.RENDERBUFFER,be,_.width,_.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function we(S,_){if(_&&_.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(n.FRAMEBUFFER,S),!(_.depthTexture&&_.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");let A=i.get(_.depthTexture);A.__renderTarget=_,(!A.__webglTexture||_.depthTexture.image.width!==_.width||_.depthTexture.image.height!==_.height)&&(_.depthTexture.image.width=_.width,_.depthTexture.image.height=_.height,_.depthTexture.needsUpdate=!0),J(_.depthTexture,0);let B=A.__webglTexture,z=tt(_);if(_.depthTexture.format===qs)de(_)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,B,0,z):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,B,0);else if(_.depthTexture.format===cr)de(_)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,B,0,z):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,B,0);else throw new Error("Unknown depthTexture format")}function Ge(S){let _=i.get(S),F=S.isWebGLCubeRenderTarget===!0;if(_.__boundDepthTexture!==S.depthTexture){let A=S.depthTexture;if(_.__depthDisposeCallback&&_.__depthDisposeCallback(),A){let B=()=>{delete _.__boundDepthTexture,delete _.__depthDisposeCallback,A.removeEventListener("dispose",B)};A.addEventListener("dispose",B),_.__depthDisposeCallback=B}_.__boundDepthTexture=A}if(S.depthTexture&&!_.__autoAllocateDepthBuffer){if(F)throw new Error("target.depthTexture not supported in Cube render targets");let A=S.texture.mipmaps;A&&A.length>0?we(_.__webglFramebuffer[0],S):we(_.__webglFramebuffer,S)}else if(F){_.__webglDepthbuffer=[];for(let A=0;A<6;A++)if(t.bindFramebuffer(n.FRAMEBUFFER,_.__webglFramebuffer[A]),_.__webglDepthbuffer[A]===void 0)_.__webglDepthbuffer[A]=n.createRenderbuffer(),Le(_.__webglDepthbuffer[A],S,!1);else{let B=S.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,z=_.__webglDepthbuffer[A];n.bindRenderbuffer(n.RENDERBUFFER,z),n.framebufferRenderbuffer(n.FRAMEBUFFER,B,n.RENDERBUFFER,z)}}else{let A=S.texture.mipmaps;if(A&&A.length>0?t.bindFramebuffer(n.FRAMEBUFFER,_.__webglFramebuffer[0]):t.bindFramebuffer(n.FRAMEBUFFER,_.__webglFramebuffer),_.__webglDepthbuffer===void 0)_.__webglDepthbuffer=n.createRenderbuffer(),Le(_.__webglDepthbuffer,S,!1);else{let B=S.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,z=_.__webglDepthbuffer;n.bindRenderbuffer(n.RENDERBUFFER,z),n.framebufferRenderbuffer(n.FRAMEBUFFER,B,n.RENDERBUFFER,z)}}t.bindFramebuffer(n.FRAMEBUFFER,null)}function At(S,_,F){let A=i.get(S);_!==void 0&&xe(A.__webglFramebuffer,S,S.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),F!==void 0&&Ge(S)}function I(S){let _=S.texture,F=i.get(S),A=i.get(_);S.addEventListener("dispose",C);let B=S.textures,z=S.isWebGLCubeRenderTarget===!0,ce=B.length>1;if(ce||(A.__webglTexture===void 0&&(A.__webglTexture=n.createTexture()),A.__version=_.version,o.memory.textures++),z){F.__webglFramebuffer=[];for(let ne=0;ne<6;ne++)if(_.mipmaps&&_.mipmaps.length>0){F.__webglFramebuffer[ne]=[];for(let be=0;be<_.mipmaps.length;be++)F.__webglFramebuffer[ne][be]=n.createFramebuffer()}else F.__webglFramebuffer[ne]=n.createFramebuffer()}else{if(_.mipmaps&&_.mipmaps.length>0){F.__webglFramebuffer=[];for(let ne=0;ne<_.mipmaps.length;ne++)F.__webglFramebuffer[ne]=n.createFramebuffer()}else F.__webglFramebuffer=n.createFramebuffer();if(ce)for(let ne=0,be=B.length;ne<be;ne++){let Pe=i.get(B[ne]);Pe.__webglTexture===void 0&&(Pe.__webglTexture=n.createTexture(),o.memory.textures++)}if(S.samples>0&&de(S)===!1){F.__webglMultisampledFramebuffer=n.createFramebuffer(),F.__webglColorRenderbuffer=[],t.bindFramebuffer(n.FRAMEBUFFER,F.__webglMultisampledFramebuffer);for(let ne=0;ne<B.length;ne++){let be=B[ne];F.__webglColorRenderbuffer[ne]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,F.__webglColorRenderbuffer[ne]);let Pe=r.convert(be.format,be.colorSpace),ae=r.convert(be.type),pe=T(be.internalFormat,Pe,ae,be.colorSpace,S.isXRRenderTarget===!0),ke=tt(S);n.renderbufferStorageMultisample(n.RENDERBUFFER,ke,pe,S.width,S.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+ne,n.RENDERBUFFER,F.__webglColorRenderbuffer[ne])}n.bindRenderbuffer(n.RENDERBUFFER,null),S.depthBuffer&&(F.__webglDepthRenderbuffer=n.createRenderbuffer(),Le(F.__webglDepthRenderbuffer,S,!0)),t.bindFramebuffer(n.FRAMEBUFFER,null)}}if(z){t.bindTexture(n.TEXTURE_CUBE_MAP,A.__webglTexture),Ve(n.TEXTURE_CUBE_MAP,_);for(let ne=0;ne<6;ne++)if(_.mipmaps&&_.mipmaps.length>0)for(let be=0;be<_.mipmaps.length;be++)xe(F.__webglFramebuffer[ne][be],S,_,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+ne,be);else xe(F.__webglFramebuffer[ne],S,_,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+ne,0);m(_)&&p(n.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(ce){for(let ne=0,be=B.length;ne<be;ne++){let Pe=B[ne],ae=i.get(Pe),pe=n.TEXTURE_2D;(S.isWebGL3DRenderTarget||S.isWebGLArrayRenderTarget)&&(pe=S.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(pe,ae.__webglTexture),Ve(pe,Pe),xe(F.__webglFramebuffer,S,Pe,n.COLOR_ATTACHMENT0+ne,pe,0),m(Pe)&&p(pe)}t.unbindTexture()}else{let ne=n.TEXTURE_2D;if((S.isWebGL3DRenderTarget||S.isWebGLArrayRenderTarget)&&(ne=S.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(ne,A.__webglTexture),Ve(ne,_),_.mipmaps&&_.mipmaps.length>0)for(let be=0;be<_.mipmaps.length;be++)xe(F.__webglFramebuffer[be],S,_,n.COLOR_ATTACHMENT0,ne,be);else xe(F.__webglFramebuffer,S,_,n.COLOR_ATTACHMENT0,ne,0);m(_)&&p(ne),t.unbindTexture()}S.depthBuffer&&Ge(S)}function it(S){let _=S.textures;for(let F=0,A=_.length;F<A;F++){let B=_[F];if(m(B)){let z=E(S),ce=i.get(B).__webglTexture;t.bindTexture(z,ce),p(z),t.unbindTexture()}}}let Fe=[],me=[];function fe(S){if(S.samples>0){if(de(S)===!1){let _=S.textures,F=S.width,A=S.height,B=n.COLOR_BUFFER_BIT,z=S.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ce=i.get(S),ne=_.length>1;if(ne)for(let Pe=0;Pe<_.length;Pe++)t.bindFramebuffer(n.FRAMEBUFFER,ce.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Pe,n.RENDERBUFFER,null),t.bindFramebuffer(n.FRAMEBUFFER,ce.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Pe,n.TEXTURE_2D,null,0);t.bindFramebuffer(n.READ_FRAMEBUFFER,ce.__webglMultisampledFramebuffer);let be=S.texture.mipmaps;be&&be.length>0?t.bindFramebuffer(n.DRAW_FRAMEBUFFER,ce.__webglFramebuffer[0]):t.bindFramebuffer(n.DRAW_FRAMEBUFFER,ce.__webglFramebuffer);for(let Pe=0;Pe<_.length;Pe++){if(S.resolveDepthBuffer&&(S.depthBuffer&&(B|=n.DEPTH_BUFFER_BIT),S.stencilBuffer&&S.resolveStencilBuffer&&(B|=n.STENCIL_BUFFER_BIT)),ne){n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,ce.__webglColorRenderbuffer[Pe]);let ae=i.get(_[Pe]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,ae,0)}n.blitFramebuffer(0,0,F,A,0,0,F,A,B,n.NEAREST),c===!0&&(Fe.length=0,me.length=0,Fe.push(n.COLOR_ATTACHMENT0+Pe),S.depthBuffer&&S.resolveDepthBuffer===!1&&(Fe.push(z),me.push(z),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,me)),n.invalidateFramebuffer(n.READ_FRAMEBUFFER,Fe))}if(t.bindFramebuffer(n.READ_FRAMEBUFFER,null),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),ne)for(let Pe=0;Pe<_.length;Pe++){t.bindFramebuffer(n.FRAMEBUFFER,ce.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Pe,n.RENDERBUFFER,ce.__webglColorRenderbuffer[Pe]);let ae=i.get(_[Pe]).__webglTexture;t.bindFramebuffer(n.FRAMEBUFFER,ce.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Pe,n.TEXTURE_2D,ae,0)}t.bindFramebuffer(n.DRAW_FRAMEBUFFER,ce.__webglMultisampledFramebuffer)}else if(S.depthBuffer&&S.resolveDepthBuffer===!1&&c){let _=S.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[_])}}}function tt(S){return Math.min(s.maxSamples,S.samples)}function de(S){let _=i.get(S);return S.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&_.__useRenderToTexture!==!1}function Ce(S){let _=o.render.frame;h.get(S)!==_&&(h.set(S,_),S.update())}function pt(S,_){let F=S.colorSpace,A=S.format,B=S.type;return S.isCompressedTexture===!0||S.isVideoTexture===!0||F!==jt&&F!==Mi&&(at.getTransfer(F)===xt?(A!==xn||B!==zn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",F)),_}function j(S){return typeof HTMLImageElement<"u"&&S instanceof HTMLImageElement?(l.width=S.naturalWidth||S.width,l.height=S.naturalHeight||S.height):typeof VideoFrame<"u"&&S instanceof VideoFrame?(l.width=S.displayWidth,l.height=S.displayHeight):(l.width=S.width,l.height=S.height),l}this.allocateTextureUnit=W,this.resetTextureUnits=U,this.setTexture2D=J,this.setTexture2DArray=G,this.setTexture3D=Q,this.setTextureCube=X,this.rebindTextures=At,this.setupRenderTarget=I,this.updateRenderTargetMipmap=it,this.updateMultisampleRenderTarget=fe,this.setupDepthRenderbuffer=Ge,this.setupFrameBufferTexture=xe,this.useMultisampledRTT=de}function wb(n,e){function t(i,s=Mi){let r,o=at.getTransfer(s);if(i===zn)return n.UNSIGNED_BYTE;if(i===tl)return n.UNSIGNED_SHORT_4_4_4_4;if(i===nl)return n.UNSIGNED_SHORT_5_5_5_1;if(i===ou)return n.UNSIGNED_INT_5_9_9_9_REV;if(i===au)return n.UNSIGNED_INT_10F_11F_11F_REV;if(i===su)return n.BYTE;if(i===ru)return n.SHORT;if(i===or)return n.UNSIGNED_SHORT;if(i===el)return n.INT;if(i===ki)return n.UNSIGNED_INT;if(i===wn)return n.FLOAT;if(i===ar)return n.HALF_FLOAT;if(i===lu)return n.ALPHA;if(i===cu)return n.RGB;if(i===xn)return n.RGBA;if(i===qs)return n.DEPTH_COMPONENT;if(i===cr)return n.DEPTH_STENCIL;if(i===il)return n.RED;if(i===sl)return n.RED_INTEGER;if(i===uu)return n.RG;if(i===rl)return n.RG_INTEGER;if(i===ol)return n.RGBA_INTEGER;if(i===yo||i===vo||i===bo||i===So)if(o===xt)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(i===yo)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===vo)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===bo)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===So)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(i===yo)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===vo)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===bo)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===So)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===al||i===ll||i===cl||i===ul)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(i===al)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===ll)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===cl)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===ul)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===hl||i===dl||i===fl)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(i===hl||i===dl)return o===xt?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(i===fl)return o===xt?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(i===pl||i===ml||i===gl||i===_l||i===xl||i===yl||i===vl||i===bl||i===Sl||i===Ml||i===Tl||i===El||i===wl||i===Al)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(i===pl)return o===xt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===ml)return o===xt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===gl)return o===xt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===_l)return o===xt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===xl)return o===xt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===yl)return o===xt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===vl)return o===xt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===bl)return o===xt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===Sl)return o===xt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===Ml)return o===xt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===Tl)return o===xt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===El)return o===xt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===wl)return o===xt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===Al)return o===xt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===Rl||i===Cl||i===Pl)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(i===Rl)return o===xt?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===Cl)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===Pl)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===Il||i===Ll||i===Dl||i===Nl)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(i===Il)return r.COMPRESSED_RED_RGTC1_EXT;if(i===Ll)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===Dl)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===Nl)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===lr?n.UNSIGNED_INT_24_8:n[i]!==void 0?n[i]:null}return{convert:t}}var Ab=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Rb=`
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

}`,Lu=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let i=new no(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=i}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,i=new Un({vertexShader:Ab,fragmentShader:Rb,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new ht(new so(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Du=class extends Yn{constructor(e,t){super();let i=this,s=null,r=1,o=null,a="local-floor",c=1,l=null,h=null,u=null,d=null,f=null,g=null,y=typeof XRWebGLBinding<"u",m=new Lu,p={},E=t.getContextAttributes(),T=null,v=null,R=[],w=[],C=new De,L=null,b=new It;b.viewport=new ut;let x=new It;x.viewport=new ut;let P=[b,x],U=new Ha,W=null,$=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(K){let Z=R[K];return Z===void 0&&(Z=new Zs,R[K]=Z),Z.getTargetRaySpace()},this.getControllerGrip=function(K){let Z=R[K];return Z===void 0&&(Z=new Zs,R[K]=Z),Z.getGripSpace()},this.getHand=function(K){let Z=R[K];return Z===void 0&&(Z=new Zs,R[K]=Z),Z.getHandSpace()};function J(K){let Z=w.indexOf(K.inputSource);if(Z===-1)return;let xe=R[Z];xe!==void 0&&(xe.update(K.inputSource,K.frame,l||o),xe.dispatchEvent({type:K.type,data:K.inputSource}))}function G(){s.removeEventListener("select",J),s.removeEventListener("selectstart",J),s.removeEventListener("selectend",J),s.removeEventListener("squeeze",J),s.removeEventListener("squeezestart",J),s.removeEventListener("squeezeend",J),s.removeEventListener("end",G),s.removeEventListener("inputsourceschange",Q);for(let K=0;K<R.length;K++){let Z=w[K];Z!==null&&(w[K]=null,R[K].disconnect(Z))}W=null,$=null,m.reset();for(let K in p)delete p[K];e.setRenderTarget(T),f=null,d=null,u=null,s=null,v=null,Xe.stop(),i.isPresenting=!1,e.setPixelRatio(L),e.setSize(C.width,C.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(K){r=K,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(K){a=K,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return l||o},this.setReferenceSpace=function(K){l=K},this.getBaseLayer=function(){return d!==null?d:f},this.getBinding=function(){return u===null&&y&&(u=new XRWebGLBinding(s,t)),u},this.getFrame=function(){return g},this.getSession=function(){return s},this.setSession=async function(K){if(s=K,s!==null){if(T=e.getRenderTarget(),s.addEventListener("select",J),s.addEventListener("selectstart",J),s.addEventListener("selectend",J),s.addEventListener("squeeze",J),s.addEventListener("squeezestart",J),s.addEventListener("squeezeend",J),s.addEventListener("end",G),s.addEventListener("inputsourceschange",Q),E.xrCompatible!==!0&&await t.makeXRCompatible(),L=e.getPixelRatio(),e.getSize(C),y&&"createProjectionLayer"in XRWebGLBinding.prototype){let xe=null,Le=null,we=null;E.depth&&(we=E.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,xe=E.stencil?cr:qs,Le=E.stencil?lr:ki);let Ge={colorFormat:t.RGBA8,depthFormat:we,scaleFactor:r};u=this.getBinding(),d=u.createProjectionLayer(Ge),s.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),v=new qn(d.textureWidth,d.textureHeight,{format:xn,type:zn,depthTexture:new to(d.textureWidth,d.textureHeight,Le,void 0,void 0,void 0,void 0,void 0,void 0,xe),stencilBuffer:E.stencil,colorSpace:e.outputColorSpace,samples:E.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1})}else{let xe={antialias:E.antialias,alpha:!0,depth:E.depth,stencil:E.stencil,framebufferScaleFactor:r};f=new XRWebGLLayer(s,t,xe),s.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),v=new qn(f.framebufferWidth,f.framebufferHeight,{format:xn,type:zn,colorSpace:e.outputColorSpace,stencilBuffer:E.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1})}v.isXRRenderTarget=!0,this.setFoveation(c),l=null,o=await s.requestReferenceSpace(a),Xe.setContext(s),Xe.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return m.getDepthTexture()};function Q(K){for(let Z=0;Z<K.removed.length;Z++){let xe=K.removed[Z],Le=w.indexOf(xe);Le>=0&&(w[Le]=null,R[Le].disconnect(xe))}for(let Z=0;Z<K.added.length;Z++){let xe=K.added[Z],Le=w.indexOf(xe);if(Le===-1){for(let Ge=0;Ge<R.length;Ge++)if(Ge>=w.length){w.push(xe),Le=Ge;break}else if(w[Ge]===null){w[Ge]=xe,Le=Ge;break}if(Le===-1)break}let we=R[Le];we&&we.connect(xe)}}let X=new D,te=new D;function ue(K,Z,xe){X.setFromMatrixPosition(Z.matrixWorld),te.setFromMatrixPosition(xe.matrixWorld);let Le=X.distanceTo(te),we=Z.projectionMatrix.elements,Ge=xe.projectionMatrix.elements,At=we[14]/(we[10]-1),I=we[14]/(we[10]+1),it=(we[9]+1)/we[5],Fe=(we[9]-1)/we[5],me=(we[8]-1)/we[0],fe=(Ge[8]+1)/Ge[0],tt=At*me,de=At*fe,Ce=Le/(-me+fe),pt=Ce*-me;if(Z.matrixWorld.decompose(K.position,K.quaternion,K.scale),K.translateX(pt),K.translateZ(Ce),K.matrixWorld.compose(K.position,K.quaternion,K.scale),K.matrixWorldInverse.copy(K.matrixWorld).invert(),we[10]===-1)K.projectionMatrix.copy(Z.projectionMatrix),K.projectionMatrixInverse.copy(Z.projectionMatrixInverse);else{let j=At+Ce,S=I+Ce,_=tt-pt,F=de+(Le-pt),A=it*I/S*j,B=Fe*I/S*j;K.projectionMatrix.makePerspective(_,F,A,B,j,S),K.projectionMatrixInverse.copy(K.projectionMatrix).invert()}}function Ee(K,Z){Z===null?K.matrixWorld.copy(K.matrix):K.matrixWorld.multiplyMatrices(Z.matrixWorld,K.matrix),K.matrixWorldInverse.copy(K.matrixWorld).invert()}this.updateCamera=function(K){if(s===null)return;let Z=K.near,xe=K.far;m.texture!==null&&(m.depthNear>0&&(Z=m.depthNear),m.depthFar>0&&(xe=m.depthFar)),U.near=x.near=b.near=Z,U.far=x.far=b.far=xe,(W!==U.near||$!==U.far)&&(s.updateRenderState({depthNear:U.near,depthFar:U.far}),W=U.near,$=U.far),U.layers.mask=K.layers.mask|6,b.layers.mask=U.layers.mask&3,x.layers.mask=U.layers.mask&5;let Le=K.parent,we=U.cameras;Ee(U,Le);for(let Ge=0;Ge<we.length;Ge++)Ee(we[Ge],Le);we.length===2?ue(U,b,x):U.projectionMatrix.copy(b.projectionMatrix),Ve(K,U,Le)};function Ve(K,Z,xe){xe===null?K.matrix.copy(Z.matrixWorld):(K.matrix.copy(xe.matrixWorld),K.matrix.invert(),K.matrix.multiply(Z.matrixWorld)),K.matrix.decompose(K.position,K.quaternion,K.scale),K.updateMatrixWorld(!0),K.projectionMatrix.copy(Z.projectionMatrix),K.projectionMatrixInverse.copy(Z.projectionMatrixInverse),K.isPerspectiveCamera&&(K.fov=Qi*2*Math.atan(1/K.projectionMatrix.elements[5]),K.zoom=1)}this.getCamera=function(){return U},this.getFoveation=function(){if(!(d===null&&f===null))return c},this.setFoveation=function(K){c=K,d!==null&&(d.fixedFoveation=K),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=K)},this.hasDepthSensing=function(){return m.texture!==null},this.getDepthSensingMesh=function(){return m.getMesh(U)},this.getCameraTexture=function(K){return p[K]};let qe=null;function lt(K,Z){if(h=Z.getViewerPose(l||o),g=Z,h!==null){let xe=h.views;f!==null&&(e.setRenderTargetFramebuffer(v,f.framebuffer),e.setRenderTarget(v));let Le=!1;xe.length!==U.cameras.length&&(U.cameras.length=0,Le=!0);for(let I=0;I<xe.length;I++){let it=xe[I],Fe=null;if(f!==null)Fe=f.getViewport(it);else{let fe=u.getViewSubImage(d,it);Fe=fe.viewport,I===0&&(e.setRenderTargetTextures(v,fe.colorTexture,fe.depthStencilTexture),e.setRenderTarget(v))}let me=P[I];me===void 0&&(me=new It,me.layers.enable(I),me.viewport=new ut,P[I]=me),me.matrix.fromArray(it.transform.matrix),me.matrix.decompose(me.position,me.quaternion,me.scale),me.projectionMatrix.fromArray(it.projectionMatrix),me.projectionMatrixInverse.copy(me.projectionMatrix).invert(),me.viewport.set(Fe.x,Fe.y,Fe.width,Fe.height),I===0&&(U.matrix.copy(me.matrix),U.matrix.decompose(U.position,U.quaternion,U.scale)),Le===!0&&U.cameras.push(me)}let we=s.enabledFeatures;if(we&&we.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&y){u=i.getBinding();let I=u.getDepthInformation(xe[0]);I&&I.isValid&&I.texture&&m.init(I,s.renderState)}if(we&&we.includes("camera-access")&&y){e.state.unbindTexture(),u=i.getBinding();for(let I=0;I<xe.length;I++){let it=xe[I].camera;if(it){let Fe=p[it];Fe||(Fe=new no,p[it]=Fe);let me=u.getCameraImage(it);Fe.sourceTexture=me}}}}for(let xe=0;xe<R.length;xe++){let Le=w[xe],we=R[xe];Le!==null&&we!==void 0&&we.update(Le,Z,l||o)}qe&&qe(K,Z),Z.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:Z}),g=null}let Xe=new Ep;Xe.setAnimationLoop(lt),this.setAnimationLoop=function(K){qe=K},this.dispose=function(){}}},ps=new En,Cb=new je;function Pb(n,e){function t(m,p){m.matrixAutoUpdate===!0&&m.updateMatrix(),p.value.copy(m.matrix)}function i(m,p){p.color.getRGB(m.fogColor.value,gu(n)),p.isFog?(m.fogNear.value=p.near,m.fogFar.value=p.far):p.isFogExp2&&(m.fogDensity.value=p.density)}function s(m,p,E,T,v){p.isMeshBasicMaterial||p.isMeshLambertMaterial?r(m,p):p.isMeshToonMaterial?(r(m,p),u(m,p)):p.isMeshPhongMaterial?(r(m,p),h(m,p)):p.isMeshStandardMaterial?(r(m,p),d(m,p),p.isMeshPhysicalMaterial&&f(m,p,v)):p.isMeshMatcapMaterial?(r(m,p),g(m,p)):p.isMeshDepthMaterial?r(m,p):p.isMeshDistanceMaterial?(r(m,p),y(m,p)):p.isMeshNormalMaterial?r(m,p):p.isLineBasicMaterial?(o(m,p),p.isLineDashedMaterial&&a(m,p)):p.isPointsMaterial?c(m,p,E,T):p.isSpriteMaterial?l(m,p):p.isShadowMaterial?(m.color.value.copy(p.color),m.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function r(m,p){m.opacity.value=p.opacity,p.color&&m.diffuse.value.copy(p.color),p.emissive&&m.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(m.map.value=p.map,t(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.bumpMap&&(m.bumpMap.value=p.bumpMap,t(p.bumpMap,m.bumpMapTransform),m.bumpScale.value=p.bumpScale,p.side===zt&&(m.bumpScale.value*=-1)),p.normalMap&&(m.normalMap.value=p.normalMap,t(p.normalMap,m.normalMapTransform),m.normalScale.value.copy(p.normalScale),p.side===zt&&m.normalScale.value.negate()),p.displacementMap&&(m.displacementMap.value=p.displacementMap,t(p.displacementMap,m.displacementMapTransform),m.displacementScale.value=p.displacementScale,m.displacementBias.value=p.displacementBias),p.emissiveMap&&(m.emissiveMap.value=p.emissiveMap,t(p.emissiveMap,m.emissiveMapTransform)),p.specularMap&&(m.specularMap.value=p.specularMap,t(p.specularMap,m.specularMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest);let E=e.get(p),T=E.envMap,v=E.envMapRotation;T&&(m.envMap.value=T,ps.copy(v),ps.x*=-1,ps.y*=-1,ps.z*=-1,T.isCubeTexture&&T.isRenderTargetTexture===!1&&(ps.y*=-1,ps.z*=-1),m.envMapRotation.value.setFromMatrix4(Cb.makeRotationFromEuler(ps)),m.flipEnvMap.value=T.isCubeTexture&&T.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=p.reflectivity,m.ior.value=p.ior,m.refractionRatio.value=p.refractionRatio),p.lightMap&&(m.lightMap.value=p.lightMap,m.lightMapIntensity.value=p.lightMapIntensity,t(p.lightMap,m.lightMapTransform)),p.aoMap&&(m.aoMap.value=p.aoMap,m.aoMapIntensity.value=p.aoMapIntensity,t(p.aoMap,m.aoMapTransform))}function o(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,p.map&&(m.map.value=p.map,t(p.map,m.mapTransform))}function a(m,p){m.dashSize.value=p.dashSize,m.totalSize.value=p.dashSize+p.gapSize,m.scale.value=p.scale}function c(m,p,E,T){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.size.value=p.size*E,m.scale.value=T*.5,p.map&&(m.map.value=p.map,t(p.map,m.uvTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function l(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.rotation.value=p.rotation,p.map&&(m.map.value=p.map,t(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function h(m,p){m.specular.value.copy(p.specular),m.shininess.value=Math.max(p.shininess,1e-4)}function u(m,p){p.gradientMap&&(m.gradientMap.value=p.gradientMap)}function d(m,p){m.metalness.value=p.metalness,p.metalnessMap&&(m.metalnessMap.value=p.metalnessMap,t(p.metalnessMap,m.metalnessMapTransform)),m.roughness.value=p.roughness,p.roughnessMap&&(m.roughnessMap.value=p.roughnessMap,t(p.roughnessMap,m.roughnessMapTransform)),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)}function f(m,p,E){m.ior.value=p.ior,p.sheen>0&&(m.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),m.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(m.sheenColorMap.value=p.sheenColorMap,t(p.sheenColorMap,m.sheenColorMapTransform)),p.sheenRoughnessMap&&(m.sheenRoughnessMap.value=p.sheenRoughnessMap,t(p.sheenRoughnessMap,m.sheenRoughnessMapTransform))),p.clearcoat>0&&(m.clearcoat.value=p.clearcoat,m.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(m.clearcoatMap.value=p.clearcoatMap,t(p.clearcoatMap,m.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,t(p.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(m.clearcoatNormalMap.value=p.clearcoatNormalMap,t(p.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===zt&&m.clearcoatNormalScale.value.negate())),p.dispersion>0&&(m.dispersion.value=p.dispersion),p.iridescence>0&&(m.iridescence.value=p.iridescence,m.iridescenceIOR.value=p.iridescenceIOR,m.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(m.iridescenceMap.value=p.iridescenceMap,t(p.iridescenceMap,m.iridescenceMapTransform)),p.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=p.iridescenceThicknessMap,t(p.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),p.transmission>0&&(m.transmission.value=p.transmission,m.transmissionSamplerMap.value=E.texture,m.transmissionSamplerSize.value.set(E.width,E.height),p.transmissionMap&&(m.transmissionMap.value=p.transmissionMap,t(p.transmissionMap,m.transmissionMapTransform)),m.thickness.value=p.thickness,p.thicknessMap&&(m.thicknessMap.value=p.thicknessMap,t(p.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=p.attenuationDistance,m.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(m.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(m.anisotropyMap.value=p.anisotropyMap,t(p.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=p.specularIntensity,m.specularColor.value.copy(p.specularColor),p.specularColorMap&&(m.specularColorMap.value=p.specularColorMap,t(p.specularColorMap,m.specularColorMapTransform)),p.specularIntensityMap&&(m.specularIntensityMap.value=p.specularIntensityMap,t(p.specularIntensityMap,m.specularIntensityMapTransform))}function g(m,p){p.matcap&&(m.matcap.value=p.matcap)}function y(m,p){let E=e.get(p).light;m.referencePosition.value.setFromMatrixPosition(E.matrixWorld),m.nearDistance.value=E.shadow.camera.near,m.farDistance.value=E.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:s}}function Ib(n,e,t,i){let s={},r={},o=[],a=n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS);function c(E,T){let v=T.program;i.uniformBlockBinding(E,v)}function l(E,T){let v=s[E.id];v===void 0&&(g(E),v=h(E),s[E.id]=v,E.addEventListener("dispose",m));let R=T.program;i.updateUBOMapping(E,R);let w=e.render.frame;r[E.id]!==w&&(d(E),r[E.id]=w)}function h(E){let T=u();E.__bindingPointIndex=T;let v=n.createBuffer(),R=E.__size,w=E.usage;return n.bindBuffer(n.UNIFORM_BUFFER,v),n.bufferData(n.UNIFORM_BUFFER,R,w),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,T,v),v}function u(){for(let E=0;E<a;E++)if(o.indexOf(E)===-1)return o.push(E),E;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(E){let T=s[E.id],v=E.uniforms,R=E.__cache;n.bindBuffer(n.UNIFORM_BUFFER,T);for(let w=0,C=v.length;w<C;w++){let L=Array.isArray(v[w])?v[w]:[v[w]];for(let b=0,x=L.length;b<x;b++){let P=L[b];if(f(P,w,b,R)===!0){let U=P.__offset,W=Array.isArray(P.value)?P.value:[P.value],$=0;for(let J=0;J<W.length;J++){let G=W[J],Q=y(G);typeof G=="number"||typeof G=="boolean"?(P.__data[0]=G,n.bufferSubData(n.UNIFORM_BUFFER,U+$,P.__data)):G.isMatrix3?(P.__data[0]=G.elements[0],P.__data[1]=G.elements[1],P.__data[2]=G.elements[2],P.__data[3]=0,P.__data[4]=G.elements[3],P.__data[5]=G.elements[4],P.__data[6]=G.elements[5],P.__data[7]=0,P.__data[8]=G.elements[6],P.__data[9]=G.elements[7],P.__data[10]=G.elements[8],P.__data[11]=0):(G.toArray(P.__data,$),$+=Q.storage/Float32Array.BYTES_PER_ELEMENT)}n.bufferSubData(n.UNIFORM_BUFFER,U,P.__data)}}}n.bindBuffer(n.UNIFORM_BUFFER,null)}function f(E,T,v,R){let w=E.value,C=T+"_"+v;if(R[C]===void 0)return typeof w=="number"||typeof w=="boolean"?R[C]=w:R[C]=w.clone(),!0;{let L=R[C];if(typeof w=="number"||typeof w=="boolean"){if(L!==w)return R[C]=w,!0}else if(L.equals(w)===!1)return L.copy(w),!0}return!1}function g(E){let T=E.uniforms,v=0,R=16;for(let C=0,L=T.length;C<L;C++){let b=Array.isArray(T[C])?T[C]:[T[C]];for(let x=0,P=b.length;x<P;x++){let U=b[x],W=Array.isArray(U.value)?U.value:[U.value];for(let $=0,J=W.length;$<J;$++){let G=W[$],Q=y(G),X=v%R,te=X%Q.boundary,ue=X+te;v+=te,ue!==0&&R-ue<Q.storage&&(v+=R-ue),U.__data=new Float32Array(Q.storage/Float32Array.BYTES_PER_ELEMENT),U.__offset=v,v+=Q.storage}}}let w=v%R;return w>0&&(v+=R-w),E.__size=v,E.__cache={},this}function y(E){let T={boundary:0,storage:0};return typeof E=="number"||typeof E=="boolean"?(T.boundary=4,T.storage=4):E.isVector2?(T.boundary=8,T.storage=8):E.isVector3||E.isColor?(T.boundary=16,T.storage=12):E.isVector4?(T.boundary=16,T.storage=16):E.isMatrix3?(T.boundary=48,T.storage=48):E.isMatrix4?(T.boundary=64,T.storage=64):E.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",E),T}function m(E){let T=E.target;T.removeEventListener("dispose",m);let v=o.indexOf(T.__bindingPointIndex);o.splice(v,1),n.deleteBuffer(s[T.id]),delete s[T.id],delete r[T.id]}function p(){for(let E in s)n.deleteBuffer(s[E]);o=[],s={},r={}}return{bind:c,update:l,dispose:p}}var zl=class{constructor(e={}){let{canvas:t=jf(),context:i=null,depth:s=!0,stencil:r=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:l=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:u=!1,reversedDepthBuffer:d=!1}=e;this.isWebGLRenderer=!0;let f;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");f=i.getContextAttributes().alpha}else f=o;let g=new Uint32Array(4),y=new Int32Array(4),m=null,p=null,E=[],T=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=Si,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let v=this,R=!1;this._outputColorSpace=Bt;let w=0,C=0,L=null,b=-1,x=null,P=new ut,U=new ut,W=null,$=new Ne(0),J=0,G=t.width,Q=t.height,X=1,te=null,ue=null,Ee=new ut(0,0,G,Q),Ve=new ut(0,0,G,Q),qe=!1,lt=new tr,Xe=!1,K=!1,Z=new je,xe=new D,Le=new ut,we={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},Ge=!1;function At(){return L===null?X:1}let I=i;function it(M,H){return t.getContext(M,H)}try{let M={alpha:!0,depth:s,stencil:r,antialias:a,premultipliedAlpha:c,preserveDrawingBuffer:l,powerPreference:h,failIfMajorPerformanceCaveat:u};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${"180"}`),t.addEventListener("webglcontextlost",he,!1),t.addEventListener("webglcontextrestored",Me,!1),t.addEventListener("webglcontextcreationerror",re,!1),I===null){let H="webgl2";if(I=it(H,M),I===null)throw it(H)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(M){throw console.error("THREE.WebGLRenderer: "+M.message),M}let Fe,me,fe,tt,de,Ce,pt,j,S,_,F,A,B,z,ce,ne,be,Pe,ae,pe,ke,Ae,ge,$e;function O(){Fe=new jy(I),Fe.init(),Ae=new wb(I,Fe),me=new Vy(I,Fe,e,Ae),fe=new Tb(I,Fe),me.reversedDepthBuffer&&d&&fe.buffers.depth.setReversed(!0),tt=new Zy(I),de=new hb,Ce=new Eb(I,Fe,fe,de,me,Ae,tt),pt=new Wy(v),j=new qy(v),S=new s_(I),ge=new zy(I,S),_=new Jy(I,S,tt,ge),F=new ev(I,_,S,tt),ae=new Qy(I,me,Ce),ne=new Gy(de),A=new ub(v,pt,j,Fe,me,ge,ne),B=new Pb(v,de),z=new fb,ce=new yb(Fe),Pe=new ky(v,pt,j,fe,F,f,c),be=new Sb(v,F,me),$e=new Ib(I,tt,me,fe),pe=new Hy(I,Fe,tt),ke=new Ky(I,Fe,tt),tt.programs=A.programs,v.capabilities=me,v.extensions=Fe,v.properties=de,v.renderLists=z,v.shadowMap=be,v.state=fe,v.info=tt}O();let le=new Du(v,I);this.xr=le,this.getContext=function(){return I},this.getContextAttributes=function(){return I.getContextAttributes()},this.forceContextLoss=function(){let M=Fe.get("WEBGL_lose_context");M&&M.loseContext()},this.forceContextRestore=function(){let M=Fe.get("WEBGL_lose_context");M&&M.restoreContext()},this.getPixelRatio=function(){return X},this.setPixelRatio=function(M){M!==void 0&&(X=M,this.setSize(G,Q,!1))},this.getSize=function(M){return M.set(G,Q)},this.setSize=function(M,H,q=!0){if(le.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}G=M,Q=H,t.width=Math.floor(M*X),t.height=Math.floor(H*X),q===!0&&(t.style.width=M+"px",t.style.height=H+"px"),this.setViewport(0,0,M,H)},this.getDrawingBufferSize=function(M){return M.set(G*X,Q*X).floor()},this.setDrawingBufferSize=function(M,H,q){G=M,Q=H,X=q,t.width=Math.floor(M*q),t.height=Math.floor(H*q),this.setViewport(0,0,M,H)},this.getCurrentViewport=function(M){return M.copy(P)},this.getViewport=function(M){return M.copy(Ee)},this.setViewport=function(M,H,q,Y){M.isVector4?Ee.set(M.x,M.y,M.z,M.w):Ee.set(M,H,q,Y),fe.viewport(P.copy(Ee).multiplyScalar(X).round())},this.getScissor=function(M){return M.copy(Ve)},this.setScissor=function(M,H,q,Y){M.isVector4?Ve.set(M.x,M.y,M.z,M.w):Ve.set(M,H,q,Y),fe.scissor(U.copy(Ve).multiplyScalar(X).round())},this.getScissorTest=function(){return qe},this.setScissorTest=function(M){fe.setScissorTest(qe=M)},this.setOpaqueSort=function(M){te=M},this.setTransparentSort=function(M){ue=M},this.getClearColor=function(M){return M.copy(Pe.getClearColor())},this.setClearColor=function(){Pe.setClearColor(...arguments)},this.getClearAlpha=function(){return Pe.getClearAlpha()},this.setClearAlpha=function(){Pe.setClearAlpha(...arguments)},this.clear=function(M=!0,H=!0,q=!0){let Y=0;if(M){let k=!1;if(L!==null){let se=L.texture.format;k=se===ol||se===rl||se===sl}if(k){let se=L.texture.type,_e=se===zn||se===ki||se===or||se===lr||se===tl||se===nl,Re=Pe.getClearColor(),ve=Pe.getClearAlpha(),Be=Re.r,ze=Re.g,Ue=Re.b;_e?(g[0]=Be,g[1]=ze,g[2]=Ue,g[3]=ve,I.clearBufferuiv(I.COLOR,0,g)):(y[0]=Be,y[1]=ze,y[2]=Ue,y[3]=ve,I.clearBufferiv(I.COLOR,0,y))}else Y|=I.COLOR_BUFFER_BIT}H&&(Y|=I.DEPTH_BUFFER_BIT),q&&(Y|=I.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),I.clear(Y)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",he,!1),t.removeEventListener("webglcontextrestored",Me,!1),t.removeEventListener("webglcontextcreationerror",re,!1),Pe.dispose(),z.dispose(),ce.dispose(),de.dispose(),pt.dispose(),j.dispose(),F.dispose(),ge.dispose(),$e.dispose(),A.dispose(),le.dispose(),le.removeEventListener("sessionstart",Wt),le.removeEventListener("sessionend",Hn),sn.stop()};function he(M){M.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),R=!0}function Me(){console.log("THREE.WebGLRenderer: Context Restored."),R=!1;let M=tt.autoReset,H=be.enabled,q=be.autoUpdate,Y=be.needsUpdate,k=be.type;O(),tt.autoReset=M,be.enabled=H,be.autoUpdate=q,be.needsUpdate=Y,be.type=k}function re(M){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",M.statusMessage)}function ee(M){let H=M.target;H.removeEventListener("dispose",ee),Te(H)}function Te(M){We(M),de.remove(M)}function We(M){let H=de.get(M).programs;H!==void 0&&(H.forEach(function(q){A.releaseProgram(q)}),M.isShaderMaterial&&A.releaseShaderCache(M))}this.renderBufferDirect=function(M,H,q,Y,k,se){H===null&&(H=we);let _e=k.isMesh&&k.matrixWorld.determinant()<0,Re=bs(M,H,q,Y,k);fe.setMaterial(Y,_e);let ve=q.index,Be=1;if(Y.wireframe===!0){if(ve=_.getWireframeAttribute(q),ve===void 0)return;Be=2}let ze=q.drawRange,Ue=q.attributes.position,Ye=ze.start*Be,nt=(ze.start+ze.count)*Be;se!==null&&(Ye=Math.max(Ye,se.start*Be),nt=Math.min(nt,(se.start+se.count)*Be)),ve!==null?(Ye=Math.max(Ye,0),nt=Math.min(nt,ve.count)):Ue!=null&&(Ye=Math.max(Ye,0),nt=Math.min(nt,Ue.count));let Rt=nt-Ye;if(Rt<0||Rt===1/0)return;ge.setup(k,Y,Re,q,ve);let yt,ct=pe;if(ve!==null&&(yt=S.get(ve),ct=ke,ct.setIndex(yt)),k.isMesh)Y.wireframe===!0?(fe.setLineWidth(Y.wireframeLinewidth*At()),ct.setMode(I.LINES)):ct.setMode(I.TRIANGLES);else if(k.isLine){let Ie=Y.linewidth;Ie===void 0&&(Ie=1),fe.setLineWidth(Ie*At()),k.isLineSegments?ct.setMode(I.LINES):k.isLineLoop?ct.setMode(I.LINE_LOOP):ct.setMode(I.LINE_STRIP)}else k.isPoints?ct.setMode(I.POINTS):k.isSprite&&ct.setMode(I.TRIANGLES);if(k.isBatchedMesh)if(k._multiDrawInstances!==null)Js("THREE.WebGLRenderer: renderMultiDrawInstances has been deprecated and will be removed in r184. Append to renderMultiDraw arguments and use indirection."),ct.renderMultiDrawInstances(k._multiDrawStarts,k._multiDrawCounts,k._multiDrawCount,k._multiDrawInstances);else if(Fe.get("WEBGL_multi_draw"))ct.renderMultiDraw(k._multiDrawStarts,k._multiDrawCounts,k._multiDrawCount);else{let Ie=k._multiDrawStarts,vt=k._multiDrawCounts,st=k._multiDrawCount,Xt=ve?S.get(ve).bytesPerElement:1,Vn=de.get(Y).currentProgram.getUniforms();for(let Ot=0;Ot<st;Ot++)Vn.setValue(I,"_gl_DrawID",Ot),ct.render(Ie[Ot]/Xt,vt[Ot])}else if(k.isInstancedMesh)ct.renderInstances(Ye,Rt,k.count);else if(q.isInstancedBufferGeometry){let Ie=q._maxInstanceCount!==void 0?q._maxInstanceCount:1/0,vt=Math.min(q.instanceCount,Ie);ct.renderInstances(Ye,Rt,vt)}else ct.render(Ye,Rt)};function dt(M,H,q){M.transparent===!0&&M.side===tn&&M.forceSinglePass===!1?(M.side=zt,M.needsUpdate=!0,yn(M,H,q),M.side=Fn,M.needsUpdate=!0,yn(M,H,q),M.side=tn):yn(M,H,q)}this.compile=function(M,H,q=null){q===null&&(q=M),p=ce.get(q),p.init(H),T.push(p),q.traverseVisible(function(k){k.isLight&&k.layers.test(H.layers)&&(p.pushLight(k),k.castShadow&&p.pushShadow(k))}),M!==q&&M.traverseVisible(function(k){k.isLight&&k.layers.test(H.layers)&&(p.pushLight(k),k.castShadow&&p.pushShadow(k))}),p.setupLights();let Y=new Set;return M.traverse(function(k){if(!(k.isMesh||k.isPoints||k.isLine||k.isSprite))return;let se=k.material;if(se)if(Array.isArray(se))for(let _e=0;_e<se.length;_e++){let Re=se[_e];dt(Re,q,k),Y.add(Re)}else dt(se,q,k),Y.add(se)}),p=T.pop(),Y},this.compileAsync=function(M,H,q=null){let Y=this.compile(M,H,q);return new Promise(k=>{function se(){if(Y.forEach(function(_e){de.get(_e).currentProgram.isReady()&&Y.delete(_e)}),Y.size===0){k(M);return}setTimeout(se,10)}Fe.get("KHR_parallel_shader_compile")!==null?se():setTimeout(se,10)})};let Ze=null;function Nt(M){Ze&&Ze(M)}function Wt(){sn.stop()}function Hn(){sn.start()}let sn=new Ep;sn.setAnimationLoop(Nt),typeof self<"u"&&sn.setContext(self),this.setAnimationLoop=function(M){Ze=M,le.setAnimationLoop(M),M===null?sn.stop():sn.start()},le.addEventListener("sessionstart",Wt),le.addEventListener("sessionend",Hn),this.render=function(M,H){if(H!==void 0&&H.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(R===!0)return;if(M.matrixWorldAutoUpdate===!0&&M.updateMatrixWorld(),H.parent===null&&H.matrixWorldAutoUpdate===!0&&H.updateMatrixWorld(),le.enabled===!0&&le.isPresenting===!0&&(le.cameraAutoUpdate===!0&&le.updateCamera(H),H=le.getCamera()),M.isScene===!0&&M.onBeforeRender(v,M,H,L),p=ce.get(M,T.length),p.init(H),T.push(p),Z.multiplyMatrices(H.projectionMatrix,H.matrixWorldInverse),lt.setFromProjectionMatrix(Z,Nn,H.reversedDepth),K=this.localClippingEnabled,Xe=ne.init(this.clippingPlanes,K),m=z.get(M,E.length),m.init(),E.push(m),le.enabled===!0&&le.isPresenting===!0){let se=v.xr.getDepthSensingMesh();se!==null&&ys(se,H,-1/0,v.sortObjects)}ys(M,H,0,v.sortObjects),m.finish(),v.sortObjects===!0&&m.sort(te,ue),Ge=le.enabled===!1||le.isPresenting===!1||le.hasDepthSensing()===!1,Ge&&Pe.addToRenderList(m,M),this.info.render.frame++,Xe===!0&&ne.beginShadows();let q=p.state.shadowsArray;be.render(q,M,H),Xe===!0&&ne.endShadows(),this.info.autoReset===!0&&this.info.reset();let Y=m.opaque,k=m.transmissive;if(p.setupLights(),H.isArrayCamera){let se=H.cameras;if(k.length>0)for(let _e=0,Re=se.length;_e<Re;_e++){let ve=se[_e];ii(Y,k,M,ve)}Ge&&Pe.render(M);for(let _e=0,Re=se.length;_e<Re;_e++){let ve=se[_e];vs(m,M,ve,ve.viewport)}}else k.length>0&&ii(Y,k,M,H),Ge&&Pe.render(M),vs(m,M,H);L!==null&&C===0&&(Ce.updateMultisampleRenderTarget(L),Ce.updateRenderTargetMipmap(L)),M.isScene===!0&&M.onAfterRender(v,M,H),ge.resetDefaultState(),b=-1,x=null,T.pop(),T.length>0?(p=T[T.length-1],Xe===!0&&ne.setGlobalState(v.clippingPlanes,p.state.camera)):p=null,E.pop(),E.length>0?m=E[E.length-1]:m=null};function ys(M,H,q,Y){if(M.visible===!1)return;if(M.layers.test(H.layers)){if(M.isGroup)q=M.renderOrder;else if(M.isLOD)M.autoUpdate===!0&&M.update(H);else if(M.isLight)p.pushLight(M),M.castShadow&&p.pushShadow(M);else if(M.isSprite){if(!M.frustumCulled||lt.intersectsSprite(M)){Y&&Le.setFromMatrixPosition(M.matrixWorld).applyMatrix4(Z);let _e=F.update(M),Re=M.material;Re.visible&&m.push(M,_e,Re,q,Le.z,null)}}else if((M.isMesh||M.isLine||M.isPoints)&&(!M.frustumCulled||lt.intersectsObject(M))){let _e=F.update(M),Re=M.material;if(Y&&(M.boundingSphere!==void 0?(M.boundingSphere===null&&M.computeBoundingSphere(),Le.copy(M.boundingSphere.center)):(_e.boundingSphere===null&&_e.computeBoundingSphere(),Le.copy(_e.boundingSphere.center)),Le.applyMatrix4(M.matrixWorld).applyMatrix4(Z)),Array.isArray(Re)){let ve=_e.groups;for(let Be=0,ze=ve.length;Be<ze;Be++){let Ue=ve[Be],Ye=Re[Ue.materialIndex];Ye&&Ye.visible&&m.push(M,_e,Ye,q,Le.z,Ue)}}else Re.visible&&m.push(M,_e,Re,q,Le.z,null)}}let se=M.children;for(let _e=0,Re=se.length;_e<Re;_e++)ys(se[_e],H,q,Y)}function vs(M,H,q,Y){let k=M.opaque,se=M.transmissive,_e=M.transparent;p.setupLightsView(q),Xe===!0&&ne.setGlobalState(v.clippingPlanes,q),Y&&fe.viewport(P.copy(Y)),k.length>0&&Vi(k,H,q),se.length>0&&Vi(se,H,q),_e.length>0&&Vi(_e,H,q),fe.buffers.depth.setTest(!0),fe.buffers.depth.setMask(!0),fe.buffers.color.setMask(!0),fe.setPolygonOffset(!1)}function ii(M,H,q,Y){if((q.isScene===!0?q.overrideMaterial:null)!==null)return;p.state.transmissionRenderTarget[Y.id]===void 0&&(p.state.transmissionRenderTarget[Y.id]=new qn(1,1,{generateMipmaps:!0,type:Fe.has("EXT_color_buffer_half_float")||Fe.has("EXT_color_buffer_float")?ar:zn,minFilter:kn,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:at.workingColorSpace}));let se=p.state.transmissionRenderTarget[Y.id],_e=Y.viewport||P;se.setSize(_e.z*v.transmissionResolutionScale,_e.w*v.transmissionResolutionScale);let Re=v.getRenderTarget(),ve=v.getActiveCubeFace(),Be=v.getActiveMipmapLevel();v.setRenderTarget(se),v.getClearColor($),J=v.getClearAlpha(),J<1&&v.setClearColor(16777215,.5),v.clear(),Ge&&Pe.render(q);let ze=v.toneMapping;v.toneMapping=Si;let Ue=Y.viewport;if(Y.viewport!==void 0&&(Y.viewport=void 0),p.setupLightsView(Y),Xe===!0&&ne.setGlobalState(v.clippingPlanes,Y),Vi(M,q,Y),Ce.updateMultisampleRenderTarget(se),Ce.updateRenderTargetMipmap(se),Fe.has("WEBGL_multisampled_render_to_texture")===!1){let Ye=!1;for(let nt=0,Rt=H.length;nt<Rt;nt++){let yt=H[nt],ct=yt.object,Ie=yt.geometry,vt=yt.material,st=yt.group;if(vt.side===tn&&ct.layers.test(Y.layers)){let Xt=vt.side;vt.side=zt,vt.needsUpdate=!0,si(ct,q,Y,Ie,vt,st),vt.side=Xt,vt.needsUpdate=!0,Ye=!0}}Ye===!0&&(Ce.updateMultisampleRenderTarget(se),Ce.updateRenderTargetMipmap(se))}v.setRenderTarget(Re,ve,Be),v.setClearColor($,J),Ue!==void 0&&(Y.viewport=Ue),v.toneMapping=ze}function Vi(M,H,q){let Y=H.isScene===!0?H.overrideMaterial:null;for(let k=0,se=M.length;k<se;k++){let _e=M[k],Re=_e.object,ve=_e.geometry,Be=_e.group,ze=_e.material;ze.allowOverride===!0&&Y!==null&&(ze=Y),Re.layers.test(q.layers)&&si(Re,H,q,ve,ze,Be)}}function si(M,H,q,Y,k,se){M.onBeforeRender(v,H,q,Y,k,se),M.modelViewMatrix.multiplyMatrices(q.matrixWorldInverse,M.matrixWorld),M.normalMatrix.getNormalMatrix(M.modelViewMatrix),k.onBeforeRender(v,H,q,Y,M,se),k.transparent===!0&&k.side===tn&&k.forceSinglePass===!1?(k.side=zt,k.needsUpdate=!0,v.renderBufferDirect(q,H,Y,k,M,se),k.side=Fn,k.needsUpdate=!0,v.renderBufferDirect(q,H,Y,k,M,se),k.side=tn):v.renderBufferDirect(q,H,Y,k,M,se),M.onAfterRender(v,H,q,Y,k,se)}function yn(M,H,q){H.isScene!==!0&&(H=we);let Y=de.get(M),k=p.state.lights,se=p.state.shadowsArray,_e=k.state.version,Re=A.getParameters(M,k.state,se,H,q),ve=A.getProgramCacheKey(Re),Be=Y.programs;Y.environment=M.isMeshStandardMaterial?H.environment:null,Y.fog=H.fog,Y.envMap=(M.isMeshStandardMaterial?j:pt).get(M.envMap||Y.environment),Y.envMapRotation=Y.environment!==null&&M.envMap===null?H.environmentRotation:M.envMapRotation,Be===void 0&&(M.addEventListener("dispose",ee),Be=new Map,Y.programs=Be);let ze=Be.get(ve);if(ze!==void 0){if(Y.currentProgram===ze&&Y.lightsStateVersion===_e)return Do(M,Re),ze}else Re.uniforms=A.getUniforms(M),M.onBeforeCompile(Re,v),ze=A.acquireProgram(Re,ve),Be.set(ve,ze),Y.uniforms=Re.uniforms;let Ue=Y.uniforms;return(!M.isShaderMaterial&&!M.isRawShaderMaterial||M.clipping===!0)&&(Ue.clippingPlanes=ne.uniform),Do(M,Re),Y.needsLights=tc(M),Y.lightsStateVersion=_e,Y.needsLights&&(Ue.ambientLightColor.value=k.state.ambient,Ue.lightProbe.value=k.state.probe,Ue.directionalLights.value=k.state.directional,Ue.directionalLightShadows.value=k.state.directionalShadow,Ue.spotLights.value=k.state.spot,Ue.spotLightShadows.value=k.state.spotShadow,Ue.rectAreaLights.value=k.state.rectArea,Ue.ltc_1.value=k.state.rectAreaLTC1,Ue.ltc_2.value=k.state.rectAreaLTC2,Ue.pointLights.value=k.state.point,Ue.pointLightShadows.value=k.state.pointShadow,Ue.hemisphereLights.value=k.state.hemi,Ue.directionalShadowMap.value=k.state.directionalShadowMap,Ue.directionalShadowMatrix.value=k.state.directionalShadowMatrix,Ue.spotShadowMap.value=k.state.spotShadowMap,Ue.spotLightMatrix.value=k.state.spotLightMatrix,Ue.spotLightMap.value=k.state.spotLightMap,Ue.pointShadowMap.value=k.state.pointShadowMap,Ue.pointShadowMatrix.value=k.state.pointShadowMatrix),Y.currentProgram=ze,Y.uniformsList=null,ze}function Lo(M){if(M.uniformsList===null){let H=M.currentProgram.getUniforms();M.uniformsList=fr.seqWithValue(H.seq,M.uniforms)}return M.uniformsList}function Do(M,H){let q=de.get(M);q.outputColorSpace=H.outputColorSpace,q.batching=H.batching,q.batchingColor=H.batchingColor,q.instancing=H.instancing,q.instancingColor=H.instancingColor,q.instancingMorph=H.instancingMorph,q.skinning=H.skinning,q.morphTargets=H.morphTargets,q.morphNormals=H.morphNormals,q.morphColors=H.morphColors,q.morphTargetsCount=H.morphTargetsCount,q.numClippingPlanes=H.numClippingPlanes,q.numIntersection=H.numClipIntersection,q.vertexAlphas=H.vertexAlphas,q.vertexTangents=H.vertexTangents,q.toneMapping=H.toneMapping}function bs(M,H,q,Y,k){H.isScene!==!0&&(H=we),Ce.resetTextureUnits();let se=H.fog,_e=Y.isMeshStandardMaterial?H.environment:null,Re=L===null?v.outputColorSpace:L.isXRRenderTarget===!0?L.texture.colorSpace:jt,ve=(Y.isMeshStandardMaterial?j:pt).get(Y.envMap||_e),Be=Y.vertexColors===!0&&!!q.attributes.color&&q.attributes.color.itemSize===4,ze=!!q.attributes.tangent&&(!!Y.normalMap||Y.anisotropy>0),Ue=!!q.morphAttributes.position,Ye=!!q.morphAttributes.normal,nt=!!q.morphAttributes.color,Rt=Si;Y.toneMapped&&(L===null||L.isXRRenderTarget===!0)&&(Rt=v.toneMapping);let yt=q.morphAttributes.position||q.morphAttributes.normal||q.morphAttributes.color,ct=yt!==void 0?yt.length:0,Ie=de.get(Y),vt=p.state.lights;if(Xe===!0&&(K===!0||M!==x)){let Et=M===x&&Y.id===b;ne.setState(Y,M,Et)}let st=!1;Y.version===Ie.__version?(Ie.needsLights&&Ie.lightsStateVersion!==vt.state.version||Ie.outputColorSpace!==Re||k.isBatchedMesh&&Ie.batching===!1||!k.isBatchedMesh&&Ie.batching===!0||k.isBatchedMesh&&Ie.batchingColor===!0&&k.colorTexture===null||k.isBatchedMesh&&Ie.batchingColor===!1&&k.colorTexture!==null||k.isInstancedMesh&&Ie.instancing===!1||!k.isInstancedMesh&&Ie.instancing===!0||k.isSkinnedMesh&&Ie.skinning===!1||!k.isSkinnedMesh&&Ie.skinning===!0||k.isInstancedMesh&&Ie.instancingColor===!0&&k.instanceColor===null||k.isInstancedMesh&&Ie.instancingColor===!1&&k.instanceColor!==null||k.isInstancedMesh&&Ie.instancingMorph===!0&&k.morphTexture===null||k.isInstancedMesh&&Ie.instancingMorph===!1&&k.morphTexture!==null||Ie.envMap!==ve||Y.fog===!0&&Ie.fog!==se||Ie.numClippingPlanes!==void 0&&(Ie.numClippingPlanes!==ne.numPlanes||Ie.numIntersection!==ne.numIntersection)||Ie.vertexAlphas!==Be||Ie.vertexTangents!==ze||Ie.morphTargets!==Ue||Ie.morphNormals!==Ye||Ie.morphColors!==nt||Ie.toneMapping!==Rt||Ie.morphTargetsCount!==ct)&&(st=!0):(st=!0,Ie.__version=Y.version);let Xt=Ie.currentProgram;st===!0&&(Xt=yn(Y,H,k));let Vn=!1,Ot=!1,Gn=!1,Tt=Xt.getUniforms(),Ft=Ie.uniforms;if(fe.useProgram(Xt.program)&&(Vn=!0,Ot=!0,Gn=!0),Y.id!==b&&(b=Y.id,Ot=!0),Vn||x!==M){fe.buffers.depth.getReversed()&&M.reversedDepth!==!0&&(M._reversedDepth=!0,M.updateProjectionMatrix()),Tt.setValue(I,"projectionMatrix",M.projectionMatrix),Tt.setValue(I,"viewMatrix",M.matrixWorldInverse);let wt=Tt.map.cameraPosition;wt!==void 0&&wt.setValue(I,xe.setFromMatrixPosition(M.matrixWorld)),me.logarithmicDepthBuffer&&Tt.setValue(I,"logDepthBufFC",2/(Math.log(M.far+1)/Math.LN2)),(Y.isMeshPhongMaterial||Y.isMeshToonMaterial||Y.isMeshLambertMaterial||Y.isMeshBasicMaterial||Y.isMeshStandardMaterial||Y.isShaderMaterial)&&Tt.setValue(I,"isOrthographic",M.isOrthographicCamera===!0),x!==M&&(x=M,Ot=!0,Gn=!0)}if(k.isSkinnedMesh){Tt.setOptional(I,k,"bindMatrix"),Tt.setOptional(I,k,"bindMatrixInverse");let Et=k.skeleton;Et&&(Et.boneTexture===null&&Et.computeBoneTexture(),Tt.setValue(I,"boneTexture",Et.boneTexture,Ce))}k.isBatchedMesh&&(Tt.setOptional(I,k,"batchingTexture"),Tt.setValue(I,"batchingTexture",k._matricesTexture,Ce),Tt.setOptional(I,k,"batchingIdTexture"),Tt.setValue(I,"batchingIdTexture",k._indirectTexture,Ce),Tt.setOptional(I,k,"batchingColorTexture"),k._colorsTexture!==null&&Tt.setValue(I,"batchingColorTexture",k._colorsTexture,Ce));let rn=q.morphAttributes;if((rn.position!==void 0||rn.normal!==void 0||rn.color!==void 0)&&ae.update(k,q,Xt),(Ot||Ie.receiveShadow!==k.receiveShadow)&&(Ie.receiveShadow=k.receiveShadow,Tt.setValue(I,"receiveShadow",k.receiveShadow)),Y.isMeshGouraudMaterial&&Y.envMap!==null&&(Ft.envMap.value=ve,Ft.flipEnvMap.value=ve.isCubeTexture&&ve.isRenderTargetTexture===!1?-1:1),Y.isMeshStandardMaterial&&Y.envMap===null&&H.environment!==null&&(Ft.envMapIntensity.value=H.environmentIntensity),Ot&&(Tt.setValue(I,"toneMappingExposure",v.toneMappingExposure),Ie.needsLights&&Gi(Ft,Gn),se&&Y.fog===!0&&B.refreshFogUniforms(Ft,se),B.refreshMaterialUniforms(Ft,Y,X,Q,p.state.transmissionRenderTarget[M.id]),fr.upload(I,Lo(Ie),Ft,Ce)),Y.isShaderMaterial&&Y.uniformsNeedUpdate===!0&&(fr.upload(I,Lo(Ie),Ft,Ce),Y.uniformsNeedUpdate=!1),Y.isSpriteMaterial&&Tt.setValue(I,"center",k.center),Tt.setValue(I,"modelViewMatrix",k.modelViewMatrix),Tt.setValue(I,"normalMatrix",k.normalMatrix),Tt.setValue(I,"modelMatrix",k.matrixWorld),Y.isShaderMaterial||Y.isRawShaderMaterial){let Et=Y.uniformsGroups;for(let wt=0,vr=Et.length;wt<vr;wt++){let ri=Et[wt];$e.update(ri,Xt),$e.bind(ri,Xt)}}return Xt}function Gi(M,H){M.ambientLightColor.needsUpdate=H,M.lightProbe.needsUpdate=H,M.directionalLights.needsUpdate=H,M.directionalLightShadows.needsUpdate=H,M.pointLights.needsUpdate=H,M.pointLightShadows.needsUpdate=H,M.spotLights.needsUpdate=H,M.spotLightShadows.needsUpdate=H,M.rectAreaLights.needsUpdate=H,M.hemisphereLights.needsUpdate=H}function tc(M){return M.isMeshLambertMaterial||M.isMeshToonMaterial||M.isMeshPhongMaterial||M.isMeshStandardMaterial||M.isShadowMaterial||M.isShaderMaterial&&M.lights===!0}this.getActiveCubeFace=function(){return w},this.getActiveMipmapLevel=function(){return C},this.getRenderTarget=function(){return L},this.setRenderTargetTextures=function(M,H,q){let Y=de.get(M);Y.__autoAllocateDepthBuffer=M.resolveDepthBuffer===!1,Y.__autoAllocateDepthBuffer===!1&&(Y.__useRenderToTexture=!1),de.get(M.texture).__webglTexture=H,de.get(M.depthTexture).__webglTexture=Y.__autoAllocateDepthBuffer?void 0:q,Y.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(M,H){let q=de.get(M);q.__webglFramebuffer=H,q.__useDefaultFramebuffer=H===void 0};let nc=I.createFramebuffer();this.setRenderTarget=function(M,H=0,q=0){L=M,w=H,C=q;let Y=!0,k=null,se=!1,_e=!1;if(M){let ve=de.get(M);if(ve.__useDefaultFramebuffer!==void 0)fe.bindFramebuffer(I.FRAMEBUFFER,null),Y=!1;else if(ve.__webglFramebuffer===void 0)Ce.setupRenderTarget(M);else if(ve.__hasExternalTextures)Ce.rebindTextures(M,de.get(M.texture).__webglTexture,de.get(M.depthTexture).__webglTexture);else if(M.depthBuffer){let Ue=M.depthTexture;if(ve.__boundDepthTexture!==Ue){if(Ue!==null&&de.has(Ue)&&(M.width!==Ue.image.width||M.height!==Ue.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");Ce.setupDepthRenderbuffer(M)}}let Be=M.texture;(Be.isData3DTexture||Be.isDataArrayTexture||Be.isCompressedArrayTexture)&&(_e=!0);let ze=de.get(M).__webglFramebuffer;M.isWebGLCubeRenderTarget?(Array.isArray(ze[H])?k=ze[H][q]:k=ze[H],se=!0):M.samples>0&&Ce.useMultisampledRTT(M)===!1?k=de.get(M).__webglMultisampledFramebuffer:Array.isArray(ze)?k=ze[q]:k=ze,P.copy(M.viewport),U.copy(M.scissor),W=M.scissorTest}else P.copy(Ee).multiplyScalar(X).floor(),U.copy(Ve).multiplyScalar(X).floor(),W=qe;if(q!==0&&(k=nc),fe.bindFramebuffer(I.FRAMEBUFFER,k)&&Y&&fe.drawBuffers(M,k),fe.viewport(P),fe.scissor(U),fe.setScissorTest(W),se){let ve=de.get(M.texture);I.framebufferTexture2D(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_CUBE_MAP_POSITIVE_X+H,ve.__webglTexture,q)}else if(_e){let ve=H;for(let Be=0;Be<M.textures.length;Be++){let ze=de.get(M.textures[Be]);I.framebufferTextureLayer(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0+Be,ze.__webglTexture,q,ve)}}else if(M!==null&&q!==0){let ve=de.get(M.texture);I.framebufferTexture2D(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_2D,ve.__webglTexture,q)}b=-1},this.readRenderTargetPixels=function(M,H,q,Y,k,se,_e,Re=0){if(!(M&&M.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let ve=de.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&_e!==void 0&&(ve=ve[_e]),ve){fe.bindFramebuffer(I.FRAMEBUFFER,ve);try{let Be=M.textures[Re],ze=Be.format,Ue=Be.type;if(!me.textureFormatReadable(ze)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!me.textureTypeReadable(Ue)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}H>=0&&H<=M.width-Y&&q>=0&&q<=M.height-k&&(M.textures.length>1&&I.readBuffer(I.COLOR_ATTACHMENT0+Re),I.readPixels(H,q,Y,k,Ae.convert(ze),Ae.convert(Ue),se))}finally{let Be=L!==null?de.get(L).__webglFramebuffer:null;fe.bindFramebuffer(I.FRAMEBUFFER,Be)}}},this.readRenderTargetPixelsAsync=async function(M,H,q,Y,k,se,_e,Re=0){if(!(M&&M.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let ve=de.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&_e!==void 0&&(ve=ve[_e]),ve)if(H>=0&&H<=M.width-Y&&q>=0&&q<=M.height-k){fe.bindFramebuffer(I.FRAMEBUFFER,ve);let Be=M.textures[Re],ze=Be.format,Ue=Be.type;if(!me.textureFormatReadable(ze))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!me.textureTypeReadable(Ue))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let Ye=I.createBuffer();I.bindBuffer(I.PIXEL_PACK_BUFFER,Ye),I.bufferData(I.PIXEL_PACK_BUFFER,se.byteLength,I.STREAM_READ),M.textures.length>1&&I.readBuffer(I.COLOR_ATTACHMENT0+Re),I.readPixels(H,q,Y,k,Ae.convert(ze),Ae.convert(Ue),0);let nt=L!==null?de.get(L).__webglFramebuffer:null;fe.bindFramebuffer(I.FRAMEBUFFER,nt);let Rt=I.fenceSync(I.SYNC_GPU_COMMANDS_COMPLETE,0);return I.flush(),await Jf(I,Rt,4),I.bindBuffer(I.PIXEL_PACK_BUFFER,Ye),I.getBufferSubData(I.PIXEL_PACK_BUFFER,0,se),I.deleteBuffer(Ye),I.deleteSync(Rt),se}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(M,H=null,q=0){let Y=Math.pow(2,-q),k=Math.floor(M.image.width*Y),se=Math.floor(M.image.height*Y),_e=H!==null?H.x:0,Re=H!==null?H.y:0;Ce.setTexture2D(M,0),I.copyTexSubImage2D(I.TEXTURE_2D,q,0,0,_e,Re,k,se),fe.unbindTexture()};let ic=I.createFramebuffer(),No=I.createFramebuffer();this.copyTextureToTexture=function(M,H,q=null,Y=null,k=0,se=null){se===null&&(k!==0?(Js("WebGLRenderer: copyTextureToTexture function signature has changed to support src and dst mipmap levels."),se=k,k=0):se=0);let _e,Re,ve,Be,ze,Ue,Ye,nt,Rt,yt=M.isCompressedTexture?M.mipmaps[se]:M.image;if(q!==null)_e=q.max.x-q.min.x,Re=q.max.y-q.min.y,ve=q.isBox3?q.max.z-q.min.z:1,Be=q.min.x,ze=q.min.y,Ue=q.isBox3?q.min.z:0;else{let rn=Math.pow(2,-k);_e=Math.floor(yt.width*rn),Re=Math.floor(yt.height*rn),M.isDataArrayTexture?ve=yt.depth:M.isData3DTexture?ve=Math.floor(yt.depth*rn):ve=1,Be=0,ze=0,Ue=0}Y!==null?(Ye=Y.x,nt=Y.y,Rt=Y.z):(Ye=0,nt=0,Rt=0);let ct=Ae.convert(H.format),Ie=Ae.convert(H.type),vt;H.isData3DTexture?(Ce.setTexture3D(H,0),vt=I.TEXTURE_3D):H.isDataArrayTexture||H.isCompressedArrayTexture?(Ce.setTexture2DArray(H,0),vt=I.TEXTURE_2D_ARRAY):(Ce.setTexture2D(H,0),vt=I.TEXTURE_2D),I.pixelStorei(I.UNPACK_FLIP_Y_WEBGL,H.flipY),I.pixelStorei(I.UNPACK_PREMULTIPLY_ALPHA_WEBGL,H.premultiplyAlpha),I.pixelStorei(I.UNPACK_ALIGNMENT,H.unpackAlignment);let st=I.getParameter(I.UNPACK_ROW_LENGTH),Xt=I.getParameter(I.UNPACK_IMAGE_HEIGHT),Vn=I.getParameter(I.UNPACK_SKIP_PIXELS),Ot=I.getParameter(I.UNPACK_SKIP_ROWS),Gn=I.getParameter(I.UNPACK_SKIP_IMAGES);I.pixelStorei(I.UNPACK_ROW_LENGTH,yt.width),I.pixelStorei(I.UNPACK_IMAGE_HEIGHT,yt.height),I.pixelStorei(I.UNPACK_SKIP_PIXELS,Be),I.pixelStorei(I.UNPACK_SKIP_ROWS,ze),I.pixelStorei(I.UNPACK_SKIP_IMAGES,Ue);let Tt=M.isDataArrayTexture||M.isData3DTexture,Ft=H.isDataArrayTexture||H.isData3DTexture;if(M.isDepthTexture){let rn=de.get(M),Et=de.get(H),wt=de.get(rn.__renderTarget),vr=de.get(Et.__renderTarget);fe.bindFramebuffer(I.READ_FRAMEBUFFER,wt.__webglFramebuffer),fe.bindFramebuffer(I.DRAW_FRAMEBUFFER,vr.__webglFramebuffer);for(let ri=0;ri<ve;ri++)Tt&&(I.framebufferTextureLayer(I.READ_FRAMEBUFFER,I.COLOR_ATTACHMENT0,de.get(M).__webglTexture,k,Ue+ri),I.framebufferTextureLayer(I.DRAW_FRAMEBUFFER,I.COLOR_ATTACHMENT0,de.get(H).__webglTexture,se,Rt+ri)),I.blitFramebuffer(Be,ze,_e,Re,Ye,nt,_e,Re,I.DEPTH_BUFFER_BIT,I.NEAREST);fe.bindFramebuffer(I.READ_FRAMEBUFFER,null),fe.bindFramebuffer(I.DRAW_FRAMEBUFFER,null)}else if(k!==0||M.isRenderTargetTexture||de.has(M)){let rn=de.get(M),Et=de.get(H);fe.bindFramebuffer(I.READ_FRAMEBUFFER,ic),fe.bindFramebuffer(I.DRAW_FRAMEBUFFER,No);for(let wt=0;wt<ve;wt++)Tt?I.framebufferTextureLayer(I.READ_FRAMEBUFFER,I.COLOR_ATTACHMENT0,rn.__webglTexture,k,Ue+wt):I.framebufferTexture2D(I.READ_FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_2D,rn.__webglTexture,k),Ft?I.framebufferTextureLayer(I.DRAW_FRAMEBUFFER,I.COLOR_ATTACHMENT0,Et.__webglTexture,se,Rt+wt):I.framebufferTexture2D(I.DRAW_FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_2D,Et.__webglTexture,se),k!==0?I.blitFramebuffer(Be,ze,_e,Re,Ye,nt,_e,Re,I.COLOR_BUFFER_BIT,I.NEAREST):Ft?I.copyTexSubImage3D(vt,se,Ye,nt,Rt+wt,Be,ze,_e,Re):I.copyTexSubImage2D(vt,se,Ye,nt,Be,ze,_e,Re);fe.bindFramebuffer(I.READ_FRAMEBUFFER,null),fe.bindFramebuffer(I.DRAW_FRAMEBUFFER,null)}else Ft?M.isDataTexture||M.isData3DTexture?I.texSubImage3D(vt,se,Ye,nt,Rt,_e,Re,ve,ct,Ie,yt.data):H.isCompressedArrayTexture?I.compressedTexSubImage3D(vt,se,Ye,nt,Rt,_e,Re,ve,ct,yt.data):I.texSubImage3D(vt,se,Ye,nt,Rt,_e,Re,ve,ct,Ie,yt):M.isDataTexture?I.texSubImage2D(I.TEXTURE_2D,se,Ye,nt,_e,Re,ct,Ie,yt.data):M.isCompressedTexture?I.compressedTexSubImage2D(I.TEXTURE_2D,se,Ye,nt,yt.width,yt.height,ct,yt.data):I.texSubImage2D(I.TEXTURE_2D,se,Ye,nt,_e,Re,ct,Ie,yt);I.pixelStorei(I.UNPACK_ROW_LENGTH,st),I.pixelStorei(I.UNPACK_IMAGE_HEIGHT,Xt),I.pixelStorei(I.UNPACK_SKIP_PIXELS,Vn),I.pixelStorei(I.UNPACK_SKIP_ROWS,Ot),I.pixelStorei(I.UNPACK_SKIP_IMAGES,Gn),se===0&&H.generateMipmaps&&I.generateMipmap(vt),fe.unbindTexture()},this.initRenderTarget=function(M){de.get(M).__webglFramebuffer===void 0&&Ce.setupRenderTarget(M)},this.initTexture=function(M){M.isCubeTexture?Ce.setTextureCube(M,0):M.isData3DTexture?Ce.setTexture3D(M,0):M.isDataArrayTexture||M.isCompressedArrayTexture?Ce.setTexture2DArray(M,0):Ce.setTexture2D(M,0),fe.unbindTexture()},this.resetState=function(){w=0,C=0,L=null,fe.reset(),ge.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Nn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=at._getDrawingBufferColorSpace(e),t.unpackColorSpace=at._getUnpackColorSpace()}};var Pp={ur3:{links:[{x:0,y:0,z:.1519,roll:0,pitch:0,yaw:0},{x:0,y:0,z:0,roll:1.570796327,pitch:0,yaw:0},{x:-.24365,y:0,z:0,roll:0,pitch:0,yaw:0},{x:-.21325,y:0,z:.11235,roll:0,pitch:0,yaw:0},{x:0,y:-.08535,z:-1750557762378351e-26,roll:1.570796327,pitch:0,yaw:0},{x:0,y:.0819,z:-1679797079540562e-26,roll:1.570796326589793,pitch:3.141592653589793,yaw:3.141592653589793}],jointLimits:[[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-3.141592654,3.141592654],[-6.283185307,6.283185307],[-6.283185307,6.283185307],null]},ur5:{links:[{x:0,y:0,z:.089159,roll:0,pitch:0,yaw:0},{x:0,y:0,z:0,roll:1.570796327,pitch:0,yaw:0},{x:-.425,y:0,z:0,roll:0,pitch:0,yaw:0},{x:-.39225,y:0,z:.10915,roll:0,pitch:0,yaw:0},{x:0,y:-.09465,z:-1941303950897609e-26,roll:1.570796327,pitch:0,yaw:0},{x:0,y:.0823,z:-1688001216681175e-26,roll:1.570796326589793,pitch:3.141592653589793,yaw:3.141592653589793}],jointLimits:[[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-3.141592654,3.141592654],[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-6.283185307,6.283185307]]},ur10:{links:[{x:0,y:0,z:.1273,roll:0,pitch:0,yaw:0},{x:0,y:0,z:0,roll:1.570796327,pitch:0,yaw:0},{x:-.612,y:0,z:0,roll:0,pitch:0,yaw:0},{x:-.5723,y:0,z:.163941,roll:0,pitch:0,yaw:0},{x:0,y:-.1157,z:-2373046667922381e-26,roll:1.570796327,pitch:0,yaw:0},{x:0,y:.0922,z:-1891053610911353e-26,roll:1.570796326589793,pitch:3.141592653589793,yaw:3.141592653589793}],jointLimits:[[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-3.141592654,3.141592654],[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-6.283185307,6.283185307]]},ur3e:{links:[{x:0,y:0,z:.15185,roll:0,pitch:0,yaw:0},{x:0,y:0,z:0,roll:1.570796327,pitch:0,yaw:0},{x:-.24355,y:0,z:0,roll:0,pitch:0,yaw:0},{x:-.2132,y:0,z:.13105,roll:0,pitch:0,yaw:0},{x:0,y:-.08535,z:-1750557762378351e-26,roll:1.570796327,pitch:0,yaw:0},{x:0,y:.0921,z:-18890025766262e-24,roll:1.570796326589793,pitch:3.141592653589793,yaw:3.141592653589793}],jointLimits:[[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-3.141592654,3.141592654],[-6.283185307,6.283185307],[-6.283185307,6.283185307],null]},ur5e:{links:[{x:0,y:0,z:.1625,roll:0,pitch:0,yaw:0},{x:0,y:0,z:0,roll:1.570796327,pitch:0,yaw:0},{x:-.425,y:0,z:0,roll:0,pitch:0,yaw:0},{x:-.3922,y:0,z:.1333,roll:0,pitch:0,yaw:0},{x:0,y:-.0997,z:-2044881182297852e-26,roll:1.570796327,pitch:0,yaw:0},{x:0,y:.0996,z:-2042830148012698e-26,roll:1.570796326589793,pitch:3.141592653589793,yaw:3.141592653589793}],jointLimits:[[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-3.141592654,3.141592654],[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-6.283185307,6.283185307]]},ur7e:{links:[{x:0,y:0,z:.1625,roll:0,pitch:0,yaw:0},{x:0,y:0,z:0,roll:1.570796327,pitch:0,yaw:0},{x:-.425,y:0,z:0,roll:0,pitch:0,yaw:0},{x:-.3922,y:0,z:.1333,roll:0,pitch:0,yaw:0},{x:0,y:-.0997,z:-2044881182297852e-26,roll:1.570796327,pitch:0,yaw:0},{x:0,y:.0996,z:-2042830148012698e-26,roll:1.570796326589793,pitch:3.141592653589793,yaw:3.141592653589793}],jointLimits:[[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-3.141592654,3.141592654],[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-6.283185307,6.283185307]]},ur10e:{links:[{x:0,y:0,z:.1807,roll:0,pitch:0,yaw:0},{x:0,y:0,z:0,roll:1.570796327,pitch:0,yaw:0},{x:-.6127,y:0,z:0,roll:0,pitch:0,yaw:0},{x:-.57155,y:0,z:.17415,roll:0,pitch:0,yaw:0},{x:0,y:-.11985,z:-2458164590756244e-26,roll:1.570796327,pitch:0,yaw:0},{x:0,y:.11655,z:-2390480459346185e-26,roll:1.570796326589793,pitch:3.141592653589793,yaw:3.141592653589793}],jointLimits:[[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-3.141592654,3.141592654],[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-6.283185307,6.283185307]]},ur12e:{links:[{x:0,y:0,z:.1807,roll:0,pitch:0,yaw:0},{x:0,y:0,z:0,roll:1.570796327,pitch:0,yaw:0},{x:-.6127,y:0,z:0,roll:0,pitch:0,yaw:0},{x:-.57155,y:0,z:.17415,roll:0,pitch:0,yaw:0},{x:0,y:-.11985,z:-2458164590756244e-26,roll:1.570796327,pitch:0,yaw:0},{x:0,y:.11655,z:-2390480459346185e-26,roll:1.570796326589793,pitch:3.141592653589793,yaw:3.141592653589793}],jointLimits:[[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-3.141592654,3.141592654],[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-6.283185307,6.283185307]]},ur16e:{links:[{x:0,y:0,z:.1807,roll:0,pitch:0,yaw:0},{x:0,y:0,z:0,roll:1.570796327,pitch:0,yaw:0},{x:-.4784,y:0,z:0,roll:0,pitch:0,yaw:0},{x:-.36,y:0,z:.17415,roll:0,pitch:0,yaw:0},{x:0,y:-.11985,z:-2458164590756244e-26,roll:1.570796327,pitch:0,yaw:0},{x:0,y:.11655,z:-2390480459346185e-26,roll:1.570796326589793,pitch:3.141592653589793,yaw:3.141592653589793}],jointLimits:[[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-3.141592654,3.141592654],[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-6.283185307,6.283185307]]},ur8long:{links:[{x:0,y:0,z:.2186,roll:0,pitch:0,yaw:0},{x:0,y:0,z:0,roll:1.570796327,pitch:0,yaw:0},{x:-.8989,y:0,z:0,roll:0,pitch:0,yaw:0},{x:-.7149,y:0,z:.1824,roll:0,pitch:0,yaw:0},{x:0,y:-.1361,z:-2791457662093657e-26,roll:1.570796327,pitch:0,yaw:0},{x:0,y:.1434,z:-2941183164909849e-26,roll:1.570796326589793,pitch:3.141592653589793,yaw:3.141592653589793}],jointLimits:[[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-3.141592654,3.141592654],[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-6.283185307,6.283185307]]},ur15:{links:[{x:0,y:0,z:.2186,roll:0,pitch:0,yaw:0},{x:0,y:0,z:0,roll:1.570796327,pitch:0,yaw:0},{x:-.6475,y:0,z:0,roll:0,pitch:0,yaw:0},{x:-.5164,y:0,z:.1824,roll:0,pitch:0,yaw:0},{x:0,y:-.1361,z:-2791457662093657e-26,roll:1.570796327,pitch:0,yaw:0},{x:0,y:.1434,z:-2941183164909849e-26,roll:1.570796326589793,pitch:3.141592653589793,yaw:3.141592653589793}],jointLimits:[[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-3.141592654,3.141592654],[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-6.283185307,6.283185307]]},ur18:{links:[{x:0,y:0,z:.2186,roll:0,pitch:0,yaw:0},{x:0,y:0,z:0,roll:1.570796327,pitch:0,yaw:0},{x:-.475,y:0,z:0,roll:0,pitch:0,yaw:0},{x:-.3389,y:0,z:.1824,roll:0,pitch:0,yaw:0},{x:0,y:-.1361,z:-2791457662093657e-26,roll:1.570796327,pitch:0,yaw:0},{x:0,y:.1434,z:-2941183164909849e-26,roll:1.570796326589793,pitch:3.141592653589793,yaw:3.141592653589793}],jointLimits:[[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-3.141592654,3.141592654],[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-6.283185307,6.283185307]]},ur20:{links:[{x:0,y:0,z:.2363,roll:0,pitch:0,yaw:0},{x:0,y:0,z:0,roll:1.570796327,pitch:0,yaw:0},{x:-.862,y:0,z:0,roll:0,pitch:0,yaw:0},{x:-.7287,y:0,z:.201,roll:0,pitch:0,yaw:0},{x:0,y:-.1593,z:-3267297616249225e-26,roll:1.570796327,pitch:0,yaw:0},{x:0,y:.1543,z:-31647459019915597e-27,roll:1.570796326589793,pitch:3.141592653589793,yaw:3.141592653589793}],jointLimits:[[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-3.141592654,3.141592654],[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-6.283185307,6.283185307]]},ur30:{links:[{x:0,y:0,z:.2363,roll:0,pitch:0,yaw:0},{x:0,y:0,z:0,roll:1.570796327,pitch:0,yaw:0},{x:-.637,y:0,z:0,roll:0,pitch:0,yaw:0},{x:-.5037,y:0,z:.201,roll:0,pitch:0,yaw:0},{x:0,y:-.1593,z:-3267297616249225e-26,roll:1.570796327,pitch:0,yaw:0},{x:0,y:.1543,z:-31647459019915597e-27,roll:1.570796326589793,pitch:3.141592653589793,yaw:3.141592653589793}],jointLimits:[[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-3.141592654,3.141592654],[-6.283185307,6.283185307],[-6.283185307,6.283185307],[-6.283185307,6.283185307]]}};var Ip={type:"change"},Fu={type:"start"},Dp={type:"end"},Vl=new gi,Lp=new Tn,Db=Math.cos(70*To.DEG2RAD),Gt=new D,pn=2*Math.PI,bt={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},Ou=1e-6,Gl=class extends _o{constructor(e,t=null){super(e,t),this.state=bt.NONE,this.target=new D,this.cursor=new D,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:Ui.ROTATE,MIDDLE:Ui.DOLLY,RIGHT:Ui.PAN},this.touches={ONE:Bi.ROTATE,TWO:Bi.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._domElementKeyEvents=null,this._lastPosition=new D,this._lastQuaternion=new ln,this._lastTargetPosition=new D,this._quat=new ln().setFromUnitVectors(e.up,new D(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new sr,this._sphericalDelta=new sr,this._scale=1,this._panOffset=new D,this._rotateStart=new De,this._rotateEnd=new De,this._rotateDelta=new De,this._panStart=new De,this._panEnd=new De,this._panDelta=new De,this._dollyStart=new De,this._dollyEnd=new De,this._dollyDelta=new De,this._dollyDirection=new D,this._mouse=new De,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=Ob.bind(this),this._onPointerDown=Nb.bind(this),this._onPointerUp=Fb.bind(this),this._onContextMenu=Gb.bind(this),this._onMouseWheel=kb.bind(this),this._onKeyDown=zb.bind(this),this._onTouchStart=Hb.bind(this),this._onTouchMove=Vb.bind(this),this._onMouseDown=Ub.bind(this),this._onMouseMove=Bb.bind(this),this._interceptControlDown=Wb.bind(this),this._interceptControlUp=$b.bind(this),this.domElement!==null&&this.connect(this.domElement),this.update()}connect(e){super.connect(e),this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents(),this.domElement.getRootNode().removeEventListener("keydown",this._interceptControlDown,{capture:!0}),this.domElement.style.touchAction="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(e){e.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=e}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(Ip),this.update(),this.state=bt.NONE}update(e=null){let t=this.object.position;Gt.copy(t).sub(this.target),Gt.applyQuaternion(this._quat),this._spherical.setFromVector3(Gt),this.autoRotate&&this.state===bt.NONE&&this._rotateLeft(this._getAutoRotationAngle(e)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let i=this.minAzimuthAngle,s=this.maxAzimuthAngle;isFinite(i)&&isFinite(s)&&(i<-Math.PI?i+=pn:i>Math.PI&&(i-=pn),s<-Math.PI?s+=pn:s>Math.PI&&(s-=pn),i<=s?this._spherical.theta=Math.max(i,Math.min(s,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(i+s)/2?Math.max(i,this._spherical.theta):Math.min(s,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let r=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{let o=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),r=o!=this._spherical.radius}if(Gt.setFromSpherical(this._spherical),Gt.applyQuaternion(this._quatInverse),t.copy(this.target).add(Gt),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let o=null;if(this.object.isPerspectiveCamera){let a=Gt.length();o=this._clampDistance(a*this._scale);let c=a-o;this.object.position.addScaledVector(this._dollyDirection,c),this.object.updateMatrixWorld(),r=!!c}else if(this.object.isOrthographicCamera){let a=new D(this._mouse.x,this._mouse.y,0);a.unproject(this.object);let c=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),r=c!==this.object.zoom;let l=new D(this._mouse.x,this._mouse.y,0);l.unproject(this.object),this.object.position.sub(l).add(a),this.object.updateMatrixWorld(),o=Gt.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;o!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(o).add(this.object.position):(Vl.origin.copy(this.object.position),Vl.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(Vl.direction))<Db?this.object.lookAt(this.target):(Lp.setFromNormalAndCoplanarPoint(this.object.up,this.target),Vl.intersectPlane(Lp,this.target))))}else if(this.object.isOrthographicCamera){let o=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),o!==this.object.zoom&&(this.object.updateProjectionMatrix(),r=!0)}return this._scale=1,this._performCursorZoom=!1,r||this._lastPosition.distanceToSquared(this.object.position)>Ou||8*(1-this._lastQuaternion.dot(this.object.quaternion))>Ou||this._lastTargetPosition.distanceToSquared(this.target)>Ou?(this.dispatchEvent(Ip),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(e){return e!==null?pn/60*this.autoRotateSpeed*e:pn/60/60*this.autoRotateSpeed}_getZoomScale(e){let t=Math.abs(e*.01);return Math.pow(.95,this.zoomSpeed*t)}_rotateLeft(e){this._sphericalDelta.theta-=e}_rotateUp(e){this._sphericalDelta.phi-=e}_panLeft(e,t){Gt.setFromMatrixColumn(t,0),Gt.multiplyScalar(-e),this._panOffset.add(Gt)}_panUp(e,t){this.screenSpacePanning===!0?Gt.setFromMatrixColumn(t,1):(Gt.setFromMatrixColumn(t,0),Gt.crossVectors(this.object.up,Gt)),Gt.multiplyScalar(e),this._panOffset.add(Gt)}_pan(e,t){let i=this.domElement;if(this.object.isPerspectiveCamera){let s=this.object.position;Gt.copy(s).sub(this.target);let r=Gt.length();r*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*e*r/i.clientHeight,this.object.matrix),this._panUp(2*t*r/i.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(e*(this.object.right-this.object.left)/this.object.zoom/i.clientWidth,this.object.matrix),this._panUp(t*(this.object.top-this.object.bottom)/this.object.zoom/i.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(e,t){if(!this.zoomToCursor)return;this._performCursorZoom=!0;let i=this.domElement.getBoundingClientRect(),s=e-i.left,r=t-i.top,o=i.width,a=i.height;this._mouse.x=s/o*2-1,this._mouse.y=-(r/a)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(e){return Math.max(this.minDistance,Math.min(this.maxDistance,e))}_handleMouseDownRotate(e){this._rotateStart.set(e.clientX,e.clientY)}_handleMouseDownDolly(e){this._updateZoomParameters(e.clientX,e.clientX),this._dollyStart.set(e.clientX,e.clientY)}_handleMouseDownPan(e){this._panStart.set(e.clientX,e.clientY)}_handleMouseMoveRotate(e){this._rotateEnd.set(e.clientX,e.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(pn*this._rotateDelta.x/t.clientHeight),this._rotateUp(pn*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(e){this._dollyEnd.set(e.clientX,e.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(e){this._panEnd.set(e.clientX,e.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(e){this._updateZoomParameters(e.clientX,e.clientY),e.deltaY<0?this._dollyIn(this._getZoomScale(e.deltaY)):e.deltaY>0&&this._dollyOut(this._getZoomScale(e.deltaY)),this.update()}_handleKeyDown(e){let t=!1;switch(e.code){case this.keys.UP:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(pn*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),t=!0;break;case this.keys.BOTTOM:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(-pn*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),t=!0;break;case this.keys.LEFT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(pn*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),t=!0;break;case this.keys.RIGHT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(-pn*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),t=!0;break}t&&(e.preventDefault(),this.update())}_handleTouchStartRotate(e){if(this._pointers.length===1)this._rotateStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),i=.5*(e.pageX+t.x),s=.5*(e.pageY+t.y);this._rotateStart.set(i,s)}}_handleTouchStartPan(e){if(this._pointers.length===1)this._panStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),i=.5*(e.pageX+t.x),s=.5*(e.pageY+t.y);this._panStart.set(i,s)}}_handleTouchStartDolly(e){let t=this._getSecondPointerPosition(e),i=e.pageX-t.x,s=e.pageY-t.y,r=Math.sqrt(i*i+s*s);this._dollyStart.set(0,r)}_handleTouchStartDollyPan(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enablePan&&this._handleTouchStartPan(e)}_handleTouchStartDollyRotate(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enableRotate&&this._handleTouchStartRotate(e)}_handleTouchMoveRotate(e){if(this._pointers.length==1)this._rotateEnd.set(e.pageX,e.pageY);else{let i=this._getSecondPointerPosition(e),s=.5*(e.pageX+i.x),r=.5*(e.pageY+i.y);this._rotateEnd.set(s,r)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(pn*this._rotateDelta.x/t.clientHeight),this._rotateUp(pn*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(e){if(this._pointers.length===1)this._panEnd.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),i=.5*(e.pageX+t.x),s=.5*(e.pageY+t.y);this._panEnd.set(i,s)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(e){let t=this._getSecondPointerPosition(e),i=e.pageX-t.x,s=e.pageY-t.y,r=Math.sqrt(i*i+s*s);this._dollyEnd.set(0,r),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);let o=(e.pageX+t.x)*.5,a=(e.pageY+t.y)*.5;this._updateZoomParameters(o,a)}_handleTouchMoveDollyPan(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enablePan&&this._handleTouchMovePan(e)}_handleTouchMoveDollyRotate(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enableRotate&&this._handleTouchMoveRotate(e)}_addPointer(e){this._pointers.push(e.pointerId)}_removePointer(e){delete this._pointerPositions[e.pointerId];for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId){this._pointers.splice(t,1);return}}_isTrackingPointer(e){for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId)return!0;return!1}_trackPointer(e){let t=this._pointerPositions[e.pointerId];t===void 0&&(t=new De,this._pointerPositions[e.pointerId]=t),t.set(e.pageX,e.pageY)}_getSecondPointerPosition(e){let t=e.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[t]}_customWheelEvent(e){let t=e.deltaMode,i={clientX:e.clientX,clientY:e.clientY,deltaY:e.deltaY};switch(t){case 1:i.deltaY*=16;break;case 2:i.deltaY*=100;break}return e.ctrlKey&&!this._controlActive&&(i.deltaY*=10),i}};function Nb(n){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(n.pointerId),this.domElement.addEventListener("pointermove",this._onPointerMove),this.domElement.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(n)&&(this._addPointer(n),n.pointerType==="touch"?this._onTouchStart(n):this._onMouseDown(n)))}function Ob(n){this.enabled!==!1&&(n.pointerType==="touch"?this._onTouchMove(n):this._onMouseMove(n))}function Fb(n){switch(this._removePointer(n),this._pointers.length){case 0:this.domElement.releasePointerCapture(n.pointerId),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(Dp),this.state=bt.NONE;break;case 1:let e=this._pointers[0],t=this._pointerPositions[e];this._onTouchStart({pointerId:e,pageX:t.x,pageY:t.y});break}}function Ub(n){let e;switch(n.button){case 0:e=this.mouseButtons.LEFT;break;case 1:e=this.mouseButtons.MIDDLE;break;case 2:e=this.mouseButtons.RIGHT;break;default:e=-1}switch(e){case Ui.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(n),this.state=bt.DOLLY;break;case Ui.ROTATE:if(n.ctrlKey||n.metaKey||n.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(n),this.state=bt.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(n),this.state=bt.ROTATE}break;case Ui.PAN:if(n.ctrlKey||n.metaKey||n.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(n),this.state=bt.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(n),this.state=bt.PAN}break;default:this.state=bt.NONE}this.state!==bt.NONE&&this.dispatchEvent(Fu)}function Bb(n){switch(this.state){case bt.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(n);break;case bt.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(n);break;case bt.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(n);break}}function kb(n){this.enabled===!1||this.enableZoom===!1||this.state!==bt.NONE||(n.preventDefault(),this.dispatchEvent(Fu),this._handleMouseWheel(this._customWheelEvent(n)),this.dispatchEvent(Dp))}function zb(n){this.enabled!==!1&&this._handleKeyDown(n)}function Hb(n){switch(this._trackPointer(n),this._pointers.length){case 1:switch(this.touches.ONE){case Bi.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(n),this.state=bt.TOUCH_ROTATE;break;case Bi.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(n),this.state=bt.TOUCH_PAN;break;default:this.state=bt.NONE}break;case 2:switch(this.touches.TWO){case Bi.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(n),this.state=bt.TOUCH_DOLLY_PAN;break;case Bi.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(n),this.state=bt.TOUCH_DOLLY_ROTATE;break;default:this.state=bt.NONE}break;default:this.state=bt.NONE}this.state!==bt.NONE&&this.dispatchEvent(Fu)}function Vb(n){switch(this._trackPointer(n),this.state){case bt.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(n),this.update();break;case bt.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(n),this.update();break;case bt.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(n),this.update();break;case bt.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(n),this.update();break;default:this.state=bt.NONE}}function Gb(n){this.enabled!==!1&&n.preventDefault()}function Wb(n){n.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function $b(n){n.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}var Wl=class extends es{constructor(){super();let e=new Ni;e.deleteAttribute("uv");let t=new hn({side:zt}),i=new hn,s=new os(16777215,900,28,2);s.position.set(.418,16.199,.3),this.add(s);let r=new ht(e,t);r.position.set(-.757,13.219,.717),r.scale.set(31.713,28.305,28.591),this.add(r);let o=new ns(e,i,6),a=new Mt;a.position.set(-10.906,2.009,1.846),a.rotation.set(0,-.195,0),a.scale.set(2.328,7.905,4.651),a.updateMatrix(),o.setMatrixAt(0,a.matrix),a.position.set(-5.607,-.754,-.758),a.rotation.set(0,.994,0),a.scale.set(1.97,1.534,3.955),a.updateMatrix(),o.setMatrixAt(1,a.matrix),a.position.set(6.167,.857,7.803),a.rotation.set(0,.561,0),a.scale.set(3.927,6.285,3.687),a.updateMatrix(),o.setMatrixAt(2,a.matrix),a.position.set(-2.017,.018,6.124),a.rotation.set(0,.333,0),a.scale.set(2.002,4.566,2.064),a.updateMatrix(),o.setMatrixAt(3,a.matrix),a.position.set(2.291,-.756,-2.621),a.rotation.set(0,-.286,0),a.scale.set(1.546,1.552,1.496),a.updateMatrix(),o.setMatrixAt(4,a.matrix),a.position.set(-2.193,-.369,-5.547),a.rotation.set(0,.516,0),a.scale.set(3.875,3.487,2.986),a.updateMatrix(),o.setMatrixAt(5,a.matrix),this.add(o);let c=new ht(e,gr(50));c.position.set(-16.116,14.37,8.208),c.scale.set(.1,2.428,2.739),this.add(c);let l=new ht(e,gr(50));l.position.set(-16.109,18.021,-8.207),l.scale.set(.1,2.425,2.751),this.add(l);let h=new ht(e,gr(17));h.position.set(14.904,12.198,-1.832),h.scale.set(.15,4.265,6.331),this.add(h);let u=new ht(e,gr(43));u.position.set(-.462,8.89,14.52),u.scale.set(4.38,5.441,.088),this.add(u);let d=new ht(e,gr(20));d.position.set(3.235,11.486,-12.541),d.scale.set(2.5,2,.1),this.add(d);let f=new ht(e,gr(100));f.position.set(0,20,0),f.scale.set(1,.1,1),this.add(f)}dispose(){let e=new Set;this.traverse(t=>{t.isMesh&&(e.add(t.geometry),e.add(t.material))});for(let t of e)t.dispose()}};function gr(n){return new ro({color:0,emissive:16777215,emissiveIntensity:n})}var zi=Object.freeze({light:Object.freeze({center:10135476,grid:13226973}),dark:Object.freeze({center:3359829,grid:2241348})});function Np(n=2,e=20,t=zi.dark){let i=t??zi.dark,s=new po(n,e,i.center,i.grid);return s.name="base_grid",s.rotation.x=Math.PI/2,s.userData.size=n,s.userData.divisions=e,s}function Xb(n,e=zi.dark){let t=e??zi.dark,i=n?.geometry?.getAttribute?.("color"),s=n?.userData?.divisions;if(!i||!Number.isFinite(s)||s<=0)return!1;let r=s/2,o=new Ne(t.center),a=new Ne(t.grid),c=!1;for(let l=0;l<=s;l++){let h=l===r?o:a;for(let u=0;u<4;u++){let d=l*4+u;if(d>=i.count)break;i.setXYZ(d,h.r,h.g,h.b),c=!0}}return i.needsUpdate=!0,c}var $l=Object.freeze({fov:45,near:.01,far:100,position:Object.freeze([.8,-.8,.6])}),Uu=Object.freeze({ambientIntensity:.8,directionalIntensity:1.2,directionalPosition:Object.freeze([1,2,1])}),Op={iso:{label:"\u7B49\u8F74\u6D4B",direction:[1,-1,.8]},front:{label:"\u524D\u89C6",direction:[0,-1,0]},side:{label:"\u4FA7\u89C6",direction:[1,0,0]},top:{label:"\u4FEF\u89C6",direction:[.02,-.02,1]}},Fp="iso",Bu=1.25;function Yb(n,e=45,t=1,i=Bu){let s=Number.isFinite(n)&&n>0?n:1,o=(Number.isFinite(e)&&e>0&&e<180?e:45)*Math.PI/180,a=s/Math.sin(o/2),c=Number.isFinite(t)&&t>0?t:1,l=2*Math.atan(Math.tan(o/2)*c),h=s/Math.sin(l/2),u=Number.isFinite(i)&&i>0?i:Bu;return Math.max(a,h)*u}function qb(n){let t=(Number.isFinite(n)&&n>0?n:1)*2*1.5,i=Math.max(.5,Math.ceil(t*2)/2),s=Math.min(40,Math.max(8,Math.round(i/.1)));return{size:i,divisions:s}}function Up(n,{maxPixelRatio:e=2,rendererFactory:t,theme:i="dark"}={}){let s=typeof t=="function"?t(n):new zl({canvas:n,antialias:!0,alpha:!0});s.toneMapping=Ja,s.toneMappingExposure=1;let r=new es,o=null,a=null;try{a=new pr(s),o=a.fromScene(new Wl,.04),r.environment=o.texture}catch{o=null,a=null}let c=new It($l.fov,1,$l.near,$l.far);c.up.set(0,0,1),c.position.set(...$l.position);let l=i==="light"?"light":"dark",h=zi[l]??zi.dark,u=Np(2,20,h);r.add(new ho(16777215,Uu.ambientIntensity));let d=new ls(16777215,Uu.directionalIntensity);d.position.set(...Uu.directionalPosition),r.add(d),r.add(u);let f=new Gl(c,n);f.enableDamping=!0,f.target.set(0,0,.3),f.minDistance=.15,f.maxDistance=6;let g=null,y=new Set;f.addEventListener?.("change",()=>{for(let C of y)try{C()}catch{}});function m(C){let{size:L,divisions:b}=qb(C);if(!(u?.userData?.size===L&&u?.userData?.divisions===b)){if(u){r.remove(u);try{u.geometry?.dispose?.(),u.material?.dispose?.()}catch{}}u=Np(L,b,h),u.userData.size=L,u.userData.divisions=b,r.add(u)}}function p(C){let L=C==="light"?"light":"dark";return L===l?!1:(l=L,h=zi[l]??zi.dark,u&&Xb(u,h),!0)}function E(){let{clientWidth:C,clientHeight:L}=n;if(C===0||L===0)return!1;let b=Math.min(e,Math.max(1,typeof globalThis<"u"&&globalThis.devicePixelRatio||1));return s.setPixelRatio(b),s.setSize(C,L,!1),c.aspect=C/L,c.updateProjectionMatrix(),!0}function T(C,{padding:L=Bu,minRadius:b=0}={}){if(!C)return!1;C.updateMatrixWorld?.(!0);let x=null;try{let J=new cn().setFromObject(C);J.isEmpty()||(x=J.getBoundingSphere(new Zt))}catch{x=null}let P=x&&Number.isFinite(x.radius)&&x.radius>0?x.radius:.5,U=Number.isFinite(b)&&b>0?b:0,W=Math.max(P,U);return g={center:x?x.center.clone():new D(0,0,.3),radius:W,padding:L},m(W),f.minDistance=W*.15,f.maxDistance=W*12,c.near=Math.max(.001,W/100),c.far=Math.max(10,W*100),c.updateProjectionMatrix(),v(Fp)}function v(C){if(g===null)return!1;let L=Op[C]??Op[Fp],b=new D(...L.direction).normalize(),x=Yb(g.radius,c.fov,c.aspect,g.padding);return f.target.copy(g.center),c.position.copy(g.center).addScaledVector(b,x),c.lookAt(g.center),f.update(),!0}function R(){f.update(),s.render(r,c)}function w(){f.dispose(),y.clear();try{u?.geometry?.dispose?.(),u?.material?.dispose?.()}catch{}u&&r.remove(u),u=null;try{o?.dispose?.(),a?.dispose?.()}catch{}o=null;try{s.forceContextLoss?.()}catch{}s.dispose()}return{renderer:s,scene:r,camera:c,controls:f,get grid(){return u},currentFitRadius(){return g?.radius??0},resize:E,render:R,fitTo:T,setViewPreset:v,applyTheme:p,onCameraChange(C){y.add(C)},dispose:w}}var _r=.08,jb=.12,Jb=.03,Kb=.3,Bp=Object.freeze([Object.freeze({text:"X",color:16725587}),Object.freeze({text:"Y",color:9240374}),Object.freeze({text:"Z",color:3580671})]);function kp(n){return!Number.isFinite(n)||n<=0?_r:Math.min(Kb,Math.max(Jb,n*jb))}function Zb(n,e){try{let t=document.createElement("canvas");t.width=64,t.height=64;let i=t.getContext("2d");if(!i)return null;i.font="bold 44px sans-serif",i.textAlign="center",i.textBaseline="middle",i.lineWidth=6,i.strokeStyle="rgba(8, 12, 16, 0.9)",i.strokeText(n,32,34),i.fillStyle=`#${new Ne(e).getHexString()}`,i.fillText(n,32,34);let s=new eo(t);return s.needsUpdate=!0,s}catch{return null}}function ku(n=_r){let e=new Lt;e.name="ursim-twin-tcp-axes";let t=new Lt;t.name="ursim-twin-tcp-axes-content",e.add(t);let i=new go(n);i.name="ursim-twin-tcp-axes-lines",t.add(i);let s=new Lt;s.name="ursim-twin-tcp-axes-labels";let r=[];for(let o=0;o<Bp.length;o++){let{text:a,color:c}=Bp[o],l=Zb(a,c);if(l===null)continue;let h=new Qs({map:l,transparent:!0,depthTest:!1}),u=new qr(h),d=n*1.12;u.position.set(o===0?d:0,o===1?d:0,o===2?d:0),u.scale.setScalar(n*.45),u.name=`ursim-twin-tcp-axis-${a.toLowerCase()}`,s.add(u),r.push(u)}return t.add(s),e.userData.content=t,e.userData.axes=i,e.userData.labels=r,e}function zp(n,e){let t=_r,i=Number.isFinite(e)&&e>0?e/t:1;n?.userData?.content?.scale?.setScalar?.(i)}function Hp(n){n?.traverse?.(e=>{e.geometry?.dispose?.();let t=e.material;if(Array.isArray(t))for(let i of t)i?.map?.dispose?.(),i?.dispose?.();else t&&(t.map?.dispose?.(),t.dispose?.())})}function zu(n,e){if(e===hu)return console.warn("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles."),n;if(e===ur||e===Mo){let t=n.getIndex();if(t===null){let o=[],a=n.getAttribute("position");if(a!==void 0){for(let c=0;c<a.count;c++)o.push(c);n.setIndex(o),t=n.getIndex()}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible."),n}let i=t.count-2,s=[];if(e===ur)for(let o=1;o<=i;o++)s.push(t.getX(0)),s.push(t.getX(o)),s.push(t.getX(o+1));else for(let o=0;o<i;o++)o%2===0?(s.push(t.getX(o)),s.push(t.getX(o+1)),s.push(t.getX(o+2))):(s.push(t.getX(o+2)),s.push(t.getX(o+1)),s.push(t.getX(o)));s.length/3!==i&&console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.");let r=n.clone();return r.setIndex(s),r.clearGroups(),r}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:",e),n}var Xl=class extends Qn{constructor(e){super(e),this.dracoLoader=null,this.ktx2Loader=null,this.meshoptDecoder=null,this.pluginCallbacks=[],this.register(function(t){return new Yu(t)}),this.register(function(t){return new qu(t)}),this.register(function(t){return new ih(t)}),this.register(function(t){return new sh(t)}),this.register(function(t){return new rh(t)}),this.register(function(t){return new Ju(t)}),this.register(function(t){return new Ku(t)}),this.register(function(t){return new Zu(t)}),this.register(function(t){return new Qu(t)}),this.register(function(t){return new Xu(t)}),this.register(function(t){return new eh(t)}),this.register(function(t){return new ju(t)}),this.register(function(t){return new nh(t)}),this.register(function(t){return new th(t)}),this.register(function(t){return new Wu(t)}),this.register(function(t){return new oh(t)}),this.register(function(t){return new ah(t)})}load(e,t,i,s){let r=this,o;if(this.resourcePath!=="")o=this.resourcePath;else if(this.path!==""){let l=vi.extractUrlBase(e);o=vi.resolveURL(l,this.path)}else o=vi.extractUrlBase(e);this.manager.itemStart(e);let a=function(l){s?s(l):console.error(l),r.manager.itemError(e),r.manager.itemEnd(e)},c=new ir(this.manager);c.setPath(this.path),c.setResponseType("arraybuffer"),c.setRequestHeader(this.requestHeader),c.setWithCredentials(this.withCredentials),c.load(e,function(l){try{r.parse(l,o,function(h){t(h),r.manager.itemEnd(e)},a)}catch(h){a(h)}},i,a)}setDRACOLoader(e){return this.dracoLoader=e,this}setKTX2Loader(e){return this.ktx2Loader=e,this}setMeshoptDecoder(e){return this.meshoptDecoder=e,this}register(e){return this.pluginCallbacks.indexOf(e)===-1&&this.pluginCallbacks.push(e),this}unregister(e){return this.pluginCallbacks.indexOf(e)!==-1&&this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(e),1),this}parse(e,t,i,s){let r,o={},a={},c=new TextDecoder;if(typeof e=="string")r=JSON.parse(e);else if(e instanceof ArrayBuffer)if(c.decode(new Uint8Array(e,0,4))===Xp){try{o[rt.KHR_BINARY_GLTF]=new lh(e)}catch(u){s&&s(u);return}r=JSON.parse(o[rt.KHR_BINARY_GLTF].content)}else r=JSON.parse(c.decode(e));else r=e;if(r.asset===void 0||r.asset.version[0]<2){s&&s(new Error("THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported."));return}let l=new mh(r,{path:t||this.resourcePath||"",crossOrigin:this.crossOrigin,requestHeader:this.requestHeader,manager:this.manager,ktx2Loader:this.ktx2Loader,meshoptDecoder:this.meshoptDecoder});l.fileLoader.setRequestHeader(this.requestHeader);for(let h=0;h<this.pluginCallbacks.length;h++){let u=this.pluginCallbacks[h](l);u.name||console.error("THREE.GLTFLoader: Invalid plugin found: missing name"),a[u.name]=u,o[u.name]=!0}if(r.extensionsUsed)for(let h=0;h<r.extensionsUsed.length;++h){let u=r.extensionsUsed[h],d=r.extensionsRequired||[];switch(u){case rt.KHR_MATERIALS_UNLIT:o[u]=new $u;break;case rt.KHR_DRACO_MESH_COMPRESSION:o[u]=new ch(r,this.dracoLoader);break;case rt.KHR_TEXTURE_TRANSFORM:o[u]=new uh;break;case rt.KHR_MESH_QUANTIZATION:o[u]=new hh;break;default:d.indexOf(u)>=0&&a[u]===void 0&&console.warn('THREE.GLTFLoader: Unknown extension "'+u+'".')}}l.setExtensions(o),l.setPlugins(a),l.parse(i,s)}parseAsync(e,t){let i=this;return new Promise(function(s,r){i.parse(e,t,s,r)})}};function Qb(){let n={};return{get:function(e){return n[e]},add:function(e,t){n[e]=t},remove:function(e){delete n[e]},removeAll:function(){n={}}}}var rt={KHR_BINARY_GLTF:"KHR_binary_glTF",KHR_DRACO_MESH_COMPRESSION:"KHR_draco_mesh_compression",KHR_LIGHTS_PUNCTUAL:"KHR_lights_punctual",KHR_MATERIALS_CLEARCOAT:"KHR_materials_clearcoat",KHR_MATERIALS_DISPERSION:"KHR_materials_dispersion",KHR_MATERIALS_IOR:"KHR_materials_ior",KHR_MATERIALS_SHEEN:"KHR_materials_sheen",KHR_MATERIALS_SPECULAR:"KHR_materials_specular",KHR_MATERIALS_TRANSMISSION:"KHR_materials_transmission",KHR_MATERIALS_IRIDESCENCE:"KHR_materials_iridescence",KHR_MATERIALS_ANISOTROPY:"KHR_materials_anisotropy",KHR_MATERIALS_UNLIT:"KHR_materials_unlit",KHR_MATERIALS_VOLUME:"KHR_materials_volume",KHR_TEXTURE_BASISU:"KHR_texture_basisu",KHR_TEXTURE_TRANSFORM:"KHR_texture_transform",KHR_MESH_QUANTIZATION:"KHR_mesh_quantization",KHR_MATERIALS_EMISSIVE_STRENGTH:"KHR_materials_emissive_strength",EXT_MATERIALS_BUMP:"EXT_materials_bump",EXT_TEXTURE_WEBP:"EXT_texture_webp",EXT_TEXTURE_AVIF:"EXT_texture_avif",EXT_MESHOPT_COMPRESSION:"EXT_meshopt_compression",EXT_MESH_GPU_INSTANCING:"EXT_mesh_gpu_instancing"},Wu=class{constructor(e){this.parser=e,this.name=rt.KHR_LIGHTS_PUNCTUAL,this.cache={refs:{},uses:{}}}_markDefs(){let e=this.parser,t=this.parser.json.nodes||[];for(let i=0,s=t.length;i<s;i++){let r=t[i];r.extensions&&r.extensions[this.name]&&r.extensions[this.name].light!==void 0&&e._addNodeRef(this.cache,r.extensions[this.name].light)}}_loadLight(e){let t=this.parser,i="light:"+e,s=t.cache.get(i);if(s)return s;let r=t.json,c=((r.extensions&&r.extensions[this.name]||{}).lights||[])[e],l,h=new Ne(16777215);c.color!==void 0&&h.setRGB(c.color[0],c.color[1],c.color[2],jt);let u=c.range!==void 0?c.range:0;switch(c.type){case"directional":l=new ls(h),l.target.position.set(0,0,-1),l.add(l.target);break;case"point":l=new os(h),l.distance=u;break;case"spot":l=new uo(h),l.distance=u,c.spot=c.spot||{},c.spot.innerConeAngle=c.spot.innerConeAngle!==void 0?c.spot.innerConeAngle:0,c.spot.outerConeAngle=c.spot.outerConeAngle!==void 0?c.spot.outerConeAngle:Math.PI/4,l.angle=c.spot.outerConeAngle,l.penumbra=1-c.spot.innerConeAngle/c.spot.outerConeAngle,l.target.position.set(0,0,-1),l.add(l.target);break;default:throw new Error("THREE.GLTFLoader: Unexpected light type: "+c.type)}return l.position.set(0,0,0),ni(l,c),c.intensity!==void 0&&(l.intensity=c.intensity),l.name=t.createUniqueName(c.name||"light_"+e),s=Promise.resolve(l),t.cache.add(i,s),s}getDependency(e,t){if(e==="light")return this._loadLight(t)}createNodeAttachment(e){let t=this,i=this.parser,r=i.json.nodes[e],a=(r.extensions&&r.extensions[this.name]||{}).light;return a===void 0?null:this._loadLight(a).then(function(c){return i._getNodeRef(t.cache,a,c)})}},$u=class{constructor(){this.name=rt.KHR_MATERIALS_UNLIT}getMaterialType(){return en}extendParams(e,t,i){let s=[];e.color=new Ne(1,1,1),e.opacity=1;let r=t.pbrMetallicRoughness;if(r){if(Array.isArray(r.baseColorFactor)){let o=r.baseColorFactor;e.color.setRGB(o[0],o[1],o[2],jt),e.opacity=o[3]}r.baseColorTexture!==void 0&&s.push(i.assignTexture(e,"map",r.baseColorTexture,Bt))}return Promise.all(s)}},Xu=class{constructor(e){this.parser=e,this.name=rt.KHR_MATERIALS_EMISSIVE_STRENGTH}extendMaterialParams(e,t){let s=this.parser.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();let r=s.extensions[this.name].emissiveStrength;return r!==void 0&&(t.emissiveIntensity=r),Promise.resolve()}},Yu=class{constructor(e){this.parser=e,this.name=rt.KHR_MATERIALS_CLEARCOAT}getMaterialType(e){let i=this.parser.json.materials[e];return!i.extensions||!i.extensions[this.name]?null:dn}extendMaterialParams(e,t){let i=this.parser,s=i.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();let r=[],o=s.extensions[this.name];if(o.clearcoatFactor!==void 0&&(t.clearcoat=o.clearcoatFactor),o.clearcoatTexture!==void 0&&r.push(i.assignTexture(t,"clearcoatMap",o.clearcoatTexture)),o.clearcoatRoughnessFactor!==void 0&&(t.clearcoatRoughness=o.clearcoatRoughnessFactor),o.clearcoatRoughnessTexture!==void 0&&r.push(i.assignTexture(t,"clearcoatRoughnessMap",o.clearcoatRoughnessTexture)),o.clearcoatNormalTexture!==void 0&&(r.push(i.assignTexture(t,"clearcoatNormalMap",o.clearcoatNormalTexture)),o.clearcoatNormalTexture.scale!==void 0)){let a=o.clearcoatNormalTexture.scale;t.clearcoatNormalScale=new De(a,a)}return Promise.all(r)}},qu=class{constructor(e){this.parser=e,this.name=rt.KHR_MATERIALS_DISPERSION}getMaterialType(e){let i=this.parser.json.materials[e];return!i.extensions||!i.extensions[this.name]?null:dn}extendMaterialParams(e,t){let s=this.parser.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();let r=s.extensions[this.name];return t.dispersion=r.dispersion!==void 0?r.dispersion:0,Promise.resolve()}},ju=class{constructor(e){this.parser=e,this.name=rt.KHR_MATERIALS_IRIDESCENCE}getMaterialType(e){let i=this.parser.json.materials[e];return!i.extensions||!i.extensions[this.name]?null:dn}extendMaterialParams(e,t){let i=this.parser,s=i.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();let r=[],o=s.extensions[this.name];return o.iridescenceFactor!==void 0&&(t.iridescence=o.iridescenceFactor),o.iridescenceTexture!==void 0&&r.push(i.assignTexture(t,"iridescenceMap",o.iridescenceTexture)),o.iridescenceIor!==void 0&&(t.iridescenceIOR=o.iridescenceIor),t.iridescenceThicknessRange===void 0&&(t.iridescenceThicknessRange=[100,400]),o.iridescenceThicknessMinimum!==void 0&&(t.iridescenceThicknessRange[0]=o.iridescenceThicknessMinimum),o.iridescenceThicknessMaximum!==void 0&&(t.iridescenceThicknessRange[1]=o.iridescenceThicknessMaximum),o.iridescenceThicknessTexture!==void 0&&r.push(i.assignTexture(t,"iridescenceThicknessMap",o.iridescenceThicknessTexture)),Promise.all(r)}},Ju=class{constructor(e){this.parser=e,this.name=rt.KHR_MATERIALS_SHEEN}getMaterialType(e){let i=this.parser.json.materials[e];return!i.extensions||!i.extensions[this.name]?null:dn}extendMaterialParams(e,t){let i=this.parser,s=i.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();let r=[];t.sheenColor=new Ne(0,0,0),t.sheenRoughness=0,t.sheen=1;let o=s.extensions[this.name];if(o.sheenColorFactor!==void 0){let a=o.sheenColorFactor;t.sheenColor.setRGB(a[0],a[1],a[2],jt)}return o.sheenRoughnessFactor!==void 0&&(t.sheenRoughness=o.sheenRoughnessFactor),o.sheenColorTexture!==void 0&&r.push(i.assignTexture(t,"sheenColorMap",o.sheenColorTexture,Bt)),o.sheenRoughnessTexture!==void 0&&r.push(i.assignTexture(t,"sheenRoughnessMap",o.sheenRoughnessTexture)),Promise.all(r)}},Ku=class{constructor(e){this.parser=e,this.name=rt.KHR_MATERIALS_TRANSMISSION}getMaterialType(e){let i=this.parser.json.materials[e];return!i.extensions||!i.extensions[this.name]?null:dn}extendMaterialParams(e,t){let i=this.parser,s=i.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();let r=[],o=s.extensions[this.name];return o.transmissionFactor!==void 0&&(t.transmission=o.transmissionFactor),o.transmissionTexture!==void 0&&r.push(i.assignTexture(t,"transmissionMap",o.transmissionTexture)),Promise.all(r)}},Zu=class{constructor(e){this.parser=e,this.name=rt.KHR_MATERIALS_VOLUME}getMaterialType(e){let i=this.parser.json.materials[e];return!i.extensions||!i.extensions[this.name]?null:dn}extendMaterialParams(e,t){let i=this.parser,s=i.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();let r=[],o=s.extensions[this.name];t.thickness=o.thicknessFactor!==void 0?o.thicknessFactor:0,o.thicknessTexture!==void 0&&r.push(i.assignTexture(t,"thicknessMap",o.thicknessTexture)),t.attenuationDistance=o.attenuationDistance||1/0;let a=o.attenuationColor||[1,1,1];return t.attenuationColor=new Ne().setRGB(a[0],a[1],a[2],jt),Promise.all(r)}},Qu=class{constructor(e){this.parser=e,this.name=rt.KHR_MATERIALS_IOR}getMaterialType(e){let i=this.parser.json.materials[e];return!i.extensions||!i.extensions[this.name]?null:dn}extendMaterialParams(e,t){let s=this.parser.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();let r=s.extensions[this.name];return t.ior=r.ior!==void 0?r.ior:1.5,Promise.resolve()}},eh=class{constructor(e){this.parser=e,this.name=rt.KHR_MATERIALS_SPECULAR}getMaterialType(e){let i=this.parser.json.materials[e];return!i.extensions||!i.extensions[this.name]?null:dn}extendMaterialParams(e,t){let i=this.parser,s=i.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();let r=[],o=s.extensions[this.name];t.specularIntensity=o.specularFactor!==void 0?o.specularFactor:1,o.specularTexture!==void 0&&r.push(i.assignTexture(t,"specularIntensityMap",o.specularTexture));let a=o.specularColorFactor||[1,1,1];return t.specularColor=new Ne().setRGB(a[0],a[1],a[2],jt),o.specularColorTexture!==void 0&&r.push(i.assignTexture(t,"specularColorMap",o.specularColorTexture,Bt)),Promise.all(r)}},th=class{constructor(e){this.parser=e,this.name=rt.EXT_MATERIALS_BUMP}getMaterialType(e){let i=this.parser.json.materials[e];return!i.extensions||!i.extensions[this.name]?null:dn}extendMaterialParams(e,t){let i=this.parser,s=i.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();let r=[],o=s.extensions[this.name];return t.bumpScale=o.bumpFactor!==void 0?o.bumpFactor:1,o.bumpTexture!==void 0&&r.push(i.assignTexture(t,"bumpMap",o.bumpTexture)),Promise.all(r)}},nh=class{constructor(e){this.parser=e,this.name=rt.KHR_MATERIALS_ANISOTROPY}getMaterialType(e){let i=this.parser.json.materials[e];return!i.extensions||!i.extensions[this.name]?null:dn}extendMaterialParams(e,t){let i=this.parser,s=i.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();let r=[],o=s.extensions[this.name];return o.anisotropyStrength!==void 0&&(t.anisotropy=o.anisotropyStrength),o.anisotropyRotation!==void 0&&(t.anisotropyRotation=o.anisotropyRotation),o.anisotropyTexture!==void 0&&r.push(i.assignTexture(t,"anisotropyMap",o.anisotropyTexture)),Promise.all(r)}},ih=class{constructor(e){this.parser=e,this.name=rt.KHR_TEXTURE_BASISU}loadTexture(e){let t=this.parser,i=t.json,s=i.textures[e];if(!s.extensions||!s.extensions[this.name])return null;let r=s.extensions[this.name],o=t.options.ktx2Loader;if(!o){if(i.extensionsRequired&&i.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");return null}return t.loadTextureImage(e,r.source,o)}},sh=class{constructor(e){this.parser=e,this.name=rt.EXT_TEXTURE_WEBP}loadTexture(e){let t=this.name,i=this.parser,s=i.json,r=s.textures[e];if(!r.extensions||!r.extensions[t])return null;let o=r.extensions[t],a=s.images[o.source],c=i.textureLoader;if(a.uri){let l=i.options.manager.getHandler(a.uri);l!==null&&(c=l)}return i.loadTextureImage(e,o.source,c)}},rh=class{constructor(e){this.parser=e,this.name=rt.EXT_TEXTURE_AVIF}loadTexture(e){let t=this.name,i=this.parser,s=i.json,r=s.textures[e];if(!r.extensions||!r.extensions[t])return null;let o=r.extensions[t],a=s.images[o.source],c=i.textureLoader;if(a.uri){let l=i.options.manager.getHandler(a.uri);l!==null&&(c=l)}return i.loadTextureImage(e,o.source,c)}},oh=class{constructor(e){this.name=rt.EXT_MESHOPT_COMPRESSION,this.parser=e}loadBufferView(e){let t=this.parser.json,i=t.bufferViews[e];if(i.extensions&&i.extensions[this.name]){let s=i.extensions[this.name],r=this.parser.getDependency("buffer",s.buffer),o=this.parser.options.meshoptDecoder;if(!o||!o.supported){if(t.extensionsRequired&&t.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files");return null}return r.then(function(a){let c=s.byteOffset||0,l=s.byteLength||0,h=s.count,u=s.byteStride,d=new Uint8Array(a,c,l);return o.decodeGltfBufferAsync?o.decodeGltfBufferAsync(h,u,d,s.mode,s.filter).then(function(f){return f.buffer}):o.ready.then(function(){let f=new ArrayBuffer(h*u);return o.decodeGltfBuffer(new Uint8Array(f),h,u,d,s.mode,s.filter),f})})}else return null}},ah=class{constructor(e){this.name=rt.EXT_MESH_GPU_INSTANCING,this.parser=e}createNodeMesh(e){let t=this.parser.json,i=t.nodes[e];if(!i.extensions||!i.extensions[this.name]||i.mesh===void 0)return null;let s=t.meshes[i.mesh];for(let l of s.primitives)if(l.mode!==An.TRIANGLES&&l.mode!==An.TRIANGLE_STRIP&&l.mode!==An.TRIANGLE_FAN&&l.mode!==void 0)return null;let o=i.extensions[this.name].attributes,a=[],c={};for(let l in o)a.push(this.parser.getDependency("accessor",o[l]).then(h=>(c[l]=h,c[l])));return a.length<1?null:(a.push(this.parser.createNodeMesh(e)),Promise.all(a).then(l=>{let h=l.pop(),u=h.isGroup?h.children:[h],d=l[0].count,f=[];for(let g of u){let y=new je,m=new D,p=new ln,E=new D(1,1,1),T=new ns(g.geometry,g.material,d);for(let v=0;v<d;v++)c.TRANSLATION&&m.fromBufferAttribute(c.TRANSLATION,v),c.ROTATION&&p.fromBufferAttribute(c.ROTATION,v),c.SCALE&&E.fromBufferAttribute(c.SCALE,v),T.setMatrixAt(v,y.compose(m,p,E));for(let v in c)if(v==="_COLOR_0"){let R=c[v];T.instanceColor=new Fi(R.array,R.itemSize,R.normalized)}else v!=="TRANSLATION"&&v!=="ROTATION"&&v!=="SCALE"&&g.geometry.setAttribute(v,c[v]);Mt.prototype.copy.call(T,g),this.parser.assignFinalMaterial(T),f.push(T)}return h.isGroup?(h.clear(),h.add(...f),h):f[0]}))}},Xp="glTF",wo=12,Vp={JSON:1313821514,BIN:5130562},lh=class{constructor(e){this.name=rt.KHR_BINARY_GLTF,this.content=null,this.body=null;let t=new DataView(e,0,wo),i=new TextDecoder;if(this.header={magic:i.decode(new Uint8Array(e.slice(0,4))),version:t.getUint32(4,!0),length:t.getUint32(8,!0)},this.header.magic!==Xp)throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");if(this.header.version<2)throw new Error("THREE.GLTFLoader: Legacy binary file detected.");let s=this.header.length-wo,r=new DataView(e,wo),o=0;for(;o<s;){let a=r.getUint32(o,!0);o+=4;let c=r.getUint32(o,!0);if(o+=4,c===Vp.JSON){let l=new Uint8Array(e,wo+o,a);this.content=i.decode(l)}else if(c===Vp.BIN){let l=wo+o;this.body=e.slice(l,l+a)}o+=a}if(this.content===null)throw new Error("THREE.GLTFLoader: JSON content not found.")}},ch=class{constructor(e,t){if(!t)throw new Error("THREE.GLTFLoader: No DRACOLoader instance provided.");this.name=rt.KHR_DRACO_MESH_COMPRESSION,this.json=e,this.dracoLoader=t,this.dracoLoader.preload()}decodePrimitive(e,t){let i=this.json,s=this.dracoLoader,r=e.extensions[this.name].bufferView,o=e.extensions[this.name].attributes,a={},c={},l={};for(let h in o){let u=fh[h]||h.toLowerCase();a[u]=o[h]}for(let h in e.attributes){let u=fh[h]||h.toLowerCase();if(o[h]!==void 0){let d=i.accessors[e.attributes[h]],f=xr[d.componentType];l[u]=f.name,c[u]=d.normalized===!0}}return t.getDependency("bufferView",r).then(function(h){return new Promise(function(u,d){s.decodeDracoFile(h,function(f){for(let g in f.attributes){let y=f.attributes[g],m=c[g];m!==void 0&&(y.normalized=m)}u(f)},a,l,jt,d)})})}},uh=class{constructor(){this.name=rt.KHR_TEXTURE_TRANSFORM}extendTexture(e,t){return(t.texCoord===void 0||t.texCoord===e.channel)&&t.offset===void 0&&t.rotation===void 0&&t.scale===void 0||(e=e.clone(),t.texCoord!==void 0&&(e.channel=t.texCoord),t.offset!==void 0&&e.offset.fromArray(t.offset),t.rotation!==void 0&&(e.rotation=t.rotation),t.scale!==void 0&&e.repeat.fromArray(t.scale),e.needsUpdate=!0),e}},hh=class{constructor(){this.name=rt.KHR_MESH_QUANTIZATION}},Yl=class extends _i{constructor(e,t,i,s){super(e,t,i,s)}copySampleValue_(e){let t=this.resultBuffer,i=this.sampleValues,s=this.valueSize,r=e*s*3+s;for(let o=0;o!==s;o++)t[o]=i[r+o];return t}interpolate_(e,t,i,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=a*2,l=a*3,h=s-t,u=(i-t)/h,d=u*u,f=d*u,g=e*l,y=g-l,m=-2*f+3*d,p=f-d,E=1-m,T=p-d+u;for(let v=0;v!==a;v++){let R=o[y+v+a],w=o[y+v+c]*h,C=o[g+v+a],L=o[g+v]*h;r[v]=E*R+T*w+m*C+p*L}return r}},eS=new ln,dh=class extends Yl{interpolate_(e,t,i,s){let r=super.interpolate_(e,t,i,s);return eS.fromArray(r).normalize().toArray(r),r}},An={FLOAT:5126,FLOAT_MAT3:35675,FLOAT_MAT4:35676,FLOAT_VEC2:35664,FLOAT_VEC3:35665,FLOAT_VEC4:35666,LINEAR:9729,REPEAT:10497,SAMPLER_2D:35678,POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6,UNSIGNED_BYTE:5121,UNSIGNED_SHORT:5123},xr={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array},Gp={9728:qt,9729:an,9984:Qa,9985:rr,9986:hs,9987:kn},Wp={33071:$n,33648:Ys,10497:Di},Hu={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},fh={POSITION:"position",NORMAL:"normal",TANGENT:"tangent",TEXCOORD_0:"uv",TEXCOORD_1:"uv1",TEXCOORD_2:"uv2",TEXCOORD_3:"uv3",COLOR_0:"color",WEIGHTS_0:"skinWeight",JOINTS_0:"skinIndex"},Hi={scale:"scale",translation:"position",rotation:"quaternion",weights:"morphTargetInfluences"},tS={CUBICSPLINE:void 0,LINEAR:Zi,STEP:Ki},Vu={OPAQUE:"OPAQUE",MASK:"MASK",BLEND:"BLEND"};function nS(n){return n.DefaultMaterial===void 0&&(n.DefaultMaterial=new hn({color:16777215,emissive:0,metalness:1,roughness:1,transparent:!1,depthTest:!0,side:Fn})),n.DefaultMaterial}function _s(n,e,t){for(let i in t.extensions)n[i]===void 0&&(e.userData.gltfExtensions=e.userData.gltfExtensions||{},e.userData.gltfExtensions[i]=t.extensions[i])}function ni(n,e){e.extras!==void 0&&(typeof e.extras=="object"?Object.assign(n.userData,e.extras):console.warn("THREE.GLTFLoader: Ignoring primitive type .extras, "+e.extras))}function iS(n,e,t){let i=!1,s=!1,r=!1;for(let l=0,h=e.length;l<h;l++){let u=e[l];if(u.POSITION!==void 0&&(i=!0),u.NORMAL!==void 0&&(s=!0),u.COLOR_0!==void 0&&(r=!0),i&&s&&r)break}if(!i&&!s&&!r)return Promise.resolve(n);let o=[],a=[],c=[];for(let l=0,h=e.length;l<h;l++){let u=e[l];if(i){let d=u.POSITION!==void 0?t.getDependency("accessor",u.POSITION):n.attributes.position;o.push(d)}if(s){let d=u.NORMAL!==void 0?t.getDependency("accessor",u.NORMAL):n.attributes.normal;a.push(d)}if(r){let d=u.COLOR_0!==void 0?t.getDependency("accessor",u.COLOR_0):n.attributes.color;c.push(d)}}return Promise.all([Promise.all(o),Promise.all(a),Promise.all(c)]).then(function(l){let h=l[0],u=l[1],d=l[2];return i&&(n.morphAttributes.position=h),s&&(n.morphAttributes.normal=u),r&&(n.morphAttributes.color=d),n.morphTargetsRelative=!0,n})}function sS(n,e){if(n.updateMorphTargets(),e.weights!==void 0)for(let t=0,i=e.weights.length;t<i;t++)n.morphTargetInfluences[t]=e.weights[t];if(e.extras&&Array.isArray(e.extras.targetNames)){let t=e.extras.targetNames;if(n.morphTargetInfluences.length===t.length){n.morphTargetDictionary={};for(let i=0,s=t.length;i<s;i++)n.morphTargetDictionary[t[i]]=i}else console.warn("THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.")}}function rS(n){let e,t=n.extensions&&n.extensions[rt.KHR_DRACO_MESH_COMPRESSION];if(t?e="draco:"+t.bufferView+":"+t.indices+":"+Gu(t.attributes):e=n.indices+":"+Gu(n.attributes)+":"+n.mode,n.targets!==void 0)for(let i=0,s=n.targets.length;i<s;i++)e+=":"+Gu(n.targets[i]);return e}function Gu(n){let e="",t=Object.keys(n).sort();for(let i=0,s=t.length;i<s;i++)e+=t[i]+":"+n[t[i]]+";";return e}function ph(n){switch(n){case Int8Array:return 1/127;case Uint8Array:return 1/255;case Int16Array:return 1/32767;case Uint16Array:return 1/65535;default:throw new Error("THREE.GLTFLoader: Unsupported normalized accessor component type.")}}function oS(n){return n.search(/\.jpe?g($|\?)/i)>0||n.search(/^data\:image\/jpeg/)===0?"image/jpeg":n.search(/\.webp($|\?)/i)>0||n.search(/^data\:image\/webp/)===0?"image/webp":n.search(/\.ktx2($|\?)/i)>0||n.search(/^data\:image\/ktx2/)===0?"image/ktx2":"image/png"}var aS=new je,mh=class{constructor(e={},t={}){this.json=e,this.extensions={},this.plugins={},this.options=t,this.cache=new Qb,this.associations=new Map,this.primitiveCache={},this.nodeCache={},this.meshCache={refs:{},uses:{}},this.cameraCache={refs:{},uses:{}},this.lightCache={refs:{},uses:{}},this.sourceCache={},this.textureCache={},this.nodeNamesUsed={};let i=!1,s=-1,r=!1,o=-1;if(typeof navigator<"u"){let a=navigator.userAgent;i=/^((?!chrome|android).)*safari/i.test(a)===!0;let c=a.match(/Version\/(\d+)/);s=i&&c?parseInt(c[1],10):-1,r=a.indexOf("Firefox")>-1,o=r?a.match(/Firefox\/([0-9]+)\./)[1]:-1}typeof createImageBitmap>"u"||i&&s<17||r&&o<98?this.textureLoader=new lo(this.options.manager):this.textureLoader=new fo(this.options.manager),this.textureLoader.setCrossOrigin(this.options.crossOrigin),this.textureLoader.setRequestHeader(this.options.requestHeader),this.fileLoader=new ir(this.options.manager),this.fileLoader.setResponseType("arraybuffer"),this.options.crossOrigin==="use-credentials"&&this.fileLoader.setWithCredentials(!0)}setExtensions(e){this.extensions=e}setPlugins(e){this.plugins=e}parse(e,t){let i=this,s=this.json,r=this.extensions;this.cache.removeAll(),this.nodeCache={},this._invokeAll(function(o){return o._markDefs&&o._markDefs()}),Promise.all(this._invokeAll(function(o){return o.beforeRoot&&o.beforeRoot()})).then(function(){return Promise.all([i.getDependencies("scene"),i.getDependencies("animation"),i.getDependencies("camera")])}).then(function(o){let a={scene:o[0][s.scene||0],scenes:o[0],animations:o[1],cameras:o[2],asset:s.asset,parser:i,userData:{}};return _s(r,a,s),ni(a,s),Promise.all(i._invokeAll(function(c){return c.afterRoot&&c.afterRoot(a)})).then(function(){for(let c of a.scenes)c.updateMatrixWorld();e(a)})}).catch(t)}_markDefs(){let e=this.json.nodes||[],t=this.json.skins||[],i=this.json.meshes||[];for(let s=0,r=t.length;s<r;s++){let o=t[s].joints;for(let a=0,c=o.length;a<c;a++)e[o[a]].isBone=!0}for(let s=0,r=e.length;s<r;s++){let o=e[s];o.mesh!==void 0&&(this._addNodeRef(this.meshCache,o.mesh),o.skin!==void 0&&(i[o.mesh].isSkinnedMesh=!0)),o.camera!==void 0&&this._addNodeRef(this.cameraCache,o.camera)}}_addNodeRef(e,t){t!==void 0&&(e.refs[t]===void 0&&(e.refs[t]=e.uses[t]=0),e.refs[t]++)}_getNodeRef(e,t,i){if(e.refs[t]<=1)return i;let s=i.clone(),r=(o,a)=>{let c=this.associations.get(o);c!=null&&this.associations.set(a,c);for(let[l,h]of o.children.entries())r(h,a.children[l])};return r(i,s),s.name+="_instance_"+e.uses[t]++,s}_invokeOne(e){let t=Object.values(this.plugins);t.push(this);for(let i=0;i<t.length;i++){let s=e(t[i]);if(s)return s}return null}_invokeAll(e){let t=Object.values(this.plugins);t.unshift(this);let i=[];for(let s=0;s<t.length;s++){let r=e(t[s]);r&&i.push(r)}return i}getDependency(e,t){let i=e+":"+t,s=this.cache.get(i);if(!s){switch(e){case"scene":s=this.loadScene(t);break;case"node":s=this._invokeOne(function(r){return r.loadNode&&r.loadNode(t)});break;case"mesh":s=this._invokeOne(function(r){return r.loadMesh&&r.loadMesh(t)});break;case"accessor":s=this.loadAccessor(t);break;case"bufferView":s=this._invokeOne(function(r){return r.loadBufferView&&r.loadBufferView(t)});break;case"buffer":s=this.loadBuffer(t);break;case"material":s=this._invokeOne(function(r){return r.loadMaterial&&r.loadMaterial(t)});break;case"texture":s=this._invokeOne(function(r){return r.loadTexture&&r.loadTexture(t)});break;case"skin":s=this.loadSkin(t);break;case"animation":s=this._invokeOne(function(r){return r.loadAnimation&&r.loadAnimation(t)});break;case"camera":s=this.loadCamera(t);break;default:if(s=this._invokeOne(function(r){return r!=this&&r.getDependency&&r.getDependency(e,t)}),!s)throw new Error("Unknown type: "+e);break}this.cache.add(i,s)}return s}getDependencies(e){let t=this.cache.get(e);if(!t){let i=this,s=this.json[e+(e==="mesh"?"es":"s")]||[];t=Promise.all(s.map(function(r,o){return i.getDependency(e,o)})),this.cache.add(e,t)}return t}loadBuffer(e){let t=this.json.buffers[e],i=this.fileLoader;if(t.type&&t.type!=="arraybuffer")throw new Error("THREE.GLTFLoader: "+t.type+" buffer type is not supported.");if(t.uri===void 0&&e===0)return Promise.resolve(this.extensions[rt.KHR_BINARY_GLTF].body);let s=this.options;return new Promise(function(r,o){i.load(vi.resolveURL(t.uri,s.path),r,void 0,function(){o(new Error('THREE.GLTFLoader: Failed to load buffer "'+t.uri+'".'))})})}loadBufferView(e){let t=this.json.bufferViews[e];return this.getDependency("buffer",t.buffer).then(function(i){let s=t.byteLength||0,r=t.byteOffset||0;return i.slice(r,r+s)})}loadAccessor(e){let t=this,i=this.json,s=this.json.accessors[e];if(s.bufferView===void 0&&s.sparse===void 0){let o=Hu[s.type],a=xr[s.componentType],c=s.normalized===!0,l=new a(s.count*o);return Promise.resolve(new Dt(l,o,c))}let r=[];return s.bufferView!==void 0?r.push(this.getDependency("bufferView",s.bufferView)):r.push(null),s.sparse!==void 0&&(r.push(this.getDependency("bufferView",s.sparse.indices.bufferView)),r.push(this.getDependency("bufferView",s.sparse.values.bufferView))),Promise.all(r).then(function(o){let a=o[0],c=Hu[s.type],l=xr[s.componentType],h=l.BYTES_PER_ELEMENT,u=h*c,d=s.byteOffset||0,f=s.bufferView!==void 0?i.bufferViews[s.bufferView].byteStride:void 0,g=s.normalized===!0,y,m;if(f&&f!==u){let p=Math.floor(d/f),E="InterleavedBuffer:"+s.bufferView+":"+s.componentType+":"+p+":"+s.count,T=t.cache.get(E);T||(y=new l(a,p*f,s.count*f/h),T=new ts(y,f/h),t.cache.add(E,T)),m=new Oi(T,c,d%f/h,g)}else a===null?y=new l(s.count*c):y=new l(a,d,s.count*c),m=new Dt(y,c,g);if(s.sparse!==void 0){let p=Hu.SCALAR,E=xr[s.sparse.indices.componentType],T=s.sparse.indices.byteOffset||0,v=s.sparse.values.byteOffset||0,R=new E(o[1],T,s.sparse.count*p),w=new l(o[2],v,s.sparse.count*c);a!==null&&(m=new Dt(m.array.slice(),m.itemSize,m.normalized)),m.normalized=!1;for(let C=0,L=R.length;C<L;C++){let b=R[C];if(m.setX(b,w[C*c]),c>=2&&m.setY(b,w[C*c+1]),c>=3&&m.setZ(b,w[C*c+2]),c>=4&&m.setW(b,w[C*c+3]),c>=5)throw new Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.")}m.normalized=g}return m})}loadTexture(e){let t=this.json,i=this.options,r=t.textures[e].source,o=t.images[r],a=this.textureLoader;if(o.uri){let c=i.manager.getHandler(o.uri);c!==null&&(a=c)}return this.loadTextureImage(e,r,a)}loadTextureImage(e,t,i){let s=this,r=this.json,o=r.textures[e],a=r.images[t],c=(a.uri||a.bufferView)+":"+o.sampler;if(this.textureCache[c])return this.textureCache[c];let l=this.loadImageSource(t,i).then(function(h){h.flipY=!1,h.name=o.name||a.name||"",h.name===""&&typeof a.uri=="string"&&a.uri.startsWith("data:image/")===!1&&(h.name=a.uri);let d=(r.samplers||{})[o.sampler]||{};return h.magFilter=Gp[d.magFilter]||an,h.minFilter=Gp[d.minFilter]||kn,h.wrapS=Wp[d.wrapS]||Di,h.wrapT=Wp[d.wrapT]||Di,h.generateMipmaps=!h.isCompressedTexture&&h.minFilter!==qt&&h.minFilter!==an,s.associations.set(h,{textures:e}),h}).catch(function(){return null});return this.textureCache[c]=l,l}loadImageSource(e,t){let i=this,s=this.json,r=this.options;if(this.sourceCache[e]!==void 0)return this.sourceCache[e].then(u=>u.clone());let o=s.images[e],a=self.URL||self.webkitURL,c=o.uri||"",l=!1;if(o.bufferView!==void 0)c=i.getDependency("bufferView",o.bufferView).then(function(u){l=!0;let d=new Blob([u],{type:o.mimeType});return c=a.createObjectURL(d),c});else if(o.uri===void 0)throw new Error("THREE.GLTFLoader: Image "+e+" is missing URI and bufferView");let h=Promise.resolve(c).then(function(u){return new Promise(function(d,f){let g=d;t.isImageBitmapLoader===!0&&(g=function(y){let m=new kt(y);m.needsUpdate=!0,d(m)}),t.load(vi.resolveURL(u,r.path),g,void 0,f)})}).then(function(u){return l===!0&&a.revokeObjectURL(c),ni(u,o),u.userData.mimeType=o.mimeType||oS(o.uri),u}).catch(function(u){throw console.error("THREE.GLTFLoader: Couldn't load texture",c),u});return this.sourceCache[e]=h,h}assignTexture(e,t,i,s){let r=this;return this.getDependency("texture",i.index).then(function(o){if(!o)return null;if(i.texCoord!==void 0&&i.texCoord>0&&(o=o.clone(),o.channel=i.texCoord),r.extensions[rt.KHR_TEXTURE_TRANSFORM]){let a=i.extensions!==void 0?i.extensions[rt.KHR_TEXTURE_TRANSFORM]:void 0;if(a){let c=r.associations.get(o);o=r.extensions[rt.KHR_TEXTURE_TRANSFORM].extendTexture(o,a),r.associations.set(o,c)}}return s!==void 0&&(o.colorSpace=s),e[t]=o,o})}assignFinalMaterial(e){let t=e.geometry,i=e.material,s=t.attributes.tangent===void 0,r=t.attributes.color!==void 0,o=t.attributes.normal===void 0;if(e.isPoints){let a="PointsMaterial:"+i.uuid,c=this.cache.get(a);c||(c=new nr,Qt.prototype.copy.call(c,i),c.color.copy(i.color),c.map=i.map,c.sizeAttenuation=!1,this.cache.add(a,c)),i=c}else if(e.isLine){let a="LineBasicMaterial:"+i.uuid,c=this.cache.get(a);c||(c=new Bn,Qt.prototype.copy.call(c,i),c.color.copy(i.color),c.map=i.map,this.cache.add(a,c)),i=c}if(s||r||o){let a="ClonedMaterial:"+i.uuid+":";s&&(a+="derivative-tangents:"),r&&(a+="vertex-colors:"),o&&(a+="flat-shading:");let c=this.cache.get(a);c||(c=i.clone(),r&&(c.vertexColors=!0),o&&(c.flatShading=!0),s&&(c.normalScale&&(c.normalScale.y*=-1),c.clearcoatNormalScale&&(c.clearcoatNormalScale.y*=-1)),this.cache.add(a,c),this.associations.set(c,this.associations.get(i))),i=c}e.material=i}getMaterialType(){return hn}loadMaterial(e){let t=this,i=this.json,s=this.extensions,r=i.materials[e],o,a={},c=r.extensions||{},l=[];if(c[rt.KHR_MATERIALS_UNLIT]){let u=s[rt.KHR_MATERIALS_UNLIT];o=u.getMaterialType(),l.push(u.extendParams(a,r,t))}else{let u=r.pbrMetallicRoughness||{};if(a.color=new Ne(1,1,1),a.opacity=1,Array.isArray(u.baseColorFactor)){let d=u.baseColorFactor;a.color.setRGB(d[0],d[1],d[2],jt),a.opacity=d[3]}u.baseColorTexture!==void 0&&l.push(t.assignTexture(a,"map",u.baseColorTexture,Bt)),a.metalness=u.metallicFactor!==void 0?u.metallicFactor:1,a.roughness=u.roughnessFactor!==void 0?u.roughnessFactor:1,u.metallicRoughnessTexture!==void 0&&(l.push(t.assignTexture(a,"metalnessMap",u.metallicRoughnessTexture)),l.push(t.assignTexture(a,"roughnessMap",u.metallicRoughnessTexture))),o=this._invokeOne(function(d){return d.getMaterialType&&d.getMaterialType(e)}),l.push(Promise.all(this._invokeAll(function(d){return d.extendMaterialParams&&d.extendMaterialParams(e,a)})))}r.doubleSided===!0&&(a.side=tn);let h=r.alphaMode||Vu.OPAQUE;if(h===Vu.BLEND?(a.transparent=!0,a.depthWrite=!1):(a.transparent=!1,h===Vu.MASK&&(a.alphaTest=r.alphaCutoff!==void 0?r.alphaCutoff:.5)),r.normalTexture!==void 0&&o!==en&&(l.push(t.assignTexture(a,"normalMap",r.normalTexture)),a.normalScale=new De(1,1),r.normalTexture.scale!==void 0)){let u=r.normalTexture.scale;a.normalScale.set(u,u)}if(r.occlusionTexture!==void 0&&o!==en&&(l.push(t.assignTexture(a,"aoMap",r.occlusionTexture)),r.occlusionTexture.strength!==void 0&&(a.aoMapIntensity=r.occlusionTexture.strength)),r.emissiveFactor!==void 0&&o!==en){let u=r.emissiveFactor;a.emissive=new Ne().setRGB(u[0],u[1],u[2],jt)}return r.emissiveTexture!==void 0&&o!==en&&l.push(t.assignTexture(a,"emissiveMap",r.emissiveTexture,Bt)),Promise.all(l).then(function(){let u=new o(a);return r.name&&(u.name=r.name),ni(u,r),t.associations.set(u,{materials:e}),r.extensions&&_s(s,u,r),u})}createUniqueName(e){let t=St.sanitizeNodeName(e||"");return t in this.nodeNamesUsed?t+"_"+ ++this.nodeNamesUsed[t]:(this.nodeNamesUsed[t]=0,t)}loadGeometries(e){let t=this,i=this.extensions,s=this.primitiveCache;function r(a){return i[rt.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(a,t).then(function(c){return $p(c,a,t)})}let o=[];for(let a=0,c=e.length;a<c;a++){let l=e[a],h=rS(l),u=s[h];if(u)o.push(u.promise);else{let d;l.extensions&&l.extensions[rt.KHR_DRACO_MESH_COMPRESSION]?d=r(l):d=$p(new Ct,l,t),s[h]={primitive:l,promise:d},o.push(d)}}return Promise.all(o)}loadMesh(e){let t=this,i=this.json,s=this.extensions,r=i.meshes[e],o=r.primitives,a=[];for(let c=0,l=o.length;c<l;c++){let h=o[c].material===void 0?nS(this.cache):this.getDependency("material",o[c].material);a.push(h)}return a.push(t.loadGeometries(o)),Promise.all(a).then(function(c){let l=c.slice(0,c.length-1),h=c[c.length-1],u=[];for(let f=0,g=h.length;f<g;f++){let y=h[f],m=o[f],p,E=l[f];if(m.mode===An.TRIANGLES||m.mode===An.TRIANGLE_STRIP||m.mode===An.TRIANGLE_FAN||m.mode===void 0)p=r.isSkinnedMesh===!0?new jr(y,E):new ht(y,E),p.isSkinnedMesh===!0&&p.normalizeSkinWeights(),m.mode===An.TRIANGLE_STRIP?p.geometry=zu(p.geometry,Mo):m.mode===An.TRIANGLE_FAN&&(p.geometry=zu(p.geometry,ur));else if(m.mode===An.LINES)p=new is(y,E);else if(m.mode===An.LINE_STRIP)p=new jn(y,E);else if(m.mode===An.LINE_LOOP)p=new Zr(y,E);else if(m.mode===An.POINTS)p=new Qr(y,E);else throw new Error("THREE.GLTFLoader: Primitive mode unsupported: "+m.mode);Object.keys(p.geometry.morphAttributes).length>0&&sS(p,r),p.name=t.createUniqueName(r.name||"mesh_"+e),ni(p,r),m.extensions&&_s(s,p,m),t.assignFinalMaterial(p),u.push(p)}for(let f=0,g=u.length;f<g;f++)t.associations.set(u[f],{meshes:e,primitives:f});if(u.length===1)return r.extensions&&_s(s,u[0],r),u[0];let d=new Lt;r.extensions&&_s(s,d,r),t.associations.set(d,{meshes:e});for(let f=0,g=u.length;f<g;f++)d.add(u[f]);return d})}loadCamera(e){let t,i=this.json.cameras[e],s=i[i.type];if(!s){console.warn("THREE.GLTFLoader: Missing camera parameters.");return}return i.type==="perspective"?t=new It(To.radToDeg(s.yfov),s.aspectRatio||1,s.znear||1,s.zfar||2e6):i.type==="orthographic"&&(t=new as(-s.xmag,s.xmag,s.ymag,-s.ymag,s.znear,s.zfar)),i.name&&(t.name=this.createUniqueName(i.name)),ni(t,i),Promise.resolve(t)}loadSkin(e){let t=this.json.skins[e],i=[];for(let s=0,r=t.joints.length;s<r;s++)i.push(this._loadNodeShallow(t.joints[s]));return t.inverseBindMatrices!==void 0?i.push(this.getDependency("accessor",t.inverseBindMatrices)):i.push(null),Promise.all(i).then(function(s){let r=s.pop(),o=s,a=[],c=[];for(let l=0,h=o.length;l<h;l++){let u=o[l];if(u){a.push(u);let d=new je;r!==null&&d.fromArray(r.array,l*16),c.push(d)}else console.warn('THREE.GLTFLoader: Joint "%s" could not be found.',t.joints[l])}return new Kr(a,c)})}loadAnimation(e){let t=this.json,i=this,s=t.animations[e],r=s.name?s.name:"animation_"+e,o=[],a=[],c=[],l=[],h=[];for(let u=0,d=s.channels.length;u<d;u++){let f=s.channels[u],g=s.samplers[f.sampler],y=f.target,m=y.node,p=s.parameters!==void 0?s.parameters[g.input]:g.input,E=s.parameters!==void 0?s.parameters[g.output]:g.output;y.node!==void 0&&(o.push(this.getDependency("node",m)),a.push(this.getDependency("accessor",p)),c.push(this.getDependency("accessor",E)),l.push(g),h.push(y))}return Promise.all([Promise.all(o),Promise.all(a),Promise.all(c),Promise.all(l),Promise.all(h)]).then(function(u){let d=u[0],f=u[1],g=u[2],y=u[3],m=u[4],p=[];for(let T=0,v=d.length;T<v;T++){let R=d[T],w=f[T],C=g[T],L=y[T],b=m[T];if(R===void 0)continue;R.updateMatrix&&R.updateMatrix();let x=i._createAnimationTracks(R,w,C,L,b);if(x)for(let P=0;P<x.length;P++)p.push(x[P])}let E=new ao(r,void 0,p);return ni(E,s),E})}createNodeMesh(e){let t=this.json,i=this,s=t.nodes[e];return s.mesh===void 0?null:i.getDependency("mesh",s.mesh).then(function(r){let o=i._getNodeRef(i.meshCache,s.mesh,r);return s.weights!==void 0&&o.traverse(function(a){if(a.isMesh)for(let c=0,l=s.weights.length;c<l;c++)a.morphTargetInfluences[c]=s.weights[c]}),o})}loadNode(e){let t=this.json,i=this,s=t.nodes[e],r=i._loadNodeShallow(e),o=[],a=s.children||[];for(let l=0,h=a.length;l<h;l++)o.push(i.getDependency("node",a[l]));let c=s.skin===void 0?Promise.resolve(null):i.getDependency("skin",s.skin);return Promise.all([r,Promise.all(o),c]).then(function(l){let h=l[0],u=l[1],d=l[2];d!==null&&h.traverse(function(f){f.isSkinnedMesh&&f.bind(d,aS)});for(let f=0,g=u.length;f<g;f++)h.add(u[f]);return h})}_loadNodeShallow(e){let t=this.json,i=this.extensions,s=this;if(this.nodeCache[e]!==void 0)return this.nodeCache[e];let r=t.nodes[e],o=r.name?s.createUniqueName(r.name):"",a=[],c=s._invokeOne(function(l){return l.createNodeMesh&&l.createNodeMesh(e)});return c&&a.push(c),r.camera!==void 0&&a.push(s.getDependency("camera",r.camera).then(function(l){return s._getNodeRef(s.cameraCache,r.camera,l)})),s._invokeAll(function(l){return l.createNodeAttachment&&l.createNodeAttachment(e)}).forEach(function(l){a.push(l)}),this.nodeCache[e]=Promise.all(a).then(function(l){let h;if(r.isBone===!0?h=new er:l.length>1?h=new Lt:l.length===1?h=l[0]:h=new Mt,h!==l[0])for(let u=0,d=l.length;u<d;u++)h.add(l[u]);if(r.name&&(h.userData.name=r.name,h.name=o),ni(h,r),r.extensions&&_s(i,h,r),r.matrix!==void 0){let u=new je;u.fromArray(r.matrix),h.applyMatrix4(u)}else r.translation!==void 0&&h.position.fromArray(r.translation),r.rotation!==void 0&&h.quaternion.fromArray(r.rotation),r.scale!==void 0&&h.scale.fromArray(r.scale);if(!s.associations.has(h))s.associations.set(h,{});else if(r.mesh!==void 0&&s.meshCache.refs[r.mesh]>1){let u=s.associations.get(h);s.associations.set(h,{...u})}return s.associations.get(h).nodes=e,h}),this.nodeCache[e]}loadScene(e){let t=this.extensions,i=this.json.scenes[e],s=this,r=new Lt;i.name&&(r.name=s.createUniqueName(i.name)),ni(r,i),i.extensions&&_s(t,r,i);let o=i.nodes||[],a=[];for(let c=0,l=o.length;c<l;c++)a.push(s.getDependency("node",o[c]));return Promise.all(a).then(function(c){for(let h=0,u=c.length;h<u;h++)r.add(c[h]);let l=h=>{let u=new Map;for(let[d,f]of s.associations)(d instanceof Qt||d instanceof kt)&&u.set(d,f);return h.traverse(d=>{let f=s.associations.get(d);f!=null&&u.set(d,f)}),u};return s.associations=l(r),r})}_createAnimationTracks(e,t,i,s,r){let o=[],a=e.name?e.name:e.uuid,c=[];Hi[r.path]===Hi.weights?e.traverse(function(d){d.morphTargetInfluences&&c.push(d.name?d.name:d.uuid)}):c.push(a);let l;switch(Hi[r.path]){case Hi.weights:l=Jn;break;case Hi.rotation:l=Kn;break;case Hi.translation:case Hi.scale:l=Zn;break;default:switch(i.itemSize){case 1:l=Jn;break;case 2:case 3:default:l=Zn;break}break}let h=s.interpolation!==void 0?tS[s.interpolation]:Zi,u=this._getArrayFromAccessor(i);for(let d=0,f=c.length;d<f;d++){let g=new l(c[d]+"."+Hi[r.path],t.array,u,h);s.interpolation==="CUBICSPLINE"&&this._createCubicSplineTrackInterpolant(g),o.push(g)}return o}_getArrayFromAccessor(e){let t=e.array;if(e.normalized){let i=ph(t.constructor),s=new Float32Array(t.length);for(let r=0,o=t.length;r<o;r++)s[r]=t[r]*i;t=s}return t}_createCubicSplineTrackInterpolant(e){e.createInterpolant=function(i){let s=this instanceof Kn?dh:Yl;return new s(this.times,this.values,this.getValueSize()/3,i)},e.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline=!0}};function lS(n,e,t){let i=e.attributes,s=new cn;if(i.POSITION!==void 0){let a=t.json.accessors[i.POSITION],c=a.min,l=a.max;if(c!==void 0&&l!==void 0){if(s.set(new D(c[0],c[1],c[2]),new D(l[0],l[1],l[2])),a.normalized){let h=ph(xr[a.componentType]);s.min.multiplyScalar(h),s.max.multiplyScalar(h)}}else{console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");return}}else return;let r=e.targets;if(r!==void 0){let a=new D,c=new D;for(let l=0,h=r.length;l<h;l++){let u=r[l];if(u.POSITION!==void 0){let d=t.json.accessors[u.POSITION],f=d.min,g=d.max;if(f!==void 0&&g!==void 0){if(c.setX(Math.max(Math.abs(f[0]),Math.abs(g[0]))),c.setY(Math.max(Math.abs(f[1]),Math.abs(g[1]))),c.setZ(Math.max(Math.abs(f[2]),Math.abs(g[2]))),d.normalized){let y=ph(xr[d.componentType]);c.multiplyScalar(y)}a.max(c)}else console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.")}}s.expandByVector(a)}n.boundingBox=s;let o=new Zt;s.getCenter(o.center),o.radius=s.min.distanceTo(s.max)/2,n.boundingSphere=o}function $p(n,e,t){let i=e.attributes,s=[];function r(o,a){return t.getDependency("accessor",o).then(function(c){n.setAttribute(a,c)})}for(let o in i){let a=fh[o]||o.toLowerCase();a in n.attributes||s.push(r(i[o],a))}if(e.indices!==void 0&&!n.index){let o=t.getDependency("accessor",e.indices).then(function(a){n.setIndex(a)});s.push(o)}return at.workingColorSpace!==jt&&"COLOR_0"in i&&console.warn(`THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${at.workingColorSpace}" not supported.`),ni(n,e),lS(n,e,t),Promise.all(s).then(function(){return e.targets!==void 0?iS(n,e.targets,t):n})}var yr=["base","shoulder","upperarm","forearm","wrist1","wrist2","wrist3"],jp=[.15,.12,.24,.21,.085,.092,.092],xs=new Map,ql=new Map,cS=20,Yp=null;async function uS(n){return Yp??=new Xl,await Yp.loadAsync(n)}var hS=16723245;function gh(n,e,{emissive:t=hS,intensity:i=.55}={}){let s=new Set(Array.from(e??[]).map(Number).filter(o=>Number.isInteger(o)));if(n==null||typeof n.getObjectByName!="function")return 0;let r=0;for(let o=0;o<6;o+=1){let a=n.getObjectByName(`assemble_${yr[o+1]}`);if(a==null)continue;let c=s.has(o);c&&(r+=1),a.traverse?.(l=>{if(l?.isMesh!==!0)return;let h=l.material;if(h==null||typeof h.emissive?.setHex!="function")return;l.userData?.ursimTintOriginal===void 0&&(l.userData.ursimTintOriginal={hex:h.emissive.getHex(),intensity:h.emissiveIntensity??1,shared:!0});let u=l.userData.ursimTintOriginal;u.shared===!0&&(h=h.clone(),l.material=h,u.shared=!1),c?(h.emissive.setHex(t),h.emissiveIntensity=i):(h.emissive.setHex(u.hex),h.emissiveIntensity=u.intensity)})}return r}function dS(n){let e=[];for(let t=0;t<7;t++){let i=new Lt;i.name=`assemble_${yr[t]}`,i.matrixAutoUpdate=!1,e.push(i)}for(let t=1;t<7;t++)e[0].add(e[t]);for(let t=0;t<7;t++){let i=n?.getObjectByName?.(yr[t]);i&&e[t].add(i)}return n?.add?.(e[0]),e}function fS(n){let e=[];for(let t=0;t<7;t++){let i=Array.isArray(n)?n[t]:void 0;e.push(Number.isFinite(i)&&i>0?i:jp[t])}return e}function jl(n){if(!Array.isArray(n)||n.length<6)return null;if(n.every(i=>i!==null&&typeof i=="object"&&!Array.isArray(i))){let i=[];for(let s=0;s<6;s+=1){let{x:r=0,y:o=0,z:a=0}=n[s];if(!Number.isFinite(r)||!Number.isFinite(o)||!Number.isFinite(a))return null;i.push(Math.hypot(r,o,a))}return i.push(i[5]),i}if(n.length<7)return null;let e=[];for(let i=0;i<7;i++){let s=n[i];if(!Array.isArray(s)||s.length<12)return null;let r=s[3],o=s[7],a=s[11];if(!Number.isFinite(r)||!Number.isFinite(o)||!Number.isFinite(a))return null;e.push([r,o,a])}let t=[];for(let i=0;i<6;i++){let[s,r,o]=e[i],[a,c,l]=e[i+1];t.push(Math.hypot(a-s,c-r,l-o))}return t.push(t[5]),t}function pS(n=jp){let e=fS(n),t=new Lt;t.name="fallback_arm";let i=new hn({color:8952234,roughness:.6,metalness:.1});for(let s=0;s<7;s++){let r=Math.max(.04,e[s]*.8),o=new ht(new io(Math.max(.03,e[s]*.18),r),i);o.name=yr[s],o.position.z=e[s]*.5,t.add(o)}return t}async function Jp(n,e={}){let t=String(n??"").toLowerCase(),i=xs.get(t);if(i)return i.refs+=1,qp(i);let s=ql.get(t),r=s??mS(t,e);s===void 0&&(ql.set(t,r),r.then(()=>ql.delete(t),()=>ql.delete(t)));let o=await r;return o.refs+=1,qp(o)}async function mS(n,e){let t=typeof e.loadGltf=="function"?e.loadGltf:uS,i,s=!1;try{let c=(await t(`${id}?model=${encodeURIComponent(n)}`))?.scene;if(!c||typeof c.traverse!="function")throw new Error("GLB \u7ED3\u679C\u7F3A\u5C11 scene");i=c}catch{i=pS(e.armLinks),s=!0}let r=dS(i),o={id:n,refs:0,root:i,groups:r,usedFallback:s,applyFK(a){_h(r,a)}};return gS(o),o}function gS(n){if(xs.set(n.id,n),!(xs.size<=cS)){for(let[e,t]of xs)if(!(t===n||t.refs>0)){Kp(t.root),xs.delete(e);return}}}function _h(n,e){let t=e?.links;if(!(!Array.isArray(t)||!Array.isArray(n))){n[0]&&(n[0].matrix.identity(),n[0].matrixWorldNeedsUpdate=!0);for(let i=1;i<7;i++){let s=t[i-1];n[i]&&Array.isArray(s)&&(n[i].matrix.fromArray(s),n[i].matrixWorldNeedsUpdate=!0)}}}function qp(n){let e=!1;return{root:n.root,groups:n.groups,usedFallback:n.usedFallback,applyFK:n.applyFK,dispose(){e||(e=!0,n.refs-=1,!(n.refs>0)&&(Kp(n.root),xs.get(n.id)===n&&xs.delete(n.id)))}}}var _S=["map","lightMap","aoMap","emissiveMap","bumpMap","normalMap","displacementMap","roughnessMap","metalnessMap","alphaMap","clearcoatMap","clearcoatNormalMap","clearcoatRoughnessMap","iridescenceMap","iridescenceThicknessMap","sheenColorMap","sheenRoughnessMap","specularMap","specularColorMap","specularIntensityMap","transmissionMap","thicknessMap","anisotropyMap","gradientMap"];function Kp(n){n?.traverse?.(e=>{e.geometry?.dispose?.();let t=Array.isArray(e.material)?e.material:e.material?[e.material]:[];for(let i of t){for(let s of _S)i?.[s]?.dispose?.();i?.dispose?.()}}),n?.parent?.remove?.(n)}function xS(){return[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}function Zp(n,e){let t=new Array(16);for(let i=0;i<4;i++)for(let s=0;s<4;s++)t[i*4+s]=n[s]*e[i*4]+n[4+s]*e[i*4+1]+n[8+s]*e[i*4+2]+n[12+s]*e[i*4+3];return t}function yS(n){let e=Math.cos(n),t=Math.sin(n);return[e,t,0,0,-t,e,0,0,0,0,1,0,0,0,0,1]}function vS(n,e,t,i,s,r){let o=Math.cos(i),a=Math.sin(i),c=Math.cos(s),l=Math.sin(s),h=Math.cos(r),u=Math.sin(r);return[h*c,u*c,-l,0,h*l*a-u*o,u*l*a+h*o,c*a,0,h*l*o+u*a,u*l*o-h*a,c*o,0,n,e,t,1]}function Ao(n,e){let t=[],i=xS();for(let s=0;s<6;s++){let r=n.links[s];i=Zp(i,vS(r.x??0,r.y??0,r.z??0,r.roll??0,r.pitch??0,r.yaw??0)),i=Zp(i,yS(e?.[s]??0)),t.push(i.slice())}return{links:t,tool0:i.slice()}}var bS=3,SS=8,MS=.001,TS=.004,Qp=5,Jl=180/Math.PI,ES=n=>[n[8],n[9],n[10]],em=n=>[n[12],n[13],n[14]];function wS(n,e){if(n==null||e==null||e.length<6)return null;let t=Ao(n,e),i=t?.tool0,s=t?.links;if(!i||!Array.isArray(s)||s.length<6)return null;let r=[[],[],[],[],[],[]],o=em(i);for(let a=0;a<6;a+=1){let c=s[a],l=ES(c),h=em(c),u=o[0]-h[0],d=o[1]-h[1],f=o[2]-h[2];r[0][a]=l[1]*f-l[2]*d,r[1][a]=l[2]*u-l[0]*f,r[2][a]=l[0]*d-l[1]*u,r[3][a]=l[0],r[4][a]=l[1],r[5][a]=l[2]}return r}function AS(n){if(!Array.isArray(n)||n.length!==6)return null;let e=n.map(i=>Array.from(i)),t=1;for(let i=0;i<6;i+=1){let s=i;for(let r=i+1;r<6;r+=1)Math.abs(e[r][i])>Math.abs(e[s][i])&&(s=r);if(e[s][i]===0)return 0;if(s!==i){let r=e[s];e[s]=e[i],e[i]=r,t=-t}t*=e[i][i];for(let r=i+1;r<6;r+=1){let o=e[r][i]/e[i][i];if(o!==0)for(let a=i;a<6;a+=1)e[r][a]-=o*e[i][a]}}return t}function RS(n,e,t=null){let i=wS(n,e);if(i===null)return null;let s=AS(i);if(s===null||!Number.isFinite(s))return null;let r=Math.abs(s);return!Number.isFinite(t)||!(t>0)?r:r/t**3}function CS(n,e){if(n==null||e==null)return null;let t=1/0,i=-1,s=Math.min(n.length??0,e.length??0);for(let r=0;r<s;r+=1){let o=e[r],a=n[r];if(o==null||a==null||!Number.isFinite(a))continue;let[c,l]=o;if(!Number.isFinite(c)||!Number.isFinite(l))continue;let h=a<c?(a-c)*Jl:a>l?(l-a)*Jl:Math.min(a-c,l-a)*Jl;h<t&&(t=h,i=r)}return i<0?null:{deg:t,joint:i}}function tm({kin:n,joints:e,limits:t=null,reach:i=null,manip:s=null}={}){if(n==null||e==null||e.length<6)return null;let r=Array.from(e).slice(0,6);if(!r.every(d=>Number.isFinite(d)))return null;let o=Math.abs(r[4])*Jl,a=Number.isFinite(s)?s:RS(n,r,i),c=CS(r,t),l=[],h="ok",u=d=>{d==="at"||h==="at"?h="at":(d==="near"||h==="near")&&(h="near")};return o<=bS?(u("at"),l.push("wrist")):o<=SS&&(u("near"),l.push("wrist")),a!==null&&Number.isFinite(a)&&(a<=MS?(u("at"),l.push("manip")):a<=TS&&(u("near"),l.push("manip"))),c!==null&&c.deg<=Qp&&(u(c.deg<0?"at":"near"),l.push("limit")),{level:h,wristDeg:o,manip:a,limitDeg:c===null?null:c.deg,limitJoint:c===null?null:c.joint,limitNear:c!==null&&c.deg<=Qp,reasons:l}}var nm=5949690,PS=.28,IS=16754263;function im(n,e={}){let t=n?.root;if(!t||typeof t.clone!="function")throw new Error("createGhostArm: \u9700\u8981\u4E00\u4E2A\u542B root \u7684\u6A21\u578B\u53E5\u67C4");let i=t.clone(!0);i.name="ursim-twin-ghost-arm";let s=new hn({color:e.color??nm,transparent:!0,opacity:e.opacity??PS,depthWrite:!1,side:tn,roughness:.5,metalness:.05});i.traverse?.(o=>{o.isMesh&&(o.material=s)});let r=[];for(let o=0;o<7;o++)r.push(i.getObjectByName?.(`assemble_${yr[o]}`)??null);return i.visible=!1,{root:i,groups:r,material:s,applyFK(o){_h(r,o)},setVisible(o){i.visible=o===!0},setPending(o){let a=e.color??nm;s.color.setHex(o===!0?IS:a)}}}function xh(n){n!=null&&(n.root?.parent?.remove?.(n.root),n.material?.dispose?.())}var sm=4030118,LS=16765286,yh=.1,DS=.002,NS=.6,OS=1;function Kl(n){let e=jl(n);if(e===null)return null;let t=e.slice(0,6).reduce((i,s)=>i+(Number.isFinite(s)?s:0),0);return t>0?t:null}function FS(n,e={}){if(!Array.isArray(n)||n.length<3)return null;let[t,i,s]=n;if(!Number.isFinite(t)||!Number.isFinite(i)||!Number.isFinite(s))return null;let r=Math.hypot(t,i,s),o=Number.isFinite(e.deadzoneN)?e.deadzoneN:OS;if(!(r>o))return null;let a=Number.isFinite(e.metersPerNewton)?e.metersPerNewton:DS,c=Number.isFinite(e.maxLength)?e.maxLength:NS,l=Math.min(c,r*a);return{direction:[t/r,i/r,s/r],length:l}}function rm(n){let e=new Lt;e.name="ursim-twin-reach-sphere";let t=Number.isFinite(n)&&n>0?n:1,i=new ht(new ss(t,32,20),new en({color:sm,transparent:!0,opacity:.06,side:zt,depthWrite:!1}));i.name="ursim-twin-reach-shell",e.add(i);let s=new ht(new ss(t,16,10),new en({color:sm,transparent:!0,opacity:.18,wireframe:!0,depthWrite:!1,side:tn}));return s.name="ursim-twin-reach-wire",e.add(s),e.visible=!1,e}function om(n=.03){let e=Number.isFinite(n)&&n>0?n:.03,t=new ht(new ss(e/2,16,12),new en({color:LS,depthTest:!1}));return t.name="ursim-twin-cog-marker",t.visible=!1,t}function am(n){let e=new mo(new D(0,0,1),new D(0,0,0),yh,16777215,yh*.25,yh*.15);return e.name="ursim-twin-force-arrow",e.visible=!1,vh(e,n),e}function vh(n,e,t){if(n==null)return;let i=FS(e,t);if(i===null){n.visible=!1;return}n.setDirection(new D(...i.direction)),n.setLength(i.length,i.length*.25,i.length*.15),n.visible=!0}function lm(n){n!=null&&(n.traverse?.(e=>{e.geometry?.dispose?.();let t=e.material;if(Array.isArray(t))for(let i of t)i?.dispose?.();else t?.dispose?.()}),n.parent?.remove?.(n))}function US(n,e,t){return n.map((i,s)=>i+(e[s]-i)*t)}function cm(n,e,t){let i=e.ts-n.ts;if(!(i>0))return e.q.slice();let s=Math.min(1,Math.max(0,(t-n.ts)/i));return US(n.q,e.q,s)}function um(n,e,t){return[...n,e].filter(s=>e.ts-s.ts<=t)}function hm(n){return n.map(e=>[e.tcp[0],e.tcp[1],e.tcp[2]])}var BS=Object.freeze([.12,.28,.45]),kS=Object.freeze([.35,.78,1]);function dm(n,e={}){if(!Array.isArray(n)||n.length===0)return[];let t=Array.isArray(e.oldColor)?e.oldColor:BS,i=Array.isArray(e.newColor)?e.newColor:kS,r=n.map(l=>Number.isFinite(l?.ts)?l.ts:null).filter(l=>l!==null),o=r.length>0?Math.max(...r):null,a=r.length>0?Math.min(...r):null,c=o!==null&&a!==null?o-a:0;return n.map((l,h)=>{let u;return c>0&&Number.isFinite(l?.ts)?u=(l.ts-a)/c:u=n.length<=1?1:h/(n.length-1),u=Math.min(1,Math.max(0,u)),[t[0]+(i[0]-t[0])*u,t[1]+(i[1]-t[1])*u,t[2]+(i[2]-t[2])*u]})}var zS="ts,tcp_x,tcp_y,tcp_z,j1,j2,j3,j4,j5,j6";function fm(n){let e=[zS];if(!Array.isArray(n))return e.join(`
`);let t=i=>Number.isFinite(i)?i.toFixed(6):"";for(let i of n){let s=Array.isArray(i?.tcp)?i.tcp:[],r=Array.isArray(i?.q)?i.q:[],o=[t(i?.ts),t(s[0]),t(s[1]),t(s[2]),t(r[0]),t(r[1]),t(r[2]),t(r[3]),t(r[4]),t(r[5])];e.push(o.join(","))}return e.join(`
`)}var pm="dsh-ursim-twin-styles",HS="data-dsh-ursim-twin-style",VS=`
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
/* \u63A7\u5236\u8F68\u7684\u63D0\u793A\u884C/\u62A5\u9519\u680F\uFF080.3.6 \u8D77\u9519\u8BEF\u884C\u30010.3.8 \u8D77\u63D0\u793A\u884C\uFF09\uFF1A\u7528\u6237\u8981\u6C42\u628A\u5B83\u4EEC\u4ECE\u53F3\u8F68\u9876\u90E8
   \u632A\u5230\u8EAB\u4EFD\u884C\u53F3\u4FA7\u3001\u4E0E\u7CFB\u7EDF\u62A5\u9519\u680F**\u5404\u5360\u4E00\u4E2A\u69FD\u4F4D**\u5171\u5B58\u3002\u69FD\u4F4D\u53EF\u6536\u7F29\uFF08\u8D85\u957F\u7701\u7565\u800C\u4E0D\u662F\u6491\u7834\u8EAB\u4EFD\u884C\uFF09\uFF1B
   \u91CC\u9762\u7684\u8282\u70B9\u53BB\u6389\u8F68\u5185\u7684\u4E0B\u5916\u8FB9\u8DDD\u3001\u6539\u5355\u884C\u663E\u793A\uFF0C\u7A7A\u7684\u65F6\u5019\u4ECD\u9760 :empty \u90A3\u6761\u89C4\u5219\u6574\u4E2A\u6D88\u5931\u3002 */
.ursim-twin-hud-row[data-ursim-twin-identity] > [data-ursim-twin-identity-error] {
  display: inline-flex;
  min-width: 0;
  overflow: hidden;
}
.ursim-twin-identity-error > .ursim-twin-ctl-error,
.ursim-twin-identity-error > .ursim-twin-ctl-note {
  margin: 0;
  font-size: 11px;
  line-height: inherit;
  white-space: pre;
  overflow: hidden;
  text-overflow: ellipsis;
}
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
/* \u2500\u2500 \u63A7\u5236\u8F68\uFF082026-10-20 \u5408\u5E76\u4E3A\u5355\u6761\u53F3\u8F68\uFF0C\u8F68\u5BBD 500px\uFF09\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
   \u5E03\u5C40\u6309\u7528\u6237\u7ED9\u7684\u53C2\u7167\u56FE\u81EA\u4E0A\u800C\u4E0B\uFF1A
     \u53EA\u8BFB\u8BFB\u6570\u884C \u2192 TCP \u4F4D\u59FF\u516D\u683C\uFF08X/Y/Z \u4E00\u884C\u3001RX/RY/RZ \u4E00\u884C\uFF09+ \u53F3\u4FA7\u300C\u5750\u6807\u7CFB\u300D\u7AD6\u6392\u4E24\u6863
     \u2192 \u4E24\u5757\u65B9\u5411\u76D8\uFF08TCP \u4F4D\u7F6E / TCP \u65B9\u5411\uFF09+ \u53F3\u4FA7\u6B65\u957F \u2192 \u516D\u884C\u5173\u8282\uFF08\u25C0 \u6ED1\u5757 \u25B6 \u89D2\u5EA6\uFF09\u3002
   \u4E3B\u533A\u662F\u4E24\u5217 grid\uFF1A\u5DE6\u5217\uFF08\u4F4D\u59FF + \u65B9\u5411\u76D8\uFF09\u81EA\u9002\u5E94\uFF0C\u53F3\u5217\u56FA\u5B9A 104px\uFF08\u5750\u6807\u7CFB + \u6B65\u957F\uFF09\uFF0C
   \u5BF9\u5E94\u53C2\u7167\u56FE\u53F3\u4FA7\u90A3\u6761\u7AD6\u5E26 \u2014\u2014 \u5750\u6807\u7CFB\u4E0E\u6B65\u957F\u5FC5\u987B\u843D\u5728\u540C\u4E00\u5217\uFF0C\u5426\u5219\u4E24\u8005\u5DE6\u53F3\u4F1A\u9519\u5F00\u3002
   \u6B65\u957F\u4E24\u5757\uFF08mm / \xB0\uFF09\u6309\u7528\u6237\u8981\u6C42\u6539\u6210**\u4E0A\u4E0B**\u5806\u53E0\uFF08\u539F\u5148\u662F\u5DE6\u53F3\u5E76\u6392\u4E24\u5217\uFF09\u3002
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
/* \u4E3B\u533A\u4E24\u5217\uFF1A\u5DE6 = \u4F4D\u59FF + \u65B9\u5411\u76D8\uFF0C\u53F3 = \u5750\u6807\u7CFB + \u6B65\u957F\u3002
   \u53F3\u5217\u6536\u7A84\u5230 96 px\uFF1A\u4F4D\u59FF\u516D\u683C\u56E0\u6B64\u591A\u51FA 8 px \u7ED9\u8F93\u5165\u6846\uFF08\u53C2\u8003\u56FE\u91CC\u8FB9\u6846\u660E\u663E\u5BBD\u4E8E\u6807\u7B7E\uFF09\u3002 */
.ursim-twin-ctl-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 96px;
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
  /* 3 \xD7 54 + 2 \xD7 6 = 174\uFF1A\u4E24\u76D8\u5E76\u6392 2 \xD7 174 + 10 = 358 \u2264 \u5DE6\u5217\u53EF\u7528\u5BBD\u5EA6\uFF08500 \u2212 1 \u8FB9\u6846 \u2212
     20 \u5185\u8FB9\u8DDD \u2212 96 \u53F3\u5217 \u2212 10 \u5217\u95F4\u8DDD = 373\uFF09\u3002 */
  grid-template-columns: repeat(3, 54px);
  grid-template-rows: repeat(3, 54px);
  gap: 6px;
  justify-content: start;
}
.ursim-twin-ctl-cell { display: block; }
.ursim-twin-ctl-button {
  width: 54px;
  height: 54px;
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
  min-width: 0;
  width: auto;
  height: 44px;
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
  flex: 0 0 32px;
  height: 32px;
  border-right: 0;
  border-bottom: 1px solid var(--ursim-border-subtle);
}
/* \u6B65\u957F\uFF1A\u4E24\u5757\uFF08mm \u5728\u4E0A\u3001\xB0 \u5728\u4E0B\uFF09\u4E0A\u4E0B\u5806\u53E0\uFF0C\u6BCF\u5757\u5185\u90E8\u518D\u300C\u6807\u7B7E\u5728\u5DE6 + \u7AD6\u6392\u4E09\u6863\u300D\u3002
   \u7528\u6237\u660E\u786E\u8981\u6C42"\u4E0D\u8981\u5DE6\u53F3\u7ED3\u6784\uFF0C\u6539\u6210\u4E0A\u4E0B\u7ED3\u6784"\u2014\u2014\u4E24\u5757\u4E4B\u95F4\u662F\u4E0A\u4E0B\uFF1B\u5757\u5185\u6807\u7B7E\u4E0E\u6309\u94AE\u7684\u5DE6\u53F3
   \u5173\u7CFB\u7167\u53C2\u8003\u56FE\uFF08\u6807\u7B7E\u5217\u7A84\u5230 40 px \u65F6\u300C\u6B65\u957F mm\u300D\u81EA\u7136\u6298\u6210\u4E24\u884C\uFF09\u3002 */
.ursim-twin-ctl-steps {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.ursim-twin-ctl-stepcol {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.ursim-twin-ctl-stepcol > .ursim-twin-ctl-label {
  margin: 0;
  line-height: 1.3;
  white-space: normal;
}
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
  gap: 6px;
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
  flex: 0 0 22px;
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
/* \u5173\u8282\uFF1A\u540D\u79F0 44 + \u25C0 30 + \u6ED1\u5757 + \u25B6 30 + \u89D2\u5EA6 52\uFF0C\u884C\u9AD8 34\u3001\u5217\u95F4\u8DDD 6\u3002
   \u5BBD\u5EA6\u4ECE 500 px \u91CC\u62A0\uFF1A\u56FA\u5B9A\u5217 156 + \u95F4\u8DDD 24 = 180\uFF0C\u6ED1\u5757\u62FF\u5269\u4E0B\u7684 ~299 px\u3002 */
.ursim-twin-ctl-joint-row {
  display: grid;
  grid-template-columns: 44px 30px minmax(0, 1fr) 30px 52px;
  align-items: center;
  /* \u95F4\u9699 6px\uFF1A\u25C0 / \u25B6 \u6BCF\u679A\u90FD\u771F\u4E0B\u53D1 1\xB0\uFF0C\u8D34\u592A\u8FD1\u65F6\u8BEF\u89E6\u4E00\u6B21\u673A\u68B0\u81C2\u5C31\u52A8\uFF1B30\xD730 \u547D\u4E2D\u533A\u4E0D\u518D\u7F29\u5C0F\u3002 */
  gap: 6px;
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
  /* \u547D\u4E2D\u533A 30\xD730\uFF1A\u8FD9\u662F"\u6BCF\u70B9\u4E00\u6B21\u771F\u4E0B\u53D1 1\xB0"\u7684\u6309\u94AE\uFF0C\u518D\u5C0F\u5728\u89E6\u5C4F/\u89E6\u63A7\u677F\u4E0A\u5BB9\u6613\u70B9\u504F\u3002 */
  width: 30px;
  height: 30px;
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
 * \u5355\u6761\u8F68\u56FA\u5B9A 500px\u3001\u4E2D\u95F4 3D \u5217\u6700\u5C11 280px\uFF0C\u56E0\u6B64\u9762\u677F\u5BBD\u5EA6\u4E0D\u8DB3 \u2248 790px \u65F6\u6574\u6761\u8F68\u4F1A\u6389\u51FA\u53EF\u89C6\u533A\u3002
 * \u8FD9\u91CC\u4E0D\u6539\u5217\u5BBD\uFF08inline \u7684 grid-template-columns \u7531 stageColumns() \u62FC\u51FA\uFF0C\u6D4B\u8BD5\u6309\u5B83\u65AD\u8A00\uFF0C
 * \u585E\u8FDB\u6837\u5F0F\u4F1A\u8BA9"\u5217\u5BBD"\u51FA\u73B0\u4E24\u4E2A\u771F\u6E90\uFF09\uFF0C\u800C\u662F\u5141\u8BB8\u6A2A\u5411\u6EDA\u52A8\uFF1A\u63A7\u4EF6\u8FD8\u5728\uFF0C\u53EA\u662F\u8981\u5212\u4E00\u4E0B\u3002
 */
@container (max-width: 999px) {
  .ursim-twin-stage { overflow-x: auto; }
}
`.trim();function mm(n=globalThis.document){if(!n||typeof n.createElement!="function")return null;let e=typeof n.getElementById=="function"?n.getElementById(pm):null;if(e)return e;let t=n.createElement("style");return t.id=pm,typeof t.setAttribute=="function"&&t.setAttribute(HS,""),t.textContent=VS,(n.head??n.documentElement??n.body??null)?.appendChild?.(t),t}var Oe=As(),GS=500,WS=24,$S=280,xm="dsh-nonead-ursim.rails";function XS(n){return n===!0?WS:GS}function Rh(n){return`minmax(${$S}px, 1fr) ${XS(n?.right===!0)}px`}function YS(n){let e={right:!1},t=null;try{t=n?.getItem?.(xm)??null}catch{return e}if(typeof t!="string"||t==="")return e;let i=null;try{i=JSON.parse(t)}catch{return e}return!i||typeof i!="object"?e:{right:i.right===!0}}function qS(n,e){let t={right:e?.right===!0};try{return n?.setItem?.(xm,JSON.stringify(t)),t}catch{return null}}function ym(n,e,t={}){let i=typeof t.onChange=="function"?t.onChange:null,s=n.createElement("div");s.className="ursim-twin-rail",s.setAttribute("data-ursim-twin-rail","right");let r=n.createElement("button");r.setAttribute("type","button"),r.className="ursim-twin-rail-toggle",r.setAttribute("data-ursim-twin-rail-toggle","right");let o=n.createElement("div");o.className="ursim-twin-rail-body",o.setAttribute("data-ursim-twin-rail-body","right"),s.appendChild(r),s.appendChild(o);let a=!1;function c(){s.setAttribute("data-collapsed",a?"true":"false"),r.setAttribute("aria-expanded",a?"false":"true"),r.textContent=a?"\u2039":"\u203A";let h=a?"\u5C55\u5F00\u63A7\u5236\u8F68":"\u6536\u8D77\u63A7\u5236\u8F68";r.setAttribute("title",h),r.setAttribute("aria-label",h)}function l(h,u={}){let d=h===!0;return d===a||(a=d,c(),u.persist!==!1&&qS(e,{right:a}),i?.(a)),a}return r.addEventListener("click",()=>{l(!a)}),a=YS(e).right===!0,c(),{rail:s,toggle:r,body:o,setCollapsed:l,isCollapsed:()=>a}}function jS(n,e){let t=n?.createElement?.("div")??null;return t?(t.className="ursim-twin-rail-body",t.setAttribute("data-ursim-twin-rail-body","right"),t.__deps=e??{},t):null}function Ql(){let n=null,e=new Set,t=()=>{for(let i of[...e])try{i(n!==null)}catch{}};return{tryAcquire(i){return n!==null?!1:(n=i,t(),!0)},release(i){n===i&&(n=null,t())},isHeld:()=>n!==null,subscribe(i){return typeof i!="function"?()=>{}:(e.add(i),()=>e.delete(i))}}}var JS=250,KS=100,ZS=400,QS=.025,eM=15,tM=eM*Math.PI/180,nM=Object.freeze([1,5,10]),iM=Object.freeze([1,2,5]),sM=1,rM=1;function oM(n,e,t){return{mode:"cartesian",axis:n,distance:e,frame:t==="base"?"base":"tool"}}function aM(n,e,t){return{mode:"rotate",axis:n,deltaRad:e*Math.PI/180,frame:t==="base"?"base":"tool"}}var Ro=Object.freeze({"cartesian-x-plus":{mode:"cartesian",axis:"x",sign:1,label:"X+"},"cartesian-x-minus":{mode:"cartesian",axis:"x",sign:-1,label:"X\u2212"},"cartesian-y-plus":{mode:"cartesian",axis:"y",sign:1,label:"Y+"},"cartesian-y-minus":{mode:"cartesian",axis:"y",sign:-1,label:"Y\u2212"},"cartesian-z-plus":{mode:"cartesian",axis:"z",sign:1,label:"Z+"},"cartesian-z-minus":{mode:"cartesian",axis:"z",sign:-1,label:"Z\u2212"},"rotate-rx-plus":{mode:"rotate",axis:"rx",sign:1,label:"RX+"},"rotate-rx-minus":{mode:"rotate",axis:"rx",sign:-1,label:"RX\u2212"},"rotate-ry-plus":{mode:"rotate",axis:"ry",sign:1,label:"RY+"},"rotate-ry-minus":{mode:"rotate",axis:"ry",sign:-1,label:"RY\u2212"},"rotate-rz-plus":{mode:"rotate",axis:"rz",sign:1,label:"RZ+"},"rotate-rz-minus":{mode:"rotate",axis:"rz",sign:-1,label:"RZ\u2212"},home:{mode:"home",label:Oe.controlsHome}});function ot(n,e,t,i,s){let r=n.createElement(e);return t&&(r.className=t),i&&r.setAttribute(i,s===void 0?"":String(s)),r}function Zl(n,e,t,i,s){let r=ot(n,"button",e,i,s);return r.setAttribute("type","button"),r.textContent=t,r}function bh(n,e,t,i,s,r){let o=ot(n,"div","ursim-twin-ctl-seg");o.setAttribute("role","group"),o.setAttribute("aria-label",e);let a=[],c=s,l=h=>{c=h;for(let u of a)u.button.setAttribute("aria-pressed",u.value===c?"true":"false")};for(let h of i){let u=Zl(n,"ursim-twin-ctl-seg-button",h.text,t,h.value);h.title&&u.setAttribute("title",h.title),u.addEventListener("click",()=>{u.disabled!==!0&&(l(h.value),r?.(h.value))}),o.appendChild(u),a.push({button:u,value:h.value})}return l(c),{wrap:o,buttons:a,setActive:l}}function lM(n,e={}){let t={...e},i=typeof t.send=="function"?t.send:null,s=typeof t.setTimeout=="function"?t.setTimeout:globalThis.setTimeout,r=typeof t.clearTimeout=="function"?t.clearTimeout:globalThis.clearTimeout,o=t.lock??Ql(),a=t.host??null,c=!1,l=sM,h=rM,u="base",d=!1,f=null,g=!1,y=null,m=null,p=null,E=null,T=[],v=(A,B,z)=>{A.addEventListener(B,z),T.push(()=>A.removeEventListener?.(B,z))},R=n?.defaultView??null,w=[],C=(A,B,z,ce)=>{!A||typeof A.addEventListener!="function"||(A.addEventListener(B,z,ce),w.push(()=>A.removeEventListener?.(B,z,ce)))},L=[],b=[],x=ot(n,"div","ursim-twin-ctl-section","data-ursim-ctl-section","position"),P=ot(n,"div","ursim-twin-ctl-label");P.textContent=Oe.controlsTcpPosition,x.appendChild(P);let U=ot(n,"div","ursim-twin-ctl-pad","data-ursim-ctl-pad","position");x.appendChild(U);for(let A of[null,"cartesian-y-plus",null,"cartesian-x-minus","home","cartesian-x-plus",null,"cartesian-y-minus",null]){if(A===null){let B=ot(n,"span","ursim-twin-ctl-cell");B.setAttribute("aria-hidden","true"),U.appendChild(B);continue}U.appendChild(xe(A))}let W=ot(n,"div","ursim-twin-ctl-row","data-ursim-ctl-row","z");W.appendChild(xe("cartesian-z-plus")),W.appendChild(xe("cartesian-z-minus")),x.appendChild(W);let $=ot(n,"div","ursim-twin-ctl-section","data-ursim-ctl-section","orientation"),J=ot(n,"div","ursim-twin-ctl-label");J.textContent=Oe.controlsTcpOrientation,$.appendChild(J);let G=ot(n,"div","ursim-twin-ctl-pad","data-ursim-ctl-pad","orientation");$.appendChild(G);for(let A of[null,"rotate-rx-plus",null,"rotate-ry-minus",null,"rotate-ry-plus",null,"rotate-rx-minus",null]){if(A===null){let B=ot(n,"span","ursim-twin-ctl-cell");B.setAttribute("aria-hidden","true"),G.appendChild(B);continue}G.appendChild(xe(A))}let Q=ot(n,"div","ursim-twin-ctl-row","data-ursim-ctl-row","rz");Q.appendChild(xe("rotate-rz-plus")),Q.appendChild(xe("rotate-rz-minus")),$.appendChild(Q);let X=ot(n,"div","ursim-twin-ctl-section","data-ursim-ctl-section","steps"),te=ot(n,"div","ursim-twin-ctl-steps"),ue=ot(n,"div","ursim-twin-ctl-stepcol"),Ee=ot(n,"div","ursim-twin-ctl-label");Ee.textContent=Oe.controlsStepMm,ue.appendChild(Ee);let Ve=bh(n,Oe.controlsStepMm,"data-ursim-step-mm",nM.map(A=>({value:String(A),text:String(A),title:Oe.controlsStepMmOptionTitle(A)})),String(l),A=>{l=Number(A),Le()});Ve.wrap.setAttribute("data-ursim-ctl-seg","step-mm"),b.push(...Ve.buttons.map(A=>A.button)),ue.appendChild(Ve.wrap),te.appendChild(ue);let qe=ot(n,"div","ursim-twin-ctl-stepcol"),lt=ot(n,"div","ursim-twin-ctl-label");lt.textContent=Oe.controlsStepDeg,qe.appendChild(lt);let Xe=bh(n,Oe.controlsStepDeg,"data-ursim-step-deg",iM.map(A=>({value:String(A),text:String(A),title:Oe.controlsStepDegOptionTitle(A)})),String(h),A=>{h=Number(A),Le()});Xe.wrap.setAttribute("data-ursim-ctl-seg","step-deg"),b.push(...Xe.buttons.map(A=>A.button)),qe.appendChild(Xe.wrap),te.appendChild(qe),X.appendChild(te);let K=bh(n,Oe.controlsFrameTitle,"data-ursim-frame",[{value:"tool",text:Oe.controlsFrameTool,title:Oe.controlsFrameOptionTitle(Oe.controlsFrameTool)},{value:"base",text:Oe.controlsFrameBase,title:Oe.controlsFrameOptionTitle(Oe.controlsFrameBase)}],u,A=>{u=A,Le()});K.wrap.setAttribute("data-ursim-ctl-seg","frame"),b.push(...K.buttons.map(A=>A.button));let Z=ot(n,"div","ursim-twin-ctl-jog","data-ursim-ctl-row","jog");Z.appendChild(x),Z.appendChild($);function xe(A){let B=Ro[A],z=Zl(n,"ursim-twin-ctl-button",B?.label??A,"data-ursim-jog",A);return z.disabled=!0,v(z,"pointerdown",ce=>{ce?.preventDefault?.(),tt()&&Ce();try{z.setPointerCapture?.(ce?.pointerId),p={button:z,id:ce?.pointerId}}catch{p=null}Ge(A)}),v(z,"pointerup",de),v(z,"pointerleave",de),v(z,"pointercancel",de),v(z,"lostpointercapture",de),L.push({button:z,key:A}),z}function Le(){let A=u==="base"?Oe.controlsFrameBase:Oe.controlsFrameTool;for(let{button:B,key:z}of L){let ce=Ro[z];if(!ce)continue;if(ce.mode==="home"){B.setAttribute("title",Oe.controlsHomeTitle);continue}let ne=String(ce.axis).toUpperCase();B.setAttribute("title",ce.mode==="cartesian"?Oe.controlsJogPositionTitle(A,ne,ce.sign,l):Oe.controlsJogRotateTitle(A,ne,ce.sign,h))}}function we(A){let B=Ro[A];return B?B.mode==="home"?{mode:"home"}:B.mode==="cartesian"?oM(B.axis,l*B.sign/1e3,u):aM(B.axis,h*B.sign,u):null}function Ge(A){c||!d||i===null||I(we(A))&&(g=!0,y=A,fe("step"),Ro[A]?.mode!=="home"&&it(A))}function At(A){let B=Ro[A];if(!B||B.mode==="home")return null;let z=[0,0,0,0,0,0];if(B.mode==="cartesian"){let ce=B.axis==="x"?0:B.axis==="y"?1:2;z[ce]=B.sign*QS}else{let ce=B.axis==="rx"?3:B.axis==="ry"?4:5;z[ce]=B.sign*tM}return{mode:"velocity",twist:z,frame:u==="base"?"base":"tool",ttlMs:ZS}}function I(A){if(c||!A||i===null||!d||!o.tryAcquire("jog"))return!1;let B=()=>{o.release("jog"),c||pt()},z;try{z=i(A)}catch{return B(),!1}return z!==null&&typeof z?.then=="function"?z.then(B,B):B(),pt(),!0}function it(A){y=A,me(),f=s(()=>{f=null,!(c||!g)&&(fe("velocity"),Fe())},JS)}function Fe(){if(c||!g)return;let A=At(y);d&&A!==null&&I(A),f=s(Fe,KS)}function me(){f!==null&&(typeof r=="function"&&r(f),f=null)}function fe(A){A!==m&&(m=A,Z.setAttribute("data-ursim-jog-mode",A),a&&a!==Z&&a.setAttribute("data-ursim-jog-mode",A))}function tt(){let A=g;g=!1,y=null,me();let B=p;if(p=null,B)try{B.button.hasPointerCapture?.(B.id)===!0&&B.button.releasePointerCapture(B.id)}catch{}return fe("step"),A}function de(){tt()&&Ce()}function Ce(){if(i===null)return;let A=z=>{Z.setAttribute("data-ursim-stop-failed","true"),t.reportError?.(Oe.controlsStopFailed(z instanceof Error?z.message:String(z)))},B;try{B=i({mode:"stop"})}catch(z){A(z);return}B!==null&&typeof B?.then=="function"?B.then(()=>{Z.removeAttribute?.("data-ursim-stop-failed")},A):Z.removeAttribute?.("data-ursim-stop-failed")}C(R,"blur",()=>de()),C(R,"pointerup",()=>de(),!0),C(R,"visibilitychange",()=>{n?.visibilityState==="hidden"&&de()});function pt(){let A=o.isHeld(),B=`${d?"1":"0"}${A?"1":"0"}`;if(B!==E){E=B;for(let z of L)z.button.disabled=!d,z.button.setAttribute("aria-disabled",A?"true":"false");for(let z of b)z.disabled=!d;Z.setAttribute("data-ursim-ctl-state",d?A?"busy":"ready":"disabled")}}function j(A){return!(i===null||A?.connected!==!0||A?.feedStale===!0||A?.simulated!==!0)}function S(A){if(c)return;let B=j(A);B!==d&&(d=B,d||de(),pt())}function _(){if(!c){c=!0,de();for(let A of T)try{A()}catch{}T.length=0;for(let A of w)try{A()}catch{}w.length=0}}let F=o.subscribe(()=>pt());return fe("step"),Le(),pt(),{row:Z,steps:X,frameSeg:K.wrap,sync:S,dispose(){F(),_()}}}var Sh=Object.freeze(["x","y","z","rx","ry","rz"]),cM=Object.freeze({x:0,y:1,z:2,rx:3,ry:4,rz:5}),Eh=-360,wh=360;function Ah(n){return n==="x"||n==="y"||n==="z"}function gm(n){return Array.isArray(n)&&n.length===6&&n.every(Number.isFinite)}function Mh(n){let e=Number(n);return Number.isFinite(e)?Math.min(wh,Math.max(Eh,e)):0}function _m(n,e){return Ah(n)?(e*1e3).toFixed(1):Number(e).toFixed(3)}var uM=/^-?\d+(\.\d+)?$/;function hM(n){let e=String(n??"").trim();if(e===""||!uM.test(e))return null;let t=Number(e);return Number.isFinite(t)?t:null}function Th(n){let e=Number(n);return Number.isFinite(e)?String(Number(e.toFixed(3))).replace(/^-/,"\u2212"):"\u2014"}function vm(n,e,t={}){let i=e??jS(n,t);if(!i)return{body:null,deps:t,sync(){},dispose(){}};i.setAttribute("data-ursim-twin-rail-body","right");let s={...i.__deps??{},...t};i.__deps=s;let r=typeof s.send=="function"?s.send:null,o=typeof s.previewJoints=="function"?s.previewJoints:null,a=s.lock??Ql(),c=j=>j&&typeof j.appendChild=="function",l=c(s.noteHost)?s.noteHost:i,h=c(s.errorHost)?s.errorHost:i,u=!1,d=!1,f=null,g=null,y=null,m=null,p=null,E=null,T=new Set,v=new Set,R=[],w=(j,S,_)=>{j.addEventListener(S,_),R.push(()=>j.removeEventListener?.(S,_))},C=ot(n,"div","ursim-twin-ctl-note","data-ursim-ctl-note");l.appendChild(C);let L=ot(n,"div","ursim-twin-ctl-error","data-ursim-ctl-error");h.appendChild(L);let b=ot(n,"div","ursim-twin-ctl-summary","data-ursim-ctl-summary");b.setAttribute("role","status"),b.setAttribute("title",Oe.controlsSummaryTitle),b.textContent="",i.appendChild(b);let x=Object.create(null),P=[],U=ot(n,"div","ursim-twin-ctl-section","data-ursim-ctl-section","pose"),W=ot(n,"div","ursim-twin-ctl-label");W.textContent=Oe.controlsToolPosition,W.setAttribute("title",Oe.controlsToolPositionTitle),U.appendChild(W);let $=ot(n,"div","ursim-twin-ctl-pose","data-ursim-ctl-grid","pose");for(let j of Sh){let S={axis:j,index:cM[j],input:null,editing:!1,lastSent:null,skipChange:!1},_=ot(n,"div","ursim-twin-ctl-pose-cell","data-ursim-pose-cell",j),F=ot(n,"span","ursim-twin-ctl-pose-label");F.textContent=j.toUpperCase();let A=n.createElement("input");A.setAttribute("type","text"),A.className="ursim-twin-ctl-pose-input",A.setAttribute("inputmode","decimal"),A.setAttribute("data-ursim-pose",j),A.setAttribute("aria-label",`${j.toUpperCase()} (${Ah(j)?"mm":"rad"})`),A.setAttribute("title",Oe.controlsToolPositionTitle),A.setAttribute("placeholder",Oe.controlsNoPoseData),A.value="",A.disabled=!0,S.input=A,x[j]=S,_.appendChild(F),_.appendChild(A),$.appendChild(_),w(A,"keydown",B=>{B?.key==="Enter"&&(B?.preventDefault?.(),S.skipChange=xe(j)!==!1)}),w(A,"change",()=>{if(S.skipChange){S.skipChange=!1;return}xe(j)}),w(A,"input",()=>{S.editing=!0,S.lastSent=null,S.skipChange=!1,Fe(A)}),w(A,"focus",()=>{S.editing=!0}),w(A,"blur",()=>{S.editing=!1})}U.appendChild($);let J=lM(n,{...s,lock:a,host:e}),G=ot(n,"div","ursim-twin-ctl-frame","data-ursim-ctl-frame","frame"),Q=ot(n,"div","ursim-twin-ctl-label");Q.textContent=Oe.controlsFrameTitle,G.appendChild(Q),J.frameSeg&&G.appendChild(J.frameSeg);let X=ot(n,"div","ursim-twin-ctl-main"),te=ot(n,"div","ursim-twin-ctl-primary"),ue=ot(n,"div","ursim-twin-ctl-side");te.appendChild(U),J.row&&te.appendChild(J.row),ue.appendChild(G),J.steps&&ue.appendChild(J.steps),X.appendChild(te),X.appendChild(ue),i.appendChild(X);let Ee=ot(n,"div","ursim-twin-ctl-section","data-ursim-ctl-section","joints"),Ve=ot(n,"div","ursim-twin-ctl-label");Ve.textContent=Oe.controlsJoints,Ve.setAttribute("title",Oe.controlsJointsTitle),Ee.appendChild(Ve);let qe=[Oe.controlsJointBase,Oe.controlsJointShoulder,Oe.controlsJointElbow,Oe.controlsJointWrist1,Oe.controlsJointWrist2,Oe.controlsJointWrist3];for(let j=0;j<6;j+=1){let S=ot(n,"div","ursim-twin-ctl-joint-row","data-ursim-joint-row",j),_=ot(n,"span","ursim-twin-ctl-joint-name");_.textContent=qe[j],_.setAttribute("title",qe[j]);let F=Zl(n,"ursim-twin-ctl-step","\u25C0","data-ursim-joint-dec",j);F.setAttribute("aria-label",`${qe[j]} \u22121\xB0`),F.setAttribute("title",Oe.controlsJointStepTitle(qe[j],-1));let A=n.createElement("input");A.setAttribute("type","range"),A.className="ursim-twin-ctl-joint-range",A.setAttribute("data-ursim-joint",j),A.setAttribute("aria-label",`${qe[j]} (\xB0)`),A.setAttribute("title",Oe.controlsJointsTitle),A.setAttribute("min",String(Eh)),A.setAttribute("max",String(wh)),A.setAttribute("step","1"),A.min=String(Eh),A.max=String(wh),A.step="1",A.value="0",A.disabled=!0;let B=Zl(n,"ursim-twin-ctl-step","\u25B6","data-ursim-joint-inc",j);B.setAttribute("aria-label",`${qe[j]} +1\xB0`),B.setAttribute("title",Oe.controlsJointStepTitle(qe[j],1));let z=ot(n,"span","ursim-twin-ctl-joint-value","data-ursim-joint-value",j);z.textContent="",S.appendChild(_),S.appendChild(F),S.appendChild(A),S.appendChild(B),S.appendChild(z),Ee.appendChild(S),P[j]={row:S,name:_,dec:F,slider:A,inc:B,value:z},w(A,"input",()=>{if(u)return;let ce=Number(A.value);if(Number.isFinite(ce)&&(T.add(j),Fe(A),z.textContent=Oe.controlsJointValue(ce),f!==null&&o!==null)){let ne=f.slice();ne[j]=ce*Math.PI/180,lt(ne)}}),w(A,"change",()=>{if(T.delete(j),u)return;let ce=Mh(Number(A.value));if(!d||a.isHeld()||r===null||f===null){I(j),Xe(),L.textContent=Z(f===null?Oe.controlsNoPoseData:Oe.controlsRejectedCommand);return}let ne=f.slice();ne[j]=ce*Math.PI/180,L.textContent="",Le({mode:"joint",q:ne},{onFail:()=>{I(j),it(A)},onOk:()=>{Fe(A)},onSettled:Xe})||Xe()}),w(B,"click",()=>K(j,1)),w(F,"click",()=>K(j,-1))}i.appendChild(Ee);function lt(j){if(o!==null)try{o(j)}catch{}}function Xe(){if(o!==null)try{o(null)}catch{}}function K(j,S){if(u||!d||a.isHeld()||r===null||f===null){u||(L.textContent=Z(f===null?Oe.controlsNoPoseData:Oe.controlsRejectedCommand));return}let _=P[j];if(!_)return;let F=f.slice();F[j]+=S*Math.PI/180,L.textContent="",Le({mode:"joint",q:F},{onFail:()=>it(_.slider)})}function Z(j){return a.isHeld()?Oe.controlsBusyRetry:p!==null&&p!==""?p:j}function xe(j){let S=x[j];if(!S)return!1;S.editing=!1;let _=S.input;if(u||!d||a.isHeld()||r===null)return u||(L.textContent=Z(Oe.controlsRejectedCommand),it(_),S.editing=!0),!0;let F=String(_.value??"").trim(),A=hM(F);if(A===null)return At(j),it(_),L.textContent=Oe.controlsInvalidRollback,!0;if(S.lastSent===_.value)return!0;if(g===null)return L.textContent=Oe.controlsNoPoseData,!0;let B=g.slice();return B[S.index]=Ah(j)?A/1e3:A,L.textContent="",Le({mode:"pose",pose:B},{onFail:()=>{At(j),it(_)},onOk:()=>{S.lastSent=_.value,Fe(_)}})||(L.textContent=Z(Oe.controlsRejectedCommand)),!0}function Le(j,S={}){if(u||!j||r===null||!d||!a.tryAcquire("rail"))return!1;let _=A=>{a.release("rail"),Ge(A,S)},F;try{F=r(j)}catch(A){return _(A),!1}return F!==null&&typeof F?.then=="function"?F.then(A=>_(we(A)),A=>_(A)):_(we(F)),fe(),!0}function we(j){if(j===null||typeof j!="object"||j.ok!==!1)return null;let S=j.error===void 0||j.error===null?"":String(j.error);return new Error(S===""?Oe.controlsRejectedCommand:S)}function Ge(j,S){u||(j?(L.textContent=Oe.controlsCommandFailed(j instanceof Error?j.message:String(j)),S?.onFail?.(),m=y):S?.onOk?.(),S?.onSettled?.(),fe())}function At(j){let S=x[j];S&&(S.lastSent=null,g!==null&&(S.input.value=_m(j,g[S.index])))}function I(j){let S=P[j];if(!S||f===null)return;let _=f[j]*180/Math.PI;S.slider.value=String(Mh(Math.round(_))),S.value.textContent=Oe.controlsJointValue(_)}function it(j){j&&(j.setAttribute("data-ursim-invalid","true"),j.setAttribute("aria-invalid","true"),v.add(j),m=y)}function Fe(j){!j||!v.has(j)||(j.removeAttribute("data-ursim-invalid"),j.removeAttribute("aria-invalid"),v.delete(j))}function me(){for(let j of[...v])Fe(j);m=null}function fe(){let j=a.isHeld(),S=`${d?"1":"0"}${j?"1":"0"}`;if(S===E)return;E=S;let _=!d||j;for(let F of Sh)x[F].input.disabled=_;for(let F of P)F.slider.disabled=_,F.inc.disabled=_,F.dec.disabled=_;i.setAttribute("data-ursim-ctl-state",d?j?"busy":"ready":"disabled")}function tt(j){return r===null||j?.connected!==!0?Oe.controlsDisabledDisconnected:j?.feedStale===!0?Oe.controlsDisabledStale:j?.simulated!==!0?Oe.controlsDisabledSimOnly:""}function de(j){if(u)return;J.sync(j);let S=tt(j),_=S==="";_!==d&&(d=_,d||(T.clear(),Xe()),fe()),S!==p&&(p=S,C.textContent=S),gm(j?.q)&&(f=j.q.slice()),gm(j?.tcp)&&(g=j.tcp.slice(),b.textContent=Oe.controlsSummary(Th(g[0]),Th(g[1]),Th(g[2])));let F=Number.isFinite(j?.ts)?j.ts:null;if(F!==null&&(y=F),v.size>0&&(m===null||F!==null&&F!==m)&&me(),g!==null)for(let A of Sh){let B=x[A];B.editing||(B.input.value=_m(A,g[B.index]))}if(f!==null)for(let A=0;A<6;A+=1){if(T.has(A))continue;let B=P[A],z=f[A]*180/Math.PI;B.slider.value=String(Mh(Math.round(z))),B.value.textContent=Oe.controlsJointValue(z)}}function Ce(){if(!u){u=!0,pt(),J.dispose(),Xe(),T.clear(),v.clear(),a.release("rail");for(let j of R)try{j()}catch{}R.length=0}}let pt=a.subscribe(()=>fe());return fe(),{body:i,deps:s,sync:de,dispose:Ce}}var Mm="data-ds-dark-theme",dM="--dsw-alias-bg-base",bm="light",Sm="dark";function fM(n){try{return n?.matchMedia?.("(prefers-color-scheme: dark)")?.matches===!0}catch{return!1}}function pM(n,e){if(typeof e?.getComputedStyle!="function")return!1;for(let t of[n?.body,n?.documentElement])if(t)try{let i=e.getComputedStyle(t)?.getPropertyValue?.(dM);if(typeof i=="string"&&i.trim()!=="")return!0}catch{}return!1}function Ch(n={}){let e=n.document??globalThis.document,t=n.window??globalThis;return e?.body?.hasAttribute?.(Mm)?Sm:pM(e,t)?bm:fM(t)?Sm:bm}function Tm(n,e={}){let t=e.document??globalThis.document,i=e.window??globalThis,s=[],r=()=>{let l;try{l=Ch({document:t,window:i})}catch{return}try{n?.(l)}catch{}},o=t?.body,a=i?.MutationObserver??globalThis.MutationObserver;if(o&&typeof a=="function"){let l=new a(r);l.observe(o,{attributes:!0,attributeFilter:[Mm]}),s.push(()=>l.disconnect?.())}let c=null;try{c=i?.matchMedia?.("(prefers-color-scheme: dark)")??null}catch{c=null}return c&&typeof c.addEventListener=="function"&&(c.addEventListener("change",r),s.push(()=>c.removeEventListener?.("change",r))),()=>{for(;s.length>0;){let l=s.pop();try{l()}catch{}}}}function Em(n){let e=i=>String(i).padStart(2,"0"),t=n instanceof Date&&!Number.isNaN(n.getTime())?n:new Date(0);return`${t.getFullYear()}-${e(t.getMonth()+1)}-${e(t.getDate())} ${e(t.getHours())}:${e(t.getMinutes())}:${e(t.getSeconds())}`}function Ph(n,e){let i=(typeof n?.model=="string"&&n.model.trim()!==""?n.model.trim():"robot").replace(/[^A-Za-z0-9._-]+/gu,"-"),s=Em(e).replace(/[: ]/gu,"-");return`ursim-twin-${i}-${s}.png`}function mM(n,e){let t=[],i=typeof n?.model=="string"&&n.model!==""?n.model:"\u672A\u77E5\u578B\u53F7",s=typeof n?.ip=="string"&&n.ip!==""?n.ip:"\u672A\u6307\u5B9A IP";t.push(`${i}  \xB7  ${s}`),n?.simulated===!0&&t.push("\u79BB\u7EBF\u4EFF\u771F\uFF08\u975E\u771F\u673A\uFF09");let r=n?.detail;if(r!==null&&typeof r=="object"){let c=[];typeof r.safety_mode=="string"&&r.safety_mode!==""&&c.push(`\u5B89\u5168 ${r.safety_mode}`),typeof r.robot_mode=="string"&&r.robot_mode!==""&&c.push(`\u6A21\u5F0F ${r.robot_mode}`),Number.isFinite(r.speed_scaling)&&c.push(`\u500D\u7387 ${(r.speed_scaling*100).toFixed(0)}%`),c.length>0&&t.push(c.join("  \xB7  "))}let o=n?.q;Array.isArray(o)&&o.length>=6&&o.every(Number.isFinite)&&t.push(o.map((c,l)=>`J${l+1} ${(c*180/Math.PI).toFixed(1)}\xB0`).join("  "));let a=n?.tcp;return Array.isArray(a)&&a.length>=3&&a.slice(0,3).every(Number.isFinite)&&t.push(`TCP [${a[0].toFixed(3)}, ${a[1].toFixed(3)}, ${a[2].toFixed(3)}] m`),t.push(Em(e)),t}function gM(n,e,t){if(n==null||!Array.isArray(e)||e.length===0)return;let i=Number.isFinite(t?.padding)?t.padding:16,s=Number.isFinite(t?.lineHeight)?t.lineHeight:22,r=Number.isFinite(t?.height)?t.height:0,o=Number.isFinite(t?.width)?t.width:0;n.save?.(),n.fillStyle="rgba(8, 12, 16, 0.62)";let a=e.length*s+i*.6;n.fillRect?.(0,r-a,o,a),n.font=`${Math.round(s*.6)}px sans-serif`,n.fillStyle="#e6edf3",n.textBaseline="bottom";for(let c=0;c<e.length;c++){let l=r-i-c*s;n.fillText?.(e[c],i,l)}n.restore?.()}function wm(n,e,t={}){let i=t.document??globalThis.document;if(i==null||n==null||typeof i.createElement!="function")return null;try{let s=i.createElement("canvas");s.width=n.width,s.height=n.height;let r=s.getContext?.("2d");return r==null?null:(r.drawImage(n,0,0),gM(r,mM(e,t.now??new Date),{width:s.width,height:s.height,...t.lineHeight===void 0?{}:{lineHeight:t.lineHeight},...t.padding===void 0?{}:{padding:t.padding}}),s.toDataURL("image/png"))}catch{return null}}function Ih(n,e,t={}){let i=t.document??globalThis.document;if(i==null||typeof n!="string"||n==="")return!1;try{let s=i.createElement("a");return s.href=n,s.download=e,s.rel="noopener",s.click?.(),!0}catch{return!1}}var ie=As(),Co=600,_M=6e4,xM=100,Dm=2500,yM=1e4,vM=3e3,bM=1e4,Am="\u6570\u636E\u5DF2\u505C\u6B62\u66F4\u65B0",Nm="\u6570\u636E\u901A\u9053\u91CD\u8FDE\u4E2D\u2026",Rm=0,SM=400;var MM="\u672A\u8FDE\u63A5\u673A\u5668\u4EBA",TM="\u5DF2\u8FDE\u63A5 \xB7 \u6B63\u5728\u52A0\u8F7D\u6A21\u578B\u2026",Po="\u5DF2\u8FDE\u63A5",EM="\uFF08\u65E0\u5185\u7F6E\u6A21\u578B\uFF0C\u4F7F\u7528\u8FD1\u4F3C\u51E0\u4F55\u4F53\uFF09",wM="\u6E32\u67D3\u5F02\u5E38\uFF1A",AM=5e3,RM="\u6A21\u578B\u52A0\u8F7D\u5931\u8D25\uFF1A",CM="\u5F53\u524D\u73AF\u5883\u4E0D\u652F\u6301 WebGL\uFF1A\u5DF2\u5207\u6362\u4E3A\u7EAF\u6570\u503C\u6A21\u5F0F\uFF08\u5173\u8282\u89D2\u4E0E TCP \u4ECD\u4F1A\u66F4\u65B0\uFF09",PM="\u673A\u5668\u4EBA\u672A\u8FD4\u56DE\u5B8C\u6574\u7684\u5173\u8282\u89D2",IM="3D \u4E0A\u4E0B\u6587\u4E22\u5931\uFF08GPU \u91CD\u7F6E\uFF09\u2014\u2014 \u6536\u8D77\u5E76\u91CD\u65B0\u5C55\u5F00\u9762\u677F\u53EF\u6062\u590D",LM="\u673A\u5668\u4EBA\u53EF\u80FD\u5DF2\u505C\u6B62\uFF0C\u8BF7\u68C0\u67E5\u793A\u6559\u5668";function DM(n,e,t){switch(n){case"no_robot":return ie.disconnectNeverConnected;case"robot_not_connected":return ie.disconnectReason(e);case"ambiguous_robot":return ie.disconnectAmbiguous(ie.disconnectCandidates(t));case"worker_unavailable":return ie.disconnectWorkerDown(e);case"robot_error":return ie.disconnectReadFailed(e);default:return e?ie.disconnectReason(e):ie.statusDisconnected}}var Om=Pp,NM="ur3",OM=Math.max(0,...Object.values(Om).map(n=>Kl(n?.links)??0));function ec(n){let e=Om??{},t=String(n??"").trim().toLowerCase();return e[t]??e[NM]??Object.values(e)[0]??null}function Cm(n){let e=[];for(let t=0;t<6;t++){let i=n?.[t],s=Number.isFinite(i)?i*180/Math.PI:null;e.push(`J${t+1} ${s===null?"--":s.toFixed(1)}`)}return`${ie.jointsPrefix}  ${e.join("  ")}`}function FM(n,e){if(n==null||e==null)return[];let t=[],i=Math.min(n.length??0,e.length??0);for(let s=0;s<i;s++){let r=e[s],o=n[s];if(!Array.isArray(r)||!Number.isFinite(o))continue;let[a,c]=r;!Number.isFinite(a)||!Number.isFinite(c)||a>c||(o<a||o>c)&&t.push(s+1)}return t}function UM(n){let t=["x","y","z","rx","ry","rz"].map((i,s)=>{let r=n?.[s];return Number.isFinite(r)?`${i} ${r.toFixed(s<3?4:3)}`:`${i} --`});return`${ie.tcpPrefix}  ${t.join("  ")}`}var BM=ie.safetyMode,kM=ie.robotMode,zM=ie.programState,HM="<\u67E5\u8BE2\u5931\u8D25>";function Dh(n,e){let t=typeof n=="string"?n.trim():"";return t===""?"--":t===HM?ie.queryFailed:e[t]??t}function VM(n={}){let e=typeof n.status=="string"?n.status:"",t=Number.isFinite(n.frames)?n.frames:0,i=Number.isFinite(n.frameErrors)?n.frameErrors:0,s=`\uFF08\u5DF2\u6536 ${t} \u5E27${i>0?`\uFF0C\u5931\u8D25 ${i} \u5E27`:""}\uFF09`;if(e==="unsupported")return`\u5F53\u524D\u73AF\u5883\u6CA1\u6709 EventSource\uFF1A${Am}${s}`;if(e==="retrying"||e==="connecting")return`${Nm}${s}`;let r=Number.isFinite(n.ageMs)?Math.max(0,n.ageMs):0;return n.feedStale===!0||r>Dm?n.connected!==!0?"":`${Am} ${(r/1e3).toFixed(1)}s \xB7 \u6B63\u5728\u91CD\u8BD5${s}`:""}var Fm=n=>Dh(n,BM),GM=n=>Dh(n,kM),WM=n=>Dh(n,zM);function Lh(n){if(typeof n!="string")return!1;let e=n.trim().toUpperCase();return e===""?!1:e!=="NORMAL"&&e!=="REDUCED"}function $M(n){let e=typeof n=="number"?n:Number(n);return Number.isFinite(e)?`x${e.toFixed(2)}`:"--"}function Pm(n,e,t=0,i=""){if(!Array.isArray(n)||n.length===0)return`${e}  --`;let s=[];for(let r=0;r<n.length;r++){let o=n[r];s.push(`J${r+1} ${Number.isFinite(o)?o.toFixed(t)+i:"--"}`)}return`${e}  ${s.join("  ")}`}function XM(n){let e=n&&typeof n=="object"?n:null;if(e===null||typeof e.error=="string")return{status:e?.error?ie.detailStatusFailed(e.error):"",temps:"",power:"",currents:"",tcpSpeed:"",hazard:!1};let t=[`\u5B89\u5168 ${Fm(e.safety_mode)}`,`\u6A21\u5F0F ${GM(e.robot_mode)}`,`\u7A0B\u5E8F ${WM(e.program_state)}`,`\u901F\u5EA6 ${$M(e.speed_scaling)}`];e.running===!0&&t.push(ie.detailRunning);let i=e.telemetry_estimated===!0?ie.detailEstimatedSuffix:"",s=o=>o===""||o===void 0?"":`${o}${i}`,r=YM(e.tcp_speed);return{status:t.join("  "),temps:s(Pm(e.joint_temperatures,ie.detailTempsPrefix)),power:Number.isFinite(Number(e.robot_voltage))&&Number.isFinite(Number(e.robot_current))?s(ie.detailBus(Number(e.robot_voltage).toFixed(1),Number(e.robot_current).toFixed(2))):"",currents:s(Array.isArray(e.joint_currents)?Pm(e.joint_currents,ie.detailCurrentsPrefix,2):""),tcpSpeed:s(r),hazard:Lh(e.safety_mode)}}function YM(n){if(!Array.isArray(n)||n.length<3)return"";let[e,t,i]=n.slice(0,3).map(Number);return!Number.isFinite(e)||!Number.isFinite(t)||!Number.isFinite(i)?"":ie.detailTcpSpeed(Math.hypot(e,t,i).toFixed(3))}var qM=[{key:"reset",label:ie.viewReset},{key:"iso",label:ie.viewIso},{key:"front",label:ie.viewFront},{key:"side",label:ie.viewSide},{key:"top",label:ie.viewTop}];function Im(n,e){let t=e?.ts-n?.ts;return Number.isFinite(t)?Math.min(SM,Math.max(Rm,t)):Rm}function et(n,e,t,i){let s=n.createElement(e);return t&&(s.className=t),i&&s.setAttribute(i,""),s}function Io(n,e){e&&(typeof n?.remove=="function"?n.remove(e):e.parent?.remove?.(e))}var Um="ursim-twin-robot",Lm=Object.freeze({reach:!1,base:!0,force:!1,ghost:!0});function jM(n,e){if(!(!n||!Array.isArray(n.children)))for(let t of n.children.slice())!t||t===e||t.name===Um&&Io(n,t)}function Bm({container:n,state:e,sceneFactory:t=Up,modelLoader:i=Jp,raf:s=globalThis.requestAnimationFrame,caf:r=globalThis.cancelAnimationFrame,now:o=()=>performance.now(),request:a=globalThis.fetch,autoSim:c=!0}={}){if(!n||typeof n.appendChild!="function")throw new TypeError("mountTwinPanel: \u9700\u8981\u4E00\u4E2A\u53EF\u7528\u7684 container \u5143\u7D20");let l=n.ownerDocument??globalThis.document;if(!l||typeof l.createElement!="function")throw new TypeError("mountTwinPanel: \u9700\u8981\u53EF\u7528\u7684 DOM\uFF08container.ownerDocument \u6216 globalThis.document\uFF09");mm(l);let h=!1,u=Ch({document:l,window:l.defaultView??globalThis}),d=null,f=null,g=null,y="",m="",p=0,E="",T=0,v=[],R=0,w=null,C=null,L=!1,b=null,x=null,P=null,U=null,W=!1,$=-1/0,J=null,G=null,Q=null,X=null,te="",ue=0,Ee=!1,Ve=!1,qe=!1,lt="",Xe=!1,K=!1,Z=null,xe=null,Le=-1/0,we=null,Ge=!0,At=-1/0,I=null,it=!1,Fe=l.hidden===!0,me=et(l,"div","ursim-twin-panel","data-ursim-twin-panel");me.setAttribute("data-ursim-twin-connected","false");let fe=et(l,"div","ursim-twin-view","data-ursim-twin-view"),tt=et(l,"canvas","ursim-twin-canvas","data-ursim-twin-canvas");tt.setAttribute("role","img"),tt.setAttribute("aria-label",ie.canvasLabel),tt.setAttribute("tabindex","0"),tt.addEventListener("keydown",N=>{let V=N?.key,oe=V==="ArrowUp"?"top":V==="ArrowDown"?"iso":V==="ArrowLeft"?"side":V==="ArrowRight"?"front":V==="Home"?"reset":null;oe!==null&&(N.preventDefault?.(),Oh(oe))}),fe.appendChild(tt);let de=et(l,"div","ursim-twin-sim-badge","data-ursim-twin-sim-badge");de.setAttribute("title",ie.simBadgeTitle),de.textContent=ie.simBadge,de.style.display="none",fe.appendChild(de);let Ce=et(l,"div","ursim-twin-hud","data-ursim-twin-hud");Ce.setAttribute("role","status"),Ce.setAttribute("aria-live","polite"),Ce.setAttribute("aria-label",ie.hudLabel);let pt=et(l,"div","ursim-twin-hud-row","data-ursim-twin-robots"),j=et(l,"div","ursim-twin-hud-row","data-ursim-twin-pending"),S=et(l,"div","ursim-twin-hud-row","data-ursim-twin-feed");S.style.display="none";let _=et(l,"div","ursim-twin-hud-row","data-ursim-twin-identity"),F=et(l,"span","ursim-twin-identity-text","data-ursim-twin-identity-text"),A=et(l,"span","ursim-twin-identity-error","data-ursim-twin-identity-error"),B=et(l,"div","ursim-twin-hud-row","data-ursim-twin-joints"),z=et(l,"div","ursim-twin-hud-row","data-ursim-twin-tcp"),ce=et(l,"div","ursim-twin-hud-row","data-ursim-twin-detail");B.setAttribute("aria-live","off"),z.setAttribute("aria-live","off"),ce.setAttribute("aria-live","off");let ne=et(l,"div","ursim-twin-hud-row","data-ursim-twin-power"),be=et(l,"div","ursim-twin-hud-row","data-ursim-twin-risk-row");Ce.appendChild(pt),Ce.appendChild(j),Ce.appendChild(_),_.appendChild(F),_.appendChild(S),_.appendChild(A);let Pe=et(l,"div","ursim-twin-hud-row","data-ursim-twin-layers"),ae={};for(let[N,V]of[["reach",ie.layerReach],["base",ie.layerBase],["force",ie.layerForce],["ghost",ie.layerGhost]]){let oe=et(l,"button","ursim-twin-layer-toggle",`data-ursim-twin-layer-${N}`);oe.type="button",oe.textContent=V,oe.setAttribute("aria-pressed",Lm[N]===!0?"true":"false"),ae[N]=oe,oe.addEventListener("click",()=>{nt[N]=!nt[N],oe.setAttribute("aria-pressed",nt[N]?"true":"false"),yt(),N==="reach"&&Zh(),Ti()}),Pe.appendChild(oe)}Ce.appendChild(Pe);let pe=et(l,"button","ursim-twin-layer-toggle","data-ursim-twin-screenshot");pe.type="button",pe.textContent=ie.screenshot,pe.setAttribute("aria-label",ie.screenshotLabel),pe.addEventListener("click",()=>{Nh();let N=f?.renderer?.domElement??tt,V=wm(N,C,{document:l});V!==null&&Ih(V,Ph(C,new Date),{document:l})}),Pe.appendChild(pe);let ke=(N,V,oe)=>{let Se=et(l,"button","ursim-twin-layer-toggle",`data-ursim-twin-trajectory-${V}`);return Se.type="button",Se.textContent=N,Se.setAttribute("aria-pressed","false"),Se.addEventListener("click",()=>{oe(Se),Ti()}),Pe.appendChild(Se),Se};ke(ie.trajectoryClear,"clear",()=>{v=[],Ie.setDrawRange(0,0)}),ke(ie.trajectoryPause,"pause",N=>{L=!L,N.setAttribute("aria-pressed",L?"true":"false"),N.textContent=L?ie.trajectoryResume:ie.trajectoryPause}),ke(ie.trajectoryExport,"export",()=>{let N=fm(v),V=`data:text/csv;charset=utf-8,${encodeURIComponent(N)}`;Ih(V,`ursim-twin-trajectory-${Ph(C,new Date).replace(/^ursim-twin-|\.png$/gu,"")}.csv`,{document:l})}),Ce.appendChild(B),Ce.appendChild(z),Ce.appendChild(ce),Ce.appendChild(ne),Ce.appendChild(be);let Ae=et(l,"details","ursim-twin-io","data-ursim-twin-io"),ge=et(l,"summary","ursim-twin-io-summary","data-ursim-twin-io-summary");ge.textContent=ie.ioSummary;let $e=et(l,"div","ursim-twin-io-body","data-ursim-twin-io-body"),O=et(l,"div","ursim-twin-io-bits","data-ursim-twin-io-bits"),le=et(l,"div","ursim-twin-io-regs","data-ursim-twin-io-regs");$e.appendChild(O),$e.appendChild(le),Ae.appendChild(ge),Ae.appendChild($e),Ce.appendChild(Ae);let he=["int","double","bit"],Me=8,re=1e3,ee=-1/0;Ae.addEventListener("toggle",()=>{Ae.open===!0&&(ee=-1/0,Wh(!0))});let Te=et(l,"div","ursim-twin-toolbar","data-ursim-twin-toolbar");for(let N of qM){let V=et(l,"button","ursim-twin-toolbar-button","data-ursim-twin-view-button");V.setAttribute("type","button"),V.setAttribute("data-ursim-twin-view-button",N.key),V.setAttribute("title",N.label),V.textContent=N.label,V.addEventListener("click",()=>Oh(N.key)),Te.appendChild(V)}let We=et(l,"div","ursim-twin-status","data-ursim-twin-status"),dt=et(l,"div","ursim-twin-error","data-ursim-twin-error"),Ze=et(l,"div","ursim-twin-sim","data-ursim-twin-sim-bar"),Nt=et(l,"button","ursim-twin-sim-toggle","data-ursim-twin-sim-toggle");Nt.setAttribute("type","button"),Nt.setAttribute("aria-pressed","false"),Nt.setAttribute("aria-label",ie.simTitle),Nt.textContent=ie.simToggleOn,Nt.addEventListener("click",()=>{br(!Yt)});let Wt=l.createElement("select");Wt.setAttribute("data-ursim-twin-sim-model",""),Wt.setAttribute("aria-label",ie.simModelLabel);let Hn=l.createElement("select");Hn.setAttribute("data-ursim-twin-sim-preset",""),Hn.setAttribute("aria-label",ie.simPresetLabel);let sn=l.createElement("select");sn.setAttribute("data-ursim-twin-sim-speed",""),sn.setAttribute("aria-label",ie.simSpeedLabel);let ys=et(l,"div","ursim-twin-sim-note","data-ursim-twin-sim-note"),vs=et(l,"div","ursim-twin-sim-error","data-ursim-twin-sim-error");Ze.appendChild(Nt),Ze.appendChild(Wt),Ze.appendChild(Hn),Ze.appendChild(sn),Ze.appendChild(ys),Ze.appendChild(vs);let ii=et(l,"details","ursim-twin-sim-caps","data-ursim-twin-sim-caps"),Vi=et(l,"summary","ursim-twin-sim-caps-summary","data-ursim-twin-sim-caps-summary");Vi.textContent=ie.simCapsSummary;let si=et(l,"div","ursim-twin-sim-caps-body","data-ursim-twin-sim-caps-body");ii.appendChild(Vi),ii.appendChild(si),ii.style.display="none",Ze.appendChild(ii);let yn=et(l,"div","ursim-twin-stage","data-ursim-twin-stage"),Lo=(()=>{try{return(l.defaultView??globalThis)?.localStorage??null}catch{return null}})();function Do(){yn.style.gridTemplateColumns=Rh({right:bs.isCollapsed()}),Fo(),Ti()}let bs=ym(l,Lo,{onChange:Do});yn.appendChild(fe),yn.appendChild(bs.rail),yn.style.gridTemplateColumns=Rh({right:bs.isCollapsed()});let Gi=null;async function tc(N){if(typeof a!="function")throw new Error("\u8BF7\u6C42\u5B9E\u73B0\u4E0D\u53EF\u7528");let oe=await(await a(rd,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(N)})).json();if(oe===null||typeof oe!="object"||oe.ok!==!0)throw new Error(String(oe?.error??"\u5BBF\u4E3B\u62D2\u7EDD\u4E86\u8FD9\u6B21\u70B9\u52A8"));return oe}let nc=Ql(),ic={send:tc,lock:nc,noteHost:A,errorHost:A,getSnapshot:()=>e?.getSnapshot?.()??{},previewJoints(N){let V=Array.isArray(N)&&N.length===6&&N.every(Number.isFinite)?N.slice():null;V===null&&Gi===null||(Gi=V,it=!1,Ge=!0)},reportError(N){typeof N!="string"||N===""||M(N)}},No=vm(l,bs.body,ic);me.appendChild(Te),me.appendChild(Ze),me.appendChild(yn),me.appendChild(Ce),me.appendChild(We),me.appendChild(dt),n.appendChild(me);function M(N){te=N,ue=o()+AM,dt.textContent=N}function H(){te===""&&dt.textContent===""||(te="",ue=0,dt.textContent="")}function q(N){te!==""&&(N<ue||H())}let Y=()=>H();me.addEventListener("pointerdown",Y,!0),me.addEventListener("keydown",Y,!0),Te.style.display="none",yn.style.display="none",fe.style.display="none",Ce.style.display="none",We.textContent=MM;let k=null,se=null,_e=!1,Re=.02,ve=null,Be=rm(1),ze=ku(_r);ze.name="ursim-twin-base-axes";let Ue=om(),Ye=am(null),nt={...Lm,cog:!1};function Rt(){k&&k.setVisible?.(nt.ghost===!0&&_e===!0)}function yt(){Be.visible=nt.reach,ze.visible=nt.base,Ye.visible=!1,Ue.visible=nt.cog,Rt()}yt();let ct=ku(_r);ct.matrixAutoUpdate=!1;let Ie=new Ct,vt=new gt(new Float32Array(Co*3),3);vt.setUsage(Fl),Ie.setAttribute("position",vt);let st=new gt(new Float32Array(Co*3),3);st.setUsage(Fl),Ie.setAttribute("color",st),Ie.setDrawRange(0,0);let Xt=vt.array,Vn=st.array,Ot=new jn(Ie,new Bn({color:3526911,vertexColors:!0}));Ot.name="ursim-twin-trajectory",Ot.frustumCulled=!1;let Gn=l.defaultView??(typeof globalThis.addEventListener=="function"?globalThis:null),Tt=()=>Fo();Gn?.addEventListener?.("resize",Tt);let Ft=null,rn=l.defaultView?.ResizeObserver??globalThis.ResizeObserver;if(typeof rn=="function")try{Ft=new rn(()=>Fo()),Ft.observe(n),Ft.observe?.(fe)}catch{Ft=null}function Et(N){We.textContent=N}function wt(){if(Ve){Et(IM);return}if(!W){let V=e?.getSnapshot?.()??{};Et(DM(V.code,V.error,V.ips));return}if(Xe){Et(`${Po} \xB7 ${PM}`);return}let N=e?.getSnapshot?.()?.detail?.safety_mode;if(Lh(N)){Et(`${Fm(N)} \xB7 ${LM}`);return}if(qe){Et(CM);return}if(lt!==""){Et(`${Po} \xB7 ${RM}${lt}${ie.statusLoadRetrying}`);return}if(!g){Et(TM);return}if(Yt){let V=String(m||e?.getSnapshot?.()?.model||"");Et(ie.simActiveStatus(Vh(V)));return}if(y!==""&&y!==m){Et(`${Po} \xB7 ${ie.statusSwitchingModel(y)}`);return}Et(g.usedFallback?`${Po} \xB7 ${m}${EM}`:`${Po} \xB7 ${m}`)}let vr=Tm(N=>{if(N!==u){u=N;try{f?.applyTheme?.(u)}catch{}Ti()}},{document:l,window:l.defaultView??globalThis});function ri(){if(f||qe)return f;try{f=t(tt,{theme:u})??{}}catch(N){return qe=!0,f=null,lt=N instanceof Error?N.message:String(N),wt(),null}f.scene?.add?.(ct),f.scene?.add?.(Ot),f.scene?.add?.(Be),f.scene?.add?.(ze),f.scene?.add?.(Ue),f.scene?.add?.(Ye),f.onCameraChange?.(()=>Ti());try{f.applyTheme?.(u)}catch{}return Hm(),Oo(),f}function Oo(){if(!f||Ve)return;let N=!1;try{N=f.resize?.()!==!1}catch{N=!1}Ee=!N}function Hm(){let N=f?.renderer?.domElement??tt;N?.addEventListener&&(N.addEventListener("webglcontextlost",V=>{V?.preventDefault?.(),Ve=!0,wt()}),N.addEventListener("webglcontextrestored",()=>{Ve=!1,Oo(),wt()}))}function Fo(){Oo()}function Nh(){f?.render?.()}function Ti(){Ge=!0}function Oh(N){N==="reset"?f?.fitTo?.(g?.root):f?.setViewPreset?.(N),Ti()}function Vm(){d!==null&&(r?.(d),d=null)}function Fh(){h||Fe||d!==null||(d=s(ed))}let Uh=()=>{if(Fe=l.hidden===!0,Fe)Vm();else{try{e?.retryNow?.(!1)}catch{}Ti(),Fh()}};Gn?.addEventListener?.("visibilitychange",Uh);function Gm(N,V,oe){let Se=Number.isFinite(V?.ts)?V.ts:null;(Se===null||Se!==xe)&&(xe=Se,Z=N);let He=e?.getStreamHealth?.()??{},ft=Z===null?0:Math.max(0,N-Z),mt=VM({status:He.status,connected:oe,feedStale:V?.feedStale===!0,ageMs:ft,frames:He.frames,frameErrors:He.frameErrors});if(mt!==we&&(we=mt,S.textContent=mt,S.style.display=mt===""?"none":"",S.setAttribute("data-ursim-twin-feed-state",mt===""?"ok":mt.startsWith(Nm)?"retrying":"stale")),oe&&ft>yM&&N-Le>=bM){Le=N;try{e?.retryNow?.(!0)}catch{}}}let Bh="127.0.0.1",Wm="ur12e",kh="upright",$m=1,Xm=["ur3","ur3e","ur5","ur5e","ur7e","ur10","ur10e","ur12e","ur16e","ur8long","ur15","ur18","ur20","ur30"],Ym=["zero","upright","reach"],qm=[1,.5,.25,.1],Yt=!1,Ss=!1,Ut={model:"ur5e",preset:"zero",speed_scaling:1},zh=[...Xm],sc=null,Uo="",Hh="sim",rc=[],Bo=null,ko=!1;function Vh(N){let V=String(N??"");return V.toLowerCase().startsWith("ur")?`UR${V.slice(2)}`:V}function oc(N,V,oe){for(;N.firstChild;)N.removeChild(N.firstChild);for(let He of V){let ft=l.createElement("option");ft.value=He.value,ft.textContent=He.label,N.appendChild(ft)}let Se=V.some(He=>He.value===oe);N.value=Se?oe:V[0]?.value??""}function Wn(){Nt.setAttribute("aria-pressed",Yt?"true":"false"),Nt.textContent=Yt?ie.simToggleOff:ie.simToggleOn,Nt.disabled=Ss||typeof a!="function";let N={zero:ie.simPresetZero,upright:ie.simPresetUpright,reach:ie.simPresetReach};oc(Wt,zh.map(oe=>({value:oe,label:Vh(oe)})),Ut.model),oc(Hn,Ym.map(oe=>({value:oe,label:N[oe]??oe})),Ut.preset),oc(sn,qm.map(oe=>({value:String(oe),label:`${Math.round(oe*100)}%`})),String(Ut.speed_scaling));for(let oe of[Wt,Hn,sn])oe.disabled=Ss;let V=Uo!==""?ie.simRestoreFailed(Uo):Ss?ie.simApplying:Yt?ie.simUnsupported:ie.simUses;ys.textContent=Yt&&Uo===""?`${V} ${ie.simCollapseStops}`:V,jm()}function jm(){let N=Bo!==null&&typeof Bo=="object"?Bo:null;if(N===null){ii.style.display="none",si.textContent="",si.removeAttribute?.("title");return}let V=[[ie.simCapsMotion,N.motion],[ie.simCapsRead,N.read],[ie.simCapsIo,N.io],[ie.simCapsTelemetry,N.telemetry]].filter(([,ft])=>Array.isArray(ft)&&ft.length>0),oe=V.map(([ft,mt])=>ie.simCapsBucket(ft,mt.length)),Se=Array.isArray(N.not_simulated)?N.not_simulated:[];Se.length>0&&oe.push(ie.simCapsCannot(Se.length)),si.textContent=oe.join("  \xB7  ");let He=V.map(([ft,mt])=>`${ft}: ${mt.join(", ")}`);Se.length>0&&He.push(`${ie.simCapsCannot(Se.length)}: ${Se.join("; ")}`),He.length>0?si.setAttribute("title",He.join(`
`)):si.removeAttribute?.("title"),ii.style.display=oe.length>0?"":"none"}let Gh=0;async function Wh(N){if(typeof a!="function")return;let V=++Gh,oe=()=>h||V!==Gh,Se=e?.getSnapshot?.()??{},He=typeof Se.ip=="string"?Se.ip:"",ft=He===""?"":`ip=${encodeURIComponent(He)}&`;ac([ie.ioReading]);try{let Rn=await(await a(`${Es}?${ft}io=1`,{cache:"no-store"})).json();if(oe()||(Jm(Rn?.io??null),N!==!0))return;for(let vn of he){let bn=await(await a(`${Es}?${ft}reg=${vn}&from=0&count=${Me}`,{cache:"no-store"})).json();if(oe())return;Km(bn?.registers??null,vn)}}catch(mt){oe()||ac([ie.ioFailed(mt instanceof Error?mt.message:String(mt))])}}function $h(N){if(!Array.isArray(N))return"\u2014";let V=[];for(let oe=0;oe<N.length;oe+=8)V.push(N.slice(oe,oe+8).map(Se=>Se===!0?"1":"0").join(""));return V.join(" ")}let Xh="",Yh=new Map;function qh(){let N=[Xh,...Yh.values()].filter(V=>V!=="");$e.setAttribute("title",N.join(`
`))}function ac(N){O.textContent=N.join(`
`),Xh=N.join(`
`),qh()}function Jm(N){let V=[];if(N!==null&&typeof N=="object"&&typeof N.error!="string"){V.push(ie.ioDigitalOut($h(N.digital_out))),V.push(ie.ioDigitalIn($h(N.digital_in)));let oe=Array.isArray(N.analog_in)?N.analog_in:[],Se=He=>Number.isFinite(Number(He))?Number(He).toFixed(3):"\u2014";V.push(ie.ioAnalogIn(Se(oe[0]),Se(oe[1]))),N.simulated===!0&&V.push(ie.ioSimInputNote)}else N!==null&&typeof N=="object"&&V.push(ie.ioFailed(N.error));ac(V)}let jh=new Map;function Km(N,V){if(N===null||typeof N!="object")return;let oe=String(V??N.set??""),Se=typeof N.error=="string"?ie.ioFailed(N.error):ie.ioRegisters(String(N.set??""),String(N.from??0),(Array.isArray(N.values)?N.values:[]).map(ft=>typeof ft=="boolean"?ft?"1":"0":String(ft??"\u2014")).join(" ")),He=jh.get(oe);He===void 0&&(He=et(l,"div","ursim-twin-io-row","data-ursim-twin-io-reg-row"),jh.set(oe,He),le.appendChild(He)),He.textContent=Se,Yh.set(oe,Se),qh()}function lc(N){let V=Hh==="real"?"real":N===!0?"sim":"idle",oe=V==="real"?rc.length>0?ie.realModeBadge(rc.join("\u3001")):ie.realModeBadgeEmpty:V==="sim"?ie.simBadge:ie.modeBadgeIdle,Se=V==="real"?ie.realModeBadgeTitle:V==="sim"?ie.simBadgeTitle:ie.modeBadgeIdleTitle,He=`${V}\0${oe}\0${Se}`;He!==Q&&(Q=He,de.setAttribute("data-ursim-twin-mode",V),de.textContent=oe,de.setAttribute("title",Se),de.style.display="")}function Jh(N){let V=N===!0?"true":"false";V!==X&&(X=V,me.setAttribute("data-ursim-twin-sim",V))}async function Kh(){if(typeof a=="function")try{let V=await(await a(Vo,{cache:"no-store"})).json();if(h||V===null||typeof V!="object")return;sc=V.active===!0,Array.isArray(V.models)&&V.models.length>0&&(zh=V.models.map(String)),Hh=V.motion_mode==="real"?"real":"sim",rc=Array.isArray(V.real_robots)?V.real_robots.map(String):[],Bo=V.capabilities!==null&&typeof V.capabilities=="object"?V.capabilities:null,Uo=typeof V.restore_error=="string"?V.restore_error:"";let oe=typeof V.model_id=="string"&&V.model_id!==""?V.model_id:String(V.model??"").toLowerCase();oe!==""&&(Ut.model=oe),typeof V.preset=="string"&&V.preset!==""&&(Ut.preset=V.preset),Number.isFinite(V.speed_scaling)&&(Ut.speed_scaling=V.speed_scaling),Wn(),lc(Yt)}catch{}}async function br(N){if(!(Ss||typeof a!="function")){Ss=!0,vs.textContent="",Wn();try{let V=N?{enabled:!0,model:Ut.model,preset:Ut.preset,speed_scaling:Ut.speed_scaling}:{enabled:!1},Se=await(await a(Vo,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(V)})).json();if(h)return;if(Se===null||typeof Se!="object"||Se.ok!==!0)throw new Error(String(Se?.error??"\u5BBF\u4E3B\u62D2\u7EDD\u4E86\u8FD9\u6B21\u5207\u6362"));N&&typeof Se.model_id=="string"&&Se.model_id!==""&&(Ut.model=Se.model_id),e?.setIp?.(N?Bh:""),ko=N,Yt=N}catch(V){h||(Yt=!1,vs.textContent=ie.simFailed(V instanceof Error?V.message:String(V)))}finally{Ss=!1,h||Wn()}}}async function Zm(){if(!(typeof a!="function"||h)&&(await Kh(),!h)){if(sc===!0||Yt){Yt=!0,e?.setIp?.(Bh),ko=!0,Wn();return}Ut.model=Wm,Ut.preset=kh,Ut.speed_scaling=$m,Wn(),await br(!0)}}function Qm(){let N=ko;if(N){try{e?.setIp?.("")}catch{}ko=!1}if(!(!N&&!Yt&&sc!==!0)&&typeof a=="function")try{let V=a(Vo,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({enabled:!1}),keepalive:!0});V&&typeof V.catch=="function"&&V.catch(()=>{})}catch{}}Wt.addEventListener("change",()=>{Ut.model=String(Wt.value||Ut.model),Ut.preset=kh,Yt?br(!0):Wn()}),Hn.addEventListener("change",()=>{Ut.preset=String(Hn.value||Ut.preset),Yt?br(!0):Wn()}),sn.addEventListener("change",()=>{let N=Number(sn.value);Ut.speed_scaling=Number.isFinite(N)&&N>0?N:1,Yt?br(!0):Wn()}),Wn(),c?Zm():Kh();function eg(N){N!==W?(W=N,me.setAttribute("data-ursim-twin-connected",N?"true":"false"),yn.style.display=N?"":"none",fe.style.display=N?"":"none",Ce.style.display=N?"":"none",Te.style.display=N?"":"none",N||(x=null,P=null,U=null,w=null,v=[],R=0,Ie.setDrawRange(0,0),F.textContent="",j.textContent="",B.textContent="",B.setAttribute("data-ursim-twin-overlimit","false"),z.textContent="",ce.textContent="",ne.textContent="",be.textContent="",be.setAttribute("data-ursim-twin-risk","ok"),be.setAttribute("title",""),J=null,G=null,gh(g?.root??null,[]),S.textContent="",S.style.display="none",we=null,Z=null,xe=null,Le=-1/0,me.setAttribute("data-ursim-twin-hazard","false"),Jh(!1),lc(!1),$=-1/0),Ti(),Fo(),wt()):N||wt()}function Zh(){f?.fitTo?.(g?.root,nt.reach?{minRadius:OM}:{}),zp(ct,kp(f?.currentFitRadius?.()))}function Qh(N,V){let oe=Ao(V,N);return g?.applyFK?.(oe),Array.isArray(oe.tool0)&&(ct.matrix.fromArray(oe.tool0),ct.matrixWorldNeedsUpdate=!0,Ye.position.set(oe.tool0[12],oe.tool0[13],oe.tool0[14]),nt.force?vh(Ye,C?.detail?.tcp_force):Ye.visible=!1),g?.root&&(g.root.visible=!0,ve=N==null?null:Array.from(N).slice(0,6)),oe}async function tg(N){let V=++p,oe=String(N).trim().toLowerCase(),Se=null;try{Se=await i(N,{armLinks:jl(ec(N)?.links)??void 0})}catch(vn){!h&&V===p&&(lt=vn instanceof Error?vn.message:String(vn),y="",E=oe,T=o()+vM,wt());return}if(!Se)return;if(h||V!==p){Se.dispose?.();return}lt="",E="",T=0;let He=ri()?.scene;Se.root&&typeof Se.root=="object"&&(Se.root.name=Um),He?.add?.(Se.root),g&&(Io(He,g.root),g.dispose?.()),jM(He,Se.root),g=Se,xh(k),k=null,se=null;try{k=im(g),He?.add?.(k.root)}catch{k=null}let ft=m;m=oe,ft!==""&&ft!==m&&ng();let mt=ec(m);mt&&Array.isArray(ve)?Qh(ve,mt):Se.root.visible=!1,Zh();let Rn=Kl(ec(m)?.links);Rn!==null&&(Be.scale.setScalar(Rn),ae.reach&&(ae.reach.textContent=`${ie.layerReach} ${Rn.toFixed(2)} m`)),Ge=!0,wt()}function ng(){x=null,P=null,w=null,v=[],R=0,Ie.setDrawRange(0,0),Ge=!0}function ig(N,V){return Number.isFinite(N)?U===null||N<U.hostTs?(U={hostTs:N,localTs:V},{ts:V,reset:!0}):{ts:U.localTs+(N-U.hostTs),reset:!1}:{ts:V,reset:!1}}function sg(N){if(L)return;let V=N?.tcp;if(!Array.isArray(V)||V.length<3||!Number.isFinite(V[0]))return;let oe=Number.isFinite(N.ts)?N.ts:R+1;R=oe;let Se=Array.isArray(N?.q)&&N.q.length>=6?[...N.q]:void 0;v=um(v,{tcp:[V[0],V[1],V[2]],ts:oe,...Se===void 0?{}:{q:Se}},_M),v.length>Co&&(v=v.slice(v.length-Co))}function rg(){let N=hm(v),V=Math.min(N.length,Co),oe=N.length-V,Se=dm(v.slice(oe));for(let He=0;He<V;He++){let ft=N[oe+He];Xt[He*3]=ft[0],Xt[He*3+1]=ft[1],Xt[He*3+2]=ft[2];let mt=Se[He]??[1,1,1];Vn[He*3]=mt[0],Vn[He*3+1]=mt[1],Vn[He*3+2]=mt[2]}vt.needsUpdate=!0,st.needsUpdate=!0,Ie.setDrawRange(0,V)}function og(N,V){let oe=N?.tcp;if(Array.isArray(oe)&&oe.length>=3)return oe;let Se=V?.tool0;return Array.isArray(Se)?[Se[12],Se[13],Se[14],0,0,0]:null}function ag(N,V,oe,Se,He){if(!(N-$>=xM))return;$=N;let ft=[V?.model??m,V?.ip].filter(Sn=>typeof Sn=="string"&&Sn!=="");F.textContent=ft.length===0?"":ie.identity(V?.model??m,V?.ip),_.setAttribute("title",F.textContent);let mt=Array.isArray(V?.ips)?V.ips.filter(Sn=>typeof Sn=="string"&&Sn!==""):[],Rn=typeof V?.ip=="string"?V.ip:"",vn=`${Rn}|${mt.join(",")}`;if(vn!==b){b=vn,pt.textContent="";for(let Sn of mt){let Ei=et(l,"button","ursim-twin-layer-toggle","data-ursim-twin-robot");Ei.type="button",Ei.textContent=Sn,Ei.setAttribute("aria-pressed",Sn===Rn?"true":"false"),Ei.addEventListener("click",()=>{e?.setIp?.(Sn)}),pt.appendChild(Ei)}}let oi=typeof V?.pendingMotion?.summary=="string"?V.pendingMotion.summary:"";j.textContent=oi===""?"":`${ie.pendingPrefix}  ${oi}`,j.setAttribute("title",j.textContent);let bn=FM(oe,He?.jointLimits);B.textContent=bn.length===0?Cm(oe):`${Cm(oe)}  ${ie.overLimit(`J${bn.join("/J")}`)}`,B.setAttribute("data-ursim-twin-overlimit",bn.length===0?"false":"true");let un=tm({kin:He,joints:oe,limits:He?.jointLimits??null,reach:Kl(He?.links)??null}),ai=un===null?"":[un.level==="at"?ie.riskAt:un.level==="near"?ie.riskNear:ie.riskOk,ie.riskWrist(un.wristDeg.toFixed(1)),un.manip===null?"":ie.riskManip(un.manip.toFixed(4)),un.limitNear===!0?ie.riskLimit(un.limitJoint,un.limitDeg.toFixed(1)):""].filter(Boolean).join("  \xB7  ");ai!==J&&(J=ai,be.textContent=ai,be.setAttribute("title",ai===""?"":ie.riskTitle),be.setAttribute("data-ursim-twin-risk",un?.level??"ok"));let Ms=bn.join(",");Ms!==G&&(G=Ms,g!==null&&gh(g.root,bn)),B.setAttribute("title",B.textContent);let Sr=og(V,Se);z.textContent=Sr?UM(Sr):"TCP  --",z.setAttribute("title",z.textContent);let Cn=XM(V?.detail);ce.textContent=Cn.status,ce.setAttribute("title",Cn.status),ce.setAttribute("data-ursim-twin-hazard",Cn.hazard?"true":"false");let Mr=[Cn.temps,Cn.power,Cn.currents,Cn.tcpSpeed].filter(Boolean).join("   ");ne.textContent=Mr,ne.setAttribute("title",Mr),me.setAttribute("data-ursim-twin-hazard",Cn.hazard?"true":"false"),V?.ip&&me.setAttribute("data-ursim-twin-ip",String(V.ip)),Ae.open===!0&&N-ee>=re&&(ee=N,Wh(!1))}function lg(N){let V=e?.getSnapshot?.()??{},oe=V.connected===!0,Se=Xe;Xe=V.degraded===!0,eg(oe),Gm(N,V,oe);let He=V?.feedStale===!0||Z!==null&&N-Z>Dm,ft=He===(V?.feedStale===!0)?V:{...V,feedStale:He};if(No.sync(ft),!oe)return;Se!==Xe&&wt();let mt=V.simulated===!0;mt!==Yt&&(Yt=mt,Wn(),wt()),Jh(mt),lc(mt);let Rn=Lh(V?.detail?.safety_mode);Rn!==K&&(K=Rn,wt());let vn=String(V.model??"").trim(),oi=vn.toLowerCase();oi!==""&&oi!==y&&(oi===E&&N<T||(y=oi,wt(),tg(vn)));let bn=ec(m||oi),un=Array.isArray(V.q)&&V.q.length>=6?V.q:null,ai=null;if(bn&&un){let Ms=ig(V.ts,N);Ms.reset&&(x=null,P=null);let Sr=Number.isFinite(V.ts);C=V;let Cn=!Sr||V.ts!==w||P===null;Sr&&(w=V.ts),Cn&&(x=P,P={q:un.slice(),ts:Ms.ts},sg(V),Ge=!0,it=!1,At=N+Im(x,P)+64);let Mr=N>=At,Sn=Gi!==null,Ei=!Sn&&!Cn&&!Ge&&Mr&&it&&I!==null;if(Ei)ai=I;else{let zo=Sn?Gi.slice():x?cm(x,P,N-Im(x,P)):P.q.slice();ai=Qh(zo,bn),I=ai,it=Mr}if(k){let zo=V?.pendingMotion,Ho=zo?.kind==="joints"?zo.q:null,td=V?.detail?.target_q,Tr=Er=>Array.isArray(Er)&&Er.length===6&&Er.every(Number.isFinite),Ts=Tr(Ho)?Ho:Tr(td)?td:null,nd=Tr(V?.q)?V.q:null,ug=Ts!==null&&nd!==null&&Ts.some((Er,hg)=>Math.abs(Er-nd[hg])>Re);_e=Ts!==null&&(Tr(Ho)||ug),_e?(Ts!==se&&(se=Ts,k.applyFK(Ao(bn,Ts))),k.setPending(Tr(Ho))):se=null,Rt()}Ei||rg(),ag(N,V,un,ai,bn)}Ee&&Oo(),(Ge||N<At)&&(Nh(),Ge=!1)}function ed(){if(!(h||Fe))try{lg(o()),q(o())}catch(N){M(`${wM}${N instanceof Error?N.message:String(N)}`)}finally{h||Fe?d=null:d=s(ed)}}Fh();function cg(){if(h)return;h=!0,Qm(),No.dispose?.(),Gi=null,d!==null&&(r?.(d),d=null),Gn?.removeEventListener?.("resize",Tt),Gn?.removeEventListener?.("visibilitychange",Uh),me.removeEventListener?.("pointerdown",Y,!0),me.removeEventListener?.("keydown",Y,!0),vr?.(),Ft?.disconnect?.(),Ft=null;let N=f?.scene;g&&(Io(N,g.root),g.dispose?.(),g=null),Io(N,ct),Io(N,Ot),xh(k),k=null;for(let V of[Be,ze,Ue,Ye])lm(V);for(f?.dispose?.(),Hp(ct),Ie.dispose(),Ot.material?.dispose?.(),v=[],x=null,P=null,U=null,f=null,me.parentNode===n?n.removeChild(me):me.remove?.();me.firstChild;)me.removeChild(me.firstChild)}return{dispose:cg}}var JM="ur-digital-twin-client",km="127.0.0.1";function zm(n,e=globalThis){return km}function KM(n,e){let t=globalThis.document,i=zm(e),s=ld({ip:i,stream:!0}),r={loaded:!0,at:Date.now(),ip:i,state:s,entry:void 0,error:null};globalThis.__URSIM_TWIN__=r,n.logger?.info?.("[ursim-twin] client half loaded");let o;try{s.start(),o=bd({doc:t,onToggle:a=>{r.active=a},mountPanel:a=>Bm({container:a,state:s})}),r.entry=o,n.logger?.info?.(`[ursim-twin] mounted (ip=${i}, surface=right-dock)`)}catch(a){r.error=a instanceof Error?a.message:String(a),n.logger?.warn?.(`[ursim-twin] \u5BA2\u6237\u7AEF\u88C5\u914D\u5931\u8D25\uFF1A${r.error}`)}return()=>{try{o?.dispose?.()}catch{}try{s.stop()}catch{}o=void 0,delete globalThis.__URSIM_TWIN__}}
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
