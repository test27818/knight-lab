(function(root){
'use strict';
const goal=Array.from({length:16},(_,i)=>(i+1)%16);
const graph=Array.from({length:16},(_,u)=>Array.from({length:16},(_,v)=>v).filter(v=>Math.abs(u%4-v%4)*Math.abs((u>>2)-(v>>2))===2));
const distances=graph.map((_,s)=>{const d=new Uint8Array(16);d.fill(255);d[s]=0;const q=[s];for(const u of q)for(const v of graph[u])if(d[v]===255){d[v]=d[u]+1;q.push(v);}return d;});
const groups=[[1,7,10,3,5],[4,6,11,13,12],[2,8,9,14,15]];
const popcount=new Uint8Array(65536);for(let i=1;i<65536;i++)popcount[i]=popcount[i>>1]+(i&1);
function valid(b){return Array.isArray(b)&&b.length===16&&new Set(b).size===16&&b.every(x=>Number.isInteger(x)&&x>=0&&x<16);}
function solved(b){return b.every((v,i)=>v===goal[i]);}
function solvable(b){if(!valid(b))return false;let p=0;for(let i=0;i<16;i++)for(let j=i+1;j<16;j++)if((b[i]||16)>(b[j]||16))p^=1;return p===color(b.indexOf(0));}
function color(z){return (z%4+(z>>2))&1;}
function encode(b){let lo=0,hi=0;for(let i=0;i<8;i++){lo|=b[i]<<(4*i);hi|=b[i+8]<<(4*i);}return [lo>>>0,hi>>>0];}
function decode(lo,hi){const b=[];for(let i=0;i<8;i++)b.push((lo>>>(4*i))&15);for(let i=0;i<8;i++)b.push((hi>>>(4*i))&15);return b;}
function move(b,v){const z=b.indexOf(0);if(!graph[z].includes(v))return null;const n=b.slice();[n[z],n[v]]=[n[v],n[z]];return n;}
function applyMoves(initial,moves){let b=initial.slice();for(const t of moves){const v=b.indexOf(t);if(!t||!graph[b.indexOf(0)].includes(v))throw Error('路线包含非法移动');b=move(b,v);}return b;}
function rank(key){let used=0,r=0;for(let i=0;i<6;i++){const p=(key>>>(i*4))&15;r=r*(16-i)+p-popcount[used&((1<<p)-1)];used|=1<<p;}return r;}
function hash(lo,hi){let h=lo^Math.imul(hi,0x9e3779b1);h=Math.imul(h^(h>>>16),0x85ebca6b);h=Math.imul(h^(h>>>13),0xc2b2ae35);return (h^(h>>>16))>>>0;}
function makeRng(seed){let h=2166136261;for(const c of String(seed)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}const s=new Uint32Array(4);for(let i=0;i<4;i++){h+=0x9e3779b9;let x=h;x=Math.imul(x^(x>>>16),0x21f0aaad);x=Math.imul(x^(x>>>15),0x735a2d97);s[i]=(x^(x>>>15))>>>0;}const rot=(x,k)=>(x<<k)|(x>>>(32-k));return n=>{let x;const limit=4294967296-4294967296%n;do{const a=Math.imul(s[1],5);x=Math.imul(rot(a,7),9)>>>0;const t=s[1]<<9;s[2]^=s[0];s[3]^=s[1];s[1]^=s[2];s[0]^=s[3];s[2]^=t;s[3]=rot(s[3],11);}while(x>=limit);return x%n;};}
function generate(mode,seed,steps=40){const pick=makeRng(seed);let b=goal.slice(),reference=[];if(mode==='uniform'){for(let i=15;i>0;i--){const j=pick(i+1);[b[i],b[j]]=[b[j],b[i]];}if(!solvable(b)){const i=b.indexOf(1),j=b.indexOf(2);[b[i],b[j]]=[b[j],b[i]];}}else{let prev=-1;const tiles=[];for(let i=0;i<steps;i++){const z=b.indexOf(0),opts=graph[z].filter(v=>v!==prev),v=opts[pick(opts.length)];tiles.push(b[v]);b=move(b,v);prev=z;}reference=tiles.reverse();}return {board:b,reference};}
function makeHeuristic(tables){
 if(!tables){
  let sum=0;
  function prepare(lo,hi,z){sum=0;for(let p=0;p<16;p++){const t=p<8?(lo>>>(4*p))&15:(hi>>>(4*(p-8)))&15;if(t)sum+=distances[p][t-1];}return sum+((sum^color(z))&1);}
  function child(tile,from,z){const value=sum-distances[from][tile-1]+distances[z][tile-1];return value+((value^color(from))&1);}
  function value(b){const [lo,hi]=encode(b);return prepare(lo,hi,b.indexOf(0));}
  return {prepare,child,value};
 }
 const owner=new Int8Array(16),shift=new Int8Array(16);groups.forEach((group,g)=>group.forEach((t,j)=>{owner[t]=g;shift[t]=4*(j+1);}));
 const keys=new Uint32Array(3),values=new Uint8Array(3),positions=new Uint8Array(16);let sum=0;
 function prepare(lo,hi,z){for(let i=0;i<8;i++){positions[(lo>>>(4*i))&15]=i;positions[(hi>>>(4*i))&15]=i+8;}sum=0;for(let g=0;g<3;g++){let key=z;for(let j=0;j<5;j++)key|=positions[groups[g][j]]<<(4*(j+1));keys[g]=key;values[g]=tables[g][rank(key)];sum+=values[g];}return sum+((sum^color(z))&1);}
 function child(tile,from,z){const g=owner[tile],s=shift[tile],key=(((keys[g]&~15)|from)&~(15<<s))|(z<<s);let h=sum-values[g]+tables[g][rank(key)];return h+((h^color(from))&1);}
 function value(b){const [lo,hi]=encode(b);return prepare(lo,hi,b.indexOf(0));}
 return {prepare,child,value};
}
const api={goal,graph,groups,distances,popcount,valid,solved,solvable,color,encode,decode,move,applyMoves,rank,hash,makeRng,generate,makeHeuristic};
if(typeof module!=='undefined')module.exports=api;else root.KnightCore=api;
})(globalThis);

