import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Chess } from 'https://cdn.jsdelivr.net/npm/chess.js@1.0.0/+esm';

const sceneRoot=document.querySelector('#scene');
const scene=new THREE.Scene(); scene.background=new THREE.Color(0x080b19); scene.fog=new THREE.FogExp2(0x090d1d,.012);
const camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.1,300); camera.position.set(12,13,16);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'}); renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.setSize(innerWidth,innerHeight); renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.18; sceneRoot.appendChild(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement); controls.target.set(0,0,0); controls.enableDamping=true; controls.dampingFactor=.06; controls.minDistance=8; controls.maxDistance=28; controls.maxPolarAngle=Math.PI*.47;
scene.add(new THREE.HemisphereLight(0x9caedb,0x17111a,1.15));
const moonLight=new THREE.DirectionalLight(0x9bbaff,2.7); moonLight.position.set(-8,18,9); moonLight.castShadow=true; moonLight.shadow.mapSize.set(2048,2048); moonLight.shadow.camera.left=-12; moonLight.shadow.camera.right=12; moonLight.shadow.camera.top=12; moonLight.shadow.camera.bottom=-12; scene.add(moonLight);
const warm=new THREE.PointLight(0xff873c,65,18,2); warm.position.set(-5,3,-5); scene.add(warm);
const warm2=new THREE.PointLight(0xff873c,65,18,2); warm2.position.set(5,3,5); scene.add(warm2);

