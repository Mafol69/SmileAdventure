'use strict';{window.DOMHandler=class DOMHandler{constructor(iRuntime,componentId){this._iRuntime=iRuntime;this._componentId=componentId;this._hasTickCallback=false;this._tickCallback=()=>this.Tick()}Attach(){}PostToRuntime(handler,data,dispatchOpts,transferables){this._iRuntime.PostToRuntimeComponent(this._componentId,handler,data,dispatchOpts,transferables)}PostToRuntimeAsync(handler,data,dispatchOpts,transferables){return this._iRuntime.PostToRuntimeComponentAsync(this._componentId,handler,data,
dispatchOpts,transferables)}_PostToRuntimeMaybeSync(name,data,dispatchOpts){if(this._iRuntime.UsesWorker())this.PostToRuntime(name,data,dispatchOpts);else this._iRuntime._GetLocalRuntime()["_OnMessageFromDOM"]({"type":"event","component":this._componentId,"handler":name,"dispatchOpts":dispatchOpts||null,"data":data,"responseId":null})}AddRuntimeMessageHandler(handler,func){this._iRuntime.AddRuntimeComponentMessageHandler(this._componentId,handler,func)}AddRuntimeMessageHandlers(list){for(const [handler,
func]of list)this.AddRuntimeMessageHandler(handler,func)}GetRuntimeInterface(){return this._iRuntime}GetComponentID(){return this._componentId}_StartTicking(){if(this._hasTickCallback)return;this._iRuntime._AddRAFCallback(this._tickCallback);this._hasTickCallback=true}_StopTicking(){if(!this._hasTickCallback)return;this._iRuntime._RemoveRAFCallback(this._tickCallback);this._hasTickCallback=false}Tick(){}};window.RateLimiter=class RateLimiter{constructor(callback,interval){this._callback=callback;
this._interval=interval;this._timerId=-1;this._lastCallTime=-Infinity;this._timerCallFunc=()=>this._OnTimer();this._ignoreReset=false;this._canRunImmediate=false}SetCanRunImmediate(c){this._canRunImmediate=!!c}Call(){if(this._timerId!==-1)return;const nowTime=Date.now();const timeSinceLastCall=nowTime-this._lastCallTime;const interval=this._interval;if(timeSinceLastCall>=interval&&this._canRunImmediate){this._lastCallTime=nowTime;this._RunCallback()}else this._timerId=self.setTimeout(this._timerCallFunc,
Math.max(interval-timeSinceLastCall,4))}_RunCallback(){this._ignoreReset=true;this._callback();this._ignoreReset=false}Reset(){if(this._ignoreReset)return;this._CancelTimer();this._lastCallTime=Date.now()}_OnTimer(){this._timerId=-1;this._lastCallTime=Date.now();this._RunCallback()}_CancelTimer(){if(this._timerId!==-1){self.clearTimeout(this._timerId);this._timerId=-1}}Release(){this._CancelTimer();this._callback=null;this._timerCallFunc=null}}};


'use strict';{window.DOMElementHandler=class DOMElementHandler extends self.DOMHandler{constructor(iRuntime,componentId){super(iRuntime,componentId);this._elementMap=new Map;this._autoAttach=true;this.AddRuntimeMessageHandlers([["create",e=>this._OnCreate(e)],["destroy",e=>this._OnDestroy(e)],["set-visible",e=>this._OnSetVisible(e)],["update-position",e=>this._OnUpdatePosition(e)],["update-state",e=>this._OnUpdateState(e)],["focus",e=>this._OnSetFocus(e)],["set-css-style",e=>this._OnSetCssStyle(e)],
["set-attribute",e=>this._OnSetAttribute(e)],["remove-attribute",e=>this._OnRemoveAttribute(e)]]);this.AddDOMElementMessageHandler("get-element",elem=>elem)}SetAutoAttach(e){this._autoAttach=!!e}AddDOMElementMessageHandler(handler,func){this.AddRuntimeMessageHandler(handler,e=>{const elementId=e["elementId"];const elem=this._elementMap.get(elementId);return func(elem,e)})}_OnCreate(e){const elementId=e["elementId"];const elem=this.CreateElement(elementId,e);this._elementMap.set(elementId,elem);elem.style.boxSizing=
"border-box";if(!e["isVisible"])elem.style.display="none";const focusElem=this._GetFocusElement(elem);focusElem.addEventListener("focus",e=>this._OnFocus(elementId));focusElem.addEventListener("blur",e=>this._OnBlur(elementId));if(this._autoAttach)document.body.appendChild(elem)}CreateElement(elementId,e){throw new Error("required override");}DestroyElement(elem){}_OnDestroy(e){const elementId=e["elementId"];const elem=this._elementMap.get(elementId);this.DestroyElement(elem);if(this._autoAttach)elem.parentElement.removeChild(elem);
this._elementMap.delete(elementId)}PostToRuntimeElement(handler,elementId,data){if(!data)data={};data["elementId"]=elementId;this.PostToRuntime(handler,data)}_PostToRuntimeElementMaybeSync(handler,elementId,data){if(!data)data={};data["elementId"]=elementId;this._PostToRuntimeMaybeSync(handler,data)}_OnSetVisible(e){if(!this._autoAttach)return;const elem=this._elementMap.get(e["elementId"]);elem.style.display=e["isVisible"]?"":"none"}_OnUpdatePosition(e){if(!this._autoAttach)return;const elem=this._elementMap.get(e["elementId"]);
elem.style.left=e["left"]+"px";elem.style.top=e["top"]+"px";elem.style.width=e["width"]+"px";elem.style.height=e["height"]+"px";const fontSize=e["fontSize"];if(fontSize!==null)elem.style.fontSize=fontSize+"em"}_OnUpdateState(e){const elem=this._elementMap.get(e["elementId"]);this.UpdateState(elem,e)}UpdateState(elem,e){throw new Error("required override");}_GetFocusElement(elem){return elem}_OnFocus(elementId){this.PostToRuntimeElement("elem-focused",elementId)}_OnBlur(elementId){this.PostToRuntimeElement("elem-blurred",
elementId)}_OnSetFocus(e){const elem=this._GetFocusElement(this._elementMap.get(e["elementId"]));if(e["focus"])elem.focus();else elem.blur()}_OnSetCssStyle(e){const elem=this._elementMap.get(e["elementId"]);elem.style[e["prop"]]=e["val"]}_OnSetAttribute(e){const elem=this._elementMap.get(e["elementId"]);elem.setAttribute(e["name"],e["val"])}_OnRemoveAttribute(e){const elem=this._elementMap.get(e["elementId"]);elem.removeAttribute(e["name"])}GetElementById(elementId){return this._elementMap.get(elementId)}}};