(function(root){
'use strict';
const C=typeof module!=='undefined'?require('./core.js'):root.KnightCore;
class Solver {
 constructor(tables){this.tables=tables;this.stopped=false;}
 cancel(){this.stopped=true;}
 async run(start,{seconds=5,memoryMB=64,incumbent=[],onProgress=()=>{},now=()=>performance.now(),yieldTask=()=>new Promise(r=>setTimeout(r,0))}={}){
  if(!C.valid(start)||!C.solvable(start))throw Error('这个局面无法还原标准目标');
  if(!Number.isFinite(seconds)||seconds<=0||seconds>600||!Number.isFinite(memoryMB)||memoryMB<8||memoryMB>512)throw Error('搜索预算无效');
  this.stopped=false;
  const began=now(),deadline=began+seconds*1000,h=C.makeHeuristic(this.tables),[slo,shi]=C.encode(start),[goalLo,goalHi]=C.encode(C.goal),z0=start.indexOf(0),parity=C.color(z0);
  let lower=h.value(start),bestMoves=null,upper=Infinity,expanded=0,stored=0,reopened=0,phase='寻找解',reason='',weight=2,allocated=0,lastReport=-Infinity,lastYield=began,improvements=0;
  if(incumbent.length&&C.solved(C.applyMoves(start,incumbent))){bestMoves=incumbent.slice();upper=bestMoves.length;}
  if(C.solved(start)){bestMoves=[];upper=0;lower=0;}
  function snapshot(done=false){return {done,reason,phase,lower,upper:Number.isFinite(upper)?upper:null,moves:bestMoves,expanded,stored,reopened,improvements,allocated,elapsed:now()-began,optimal:bestMoves!==null&&lower>=upper};}
  function report(force=false){if(force||now()-lastReport>100){lastReport=now();onProgress(snapshot());}}
  function roundBound(value){return value+((value^parity)&1);}
  const halted=()=>this.stopped||now()>=deadline;
  let maxNodes=Math.floor(memoryMB*1048576/41),hashCapacity=1;
  while(hashCapacity<2*maxNodes)hashCapacity*=2;
  let lows=new Uint32Array(maxNodes),highs=new Uint32Array(maxNodes),parents=new Int32Array(maxNodes),gs=new Uint16Array(maxNodes),hs=new Uint8Array(maxNodes),blanks=new Uint8Array(maxNodes),pending=new Uint8Array(maxNodes),open=new Uint32Array(maxNodes),bounds=new Uint32Array(maxNodes),best=new Uint32Array(hashCapacity);
  allocated=25*maxNodes+4*hashCapacity;
  let count=0,openSize=0,boundSize=0,memoryLimit=false;
  const hashMask=hashCapacity-1;
  const slotFor=(lo,hi)=>{let s=C.hash(lo,hi)&hashMask;while(best[s]){const n=best[s]-1;if(lows[n]===lo&&highs[n]===hi)break;s=(s+1)&hashMask;}return s;};
  const live=n=>pending[n]&&best[slotFor(lows[n],highs[n])]===n+1;
  function less(a,b,weighted){const af=gs[a]+(weighted?weight:1)*hs[a],bf=gs[b]+(weighted?weight:1)*hs[b];return af<bf||(af===bf&&(hs[a]<hs[b]||(hs[a]===hs[b]&&a<b)));}
  function push(heap,n,size,weighted){let i=size;while(i){const p=(i-1)>>>1;if(!less(n,heap[p],weighted))break;heap[i]=heap[p];i=p;}heap[i]=n;}
  function pop(heap,size,weighted){const first=heap[0],last=heap[size-1];size--;if(size){let i=0;while(2*i+1<size){let c=2*i+1;if(c+1<size&&less(heap[c+1],heap[c],weighted))c++;if(!less(heap[c],last,weighted))break;heap[i]=heap[c];i=c;}heap[i]=last;}return first;}
  function append(lo,hi,g,heuristic,parent,z,slot){const n=count++;lows[n]=lo;highs[n]=hi;gs[n]=g;hs[n]=heuristic;parents[n]=parent;blanks[n]=z;pending[n]=1;best[slot]=n+1;push(open,n,openSize++,true);push(bounds,n,boundSize++,false);stored=count;}
  function updateBound(){while(boundSize&&!live(bounds[0])){pop(bounds,boundSize,false);boundSize--;}if(boundSize)lower=Math.max(lower,Math.min(upper,roundBound(gs[bounds[0]]+hs[bounds[0]])));else if(bestMoves!==null)lower=upper;}
  function rebuildWeight(value){weight=value;let size=0;for(let i=0;i<openSize;i++){const n=open[i];if(live(n))push(open,n,size++,true);}openSize=size;}
  function install(n){const moves=[];for(let v=n;parents[v]>=0;v=parents[v]){const p=parents[v],z=blanks[p];moves.push(z<8?(lows[v]>>>(4*z))&15:(highs[v]>>>(4*(z-8)))&15);}moves.reverse();if(moves.length<upper){bestMoves=moves;upper=moves.length;improvements++;phase='缩短并证明';report(true);rebuildWeight(weight===2?1.5:weight===1.5?1.2:1);}}
  append(slo,shi,0,lower,-1,z0,slotFor(slo,shi));report(true);
  while(openSize&&lower<upper&&!halted()){
   const sliceEnd=Math.min(deadline,now()+10);let steps=0;
   while(openSize&&lower<upper&&steps++<4096){
    if((steps&127)===0&&now()>=sliceEnd)break;
    updateBound();if(lower>=upper)break;
    const n=pop(open,openSize,true);openSize--;
    if(!live(n))continue;
    if(gs[n]+hs[n]>=upper){pending[n]=0;continue;}
    const lo=lows[n],hi=highs[n],z=blanks[n];
    if(lo===goalLo&&hi===goalHi){install(n);pending[n]=0;continue;}
    // Keep a not-yet-expanded node in the proof frontier when memory fills.
    if(count+C.graph[z].length>maxNodes){memoryLimit=true;break;}
    pending[n]=0;expanded++;h.prepare(lo,hi,z);
    const previous=parents[n]>=0?blanks[parents[n]]:-1;
    for(const v of C.graph[z]){if(v===previous)continue;const tile=v<8?(lo>>>(4*v))&15:(hi>>>(4*(v-8)))&15;let nl=lo,nh=hi;if(v<8)nl^=tile<<(4*v);else nh^=tile<<(4*(v-8));if(z<8)nl^=tile<<(4*z);else nh^=tile<<(4*(z-8));nl>>>=0;nh>>>=0;const slot=slotFor(nl,nh),old=best[slot]-1,g=gs[n]+1;if(old>=0&&gs[old]<=g)continue;const hv=h.child(tile,v,z);if(g+hv>=upper)continue;if(old>=0)reopened++;append(nl,nh,g,hv,n,v,slot);}
   }
   updateBound();report();if(memoryLimit)break;
   await yieldTask();lastYield=now();
  }
  updateBound();
  if(memoryLimit&&lower<upper&&!halted()){
   phase='低内存证明';report(true);
   lows=highs=parents=gs=hs=blanks=pending=open=bounds=best=null;
   await yieldTask();
   // IDA* restarts from a certified lower bound. No history-dependent pruning
   // or transposition cache is used here, so threshold exhaustion is a proof.
   const board=start.slice(),route=[],frames=[];let threshold=lower,next=Infinity;
   const tracker=C.makeHeuristic(this.tables);
   const loStack=new Uint32Array(1024),hiStack=new Uint32Array(1024);loStack[0]=slo;hiStack[0]=shi;
   function enter(z,previous,g){const [lo,hi]=C.encode(board),hv=tracker.prepare(lo,hi,z),f=g+hv;if(f>=upper)return false;if(f>threshold){next=Math.min(next,f);return false;}if(C.solved(board)){bestMoves=route.slice();upper=g;lower=g;improvements++;return false;}const opts=[];for(const v of C.graph[z])if(v!==previous)opts.push({v,tile:board[v],h:tracker.child(board[v],v,z)});opts.sort((a,b)=>a.h-b.h);frames.push({z,g,opts,index:0});expanded++;loStack[g]=lo;hiStack[g]=hi;return true;}
   while(lower<upper&&!halted()){
    next=Infinity;frames.length=0;route.length=0;enter(z0,-1,0);let ticks=0;
    while(frames.length&&lower<upper&&!halted()){
     const f=frames[frames.length-1];
     if(f.index>=f.opts.length){frames.pop();if(frames.length){const parent=frames[frames.length-1];[board[parent.z],board[f.z]]=[board[f.z],board[parent.z]];route.pop();}continue;}
     const o=f.opts[f.index++];[board[f.z],board[o.v]]=[board[o.v],board[f.z]];route.push(o.tile);
     const [lo,hi]=C.encode(board);let cycle=false;for(let k=f.g-1;k>=0;k-=2)if(loStack[k]===lo&&hiStack[k]===hi){cycle=true;break;}
     const descended=!cycle&&enter(o.v,f.z,f.g+1);
     if(!descended){[board[f.z],board[o.v]]=[board[o.v],board[f.z]];route.pop();}
     if((++ticks&511)===0){report();await yieldTask();lastYield=now();}
    }
    if(halted()||lower>=upper)break;
    if(!Number.isFinite(next)||next>=upper){if(bestMoves!==null)lower=upper;else throw Error('搜索空间异常');break;}
    lower=threshold=roundBound(next);report(true);
   }
  }
  if(lower>=upper){lower=upper;reason='optimal';phase='最短已证明';}
  else if(this.stopped){reason='cancelled';phase='已停止';}
  else{reason='budget';phase='预算已用完';}
  const result=snapshot(true);onProgress(result);return result;
 }
}
if(typeof module!=='undefined')module.exports={Solver};else root.KnightSolver={Solver};
})(globalThis);