const mats={
 dark:new THREE.MeshStandardMaterial({color:0x171c2d,roughness:.38,metalness:.45}),
 light:new THREE.MeshStandardMaterial({color:0xb6a17c,roughness:.48,metalness:.25}),
 gold:new THREE.MeshStandardMaterial({color:0xb58b4f,metalness:.75,roughness:.25}),
 silver:new THREE.MeshStandardMaterial({color:0x9daec7,metalness:.8,roughness:.22}),
 stone:new THREE.MeshStandardMaterial({color:0x303449,roughness:.92}),
 blackSquare:new THREE.MeshStandardMaterial({color:0x20263a,roughness:.68}),
 whiteSquare:new THREE.MeshStandardMaterial({color:0x9b8b78,roughness:.72}),
 selected:new THREE.MeshBasicMaterial({color:0x66d9ff,transparent:true,opacity:.45}),
 move:new THREE.MeshBasicMaterial({color:0x78e5ad,transparent:true,opacity:.5}),
};
function mesh(geo,mat,parent=scene){const m=new THREE.Mesh(geo,mat);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
const floor=mesh(new THREE.PlaneGeometry(180,180),new THREE.MeshStandardMaterial({color:0x111626,roughness:1}),scene);floor.rotation.x=-Math.PI/2;floor.position.y=-.72;floor.receiveShadow=true;
// Raised circular platform and board frame
const platform=mesh(new THREE.CylinderGeometry(7.15,7.5,.7,8),mats.stone);platform.position.y=-.42;platform.rotation.y=Math.PI/8;
const trim=mesh(new THREE.CylinderGeometry(7.2,7.25,.12,8),mats.gold);trim.position.y=-.05;trim.rotation.y=Math.PI/8;
const boardBase=mesh(new THREE.BoxGeometry(8.25,.42,8.25),new THREE.MeshStandardMaterial({color:0x332d2c,roughness:.58,metalness:.2}));boardBase.position.y=.15;
const boardTop=mesh(new THREE.BoxGeometry(8.08,.12,8.08),mats.stone);boardTop.position.y=.4;
const squares=[],pieceMeshes=new Map(),highlightMeshes=[];
const boardGroup=new THREE.Group();scene.add(boardGroup);
for(let r=0;r<8;r++)for(let f=0;f<8;f++){const s=mesh(new THREE.BoxGeometry(.99,.12,.99),((r+f)%2===0)?mats.whiteSquare:mats.blackSquare,boardGroup);s.position.set(f-3.5,.51,r-3.5);s.userData.square=r*8+f;squares.push(s)}
// Decorative corner runes / edge rails
for(let i=0;i<4;i++){let p=mesh(new THREE.BoxGeometry(8.45,.08,.08),mats.gold);p.position.set(0,.49,i<2?-4.17:4.17);if(i>=2)p.rotation.y=Math.PI/2;}
// Distant ruins, pillars, moon and stars
const moon=mesh(new THREE.SphereGeometry(2.1,32,32),new THREE.MeshBasicMaterial({color:0xc8d6f4}));moon.position.set(-29,29,-48);
const moonGlow=new THREE.PointLight(0x9bbcff,280,90,2);moonGlow.position.copy(moon.position);scene.add(moonGlow);
function pillar(x,z,h=5){const g=new THREE.Group();g.position.set(x,-.6,z);scene.add(g);const base=mesh(new THREE.CylinderGeometry(.8,.95,.45,8),mats.stone,g);base.position.y=.22;const col=mesh(new THREE.CylinderGeometry(.48,.62,h,8),mats.stone,g);col.position.y=h/2+.4;const cap=mesh(new THREE.BoxGeometry(1.4,.45,1.4),mats.stone,g);cap.position.y=h+.65;return g}
for(const p of [[-11,-9,7],[11,-10,6],[-12,10,8],[12,10,5],[-18,0,10],[18,0,9]])pillar(...p);
function brazier(x,z){const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);const stem=mesh(new THREE.CylinderGeometry(.12,.2,1.5,8),mats.gold,g);stem.position.y=.75;const bowl=mesh(new THREE.CylinderGeometry(.42,.22,.35,8),mats.gold,g);bowl.position.y=1.55;const flame=mesh(new THREE.IcosahedronGeometry(.27,1),new THREE.MeshBasicMaterial({color:0xff8b36}),g);flame.position.y=1.95;const l=new THREE.PointLight(0xff8438,45,9,2);l.position.y=2;g.add(l);return {flame,l}}
const fires=[brazier(-5.2,-5.2),brazier(5.2,-5.2),brazier(-5.2,5.2),brazier(5.2,5.2)];
// Atmospheric stars
const starGeo=new THREE.BufferGeometry(), starPos=[];for(let i=0;i<1200;i++){const rad=45+Math.random()*90,a=Math.random()*Math.PI*2,y=8+Math.random()*65;starPos.push(Math.cos(a)*rad,y,Math.sin(a)*rad)}starGeo.setAttribute('position',new THREE.Float32BufferAttribute(starPos,3));const stars=new THREE.Points(starGeo,new THREE.PointsMaterial({color:0xaab9e0,size:.17,transparent:true,opacity:.8}));scene.add(stars);
// Rain particles
const rainCount=1500,rainPositions=new Float32Array(rainCount*3),rainVel=[];for(let i=0;i<rainCount;i++){rainPositions[i*3]=(Math.random()-.5)*42;rainPositions[i*3+1]=Math.random()*24;rainPositions[i*3+2]=(Math.random()-.5)*42;rainVel.push(.16+Math.random()*.22)}const rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.BufferAttribute(rainPositions,3));const rain=new THREE.Points(rainGeo,new THREE.PointsMaterial({color:0x9db8e8,size:.045,transparent:true,opacity:.42}));scene.add(rain);let storm=true;rain.visible=storm;