'use strict';{const isiOSLike=/(iphone|ipod|ipad|macos|macintosh|mac os x)/i.test(navigator.userAgent);const isAndroid=/android/i.test(navigator.userAgent);let resolveCounter=0;function AddScript(url){const elem=document.createElement("script");elem.async=false;elem.type="module";if(url.isStringSrc)return new Promise(resolve=>{const resolveName="c3_resolve_"+resolveCounter;++resolveCounter;self[resolveName]=resolve;elem.textContent=url.str+`\n\nself["${resolveName}"]();`;document.head.appendChild(elem)});
else return new Promise((resolve,reject)=>{elem.onload=resolve;elem.onerror=reject;elem.src=url;document.head.appendChild(elem)})}let didCheckWorkerModuleSupport=false;let isWorkerModuleSupported=false;function SupportsWorkerTypeModule(){if(!didCheckWorkerModuleSupport){try{new Worker("blob://",{get type(){isWorkerModuleSupported=true}})}catch(e){}didCheckWorkerModuleSupport=true}return isWorkerModuleSupported}let tmpAudio=new Audio;const supportedAudioFormats={"audio/webm; codecs=opus":!!tmpAudio.canPlayType("audio/webm; codecs=opus"),
"audio/ogg; codecs=opus":!!tmpAudio.canPlayType("audio/ogg; codecs=opus"),"audio/webm; codecs=vorbis":!!tmpAudio.canPlayType("audio/webm; codecs=vorbis"),"audio/ogg; codecs=vorbis":!!tmpAudio.canPlayType("audio/ogg; codecs=vorbis"),"audio/mp4":!!tmpAudio.canPlayType("audio/mp4"),"audio/mpeg":!!tmpAudio.canPlayType("audio/mpeg")};tmpAudio=null;async function BlobToString(blob){const arrayBuffer=await BlobToArrayBuffer(blob);const textDecoder=new TextDecoder("utf-8");return textDecoder.decode(arrayBuffer)}
function BlobToArrayBuffer(blob){return new Promise((resolve,reject)=>{const fileReader=new FileReader;fileReader.onload=e=>resolve(e.target.result);fileReader.onerror=err=>reject(err);fileReader.readAsArrayBuffer(blob)})}const queuedArrayBufferReads=[];let activeArrayBufferReads=0;const MAX_ARRAYBUFFER_READS=8;window["RealFile"]=window["File"];const domHandlerClasses=[];const runtimeEventHandlers=new Map;const pendingResponsePromises=new Map;let nextResponseId=0;const runOnStartupFunctions=[];self.runOnStartup=
function runOnStartup(f){if(typeof f!=="function")throw new Error("runOnStartup called without a function");runOnStartupFunctions.push(f)};const WEBVIEW_EXPORT_TYPES=new Set(["cordova","playable-ad","instant-games"]);function IsWebViewExportType(exportType){return WEBVIEW_EXPORT_TYPES.has(exportType)}let isWrapperFullscreen=false;window.RuntimeInterface=class RuntimeInterface{constructor(opts){this._useWorker=opts.useWorker;this._messageChannelPort=null;this._runtimeBaseUrl="";this._scriptFolder=
opts.scriptFolder;this._workerScriptURLs={};this._worker=null;this._localRuntime=null;this._domHandlers=[];this._runtimeDomHandler=null;this._canvas=null;this._isExportingToVideo=false;this._exportToVideoDuration=0;this._jobScheduler=null;this._rafId=-1;this._rafFunc=()=>this._OnRAFCallback();this._rafCallbacks=[];this._exportType=opts.exportType;this._isFileProtocol=location.protocol.substr(0,4)==="file";if(this._useWorker&&(typeof OffscreenCanvas==="undefined"||!navigator["userActivation"]||!SupportsWorkerTypeModule()))this._useWorker=
false;if(this._exportType==="playable-ad"||this._exportType==="instant-games")this._useWorker=false;if(this._exportType==="cordova"&&this._useWorker)if(isAndroid){const chromeVer=/Chrome\/(\d+)/i.exec(navigator.userAgent);if(!chromeVer||!(parseInt(chromeVer[1],10)>=90))this._useWorker=false}else this._useWorker=false;this._localFileBlobs=null;this._localFileStrings=null;if((this._exportType==="html5"||this._exportType==="playable-ad")&&this._isFileProtocol)alert("Exported games won't work until you upload them. (When running on the file: protocol, browsers block many features from working for security reasons.)");
if(this._exportType==="html5"&&!window.isSecureContext)console.warn("[Construct 3] Warning: the browser indicates this is not a secure context. Some features may be unavailable. Use secure (HTTPS) hosting to ensure all features are available.");this.AddRuntimeComponentMessageHandler("runtime","cordova-fetch-local-file",e=>this._OnCordovaFetchLocalFile(e));this.AddRuntimeComponentMessageHandler("runtime","create-job-worker",e=>this._OnCreateJobWorker(e));if(this._exportType==="cordova")document.addEventListener("deviceready",
()=>this._Init(opts));else this._Init(opts)}Release(){this._CancelAnimationFrame();if(this._messageChannelPort){this._messageChannelPort.onmessage=null;this._messageChannelPort=null}if(this._worker){this._worker.terminate();this._worker=null}if(this._localRuntime){this._localRuntime.Release();this._localRuntime=null}if(this._canvas){this._canvas.parentElement.removeChild(this._canvas);this._canvas=null}}GetCanvas(){return this._canvas}GetRuntimeBaseURL(){return this._runtimeBaseUrl}UsesWorker(){return this._useWorker}GetExportType(){return this._exportType}IsFileProtocol(){return this._isFileProtocol}GetScriptFolder(){return this._scriptFolder}IsiOSCordova(){return isiOSLike&&
this._exportType==="cordova"}IsiOSWebView(){const ua=navigator.userAgent;return isiOSLike&&IsWebViewExportType(this._exportType)||navigator["standalone"]||/crios\/|fxios\/|edgios\//i.test(ua)}IsAndroid(){return isAndroid}IsAndroidWebView(){return isAndroid&&IsWebViewExportType(this._exportType)}async _Init(opts){if(this._exportType==="macos-wkwebview")this._SendWrapperMessage({"type":"ready"});if(this._exportType==="playable-ad"){this._localFileBlobs=self["c3_base64files"];this._localFileStrings=
{};await this._ConvertDataUrisToBlobs();for(let i=0,len=opts.engineScripts.length;i<len;++i){const src=opts.engineScripts[i].toLowerCase();if(this._localFileStrings.hasOwnProperty(src))opts.engineScripts[i]={isStringSrc:true,str:this._localFileStrings[src]};else if(this._localFileBlobs.hasOwnProperty(src))opts.engineScripts[i]=URL.createObjectURL(this._localFileBlobs[src])}}if(opts.runtimeBaseUrl)this._runtimeBaseUrl=opts.runtimeBaseUrl;else{const origin=location.origin;this._runtimeBaseUrl=(origin===
"null"?"file:///":origin)+location.pathname;const i=this._runtimeBaseUrl.lastIndexOf("/");if(i!==-1)this._runtimeBaseUrl=this._runtimeBaseUrl.substr(0,i+1)}if(opts.workerScripts)this._workerScriptURLs=opts.workerScripts;const messageChannel=new MessageChannel;this._messageChannelPort=messageChannel.port1;this._messageChannelPort.onmessage=e=>this["_OnMessageFromRuntime"](e.data);if(window["c3_addPortMessageHandler"])window["c3_addPortMessageHandler"](e=>this._OnMessageFromDebugger(e));this._jobScheduler=
new self.JobSchedulerDOM(this);await this._jobScheduler.Init();if(typeof window["StatusBar"]==="object")window["StatusBar"]["hide"]();if(typeof window["AndroidFullScreen"]==="object")try{await new Promise((resolve,reject)=>{window["AndroidFullScreen"]["immersiveMode"](resolve,reject)})}catch(err){console.error("Failed to enter Android immersive mode: ",err)}if(this._useWorker)await this._InitWorker(opts,messageChannel.port2);else await this._InitDOM(opts,messageChannel.port2)}_GetWorkerURL(url){let ret;
if(this._workerScriptURLs.hasOwnProperty(url))ret=this._workerScriptURLs[url];else if(url.endsWith("/workermain.js")&&this._workerScriptURLs.hasOwnProperty("workermain.js"))ret=this._workerScriptURLs["workermain.js"];else if(this._exportType==="playable-ad"&&this._localFileBlobs.hasOwnProperty(url.toLowerCase()))ret=this._localFileBlobs[url.toLowerCase()];else ret=url;if(ret instanceof Blob)ret=URL.createObjectURL(ret);return ret}async CreateWorker(url,baseUrl,workerOpts){if(url.startsWith("blob:"))return new Worker(url,
workerOpts);if(this._exportType==="cordova"&&this._isFileProtocol){let filePath="";if(workerOpts.isC3MainWorker)filePath=url;else filePath=this._scriptFolder+url;const arrayBuffer=await this.CordovaFetchLocalFileAsArrayBuffer(filePath);const blob=new Blob([arrayBuffer],{type:"application/javascript"});return new Worker(URL.createObjectURL(blob),workerOpts)}const absUrl=new URL(url,baseUrl);const isCrossOrigin=location.origin!==absUrl.origin;if(isCrossOrigin){const response=await fetch(absUrl);if(!response.ok)throw new Error("failed to fetch worker script");
const blob=await response.blob();return new Worker(URL.createObjectURL(blob),workerOpts)}else return new Worker(absUrl,workerOpts)}_GetWindowInnerWidth(){return Math.max(window.innerWidth,1)}_GetWindowInnerHeight(){return Math.max(window.innerHeight,1)}_GetCommonRuntimeOptions(opts){return{"runtimeBaseUrl":this._runtimeBaseUrl,"previewUrl":location.href,"windowInnerWidth":this._GetWindowInnerWidth(),"windowInnerHeight":this._GetWindowInnerHeight(),"devicePixelRatio":window.devicePixelRatio,"isFullscreen":RuntimeInterface.IsDocumentFullscreen(),
"projectData":opts.projectData,"previewImageBlobs":window["cr_previewImageBlobs"]||this._localFileBlobs,"previewProjectFileBlobs":window["cr_previewProjectFileBlobs"],"previewProjectFileSWUrls":window["cr_previewProjectFiles"],"swClientId":window.cr_swClientId||"","exportType":opts.exportType,"isDebug":(new URLSearchParams(self.location.search)).has("debug"),"ife":!!self.ife,"jobScheduler":this._jobScheduler.GetPortData(),"supportedAudioFormats":supportedAudioFormats,"opusWasmScriptUrl":window["cr_opusWasmScriptUrl"]||
this._scriptFolder+"opus.wasm.js","opusWasmBinaryUrl":window["cr_opusWasmBinaryUrl"]||this._scriptFolder+"opus.wasm.wasm","isFileProtocol":this._isFileProtocol,"isiOSCordova":this.IsiOSCordova(),"isiOSWebView":this.IsiOSWebView(),"isFBInstantAvailable":typeof self["FBInstant"]!=="undefined"}}async _InitWorker(opts,port2){const workerMainUrl=this._GetWorkerURL(opts.workerMainUrl);this._worker=await this.CreateWorker(workerMainUrl,this._runtimeBaseUrl,{type:"module",name:"Runtime",isC3MainWorker:true});
this._canvas=document.createElement("canvas");this._canvas.style.display="none";const offscreenCanvas=this._canvas["transferControlToOffscreen"]();document.body.appendChild(this._canvas);window["c3canvas"]=this._canvas;if(self["C3_InsertHTMLPlaceholders"])self["C3_InsertHTMLPlaceholders"]();let workerDependencyScripts=opts.workerDependencyScripts||[];let engineScripts=opts.engineScripts;workerDependencyScripts=await Promise.all(workerDependencyScripts.map(url=>this._MaybeGetCordovaScriptURL(url)));
engineScripts=await Promise.all(engineScripts.map(url=>this._MaybeGetCordovaScriptURL(url)));if(this._exportType==="cordova")for(let i=0,len=opts.projectScripts.length;i<len;++i){const info=opts.projectScripts[i];const originalUrl=info[0];if(originalUrl===opts.mainProjectScript||(originalUrl==="scriptsInEvents.js"||originalUrl.endsWith("/scriptsInEvents.js")))info[1]=await this._MaybeGetCordovaScriptURL(originalUrl)}this._worker.postMessage(Object.assign(this._GetCommonRuntimeOptions(opts),{"type":"init-runtime",
"isInWorker":true,"messagePort":port2,"canvas":offscreenCanvas,"workerDependencyScripts":workerDependencyScripts,"engineScripts":engineScripts,"projectScripts":opts.projectScripts,"mainProjectScript":opts.mainProjectScript,"projectScriptsStatus":self["C3_ProjectScriptsStatus"]}),[port2,offscreenCanvas,...this._jobScheduler.GetPortTransferables()]);this._domHandlers=domHandlerClasses.map(C=>new C(this));this._FindRuntimeDOMHandler();self["c3_callFunction"]=(name,params)=>this._runtimeDomHandler._InvokeFunctionFromJS(name,
params);if(this._exportType==="preview")self["goToLastErrorScript"]=()=>this.PostToRuntimeComponent("runtime","go-to-last-error-script")}async _InitDOM(opts,port2){this._canvas=document.createElement("canvas");this._canvas.style.display="none";document.body.appendChild(this._canvas);window["c3canvas"]=this._canvas;if(self["C3_InsertHTMLPlaceholders"])self["C3_InsertHTMLPlaceholders"]();this._domHandlers=domHandlerClasses.map(C=>new C(this));this._FindRuntimeDOMHandler();let engineScripts=opts.engineScripts.map(url=>
typeof url==="string"?(new URL(url,this._runtimeBaseUrl)).toString():url);if(Array.isArray(opts.workerDependencyScripts))engineScripts.unshift(...opts.workerDependencyScripts);engineScripts=await Promise.all(engineScripts.map(url=>this._MaybeGetCordovaScriptURL(url)));await Promise.all(engineScripts.map(url=>AddScript(url)));const scriptsStatus=self["C3_ProjectScriptsStatus"];const mainProjectScript=opts.mainProjectScript;const allProjectScripts=opts.projectScripts;for(let [originalUrl,loadUrl]of allProjectScripts){if(!loadUrl)loadUrl=
originalUrl;if(originalUrl===mainProjectScript)try{loadUrl=await this._MaybeGetCordovaScriptURL(loadUrl);await AddScript(loadUrl);if(this._exportType==="preview"&&!scriptsStatus[originalUrl])this._ReportProjectMainScriptError(originalUrl,"main script did not run to completion")}catch(err){this._ReportProjectMainScriptError(originalUrl,err)}else if(originalUrl==="scriptsInEvents.js"||originalUrl.endsWith("/scriptsInEvents.js")){loadUrl=await this._MaybeGetCordovaScriptURL(loadUrl);await AddScript(loadUrl)}}if(this._exportType===
"preview"&&typeof self.C3.ScriptsInEvents!=="object"){this._RemoveLoadingMessage();const msg="Failed to load JavaScript code used in events. Check all your JavaScript code has valid syntax.";console.error("[C3 runtime] "+msg);alert(msg);return}const runtimeOpts=Object.assign(this._GetCommonRuntimeOptions(opts),{"isInWorker":false,"messagePort":port2,"canvas":this._canvas,"runOnStartupFunctions":runOnStartupFunctions});this._OnBeforeCreateRuntime();this._localRuntime=self["C3_CreateRuntime"](runtimeOpts);
await self["C3_InitRuntime"](this._localRuntime,runtimeOpts)}_ReportProjectMainScriptError(url,err){this._RemoveLoadingMessage();console.error(`[Preview] Failed to load project main script (${url}): `,err);alert(`Failed to load project main script (${url}). Check all your JavaScript code has valid syntax. Press F12 and check the console for error details.`)}_OnBeforeCreateRuntime(){this._RemoveLoadingMessage()}_RemoveLoadingMessage(){const loadingElem=window.cr_previewLoadingElem;if(loadingElem){loadingElem.parentElement.removeChild(loadingElem);
window.cr_previewLoadingElem=null}}async _OnCreateJobWorker(e){const outputPort=await this._jobScheduler._CreateJobWorker();return{"outputPort":outputPort,"transferables":[outputPort]}}_GetLocalRuntime(){if(this._useWorker)throw new Error("not available in worker mode");return this._localRuntime}PostToRuntimeComponent(component,handler,data,dispatchOpts,transferables){this._messageChannelPort.postMessage({"type":"event","component":component,"handler":handler,"dispatchOpts":dispatchOpts||null,"data":data,
"responseId":null},transferables)}PostToRuntimeComponentAsync(component,handler,data,dispatchOpts,transferables){const responseId=nextResponseId++;const ret=new Promise((resolve,reject)=>{pendingResponsePromises.set(responseId,{resolve,reject})});this._messageChannelPort.postMessage({"type":"event","component":component,"handler":handler,"dispatchOpts":dispatchOpts||null,"data":data,"responseId":responseId},transferables);return ret}["_OnMessageFromRuntime"](data){const type=data["type"];if(type===
"event")return this._OnEventFromRuntime(data);else if(type==="result")this._OnResultFromRuntime(data);else if(type==="runtime-ready")this._OnRuntimeReady();else if(type==="alert-error"){this._RemoveLoadingMessage();alert(data["message"])}else if(type==="creating-runtime")this._OnBeforeCreateRuntime();else throw new Error(`unknown message '${type}'`);}_OnEventFromRuntime(e){const component=e["component"];const handler=e["handler"];const data=e["data"];const responseId=e["responseId"];const handlerMap=
runtimeEventHandlers.get(component);if(!handlerMap){console.warn(`[DOM] No event handlers for component '${component}'`);return}const func=handlerMap.get(handler);if(!func){console.warn(`[DOM] No handler '${handler}' for component '${component}'`);return}let ret=null;try{ret=func(data)}catch(err){console.error(`Exception in '${component}' handler '${handler}':`,err);if(responseId!==null)this._PostResultToRuntime(responseId,false,""+err);return}if(responseId===null)return ret;else if(ret&&ret.then)ret.then(result=>
this._PostResultToRuntime(responseId,true,result)).catch(err=>{console.error(`Rejection from '${component}' handler '${handler}':`,err);this._PostResultToRuntime(responseId,false,""+err)});else this._PostResultToRuntime(responseId,true,ret)}_PostResultToRuntime(responseId,isOk,result){let transferables;if(result&&result["transferables"])transferables=result["transferables"];this._messageChannelPort.postMessage({"type":"result","responseId":responseId,"isOk":isOk,"result":result},transferables)}_OnResultFromRuntime(data){const responseId=
data["responseId"];const isOk=data["isOk"];const result=data["result"];const pendingPromise=pendingResponsePromises.get(responseId);if(isOk)pendingPromise.resolve(result);else pendingPromise.reject(result);pendingResponsePromises.delete(responseId)}AddRuntimeComponentMessageHandler(component,handler,func){let handlerMap=runtimeEventHandlers.get(component);if(!handlerMap){handlerMap=new Map;runtimeEventHandlers.set(component,handlerMap)}if(handlerMap.has(handler))throw new Error(`[DOM] Component '${component}' already has handler '${handler}'`);
handlerMap.set(handler,func)}static AddDOMHandlerClass(Class){if(domHandlerClasses.includes(Class))throw new Error("DOM handler already added");domHandlerClasses.push(Class)}_FindRuntimeDOMHandler(){for(const dh of this._domHandlers)if(dh.GetComponentID()==="runtime"){this._runtimeDomHandler=dh;return}throw new Error("cannot find runtime DOM handler");}_OnMessageFromDebugger(e){this.PostToRuntimeComponent("debugger","message",e)}_OnRuntimeReady(){for(const h of this._domHandlers)h.Attach()}static IsDocumentFullscreen(){return!!(document["fullscreenElement"]||
document["webkitFullscreenElement"]||document["mozFullScreenElement"]||isWrapperFullscreen)}static _SetWrapperIsFullscreenFlag(f){isWrapperFullscreen=!!f}async GetRemotePreviewStatusInfo(){return await this.PostToRuntimeComponentAsync("runtime","get-remote-preview-status-info")}_AddRAFCallback(f){this._rafCallbacks.push(f);this._RequestAnimationFrame()}_RemoveRAFCallback(f){const i=this._rafCallbacks.indexOf(f);if(i===-1)throw new Error("invalid callback");this._rafCallbacks.splice(i,1);if(!this._rafCallbacks.length)this._CancelAnimationFrame()}_RequestAnimationFrame(){if(this._rafId===
-1&&this._rafCallbacks.length)this._rafId=requestAnimationFrame(this._rafFunc)}_CancelAnimationFrame(){if(this._rafId!==-1){cancelAnimationFrame(this._rafId);this._rafId=-1}}_OnRAFCallback(){this._rafId=-1;for(const f of this._rafCallbacks)f();this._RequestAnimationFrame()}TryPlayMedia(mediaElem){this._runtimeDomHandler.TryPlayMedia(mediaElem)}RemovePendingPlay(mediaElem){this._runtimeDomHandler.RemovePendingPlay(mediaElem)}_PlayPendingMedia(){this._runtimeDomHandler._PlayPendingMedia()}SetSilent(s){this._runtimeDomHandler.SetSilent(s)}IsAudioFormatSupported(typeStr){return!!supportedAudioFormats[typeStr]}async _WasmDecodeWebMOpus(arrayBuffer){const result=
await this.PostToRuntimeComponentAsync("runtime","opus-decode",{"arrayBuffer":arrayBuffer},null,[arrayBuffer]);return new Float32Array(result)}SetIsExportingToVideo(duration){this._isExportingToVideo=true;this._exportToVideoDuration=duration}IsExportingToVideo(){return this._isExportingToVideo}GetExportToVideoDuration(){return this._exportToVideoDuration}IsAbsoluteURL(url){return/^(?:[a-z\-]+:)?\/\//.test(url)||url.substr(0,5)==="data:"||url.substr(0,5)==="blob:"}IsRelativeURL(url){return!this.IsAbsoluteURL(url)}async _MaybeGetCordovaScriptURL(url){if(this._exportType===
"cordova"&&(url.startsWith("file:")||this._isFileProtocol&&this.IsRelativeURL(url))){let filename=url;if(filename.startsWith(this._runtimeBaseUrl))filename=filename.substr(this._runtimeBaseUrl.length);const arrayBuffer=await this.CordovaFetchLocalFileAsArrayBuffer(filename);const blob=new Blob([arrayBuffer],{type:"application/javascript"});return URL.createObjectURL(blob)}else return url}async _OnCordovaFetchLocalFile(e){const filename=e["filename"];switch(e["as"]){case "text":return await this.CordovaFetchLocalFileAsText(filename);
case "buffer":return await this.CordovaFetchLocalFileAsArrayBuffer(filename);default:throw new Error("unsupported type");}}_GetPermissionAPI(){const api=window["cordova"]&&window["cordova"]["plugins"]&&window["cordova"]["plugins"]["permissions"];if(typeof api!=="object")throw new Error("Permission API is not loaded");return api}_MapPermissionID(api,permission){const permissionID=api[permission];if(typeof permissionID!=="string")throw new Error("Invalid permission name");return permissionID}_HasPermission(id){const api=
this._GetPermissionAPI();return new Promise((resolve,reject)=>api["checkPermission"](this._MapPermissionID(api,id),status=>resolve(!!status["hasPermission"]),reject))}_RequestPermission(id){const api=this._GetPermissionAPI();return new Promise((resolve,reject)=>api["requestPermission"](this._MapPermissionID(api,id),status=>resolve(!!status["hasPermission"]),reject))}async RequestPermissions(permissions){if(this.GetExportType()!=="cordova")return true;if(this.IsiOSCordova())return true;for(const id of permissions){const alreadyGranted=
await this._HasPermission(id);if(alreadyGranted)continue;const granted=await this._RequestPermission(id);if(granted===false)return false}return true}async RequirePermissions(...permissions){if(await this.RequestPermissions(permissions)===false)throw new Error("Permission not granted");}CordovaFetchLocalFile(filename){const path=window["cordova"]["file"]["applicationDirectory"]+"www/"+filename.toLowerCase();return new Promise((resolve,reject)=>{window["resolveLocalFileSystemURL"](path,entry=>{entry["file"](resolve,
reject)},reject)})}async CordovaFetchLocalFileAsText(filename){const file=await this.CordovaFetchLocalFile(filename);return await BlobToString(file)}_CordovaMaybeStartNextArrayBufferRead(){if(!queuedArrayBufferReads.length)return;if(activeArrayBufferReads>=MAX_ARRAYBUFFER_READS)return;activeArrayBufferReads++;const job=queuedArrayBufferReads.shift();this._CordovaDoFetchLocalFileAsAsArrayBuffer(job.filename,job.successCallback,job.errorCallback)}CordovaFetchLocalFileAsArrayBuffer(filename){return new Promise((resolve,
reject)=>{queuedArrayBufferReads.push({filename:filename,successCallback:result=>{activeArrayBufferReads--;this._CordovaMaybeStartNextArrayBufferRead();resolve(result)},errorCallback:err=>{activeArrayBufferReads--;this._CordovaMaybeStartNextArrayBufferRead();reject(err)}});this._CordovaMaybeStartNextArrayBufferRead()})}async _CordovaDoFetchLocalFileAsAsArrayBuffer(filename,successCallback,errorCallback){try{const file=await this.CordovaFetchLocalFile(filename);const arrayBuffer=await BlobToArrayBuffer(file);
successCallback(arrayBuffer)}catch(err){errorCallback(err)}}_SendWrapperMessage(o){if(this._exportType==="windows-webview2")window["chrome"]["webview"]["postMessage"](JSON.stringify(o));else if(this._exportType==="macos-wkwebview")window["webkit"]["messageHandlers"]["C3Wrapper"]["postMessage"](JSON.stringify(o));else throw new Error("cannot send wrapper message");}async _ConvertDataUrisToBlobs(){const promises=[];for(const [filename,data]of Object.entries(this._localFileBlobs))promises.push(this._ConvertDataUriToBlobs(filename,
data));await Promise.all(promises)}async _ConvertDataUriToBlobs(filename,data){if(typeof data==="object"){this._localFileBlobs[filename]=new Blob([data["str"]],{"type":data["type"]});this._localFileStrings[filename]=data["str"]}else{let blob=await this._FetchDataUri(data);if(!blob)blob=this._DataURIToBinaryBlobSync(data);this._localFileBlobs[filename]=blob}}async _FetchDataUri(dataUri){try{const response=await fetch(dataUri);return await response.blob()}catch(err){console.warn("Failed to fetch a data: URI. Falling back to a slower workaround. This is probably because the Content Security Policy unnecessarily blocked it. Allow data: URIs in your CSP to avoid this.",
err);return null}}_DataURIToBinaryBlobSync(datauri){const o=this._ParseDataURI(datauri);return this._BinaryStringToBlob(o.data,o.mime_type)}_ParseDataURI(datauri){const comma=datauri.indexOf(",");if(comma<0)throw new URIError("expected comma in data: uri");const typepart=datauri.substring(5,comma);const datapart=datauri.substring(comma+1);const typearr=typepart.split(";");const mimetype=typearr[0]||"";const encoding1=typearr[1];const encoding2=typearr[2];let decodeddata;if(encoding1==="base64"||encoding2===
"base64")decodeddata=atob(datapart);else decodeddata=decodeURIComponent(datapart);return{mime_type:mimetype,data:decodeddata}}_BinaryStringToBlob(binstr,mime_type){let len=binstr.length;let len32=len>>2;let a8=new Uint8Array(len);let a32=new Uint32Array(a8.buffer,0,len32);let i,j;for(i=0,j=0;i<len32;++i)a32[i]=binstr.charCodeAt(j++)|binstr.charCodeAt(j++)<<8|binstr.charCodeAt(j++)<<16|binstr.charCodeAt(j++)<<24;let tailLength=len&3;while(tailLength--){a8[j]=binstr.charCodeAt(j);++j}return new Blob([a8],
{"type":mime_type})}}};