(function(root){
'use strict';
function createDataLoader(manifest,onProgress,options={}){
 const memory=new Map(),partial=new Map(),complete=new Map();
 const totalBytes=manifest.reduce((sum,t)=>sum+t.parts.reduce((n,p)=>n+p.bytes,0),0);
 let completedBytes=0,cachedBytes=0,loaded=0,active=0,lastProgress=0;
 let concurrency=Number.isInteger(options.concurrency)&&options.concurrency>=1&&options.concurrency<=12?options.concurrency:6;
 const waiting=[],idleMs=options.idleMs??12000,totalMs=options.totalMs??90000;
 const maxAttempts=options.maxAttempts??3,delayMs=options.delayMs??250;
 const cachePromise=Promise.resolve().then(()=>root.caches?.open('knight-lab-pdb-v2')).catch(()=>null);
 const progress=(force=false)=>{const now=Date.now();if(force||now-lastProgress>100){lastProgress=now;onProgress({loaded,total:manifest.length,completedBytes,receivedBytes:completedBytes+[...partial.values()].reduce((a,b)=>a+b,0),totalBytes,cachedBytes,concurrency});}};
 async function digest(bytes){const result=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(result),v=>v.toString(16).padStart(2,'0')).join('');}
 async function verify(bytes,part){if(bytes.length!==part.bytes||await digest(bytes)!==part.sha256)throw Error('加速数据校验失败');return bytes;}
 function drain(){while(active<concurrency&&waiting.length){active++;waiting.shift()();}}
 function acquire(){return new Promise(resolve=>{waiting.push(resolve);drain();});}
 function release(){active--;drain();}
 function setConcurrency(value){if(!Number.isInteger(value)||value<1||value>12)return;concurrency=value;drain();progress(true);}
 async function download(part){
  const controller=new AbortController();let idleTimer;
  const touch=()=>{clearTimeout(idleTimer);idleTimer=setTimeout(()=>controller.abort(),idleMs);};
  const totalTimer=setTimeout(()=>controller.abort(),totalMs);touch();
  try{
   const response=await fetch(part.url,{signal:controller.signal});if(!response.ok)throw Error(`HTTP ${response.status}`);
   const reader=response.body.getReader(),chunks=[];let received=0;
   for(;;){const {done,value}=await reader.read();if(done)break;touch();received+=value.length;if(received>part.bytes)throw Error('加速数据大小异常');chunks.push(value);partial.set(part.url,received);progress();}
   const bytes=new Uint8Array(received);let offset=0;for(const value of chunks){bytes.set(value,offset);offset+=value.length;}
   return await verify(bytes,part);
  }catch(e){if(e.name==='AbortError')throw Error('网络传输中断');throw e;}
  finally{clearTimeout(idleTimer);clearTimeout(totalTimer);partial.delete(part.url);}
 }
 async function piece(part){
  if(memory.has(part.url))return memory.get(part.url);
  await acquire();
  try{
   const cache=await cachePromise;let bytes=null,fromCache=false;
   if(cache){try{const response=await cache.match(part.url);if(response){bytes=await verify(new Uint8Array(await response.arrayBuffer()),part);fromCache=true;}}catch{try{await cache.delete(part.url);}catch{}}}
   if(!bytes){let lastError;for(let attempt=0;attempt<maxAttempts;attempt++){try{bytes=await download(part);break;}catch(e){lastError=e;if(attempt+1<maxAttempts)await new Promise(r=>setTimeout(r,delayMs*(attempt+1)));}}if(!bytes)throw lastError;}
   memory.set(part.url,bytes);completedBytes+=bytes.length;if(fromCache)cachedBytes+=bytes.length;
   if(cache&&!fromCache){try{await cache.put(part.url,new Response(bytes,{headers:{'Content-Type':'application/octet-stream'}}));}catch{}}
   progress(true);return bytes;
  }finally{release();}
 }
 async function table(info,index){
  if(complete.has(index))return complete.get(index);
  const parts=await Promise.allSettled(info.parts.map(piece)),failed=parts.find(p=>p.status==='rejected');if(failed)throw failed.reason;
  const stream=new Blob(parts.map(p=>p.value)).stream().pipeThrough(new DecompressionStream('gzip'));
  const bytes=new Uint8Array(await new Response(stream).arrayBuffer());
  await verify(bytes,{bytes:info.bytes,sha256:info.sha256});complete.set(index,bytes);loaded++;progress(true);return bytes;
 }
 async function load(){
  if(typeof DecompressionStream==='undefined')throw Error('当前浏览器不支持加速数据解压');
  progress(true);
  const results=await Promise.allSettled(manifest.map(table)),failed=results.find(r=>r.status==='rejected');
  if(failed)throw failed.reason;
  return results.map(r=>r.value);
 }
 return {load,setConcurrency};
}
root.createDataLoader=createDataLoader;
})(globalThis);