// Chess pieces built from procedural geometry
const pieceDefs={p:'pawn',n:'knight',b:'bishop',r:'rook',q:'queen',k:'king'};
function lathe(points,material,parent){const geo=new THREE.LatheGeometry(points.map(p=>new THREE.Vector2(p[0],p[1])),16);return mesh(geo,material,parent)}
function makePiece(type,color){const g=new THREE.Group();const mat=color==='w'?mats.light:mats.dark,accent=color==='w'?mats.gold:mats.silver;
 lathe([[.0,0],[.34,.04],[.38,.13],[.29,.22],[.22,.3],[.2,.42],[.27,.49],[.2,.57]],mat,g);
 const stem=mesh(new THREE.CylinderGeometry(.17,.22,.2,16),accent,g);stem.position.y=.55;
 if(type==='p'){mesh(new THREE.SphereGeometry(.22,16,12),mat,g).position.y=.82;}
 if(type==='r'){lathe([[.19,.62],[.25,.7],[.25,.9],[.32,.9],[.32,1.04],[.0,1.04]],mat,g);for(let i=0;i<4;i++){const b=mesh(new THREE.BoxGeometry(.12,.18,.16),accent,g);const a=i*Math.PI/2;b.position.set(Math.sin(a)*.24,1.08,Math.cos(a)*.24)}}
 if(type==='n'){const neck=mesh(new THREE.CapsuleGeometry(.19,.47,5,8),mat,g);neck.position.set(0,.93,0);neck.rotation.z=-.32;const head=mesh(new THREE.SphereGeometry(.22,14,12),mat,g);head.position.set(.11,1.28,0);const ear=mesh(new THREE.ConeGeometry(.09,.22,6),accent,g);ear.position.set(.18,1.48,0);ear.rotation.z=-.3;}
 if(type==='b'){lathe([[.18,.62],[.2,.72],[.12,.86],[.18,1.0],[.1,1.15],[0,1.3]],mat,g);const orb=mesh(new THREE.SphereGeometry(.1,12,12),accent,g);orb.position.y=1.27;}
 if(type==='q'){lathe([[.18,.62],[.23,.75],[.15,.88],[.25,1.0],[.1,1.12],[.0,1.17]],mat,g);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;const orb=mesh(new THREE.SphereGeometry(.1,10,8),accent,g);orb.position.set(Math.cos(a)*.23,1.19,Math.sin(a)*.23)}}
 if(type==='k'){lathe([[.18,.62],[.24,.76],[.15,.9],[.22,1.08],[.11,1.22],[0,1.28]],mat,g);const v=mesh(new THREE.BoxGeometry(.09,.48,.09),accent,g);v.position.y=1.43;const h=mesh(new THREE.BoxGeometry(.32,.09,.09),accent,g);h.position.y=1.47;}
 g.userData.baseY=.57;return g;
}
const chess=new Chess();let selected=null,legal=[],thinking=false,mode='ai',difficulty=2,moveHistory=[],soundOn=true,audioCtx=null;
function sqToWorld(sq){const f=sq.charCodeAt(0)-97,r=Number(sq[1])-1;return new THREE.Vector3(f-3.5,.57,7-r-3.5)}
function squareName(i){return String.fromCharCode(97+i%8)+(Math.floor(i/8)+1)}
function syncPieces(){for(const [sq,g] of pieceMeshes){scene.remove(g);pieceMeshes.delete(sq)}const board=chess.board();for(let row=0;row<8;row++)for(let col=0;col<8;col++){const p=board[row][col];if(!p)continue;const sq=String.fromCharCode(97+col)+(8-row),g=makePiece(p.type,p.color);const pos=sqToWorld(sq);g.position.set(pos.x,.57,pos.z);g.userData.square=sq;scene.add(g);pieceMeshes.set(sq,g)}}
syncPieces();
function clearHighlights(){for(const h of highlightMeshes){boardGroup.remove(h);h.geometry.dispose()}highlightMeshes.length=0}
function addHighlight(sq,mat,ring=false){const pos=sqToWorld(sq);const h=mesh(ring?new THREE.RingGeometry(.22,.34,24):new THREE.PlaneGeometry(.82,.82),mat,boardGroup);h.rotation.x=ring? -Math.PI/2:-Math.PI/2;h.position.set(pos.x,.585,pos.z);highlightMeshes.push(h)}
function showSelection(sq){clearHighlights();selected=sq;addHighlight(sq,mats.selected);legal=chess.moves({square:sq,verbose:true});for(const m of legal)addHighlight(m.to,mats.move,true)}
function sound(freq=360,duration=.11,type='sine'){if(!soundOn)return;try{audioCtx??=new (window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),gain=audioCtx.createGain();o.type=type;o.frequency.value=freq;gain.gain.setValueAtTime(.0001,audioCtx.currentTime);gain.gain.exponentialRampToValueAtTime(.08,audioCtx.currentTime+.015);gain.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+duration);o.connect(gain);gain.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+duration)}catch{}}
function updateStatus(){const status=document.querySelector('#status'),sub=document.querySelector('#substatus'),turn=document.querySelector('#turnIndicator');const who=chess.turn()==='w'?'White':'Black';turn.innerHTML=`<span class="turn-icon">${chess.turn()==='w'?'♔':'♚'}</span><span>${who.toUpperCase()}'S TURN</span>`;if(chess.isCheckmate()){status.textContent='Checkmate';sub.textContent=`${who==='White'?'Black':'White'} claims the kingdom.`}else if(chess.isDraw()){status.textContent='The battle is drawn';sub.textContent='Neither kingdom prevails.'}else if(chess.isCheck()){status.textContent=`${who} is in check`;sub.textContent='The king is under threat.'}else{status.textContent=`${who} to move`;sub.textContent=mode==='ai'?(chess.turn()==='w'?'The Warden awaits.':'The Warden is thinking…'):'Choose your next move.'}
 const hist=chess.history({verbose:true});const wc=[],bc=[];for(const m of hist)if(m.captured){(m.color==='w'?wc:bc).push(m.captured.toUpperCase())}document.querySelector('#whiteCaptured').textContent=wc.length?wc.join('  '):'—';document.querySelector('#blackCaptured').textContent=bc.length?bc.join('  '):'—';}