'use strict';{const RuntimeInterface=self.RuntimeInterface;function IsCompatibilityMouseEvent(e){return e["sourceCapabilities"]&&e["sourceCapabilities"]["firesTouchEvents"]||e["originalEvent"]&&e["originalEvent"]["sourceCapabilities"]&&e["originalEvent"]["sourceCapabilities"]["firesTouchEvents"]}const KEY_CODE_ALIASES=new Map([["OSLeft","MetaLeft"],["OSRight","MetaRight"]]);const DISPATCH_RUNTIME_AND_SCRIPT={"dispatchRuntimeEvent":true,"dispatchUserScriptEvent":true};const DISPATCH_SCRIPT_ONLY={"dispatchUserScriptEvent":true};
const DISPATCH_RUNTIME_ONLY={"dispatchRuntimeEvent":true};function AddStyleSheet(cssUrl){return new Promise((resolve,reject)=>{const styleLink=document.createElement("link");styleLink.onload=()=>resolve(styleLink);styleLink.onerror=err=>reject(err);styleLink.rel="stylesheet";styleLink.href=cssUrl;document.head.appendChild(styleLink)})}function FetchImage(url){return new Promise((resolve,reject)=>{const img=new Image;img.onload=()=>resolve(img);img.onerror=err=>reject(err);img.src=url})}async function BlobToImage(blob){const blobUrl=
URL.createObjectURL(blob);try{return await FetchImage(blobUrl)}finally{URL.revokeObjectURL(blobUrl)}}function BlobToString(blob){return new Promise((resolve,reject)=>{let fileReader=new FileReader;fileReader.onload=e=>resolve(e.target.result);fileReader.onerror=err=>reject(err);fileReader.readAsText(blob)})}async function BlobToSvgImage(blob,width,height){if(!/firefox/i.test(navigator.userAgent))return await BlobToImage(blob);let str=await BlobToString(blob);const parser=new DOMParser;const doc=parser.parseFromString(str,
"image/svg+xml");const rootElem=doc.documentElement;if(rootElem.hasAttribute("width")&&rootElem.hasAttribute("height")){const widthStr=rootElem.getAttribute("width");const heightStr=rootElem.getAttribute("height");if(!widthStr.includes("%")&&!heightStr.includes("%"))return await BlobToImage(blob)}rootElem.setAttribute("width",width+"px");rootElem.setAttribute("height",height+"px");const serializer=new XMLSerializer;str=serializer.serializeToString(doc);blob=new Blob([str],{type:"image/svg+xml"});
return await BlobToImage(blob)}function IsInContentEditable(el){do{if(el.parentNode&&el.hasAttribute("contenteditable"))return true;el=el.parentNode}while(el);return false}const keyboardInputElementTagNames=new Set(["input","textarea","datalist","select"]);function IsKeyboardInputElement(elem){return keyboardInputElementTagNames.has(elem.tagName.toLowerCase())||IsInContentEditable(elem)}const canvasOrDocTags=new Set(["canvas","body","html"]);function PreventDefaultOnCanvasOrDoc(e){const tagName=e.target.tagName.toLowerCase();
if(canvasOrDocTags.has(tagName))e.preventDefault()}function BlockWheelZoom(e){if(e.metaKey||e.ctrlKey)e.preventDefault()}self["C3_GetSvgImageSize"]=async function(blob){const img=await BlobToImage(blob);if(img.width>0&&img.height>0)return[img.width,img.height];else{img.style.position="absolute";img.style.left="0px";img.style.top="0px";img.style.visibility="hidden";document.body.appendChild(img);const rc=img.getBoundingClientRect();document.body.removeChild(img);return[rc.width,rc.height]}};self["C3_RasterSvgImageBlob"]=
async function(blob,imageWidth,imageHeight,surfaceWidth,surfaceHeight){const img=await BlobToSvgImage(blob,imageWidth,imageHeight);const canvas=document.createElement("canvas");canvas.width=surfaceWidth;canvas.height=surfaceHeight;const ctx=canvas.getContext("2d");ctx.drawImage(img,0,0,imageWidth,imageHeight);return canvas};let isCordovaPaused=false;document.addEventListener("pause",()=>isCordovaPaused=true);document.addEventListener("resume",()=>isCordovaPaused=false);function ParentHasFocus(){try{return window.parent&&
window.parent.document.hasFocus()}catch(err){return false}}function KeyboardIsVisible(){const elem=document.activeElement;if(!elem)return false;const tagName=elem.tagName.toLowerCase();const inputTypes=new Set(["email","number","password","search","tel","text","url"]);if(tagName==="textarea")return true;if(tagName==="input")return inputTypes.has(elem.type.toLowerCase()||"text");return IsInContentEditable(elem)}const DOM_COMPONENT_ID="runtime";const HANDLER_CLASS=class RuntimeDOMHandler extends self.DOMHandler{constructor(iRuntime){super(iRuntime,
DOM_COMPONENT_ID);this._isFirstSizeUpdate=true;this._simulatedResizeTimerId=-1;this._targetOrientation="any";this._attachedDeviceOrientationEvent=false;this._attachedDeviceMotionEvent=false;this._debugHighlightElem=null;this._isExportToVideo=false;this._exportVideoProgressMessage="";this._exportVideoUpdateTimerId=-1;this._pointerRawUpdateRateLimiter=null;this._lastPointerRawUpdateEvent=null;this._pointerRawMovementX=0;this._pointerRawMovementY=0;this._enableAndroidVKDetection=false;this._lastWindowWidth=
iRuntime._GetWindowInnerWidth();this._lastWindowHeight=iRuntime._GetWindowInnerHeight();this._virtualKeyboardHeight=0;iRuntime.AddRuntimeComponentMessageHandler("canvas","update-size",e=>this._OnUpdateCanvasSize(e));iRuntime.AddRuntimeComponentMessageHandler("runtime","invoke-download",e=>this._OnInvokeDownload(e));iRuntime.AddRuntimeComponentMessageHandler("runtime","raster-svg-image",e=>this._OnRasterSvgImage(e));iRuntime.AddRuntimeComponentMessageHandler("runtime","get-svg-image-size",e=>this._OnGetSvgImageSize(e));
iRuntime.AddRuntimeComponentMessageHandler("runtime","set-target-orientation",e=>this._OnSetTargetOrientation(e));iRuntime.AddRuntimeComponentMessageHandler("runtime","register-sw",()=>this._OnRegisterSW());iRuntime.AddRuntimeComponentMessageHandler("runtime","post-to-debugger",e=>this._OnPostToDebugger(e));iRuntime.AddRuntimeComponentMessageHandler("runtime","go-to-script",e=>this._OnPostToDebugger(e));iRuntime.AddRuntimeComponentMessageHandler("runtime","before-start-ticking",()=>this._OnBeforeStartTicking());
iRuntime.AddRuntimeComponentMessageHandler("runtime","debug-highlight",e=>this._OnDebugHighlight(e));iRuntime.AddRuntimeComponentMessageHandler("runtime","enable-device-orientation",()=>this._AttachDeviceOrientationEvent());iRuntime.AddRuntimeComponentMessageHandler("runtime","enable-device-motion",()=>this._AttachDeviceMotionEvent());iRuntime.AddRuntimeComponentMessageHandler("runtime","add-stylesheet",e=>this._OnAddStylesheet(e));iRuntime.AddRuntimeComponentMessageHandler("runtime","alert",e=>this._OnAlert(e));
iRuntime.AddRuntimeComponentMessageHandler("runtime","hide-cordova-splash",()=>this._OnHideCordovaSplash());iRuntime.AddRuntimeComponentMessageHandler("runtime","set-exporting-to-video",e=>this._SetExportingToVideo(e));iRuntime.AddRuntimeComponentMessageHandler("runtime","export-to-video-progress",e=>this._OnExportVideoProgress(e));iRuntime.AddRuntimeComponentMessageHandler("runtime","exported-to-video",e=>this._OnExportedToVideo(e));const allowDefaultContextMenuTagNames=new Set(["input","textarea",
"datalist"]);window.addEventListener("contextmenu",e=>{const t=e.target;const name=t.tagName.toLowerCase();if(!allowDefaultContextMenuTagNames.has(name)&&!IsInContentEditable(t))e.preventDefault()});const canvas=iRuntime.GetCanvas();window.addEventListener("selectstart",PreventDefaultOnCanvasOrDoc);window.addEventListener("gesturehold",PreventDefaultOnCanvasOrDoc);canvas.addEventListener("selectstart",PreventDefaultOnCanvasOrDoc);canvas.addEventListener("gesturehold",PreventDefaultOnCanvasOrDoc);
window.addEventListener("touchstart",PreventDefaultOnCanvasOrDoc,{"passive":false});if(typeof PointerEvent!=="undefined"){window.addEventListener("pointerdown",PreventDefaultOnCanvasOrDoc,{"passive":false});canvas.addEventListener("pointerdown",PreventDefaultOnCanvasOrDoc)}else canvas.addEventListener("touchstart",PreventDefaultOnCanvasOrDoc);this._mousePointerLastButtons=0;window.addEventListener("mousedown",e=>{if(e.button===1)e.preventDefault()});window.addEventListener("mousewheel",BlockWheelZoom,
{"passive":false});window.addEventListener("wheel",BlockWheelZoom,{"passive":false});window.addEventListener("resize",()=>this._OnWindowResize());window.addEventListener("fullscreenchange",()=>this._OnFullscreenChange());window.addEventListener("webkitfullscreenchange",()=>this._OnFullscreenChange());window.addEventListener("mozfullscreenchange",()=>this._OnFullscreenChange());window.addEventListener("fullscreenerror",e=>this._OnFullscreenError(e));window.addEventListener("webkitfullscreenerror",
e=>this._OnFullscreenError(e));window.addEventListener("mozfullscreenerror",e=>this._OnFullscreenError(e));if(iRuntime.IsiOSWebView())if(window["visualViewport"]){let lastVisualViewportHeight=Infinity;window["visualViewport"].addEventListener("resize",()=>{const curVisualViewportHeight=window["visualViewport"].height;if(curVisualViewportHeight>lastVisualViewportHeight)document.scrollingElement.scrollTop=0;lastVisualViewportHeight=curVisualViewportHeight})}else window.addEventListener("focusout",()=>
{if(!KeyboardIsVisible())document.scrollingElement.scrollTop=0});self["C3WrapperOnMessage"]=msg=>this._OnWrapperMessage(msg);this._mediaPendingPlay=new Set;this._mediaRemovedPendingPlay=new WeakSet;this._isSilent=false}_OnBeforeStartTicking(){self.setTimeout(()=>{this._enableAndroidVKDetection=true},1E3);if(this._iRuntime.GetExportType()==="cordova"){document.addEventListener("pause",()=>this._OnVisibilityChange(true));document.addEventListener("resume",()=>this._OnVisibilityChange(false))}else document.addEventListener("visibilitychange",
()=>this._OnVisibilityChange(document.hidden));return{"isSuspended":!!(document.hidden||isCordovaPaused)}}Attach(){window.addEventListener("focus",()=>this._PostRuntimeEvent("window-focus"));window.addEventListener("blur",()=>{this._PostRuntimeEvent("window-blur",{"parentHasFocus":ParentHasFocus()});this._mousePointerLastButtons=0});window.addEventListener("focusin",e=>{if(IsKeyboardInputElement(e.target))this._PostRuntimeEvent("keyboard-blur")});window.addEventListener("keydown",e=>this._OnKeyEvent("keydown",
e));window.addEventListener("keyup",e=>this._OnKeyEvent("keyup",e));window.addEventListener("dblclick",e=>this._OnMouseEvent("dblclick",e,DISPATCH_RUNTIME_AND_SCRIPT));window.addEventListener("wheel",e=>this._OnMouseWheelEvent("wheel",e));if(typeof PointerEvent!=="undefined"){window.addEventListener("pointerdown",e=>{this._HandlePointerDownFocus(e);this._OnPointerEvent("pointerdown",e)});if(this._iRuntime.UsesWorker()&&typeof window["onpointerrawupdate"]!=="undefined"&&self===self.top){this._pointerRawUpdateRateLimiter=
new self.RateLimiter(()=>this._DoSendPointerRawUpdate(),5);this._pointerRawUpdateRateLimiter.SetCanRunImmediate(true);window.addEventListener("pointerrawupdate",e=>this._OnPointerRawUpdate(e))}else window.addEventListener("pointermove",e=>this._OnPointerEvent("pointermove",e));window.addEventListener("pointerup",e=>this._OnPointerEvent("pointerup",e));window.addEventListener("pointercancel",e=>this._OnPointerEvent("pointercancel",e))}else{window.addEventListener("mousedown",e=>{this._HandlePointerDownFocus(e);
this._OnMouseEventAsPointer("pointerdown",e)});window.addEventListener("mousemove",e=>this._OnMouseEventAsPointer("pointermove",e));window.addEventListener("mouseup",e=>this._OnMouseEventAsPointer("pointerup",e));window.addEventListener("touchstart",e=>{this._HandlePointerDownFocus(e);this._OnTouchEvent("pointerdown",e)});window.addEventListener("touchmove",e=>this._OnTouchEvent("pointermove",e));window.addEventListener("touchend",e=>this._OnTouchEvent("pointerup",e));window.addEventListener("touchcancel",
e=>this._OnTouchEvent("pointercancel",e))}const playFunc=()=>this._PlayPendingMedia();window.addEventListener("pointerup",playFunc,true);window.addEventListener("touchend",playFunc,true);window.addEventListener("click",playFunc,true);window.addEventListener("keydown",playFunc,true);window.addEventListener("gamepadconnected",playFunc,true);if(this._iRuntime.IsAndroid()&&!this._iRuntime.IsAndroidWebView()&&navigator["virtualKeyboard"]){navigator["virtualKeyboard"]["overlaysContent"]=true;navigator["virtualKeyboard"].addEventListener("geometrychange",
()=>{this._OnAndroidVirtualKeyboardChange(this._GetWindowInnerHeight(),navigator["virtualKeyboard"]["boundingRect"]["height"])})}}_OnAndroidVirtualKeyboardChange(windowHeight,vkHeight){document.body.style.transform="";if(vkHeight>0){const activeElement=document.activeElement;if(activeElement){const rc=activeElement.getBoundingClientRect();const rcMidY=(rc.top+rc.bottom)/2;const targetY=(windowHeight-vkHeight)/2;let shiftY=rcMidY-targetY;if(shiftY>vkHeight)shiftY=vkHeight;if(shiftY<0)shiftY=0;if(shiftY>
0)document.body.style.transform=`translateY(${-shiftY}px)`}}}_PostRuntimeEvent(name,data){this.PostToRuntime(name,data||null,DISPATCH_RUNTIME_ONLY)}_GetWindowInnerWidth(){return this._iRuntime._GetWindowInnerWidth()}_GetWindowInnerHeight(){return this._iRuntime._GetWindowInnerHeight()}_OnWindowResize(){if(this._isExportToVideo)return;const width=this._GetWindowInnerWidth();const height=this._GetWindowInnerHeight();if(this._iRuntime.IsAndroidWebView())if(this._enableAndroidVKDetection)if(this._lastWindowWidth===
width&&height<this._lastWindowHeight){this._virtualKeyboardHeight=this._lastWindowHeight-height;this._OnAndroidVirtualKeyboardChange(this._lastWindowHeight,this._virtualKeyboardHeight);return}else{if(this._virtualKeyboardHeight>0){this._virtualKeyboardHeight=0;this._OnAndroidVirtualKeyboardChange(height,this._virtualKeyboardHeight)}this._lastWindowWidth=width;this._lastWindowHeight=height}else{this._lastWindowWidth=width;this._lastWindowHeight=height}this._PostRuntimeEvent("window-resize",{"innerWidth":width,
"innerHeight":height,"devicePixelRatio":window.devicePixelRatio,"isFullscreen":RuntimeInterface.IsDocumentFullscreen()});if(this._iRuntime.IsiOSWebView()){if(this._simulatedResizeTimerId!==-1)clearTimeout(this._simulatedResizeTimerId);this._OnSimulatedResize(width,height,0)}}_ScheduleSimulatedResize(width,height,count){if(this._simulatedResizeTimerId!==-1)clearTimeout(this._simulatedResizeTimerId);this._simulatedResizeTimerId=setTimeout(()=>this._OnSimulatedResize(width,height,count),48)}_OnSimulatedResize(originalWidth,
originalHeight,count){const width=this._GetWindowInnerWidth();const height=this._GetWindowInnerHeight();this._simulatedResizeTimerId=-1;if(width!=originalWidth||height!=originalHeight)this._PostRuntimeEvent("window-resize",{"innerWidth":width,"innerHeight":height,"devicePixelRatio":window.devicePixelRatio,"isFullscreen":RuntimeInterface.IsDocumentFullscreen()});else if(count<10)this._ScheduleSimulatedResize(width,height,count+1)}_OnSetTargetOrientation(e){this._targetOrientation=e["targetOrientation"]}_TrySetTargetOrientation(){const orientation=
this._targetOrientation;if(screen["orientation"]&&screen["orientation"]["lock"])screen["orientation"]["lock"](orientation).catch(err=>console.warn("[Construct 3] Failed to lock orientation: ",err));else try{let result=false;if(screen["lockOrientation"])result=screen["lockOrientation"](orientation);else if(screen["webkitLockOrientation"])result=screen["webkitLockOrientation"](orientation);else if(screen["mozLockOrientation"])result=screen["mozLockOrientation"](orientation);else if(screen["msLockOrientation"])result=
screen["msLockOrientation"](orientation);if(!result)console.warn("[Construct 3] Failed to lock orientation")}catch(err){console.warn("[Construct 3] Failed to lock orientation: ",err)}}_OnFullscreenChange(){if(this._isExportToVideo)return;const isDocFullscreen=RuntimeInterface.IsDocumentFullscreen();if(isDocFullscreen&&this._targetOrientation!=="any")this._TrySetTargetOrientation();this.PostToRuntime("fullscreenchange",{"isFullscreen":isDocFullscreen,"innerWidth":this._GetWindowInnerWidth(),"innerHeight":this._GetWindowInnerHeight()})}_OnFullscreenError(e){console.warn("[Construct 3] Fullscreen request failed: ",
e);this.PostToRuntime("fullscreenerror",{"isFullscreen":RuntimeInterface.IsDocumentFullscreen(),"innerWidth":this._GetWindowInnerWidth(),"innerHeight":this._GetWindowInnerHeight()})}_OnVisibilityChange(isHidden){if(isHidden)this._iRuntime._CancelAnimationFrame();else this._iRuntime._RequestAnimationFrame();this.PostToRuntime("visibilitychange",{"hidden":isHidden})}_OnKeyEvent(name,e){if(e.key==="Backspace")PreventDefaultOnCanvasOrDoc(e);if(this._isExportToVideo)return;const code=KEY_CODE_ALIASES.get(e.code)||
e.code;this._PostToRuntimeMaybeSync(name,{"code":code,"key":e.key,"which":e.which,"repeat":e.repeat,"altKey":e.altKey,"ctrlKey":e.ctrlKey,"metaKey":e.metaKey,"shiftKey":e.shiftKey,"timeStamp":e.timeStamp},DISPATCH_RUNTIME_AND_SCRIPT)}_OnMouseWheelEvent(name,e){if(this._isExportToVideo)return;this.PostToRuntime(name,{"clientX":e.clientX,"clientY":e.clientY,"pageX":e.pageX,"pageY":e.pageY,"deltaX":e.deltaX,"deltaY":e.deltaY,"deltaZ":e.deltaZ,"deltaMode":e.deltaMode,"timeStamp":e.timeStamp},DISPATCH_RUNTIME_AND_SCRIPT)}_OnMouseEvent(name,
e,opts){if(this._isExportToVideo)return;if(IsCompatibilityMouseEvent(e))return;this._PostToRuntimeMaybeSync(name,{"button":e.button,"buttons":e.buttons,"clientX":e.clientX,"clientY":e.clientY,"pageX":e.pageX,"pageY":e.pageY,"movementX":e.movementX||0,"movementY":e.movementY||0,"timeStamp":e.timeStamp},opts)}_OnMouseEventAsPointer(name,e){if(this._isExportToVideo)return;if(IsCompatibilityMouseEvent(e))return;const pointerId=1;const lastButtons=this._mousePointerLastButtons;if(name==="pointerdown"&&
lastButtons!==0)name="pointermove";else if(name==="pointerup"&&e.buttons!==0)name="pointermove";this._PostToRuntimeMaybeSync(name,{"pointerId":pointerId,"pointerType":"mouse","button":e.button,"buttons":e.buttons,"lastButtons":lastButtons,"clientX":e.clientX,"clientY":e.clientY,"pageX":e.pageX,"pageY":e.pageY,"movementX":e.movementX||0,"movementY":e.movementY||0,"width":0,"height":0,"pressure":0,"tangentialPressure":0,"tiltX":0,"tiltY":0,"twist":0,"timeStamp":e.timeStamp},DISPATCH_RUNTIME_AND_SCRIPT);
this._mousePointerLastButtons=e.buttons;this._OnMouseEvent(e.type,e,DISPATCH_SCRIPT_ONLY)}_OnPointerEvent(name,e){if(this._isExportToVideo)return;if(this._pointerRawUpdateRateLimiter&&name!=="pointermove")this._pointerRawUpdateRateLimiter.Reset();let lastButtons=0;if(e.pointerType==="mouse")lastButtons=this._mousePointerLastButtons;this._PostToRuntimeMaybeSync(name,{"pointerId":e.pointerId,"pointerType":e.pointerType,"button":e.button,"buttons":e.buttons,"lastButtons":lastButtons,"clientX":e.clientX,
"clientY":e.clientY,"pageX":e.pageX,"pageY":e.pageY,"movementX":(e.movementX||0)+this._pointerRawMovementX,"movementY":(e.movementY||0)+this._pointerRawMovementY,"width":e.width||0,"height":e.height||0,"pressure":e.pressure||0,"tangentialPressure":e["tangentialPressure"]||0,"tiltX":e.tiltX||0,"tiltY":e.tiltY||0,"twist":e["twist"]||0,"timeStamp":e.timeStamp},DISPATCH_RUNTIME_AND_SCRIPT);this._pointerRawMovementX=0;this._pointerRawMovementY=0;if(e.pointerType==="mouse"){let mouseEventName="mousemove";
if(name==="pointerdown")mouseEventName="mousedown";else if(name==="pointerup")mouseEventName="mouseup";this._OnMouseEvent(mouseEventName,e,DISPATCH_SCRIPT_ONLY);this._mousePointerLastButtons=e.buttons}}_OnPointerRawUpdate(e){if(this._lastPointerRawUpdateEvent){this._pointerRawMovementX+=this._lastPointerRawUpdateEvent.movementX||0;this._pointerRawMovementY+=this._lastPointerRawUpdateEvent.movementY||0}this._lastPointerRawUpdateEvent=e;this._pointerRawUpdateRateLimiter.Call()}_DoSendPointerRawUpdate(){this._OnPointerEvent("pointermove",
this._lastPointerRawUpdateEvent);this._lastPointerRawUpdateEvent=null}_OnTouchEvent(fireName,e){if(this._isExportToVideo)return;for(let i=0,len=e.changedTouches.length;i<len;++i){const t=e.changedTouches[i];this._PostToRuntimeMaybeSync(fireName,{"pointerId":t.identifier,"pointerType":"touch","button":0,"buttons":0,"lastButtons":0,"clientX":t.clientX,"clientY":t.clientY,"pageX":t.pageX,"pageY":t.pageY,"movementX":e.movementX||0,"movementY":e.movementY||0,"width":(t["radiusX"]||t["webkitRadiusX"]||
0)*2,"height":(t["radiusY"]||t["webkitRadiusY"]||0)*2,"pressure":t["force"]||t["webkitForce"]||0,"tangentialPressure":0,"tiltX":0,"tiltY":0,"twist":t["rotationAngle"]||0,"timeStamp":e.timeStamp},DISPATCH_RUNTIME_AND_SCRIPT)}}_HandlePointerDownFocus(e){if(window!==window.top)window.focus();if(this._IsElementCanvasOrDocument(e.target)&&document.activeElement&&!this._IsElementCanvasOrDocument(document.activeElement))document.activeElement.blur()}_IsElementCanvasOrDocument(elem){return!elem||elem===document||
elem===window||elem===document.body||elem.tagName.toLowerCase()==="canvas"}_AttachDeviceOrientationEvent(){if(this._attachedDeviceOrientationEvent)return;this._attachedDeviceOrientationEvent=true;window.addEventListener("deviceorientation",e=>this._OnDeviceOrientation(e));window.addEventListener("deviceorientationabsolute",e=>this._OnDeviceOrientationAbsolute(e))}_AttachDeviceMotionEvent(){if(this._attachedDeviceMotionEvent)return;this._attachedDeviceMotionEvent=true;window.addEventListener("devicemotion",
e=>this._OnDeviceMotion(e))}_OnDeviceOrientation(e){if(this._isExportToVideo)return;this.PostToRuntime("deviceorientation",{"absolute":!!e["absolute"],"alpha":e["alpha"]||0,"beta":e["beta"]||0,"gamma":e["gamma"]||0,"timeStamp":e.timeStamp,"webkitCompassHeading":e["webkitCompassHeading"],"webkitCompassAccuracy":e["webkitCompassAccuracy"]},DISPATCH_RUNTIME_AND_SCRIPT)}_OnDeviceOrientationAbsolute(e){if(this._isExportToVideo)return;this.PostToRuntime("deviceorientationabsolute",{"absolute":!!e["absolute"],
"alpha":e["alpha"]||0,"beta":e["beta"]||0,"gamma":e["gamma"]||0,"timeStamp":e.timeStamp},DISPATCH_RUNTIME_AND_SCRIPT)}_OnDeviceMotion(e){if(this._isExportToVideo)return;let accProp=null;const acc=e["acceleration"];if(acc)accProp={"x":acc["x"]||0,"y":acc["y"]||0,"z":acc["z"]||0};let withGProp=null;const withG=e["accelerationIncludingGravity"];if(withG)withGProp={"x":withG["x"]||0,"y":withG["y"]||0,"z":withG["z"]||0};let rotationRateProp=null;const rotationRate=e["rotationRate"];if(rotationRate)rotationRateProp=
{"alpha":rotationRate["alpha"]||0,"beta":rotationRate["beta"]||0,"gamma":rotationRate["gamma"]||0};this.PostToRuntime("devicemotion",{"acceleration":accProp,"accelerationIncludingGravity":withGProp,"rotationRate":rotationRateProp,"interval":e["interval"],"timeStamp":e.timeStamp},DISPATCH_RUNTIME_AND_SCRIPT)}_OnUpdateCanvasSize(e){const runtimeInterface=this.GetRuntimeInterface();if(runtimeInterface.IsExportingToVideo())return;const canvas=runtimeInterface.GetCanvas();canvas.style.width=e["styleWidth"]+
"px";canvas.style.height=e["styleHeight"]+"px";canvas.style.marginLeft=e["marginLeft"]+"px";canvas.style.marginTop=e["marginTop"]+"px";if(this._isFirstSizeUpdate){canvas.style.display="";this._isFirstSizeUpdate=false}}_OnInvokeDownload(e){const url=e["url"];const filename=e["filename"];const a=document.createElement("a");const body=document.body;a.textContent=filename;a.href=url;a.download=filename;body.appendChild(a);a.click();body.removeChild(a)}async _OnRasterSvgImage(e){const blob=e["blob"];const imageWidth=
e["imageWidth"];const imageHeight=e["imageHeight"];const surfaceWidth=e["surfaceWidth"];const surfaceHeight=e["surfaceHeight"];const imageBitmapOpts=e["imageBitmapOpts"];const canvas=await self["C3_RasterSvgImageBlob"](blob,imageWidth,imageHeight,surfaceWidth,surfaceHeight);let ret;if(imageBitmapOpts)ret=await createImageBitmap(canvas,imageBitmapOpts);else ret=await createImageBitmap(canvas);return{"imageBitmap":ret,"transferables":[ret]}}async _OnGetSvgImageSize(e){return await self["C3_GetSvgImageSize"](e["blob"])}async _OnAddStylesheet(e){await AddStyleSheet(e["url"])}_PlayPendingMedia(){const mediaToTryPlay=
[...this._mediaPendingPlay];this._mediaPendingPlay.clear();if(!this._isSilent)for(const mediaElem of mediaToTryPlay){const playRet=mediaElem.play();if(playRet)playRet.catch(err=>{if(!this._mediaRemovedPendingPlay.has(mediaElem))this._mediaPendingPlay.add(mediaElem)})}}TryPlayMedia(mediaElem){if(typeof mediaElem.play!=="function")throw new Error("missing play function");this._mediaRemovedPendingPlay.delete(mediaElem);let playRet;try{playRet=mediaElem.play()}catch(err){this._mediaPendingPlay.add(mediaElem);
return}if(playRet)playRet.catch(err=>{if(!this._mediaRemovedPendingPlay.has(mediaElem))this._mediaPendingPlay.add(mediaElem)})}RemovePendingPlay(mediaElem){this._mediaPendingPlay.delete(mediaElem);this._mediaRemovedPendingPlay.add(mediaElem)}SetSilent(s){this._isSilent=!!s}_OnHideCordovaSplash(){if(navigator["splashscreen"]&&navigator["splashscreen"]["hide"])navigator["splashscreen"]["hide"]()}_OnDebugHighlight(e){const show=e["show"];if(!show){if(this._debugHighlightElem)this._debugHighlightElem.style.display=
"none";return}if(!this._debugHighlightElem){this._debugHighlightElem=document.createElement("div");this._debugHighlightElem.id="inspectOutline";document.body.appendChild(this._debugHighlightElem)}const elem=this._debugHighlightElem;elem.style.display="";elem.style.left=e["left"]-1+"px";elem.style.top=e["top"]-1+"px";elem.style.width=e["width"]+2+"px";elem.style.height=e["height"]+2+"px";elem.textContent=e["name"]}_OnRegisterSW(){if(window["C3_RegisterSW"])window["C3_RegisterSW"]()}_OnPostToDebugger(data){if(!window["c3_postToMessagePort"])return;
data["from"]="runtime";window["c3_postToMessagePort"](data)}_InvokeFunctionFromJS(name,params){return this.PostToRuntimeAsync("js-invoke-function",{"name":name,"params":params})}_OnAlert(e){alert(e["message"])}_OnWrapperMessage(msg){if(msg==="entered-fullscreen"){RuntimeInterface._SetWrapperIsFullscreenFlag(true);this._OnFullscreenChange()}else if(msg==="exited-fullscreen"){RuntimeInterface._SetWrapperIsFullscreenFlag(false);this._OnFullscreenChange()}else console.warn("Unknown wrapper message: ",
msg)}_SetExportingToVideo(e){this._isExportToVideo=true;const headerElem=document.createElement("h1");headerElem.id="exportToVideoMessage";headerElem.textContent=e["message"];document.body.prepend(headerElem);document.body.classList.add("exportingToVideo");this.GetRuntimeInterface().GetCanvas().style.display="";this._iRuntime.SetIsExportingToVideo(e["duration"])}_OnExportVideoProgress(e){this._exportVideoProgressMessage=e["message"];if(this._exportVideoUpdateTimerId===-1)this._exportVideoUpdateTimerId=
setTimeout(()=>this._DoUpdateExportVideoProgressMessage(),250)}_DoUpdateExportVideoProgressMessage(){this._exportVideoUpdateTimerId=-1;const headerElem=document.getElementById("exportToVideoMessage");if(headerElem)headerElem.textContent=this._exportVideoProgressMessage}_OnExportedToVideo(e){window.c3_postToMessagePort({"type":"exported-video","blob":e["blob"],"time":e["time"]})}};RuntimeInterface.AddDOMHandlerClass(HANDLER_CLASS)};