let solver=null,tables=null,pending=null,running=false,initialized=false,loading=false,loadConfig=null,dataLoader=null,downloadConcurrency=6;
async function unpack(compressed){
 if(typeof DecompressionStream==='undefined')throw Error('当前浏览器不支持加速数据解压');
 const raw=atob(compressed),bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
 const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
 const result=new Uint8Array(await new Response(stream).arrayBuffer());
 if(result.length!==5765760)throw Error('加速数据不完整');
 return result;
}
async function loadExternal(url){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),60000);
 try{const response=await fetch(url,{signal:controller.signal});if(!response.ok)throw Error(`HTTP ${response.status}`);return await unpack((await response.text()).trim());}
 catch(e){if(e.name==='AbortError')throw Error('网络请求超时');throw e;}
 finally{clearTimeout(timer);}
}
async function loadTables(){
 if(loading||tables||!loadConfig)return;
 loading=true;let loaded=0;
 try{
  if(loadConfig.manifest){
   dataLoader??=createDataLoader(loadConfig.manifest,progress=>postMessage({type:'loading',...progress}),{concurrency:downloadConcurrency});
   tables=await dataLoader.load();postMessage({type:'ready',mode:'accelerated'});return;
  }
  postMessage({type:'loading',loaded,total:3});
  const entries=loadConfig.databaseUrls||loadConfig.database;
  if(!Array.isArray(entries)||entries.length!==3)throw Error('加速数据配置无效');
  // Publish only a complete set. A search retains the heuristic it started with.
  const settled=await Promise.allSettled(entries.map(async item=>{const table=loadConfig.databaseUrls?await loadExternal(item):await unpack(item);postMessage({type:'loading',loaded:++loaded,total:3});return table;}));
  const failed=settled.find(result=>result.status==='rejected');
  if(failed)throw failed.reason;
  tables=settled.map(result=>result.value);postMessage({type:'ready',mode:'accelerated'});
 }catch(e){postMessage({type:'load-error',message:String(e.message||e)});}
 finally{loading=false;}
}
async function pump(){
 if(running||!initialized)return;
 running=true;
 try{while(pending){const task=pending;pending=null;solver=new KnightSolver.Solver(tables);try{await solver.run(task.board,{seconds:task.seconds,memoryMB:task.memoryMB,incumbent:task.incumbent||[],onProgress:state=>postMessage({type:'progress',id:task.id,state})});}catch(e){postMessage({type:'error',id:task.id,message:e.message});}solver=null;}}
 finally{running=false;}
}
self.onmessage=({data})=>{
 if(data.type==='init'){loadConfig=data;if([3,6,12].includes(data.concurrency))downloadConcurrency=data.concurrency;initialized=true;postMessage({type:'ready',mode:'basic'});pump();loadTables();}
 else if(data.type==='download-concurrency'&&[3,6,12].includes(data.value)){downloadConcurrency=data.value;if(!tables)dataLoader?.setConcurrency(downloadConcurrency);}
 else if(data.type==='retry-data')loadTables();
 else if(data.type==='search'){pending=data;solver?.cancel();pump();}
 else if(data.type==='cancel'){pending=null;solver?.cancel();}
};