function commitMove(from,to){let move;try{move=chess.move({from,to,promotion:'q'})}catch{return false}if(!move)return false;selected=null;legal=[];clearHighlights();syncPieces();sound(move.captured?190:move.san.includes('+')?520:320,.12,move.captured?'triangle':'sine');updateStatus();if(chess.isGameOver())return true;if(mode==='ai'&&chess.turn()==='b')setTimeout(aiMove,450);return true}
function onBoardClick(event){if(thinking||chess.isGameOver())return;const rect=renderer.domElement.getBoundingClientRect();mouse.x=((event.clientX-rect.left)/rect.width)*2-1;mouse.y=-((event.clientY-rect.top)/rect.height)*2+1;raycaster.setFromCamera(mouse,camera);const hits=raycaster.intersectObjects([...squares,...pieceMeshes.values()],true);if(!hits.length)return;let obj=hits[0].object;while(obj&&!obj.userData.square)obj=obj.parent;if(!obj)return;const sq=typeof obj.userData.square==='number'?String.fromCharCode(97+(obj.userData.square%8))+(8-Math.floor(obj.userData.square/8)):obj.userData.square;
 const piece=chess.get(sq);if(selected){if(legal.some(m=>m.to===sq)){commitMove(selected,sq);return}if(piece&&piece.color===chess.turn()){showSelection(sq);sound(250,.05)}else{clearHighlights();selected=null;legal=[]}}else if(piece&&piece.color===chess.turn()&&(mode==='local'||chess.turn()==='w')){showSelection(sq);sound(250,.05)}}