'use strict';{const DISPATCH_WORKER_SCRIPT_NAME="dispatchworker.js";const JOB_WORKER_SCRIPT_NAME="jobworker.js";self.JobSchedulerDOM=class JobSchedulerDOM{constructor(runtimeInterface){this._runtimeInterface=runtimeInterface;this._baseUrl=runtimeInterface.GetRuntimeBaseURL();if(runtimeInterface.GetExportType()==="preview")this._baseUrl+="workers/";else this._baseUrl+=runtimeInterface.GetScriptFolder();this._maxNumWorkers=Math.min(navigator.hardwareConcurrency||2,16);this._dispatchWorker=null;this._jobWorkers=
[];this._inputPort=null;this._outputPort=null}async Init(){if(this._hasInitialised)throw new Error("already initialised");this._hasInitialised=true;const dispatchWorkerScriptUrl=this._runtimeInterface._GetWorkerURL(DISPATCH_WORKER_SCRIPT_NAME);this._dispatchWorker=await this._runtimeInterface.CreateWorker(dispatchWorkerScriptUrl,this._baseUrl,{name:"DispatchWorker"});const messageChannel=new MessageChannel;this._inputPort=messageChannel.port1;this._dispatchWorker.postMessage({"type":"_init","in-port":messageChannel.port2},
[messageChannel.port2]);this._outputPort=await this._CreateJobWorker()}async _CreateJobWorker(){const number=this._jobWorkers.length;const jobWorkerScriptUrl=this._runtimeInterface._GetWorkerURL(JOB_WORKER_SCRIPT_NAME);const jobWorker=await this._runtimeInterface.CreateWorker(jobWorkerScriptUrl,this._baseUrl,{name:"JobWorker"+number});const dispatchChannel=new MessageChannel;const outputChannel=new MessageChannel;this._dispatchWorker.postMessage({"type":"_addJobWorker","port":dispatchChannel.port1},
[dispatchChannel.port1]);jobWorker.postMessage({"type":"init","number":number,"dispatch-port":dispatchChannel.port2,"output-port":outputChannel.port2},[dispatchChannel.port2,outputChannel.port2]);this._jobWorkers.push(jobWorker);return outputChannel.port1}GetPortData(){return{"inputPort":this._inputPort,"outputPort":this._outputPort,"maxNumWorkers":this._maxNumWorkers}}GetPortTransferables(){return[this._inputPort,this._outputPort]}}};