const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2();renderer.domElement.addEventListener('pointerdown',onBoardClick);
function evaluate(game){const val={p:100,n:320,b:335,r:500,q:900,k:20000};let score=0;const b=game.board();for(let r=0;r<8;r++)for(let f=0;f<8;f++){const p=b[r][f];if(!p)continue;let v=val[p.type];if(p.type==='p')v+=p.color==='w'?(6-r)*5:r*5;const center=3.5-(Math.abs(3.5-f)+Math.abs(3.5-r))*.9;v+=center*3;score+=(p.color==='b'?v:-v)}return score}
function minimax(game,depth,alpha,beta,maximizing){if(depth===0||game.isGameOver())return evaluate(game);const moves=game.moves();if(maximizing){let best=-Infinity;for(const m of moves){game.move(m);best=Math.max(best,minimax(game,depth-1,alpha,beta,false));game.undo();alpha=Math.max(alpha,best);if(beta<=alpha)break}return best}else{let best=Infinity;for(const m of moves){game.move(m);best=Math.min(best,minimax(game,depth-1,alpha,beta,true));game.undo();beta=Math.min(beta,best);if(beta<=alpha)break}return best}}
function aiMove(){if(mode!=='ai'||chess.turn()!=='b'||chess.isGameOver())return;thinking=true;updateStatus();setTimeout(()=>{const depth=difficulty===1?1:difficulty===2?2:3;const moves=chess.moves();let best=-Infinity,choices=[];for(const m of moves){chess.move(m);const score=minimax(chess,depth-1,-Infinity,Infinity,false);chess.undo();if(score>best){best=score;choices=[m]}else if(score===best)choices.push(m)}const pick=choices[Math.floor(Math.random()*choices.length)];if(pick)chess.move(pick);thinking=false;selected=null;clearHighlights();syncPieces();sound(300,.13);updateStatus()},100)}
function newGame(){chess.reset();selected=null;legal=[];thinking=false;clearHighlights();syncPieces();updateStatus();if(mode==='ai'&&Math.random()<0){/* reserved */}}
document.querySelector('#newGame').onclick=newGame;
document.querySelector('#undo').onclick=()=>{if(chess.history().length){chess.undo();if(mode==='ai'&&chess.turn()==='b')chess.undo();clearHighlights();selected=null;syncPieces();updateStatus();sound(230,.1)}};
document.querySelector('#mode').onchange=e=>{mode=e.target.value;document.querySelector('#difficulty').disabled=mode==='local';newGame()};
document.querySelector('#difficulty').onchange=e=>difficulty=Number(e.target.value);
document.querySelector('#soundBtn').onclick=()=>{soundOn=!soundOn;document.querySelector('#soundBtn').style.opacity=soundOn?1:.45;if(soundOn)sound(440)};
document.querySelector('#weatherBtn').onclick=()=>{storm=!storm;rain.visible=storm;document.querySelector('#weatherBtn').style.opacity=storm?1:.45};
function resetCamera(){camera.position.set(12,13,16);controls.target.set(0,0,0);controls.update()}
document.querySelector('#cameraBtn').onclick=resetCamera;window.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='v')resetCamera();if(e.key==='Escape')document.querySelector('#helpModal').classList.add('hidden')});
document.querySelector('#helpBtn').onclick=()=>document.querySelector('#helpModal').classList.remove('hidden');document.querySelector('#closeHelp').onclick=()=>document.querySelector('#helpModal').classList.add('hidden');
document.querySelector('#begin').onclick=()=>{document.querySelector('#overlay').classList.add('gone');sound(520,.3,'sine')};
updateStatus();
const clock=new THREE.Clock();
function animate(){requestAnimationFrame(animate);const t=clock.getElapsedTime();controls.update();fires.forEach((f,i)=>{f.flame.scale.set(.8+Math.sin(t*9+i)*.18,1+Math.sin(t*13+i)*.25,.8+Math.cos(t*11+i)*.15);f.l.intensity=38+Math.sin(t*8+i)*8});if(storm){const p=rain.geometry.attributes.position;for(let i=0;i<rainCount;i++){p.array[i*3+1]-=rainVel[i];p.array[i*3]-=.025;if(p.array[i*3+1]<0){p.array[i*3+1]=22+Math.random()*3;p.array[i*3+2]=(Math.random()-.5)*42;p.array[i*3]=(Math.random()-.5)*42}}p.needsUpdate=true}renderer.render(scene,camera)}
animate();
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,2))});