'use strict';{if(window["C3_IsSupported"]){const enableWorker=false;window["c3_runtimeInterface"]=new self.RuntimeInterface({useWorker:enableWorker,workerMainUrl:"workermain.js",engineScripts:["scripts/c3runtime.js"],projectScripts:[["scripts/project/vkbridge.js"]],mainProjectScript:"scripts/project/vkbridge.js",scriptFolder:"scripts/",workerDependencyScripts:[],exportType:"html5"})}};
(() => {
    const ELEMENT_ID = 'Eponesh_YandexSDK';
    const DEFAULT_BANNER_STYLES = `
        display: flex;
        justify-content: center;
        align-tems: center;
        position: absolute;
        z-index: 10;
    `;
    const POSITIONS_MAP = {
        0: 'top: 0; left: 0;',
        1: 'top: 0; left: 50%; transform: translateX(-50%);',
        2: 'top: 0; right: 0;',
        3: 'top: 0; left: 0; bottom: 0;',
        4: 'top: 50%; left: 50%; transform: translate(-50%, -50%);',
        5: 'top: 0; right: 0; bottom: 0;',
        6: 'bottom: 0; left: 0;',
        7: 'bottom: 0; left: 50%; transform: translateX(-50%);',
        8: 'bottom: 0; right: 0;',
    };

    class DomHandler extends DOMElementHandler {
        constructor(iRuntime) {
            super(iRuntime, ELEMENT_ID);

            this.$banners = {};

            // INIT
            this.AddDOMElementMessageHandler('INIT_SDK', (_, sdkOptions) => this.loadSDK(sdkOptions));
            this.AddDOMElementMessageHandler('INIT_RTB', () => this.loadRTB());
            this.AddDOMElementMessageHandler('INIT_METRICA', (_, { metricaId }) => {
                this.metricaId = metricaId;
                this.loadMetrica();

                return new Promise((resolve) => {
                    if (window[`yaCounter${this.metricaId}`]) {
                        resolve();
                        return;
                    }

                    document.addEventListener(`yacounter${this.metricaId}inited`, () => resolve());
                });
            });

            // PAYMENTS
            this.AddDOMElementMessageHandler('YSDK_PAYMENTS_GET', async (_, options) => {
                this.payments = await this.ysdk.getPayments(options);
            });
            this.AddDOMElementMessageHandler('YSDK_PAYMENTS_GET_CATALOG', async () => {
                const products = await this.payments.getCatalog();
                // map symbol to objects
                return products.map(p => ({
                    productID: p.id || p.productID,
                    title: p.title,
                    description: p.description,
                    imageURI: p.imageURI,
                    price: parseFloat(p.price)
                }));
            });
            this.AddDOMElementMessageHandler('YSDK_PAYMENTS_GET_PURCHASES', async () => {
                const purchases = await this.payments.getPurchases();
                // map symbol to objects
                return purchases.map(p => ({
                    productID: p.productID,
                    purchaseToken: p.purchaseToken,
                    signature: p.signature
                }));
            });
            this.AddDOMElementMessageHandler('YSDK_PAYMENTS_PURCHASE', (_, { purchaseId }) => this.payments.purchase(purchaseId));
            this.AddDOMElementMessageHandler('YSDK_PAYMENTS_CONSUME_PURCHASE', (_, { purchaseToken }) => this.payments.consumePurchase(purchaseToken));

            // PLAYER
            this.AddDOMElementMessageHandler('YSDK_PLAYER_GET', async () => {
                this.player = await this.ysdk.getPlayer();
                return {
                    name: this.player.getName() || '',
                    id: this.player.getUniqueID() || '',
                    photoSmall: this.player.getPhoto('small') || '',
                    photoMedium: this.player.getPhoto('medium') || '',
                    photoLarge: this.player.getPhoto('large') || ''
                };
            });

            this.AddDOMElementMessageHandler('YSDK_PLAYER_GET_FULL_STATS', () => this.player.getStats());
            this.AddDOMElementMessageHandler('YSDK_PLAYER_GET_STATS', (_, p) => this.player.getStats(p));
            this.AddDOMElementMessageHandler('YSDK_PLAYER_SET_STATS', (_, p) => this.player.setStats(p));
            this.AddDOMElementMessageHandler('YSDK_PLAYER_INCREMENT_STATS', (_, p) => this.player.incrementStats(p));

            this.AddDOMElementMessageHandler('YSDK_PLAYER_GET_FULL_DATA', () => this.player.getData());
            this.AddDOMElementMessageHandler('YSDK_PLAYER_GET_DATA', (_, p) => this.player.getData(p));
            this.AddDOMElementMessageHandler('YSDK_PLAYER_SET_DATA', (_, p) => this.player.setData(p));

            // AUTH
            this.AddDOMElementMessageHandler('YSDK_AUTH_OPEN', () => this.ysdk.auth.openAuthDialog());

            // ADS
            this.AddDOMElementMessageHandler('YSDK_ADS_SHOW_FULLSCREEN', () => this.ysdk.adv.showFullscreenAdv({ callbacks: {} }));
            this.AddDOMElementMessageHandler('YSDK_ADS_SHOW_REWARDED', () => {
                const callbacks = {
                    onOpen: () => this.PostToRuntimeElement('YSDK_ADS_REWARDED_OPEN', ELEMENT_ID),
                    onRewarded: () => this.PostToRuntimeElement('YSDK_ADS_REWARDED_REWARD', ELEMENT_ID),
                    onClose: () => this.PostToRuntimeElement('YSDK_ADS_REWARDED_CLOSE', ELEMENT_ID),
                    onError: () => this.PostToRuntimeElement('YSDK_ADS_REWARDED_ERROR', ELEMENT_ID)
                };
                this.ysdk.adv.showRewardedVideo({ callbacks });
            });

            // METRICA
            this.AddDOMElementMessageHandler('YSDK_METRICA_REACH_GOAL', (_, { target }) => ym(this.metricaId, 'reachGoal', target));

            // RTB BANNERS
            this.AddDOMElementMessageHandler('YSDK_RTB_CREATE_BANNER', (_, { id, x, y, width, height, styles }) => {
                if (!this.$banners[id]) {
                    this.$banners[id] = this.createBanner(id, `
                        ${DEFAULT_BANNER_STYLES}
                        top: ${x}px;
                        left: ${y}px;
                        width: ${width === 0 ? 'auto' : `${width}px`};
                        height: ${height === 0 ? 'auto' : `${height}px`};
                        ${styles}
                    `);
                }

                this.rtbRenderBanner(id);
            });

            this.AddDOMElementMessageHandler('YSDK_RTB_CREATE_STICKY_BANNER', (_, { id, position, width, height, styles }) => {
                if (!this.$banners[id]) {
                    this.$banners[id] = this.createBanner(id, `
                        ${DEFAULT_BANNER_STYLES}
                        ${POSITIONS_MAP[position] || ''}
                        width: ${width === 0 ? '100%' : `${width}px`};
                        height: ${height === 0 ? '100%' : `${height}px`};
                        ${styles}
                    `);
                }
                this.rtbRenderBanner(id);
            });

            this.AddDOMElementMessageHandler('YSDK_RTB_DESTROY_BANNER', (_, { id }) => this.destroyBanner(id));
            this.AddDOMElementMessageHandler('YSDK_RTB_DISPLAY_BANNER', (_, { id }) => {
                this.rtbRenderBanner(id);
            });
            this.AddDOMElementMessageHandler('YSDK_RTB_REFRESH_BANNER', (_, { id }) => {
                this.destroyBanner(id);
                this.rtbRenderBanner(id);
            });
        }

        loadMetrica() {
            (function(m, e, t, r, i, k, a) {
                m[i] = m[i] || function() {
                    (m[i].a = m[i].a || []).push(arguments)
                };
                m[i].l = 1 * new Date();
                k = e.createElement(t), a = e.getElementsByTagName(t)[0], k.async = 1, k.src = r, a.parentNode.insertBefore(k, a)
            })
            (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

            ym(this.metricaId, "init", {
                clickmap: true,
                trackLinks: true,
                accurateTrackBounce: true,
                triggerEvent: true
            });
        }

        loadSDK({ screen }) {
            return new Promise((resolve) => {
                const initSDK = async () => {
                    this.ysdk = await YaGames.init({
                        screen,
                        adv: {
                            onAdvClose: (wasShown) => this.PostToRuntimeElement('SDK_ADS_CLOSED', ELEMENT_ID, { wasShown })
                        },
                    });
                    resolve();
                }

                (function(d) {
                    var t = d.getElementsByTagName('script')[0];
                    var s = d.createElement('script');
                    s.src = 'https://yandex.ru/games/sdk/v2';
                    s.async = true;
                    t.parentNode.insertBefore(s, t);
                    s.onload = initSDK;
                })(document);
            });
        }

        loadRTB () {
            return new Promise((resolve) => {
                ((w, d, n, s, t) => {
                    w[n] = w[n] || [];
                    t = d.getElementsByTagName("script")[0];
                    s = d.createElement("script");
                    s.onload = () => resolve();
                    s.type = "text/javascript";
                    s.src = "//an.yandex.ru/system/context.js";
                    s.async = true;
                    t.parentNode.insertBefore(s, t);
                })(window, document, "yandexContextAsyncCallbacks");
            });
        }

        rtbRenderBanner (id) {
            if (!this.$banners[id]) {
                return;
            }

            document.body.appendChild(this.$banners[id]);

            Ya.Context.AdvManager.render({
                blockId: id,
                renderTo: id,
                async: true,
                onRender: () => this.PostToRuntimeElement('SDK_RTB_RENDER', ELEMENT_ID, { id })
            });
        }

        createBanner (id, styles) {
            const div = document.createElement('div');
            div.id = id;
            div.style.cssText = styles;
            return div;
        }

        destroyBanner (id) {
            if (this.$banners[id]) {
                this.$banners[id].remove();
                this.$banners[id].innerHTML = '';
            }
        }
    }

    RuntimeInterface.AddDOMHandlerClass(DomHandler);
})();
'use strict';{const DOM_COMPONENT_ID="mouse";const HANDLER_CLASS=class MouseDOMHandler extends self.DOMHandler{constructor(iRuntime){super(iRuntime,DOM_COMPONENT_ID);this.AddRuntimeMessageHandlers([["cursor",e=>this._OnChangeCursorStyle(e)],["request-pointer-lock",()=>this._OnRequestPointerLock()],["release-pointer-lock",()=>this._OnReleasePointerLock()]]);document.addEventListener("pointerlockchange",e=>this._OnPointerLockChange());document.addEventListener("pointerlockerror",e=>this._OnPointerLockError())}_OnChangeCursorStyle(e){document.documentElement.style.cursor=
e}_OnRequestPointerLock(){this._iRuntime.GetCanvas().requestPointerLock()}_OnReleasePointerLock(){document.exitPointerLock()}_OnPointerLockChange(){this.PostToRuntime("pointer-lock-change",{"has-pointer-lock":!!document.pointerLockElement})}_OnPointerLockError(){this.PostToRuntime("pointer-lock-error",{"has-pointer-lock":!!document.pointerLockElement})}};self.RuntimeInterface.AddDOMHandlerClass(HANDLER_CLASS)};
