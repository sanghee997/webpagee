// 🔊 Sound System
const bgm = document.getElementById('bgm');
const sfxClick = document.getElementById('sfxClick');
const sfxLock = document.getElementById('sfxLock');
const sfxEnding = document.getElementById('sfxEnding');

function playSound(audio, volume = 1) {
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
  audio.volume = volume;
  audio.play().catch(() => {});
}
// ✅ 마우스 클릭 소리 (전역)
document.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  playSound(sfxClick, 0.35);
}, true);

// =====================
// 기본 Three.js 설정
// =====================
const canvas = document.getElementById('gameCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);
scene.fog = new THREE.Fog(0xf0f0f0, 15, 40);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.6, 5);

scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dirLight = new THREE.DirectionalLight(0xfff5e0, 0.8);
dirLight.position.set(5, 10, 5);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
scene.add(dirLight);
[-3, 3].forEach(x => {
    const l = new THREE.PointLight(0xfff8f0, 0.6, 12);
    l.position.set(x, 3.1, 0);
    scene.add(l);
});

const W = 20, H = 4, D = 20;

const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshLambertMaterial({ color: 0xd8d8d8 }));
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
const grid = new THREE.GridHelper(W, 20, 0xbbbbbb, 0xbbbbbb);
grid.position.y = 0.01; scene.add(grid);
const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshLambertMaterial({ color: 0xf5f5f5 }));
ceiling.rotation.x = Math.PI / 2; ceiling.position.y = H; scene.add(ceiling);
const wallMat = new THREE.MeshLambertMaterial({ color: 0xe8e8e8 });
// 3면 벽 (오른쪽 제외)
[[0,H/2,-D/2,0],[0,H/2,D/2,Math.PI],[-W/2,H/2,0,Math.PI/2]].forEach(([x,y,z,ry])=>{
    const w = new THREE.Mesh(new THREE.PlaneGeometry(W,H), wallMat);
    w.position.set(x,y,z); w.rotation.y=ry; scene.add(w);
});

// =====================
// 오른쪽 벽 = 통유리창 + 21층 도시 뷰
// =====================
(function buildGlassWall() {
    // 하늘 그라디언트 배경 (캔버스 텍스처)
    function makeSkyCanvas() {
        const c = document.createElement('canvas');
        c.width = 1024; c.height = 512;
        const ctx = c.getContext('2d');
        // 하늘 그라디언트
        const grad = ctx.createLinearGradient(0,0,0,c.height);
        grad.addColorStop(0, '#87ceeb');
        grad.addColorStop(0.45, '#b0d8f0');
        grad.addColorStop(0.7, '#d4eaf7');
        grad.addColorStop(1, '#e8f4fb');
        ctx.fillStyle = grad; ctx.fillRect(0,0,c.width,c.height);

        // 구름 몇 개
        function drawCloud(x,y,r,alpha) {
            ctx.save(); ctx.globalAlpha=alpha;
            ctx.fillStyle='#ffffff';
            for(let dx=-1;dx<=1;dx++) {
                ctx.beginPath(); ctx.arc(x+dx*r*0.6, y, r*(0.7-Math.abs(dx)*0.15), 0, Math.PI*2); ctx.fill();
            }
            ctx.restore();
        }
        drawCloud(150,80,38,0.88); drawCloud(380,55,28,0.75); drawCloud(620,90,42,0.82);
        drawCloud(820,60,32,0.7); drawCloud(920,110,22,0.65);

        // 지평선 위 도시 스카이라인 (원거리 빌딩)
        const groundY = c.height * 0.72;
        // 배경 빌딩 (흐릿한 회색, 멀리)
        ctx.globalAlpha = 0.22;
        const farBuildings = [
            [0,50],[60,80],[110,55],[170,90],[230,65],[290,75],[350,60],[410,85],[470,50],[530,70],[590,80],[650,55],[710,90],[770,65],[830,75],[890,60],[950,80],[1000,55]
        ];
        farBuildings.forEach(([bx,bh])=>{
            ctx.fillStyle='#5a7a9a';
            ctx.fillRect(bx, groundY-bh, 40, bh);
        });

        // 중간 거리 빌딩
        ctx.globalAlpha = 0.42;
        const midBuildings = [
            [20,110,32],[80,85,28],[140,130,36],[200,95,30],[260,115,34],[320,80,26],[380,125,38],[440,100,30],[500,90,28],[560,120,35],[620,105,32],[680,85,28],[740,130,36],[800,95,30],[860,115,34],[920,80,26],[980,125,38]
        ];
        midBuildings.forEach(([bx,bh,bw])=>{
            // 빌딩 색
            const hue = 200+Math.floor(bx/100)*5;
            ctx.fillStyle=`hsl(${hue},20%,55%)`;
            ctx.fillRect(bx, groundY-bh, bw, bh);
            // 창문 느낌
            ctx.fillStyle='rgba(220,235,255,0.35)';
            for(let r=0;r<Math.floor(bh/14);r++) for(let col=0;col<2;col++) {
                ctx.fillRect(bx+4+col*(bw/2-2), groundY-bh+6+r*14, bw/2-6, 8);
            }
        });

        // 가까운 거리 빌딩 (더 선명)
        ctx.globalAlpha = 0.7;
        const nearBuildings = [
            [0,155,45],[55,120,38],[105,170,50],[165,140,42],[220,160,48],[280,130,40],[340,175,52],[400,145,44],[460,135,40],[520,165,50],[580,150,46],[640,125,38],[700,170,52],[760,140,44],[820,160,48],[880,130,40],[940,175,52],[995,145,30]
        ];
        nearBuildings.forEach(([bx,bh,bw])=>{
            ctx.fillStyle=`hsl(210,18%,42%)`;
            ctx.fillRect(bx, groundY-bh, bw, bh);
            ctx.fillStyle='rgba(180,220,255,0.3)';
            for(let r=0;r<Math.floor(bh/16);r++) for(let col=0;col<Math.floor(bw/16);col++) {
                if(Math.random()>0.3) ctx.fillRect(bx+3+col*15, groundY-bh+5+r*16, 10, 10);
            }
        });

        // 지면/도로 (아주 흐릿하게)
        ctx.globalAlpha = 0.5;
        const roadGrad = ctx.createLinearGradient(0, groundY, 0, c.height);
        roadGrad.addColorStop(0,'#8a9ba8'); roadGrad.addColorStop(1,'#5a6a78');
        ctx.fillStyle=roadGrad; ctx.fillRect(0, groundY, c.width, c.height-groundY);

        ctx.globalAlpha = 1.0;
        return c;
    }

    // 통유리창 전체 배경
    const skyTex = new THREE.CanvasTexture(makeSkyCanvas());
    const glassBg = new THREE.Mesh(
        new THREE.PlaneGeometry(W, H),
        new THREE.MeshBasicMaterial({ map: skyTex })
    );
    glassBg.position.set(W/2-0.05, H/2, 0);
    glassBg.rotation.y = -Math.PI/2;
    scene.add(glassBg);

    // 유리 틴팅 (반투명 파란빛)
    const glassTint = new THREE.Mesh(
        new THREE.PlaneGeometry(W, H),
        new THREE.MeshBasicMaterial({ color: 0x88ccee, transparent: true, opacity: 0.12 })
    );
    glassTint.position.set(W/2-0.03, H/2, 0);
    glassTint.rotation.y = -Math.PI/2;
    scene.add(glassTint);

    // 창틀 격자 (가로 1개 + 세로 4개)
    const frameMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    // 가로 중간 프레임
    const hFrame = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, W), frameMat);
    hFrame.position.set(W/2-0.06, H*0.45, 0); scene.add(hFrame);
    // 세로 프레임 5개
    [-8,-4,0,4,8].forEach(z => {
        const vFrame = new THREE.Mesh(new THREE.BoxGeometry(0.06, H, 0.08), frameMat);
        vFrame.position.set(W/2-0.06, H/2, z); scene.add(vFrame);
    });
    // 창틀 테두리 (위/아래)
    [0, H].forEach(y => {
        const border = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, W+0.2), frameMat);
        border.position.set(W/2-0.06, y, 0); scene.add(border);
    });
})();
[-3,3].forEach(x=>{
    const fix = new THREE.Mesh(new THREE.BoxGeometry(1.2,0.05,0.25), new THREE.MeshBasicMaterial({color:0xfffde8}));
    fix.position.set(x,H-0.02,0); scene.add(fix);
});

// =====================
// 책상
// =====================
function makeDesk(x, z, ry=0, isPlayer=false) {
    const g = new THREE.Group();
    const top = new THREE.Mesh(new THREE.BoxGeometry(2.2,0.06,1.1), new THREE.MeshLambertMaterial({color:0xd4c5a9}));
    top.position.y=0.75; top.castShadow=true; top.receiveShadow=true; g.add(top);
    [-1,1].forEach(lx=>{
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05,0.75,0.05), new THREE.MeshLambertMaterial({color:0x888888}));
        leg.position.set(lx*1.05,0.375,0); g.add(leg);
    });
    const stand = new THREE.Mesh(new THREE.BoxGeometry(0.06,0.28,0.06), new THREE.MeshLambertMaterial({color:0x111111}));
    stand.position.set(0,0.92,-0.25); g.add(stand);
    const mon = new THREE.Mesh(new THREE.BoxGeometry(1.2,0.72,0.05), new THREE.MeshLambertMaterial({color:0x111111}));
    mon.position.set(0,1.38,-0.38); mon.name=isPlayer?'my_monitor':'monitor'; g.add(mon);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.1,0.64), new THREE.MeshBasicMaterial({color:0x1e3a5f}));
    scr.position.set(0,1.38,-0.35); scr.name=isPlayer?'my_monitor':'monitor'; g.add(scr);
    const kb = new THREE.Mesh(new THREE.BoxGeometry(0.7,0.02,0.25), new THREE.MeshLambertMaterial({color:0xdddddd}));
    kb.position.set(0,0.78,0.1); g.add(kb);
    if(isPlayer) {
        const papers = new THREE.Mesh(new THREE.BoxGeometry(0.4,0.03,0.3), new THREE.MeshLambertMaterial({color:0xff4444}));
        papers.position.set(0.7,0.79,0.15); papers.name='papers'; g.add(papers);
        const note = new THREE.Mesh(new THREE.BoxGeometry(0.2,0.01,0.2), new THREE.MeshLambertMaterial({color:0xffeb3b}));
        note.position.set(-0.7,0.79,0.15); note.name='note'; g.add(note);
    }
    g.position.set(x,0,z); g.rotation.y=ry; scene.add(g);
    return g;
}

function makeChair(x, z, ry=0, isPlayer=false) {
    const g = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({color:0x222222});
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.6,0.07,0.6), mat);
    seat.position.y=0.48; seat.name=isPlayer?'my_chair':'chair'; g.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.6,0.7,0.06), mat);
    back.position.set(0,0.87,-0.27); back.name=isPlayer?'my_chair':'chair'; g.add(back);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.45,8), new THREE.MeshLambertMaterial({color:0x555555}));
    pole.position.y=0.22; g.add(pole);
    g.position.set(x,0,z); g.rotation.y=ry; scene.add(g);
    return g;
}

// 내 자리 (방향 수정)
makeDesk(0, -3, 0, true);
makeChair(0, -1.5, Math.PI, true);

// 동료 자리
makeDesk(-4, -3); makeDesk(4, -3);
makeDesk(-4, 2, Math.PI); makeDesk(4, 2, Math.PI);
makeChair(-4, -1.5, Math.PI); makeChair(4, -1.5, Math.PI);
makeChair(-4, 3.5, Math.PI); makeChair(4, 3.5, Math.PI);



// =====================
// 사무실 디테일 + 출출박스
// =====================
function makeBox(w, h, d, color, x, y, z, name='') {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if(name) mesh.name = name;
    scene.add(mesh);
    return mesh;
}

function makePlaneLabel(text, x, y, z, w=1.8, h=.5, bg='#ffffff', fg='#111111', ry=0, name='') {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 180;
    const ctx = c.getContext('2d');
    ctx.fillStyle = bg; ctx.fillRect(0,0,c.width,c.height);
    ctx.strokeStyle = '#222'; ctx.lineWidth = 8; ctx.strokeRect(0,0,c.width,c.height);
    ctx.fillStyle = fg; ctx.font = 'bold 44px Malgun Gothic, Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const lines = text.split('\n');
    lines.forEach((line,i)=>ctx.fillText(line, c.width/2, c.height/2 + (i-(lines.length-1)/2)*54));
    const tex = new THREE.CanvasTexture(c);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w,h), mat);
    mesh.position.set(x,y,z); mesh.rotation.y = ry;
    if(name) mesh.name = name;
    scene.add(mesh);
    return mesh;
}


function makeFloatingNameLabel(text, parent, y=1.72, z=0.02) {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 128;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.roundRect(36, 22, 440, 76, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(232,201,109,0.9)';
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 38px Malgun Gothic, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, c.width / 2, 60);
    const tex = new THREE.CanvasTexture(c);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.55, .38), mat);
    mesh.position.set(0, y, z);
    mesh.name = 'npc';
    parent.add(mesh);
    return mesh;
}

function addDeskDecor(x,z,ry=0) {
    const g = new THREE.Group();
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,.14,16), new THREE.MeshLambertMaterial({color:0xffffff}));
    mug.position.set(.65,.86,.18); g.add(mug);
    const file = new THREE.Mesh(new THREE.BoxGeometry(.42,.08,.3), new THREE.MeshLambertMaterial({color:0xf4d35e}));
    file.position.set(-.55,.84,.14); g.add(file);
    const plantStem = new THREE.Mesh(new THREE.CylinderGeometry(.015,.015,.22,8), new THREE.MeshLambertMaterial({color:0x2e7d32}));
    plantStem.position.set(.88,.95,-.05); g.add(plantStem);
    const plantLeaf = new THREE.Mesh(new THREE.SphereGeometry(.12,8,8), new THREE.MeshLambertMaterial({color:0x43a047}));
    plantLeaf.scale.set(1.2,.7,1.2); plantLeaf.position.set(.88,1.1,-.05); g.add(plantLeaf);
    g.position.set(x,0,z); g.rotation.y=ry; scene.add(g);
}

function makeOfficeCabinet(x,z) {
    const cab = makeBox(1.8,1.65,.42,0xb7b7b7,x,.82,z);
    for(let i=0;i<4;i++) makeBox(.34,.28,.06,[0x263238,0x455a64,0x607d8b,0x37474f][i],x-.62+i*.42,1.25,z-.24);
    makeBox(1.7,.04,.48,0x888888,x,1.62,z);
}

function makeTrashAndPrinter() {
    const trash = new THREE.Mesh(new THREE.CylinderGeometry(.28,.22,.55,18), new THREE.MeshLambertMaterial({color:0x9e9e9e}));
    trash.position.set(-8.7,.28,-6.5); trash.castShadow=true; scene.add(trash);
    makeBox(.9,.36,.7,0x333333,-8.2,.92,-8.9);
    makeBox(.75,.08,.55,0xffffff,-8.2,1.15,-8.9);
}

function makeSnackBox() {
    const group = new THREE.Group();
    const shellMat = new THREE.MeshLambertMaterial({color:0x151515});
    const greenMat = new THREE.MeshBasicMaterial({color:0x8cc63f});
    const glassMat = new THREE.MeshBasicMaterial({color:0xbfeeff, transparent:true, opacity:.18});

    // 전체 간판/프레임
    const back = new THREE.Mesh(new THREE.BoxGeometry(5.25,2.85,.22), shellMat);
    back.position.y=1.42; back.position.z=0.02; group.add(back);
    const topBand = new THREE.Mesh(new THREE.BoxGeometry(5.45,.18,.42), greenMat);
    topBand.position.set(0,2.86,.16); group.add(topBand);

    const signCanvas = document.createElement('canvas');
    signCanvas.width = 700; signCanvas.height = 170;
    const signCtx = signCanvas.getContext('2d');
    signCtx.fillStyle = '#111'; signCtx.fillRect(0,0,700,170);
    signCtx.fillStyle = '#ffffff'; signCtx.font = 'bold 64px Malgun Gothic, Arial';
    signCtx.textAlign = 'center'; signCtx.textBaseline = 'middle';
    signCtx.fillText('출출박스', 330, 72);
    signCtx.fillStyle = '#9bd44d'; signCtx.font = 'bold 28px Malgun Gothic, Arial';
    signCtx.fillText('우리 회사 간식 충전소 · 전 메뉴 2,000원 미만', 350, 126);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.65,.88), new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(signCanvas)}));
    sign.position.set(0,3.17,.27); sign.name='snack_machine'; group.add(sign);

    const foodSets = [
        [['🍙','삼각김밥'],['🥪','샌드위치'],['🍔','햄버거'],['🥤','음료']],
        [['🥚','삶은달걀'],['🍌','바나나'],['🍎','사과'],['🧃','주스']],
        [['🍙','김밥'],['🥪','샌드'],['🥛','우유'],['🍪','간식']]
    ];

    function makeMachineFront(idx) {
        const c = document.createElement('canvas');
        c.width = 360; c.height = 560;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#121212'; ctx.fillRect(0,0,360,560);
        ctx.fillStyle = '#232323'; ctx.fillRect(14,18,332,524);
        ctx.fillStyle = '#8cc63f'; ctx.fillRect(14,18,332,20);
        ctx.fillStyle = '#dff6ff'; ctx.globalAlpha = .88; ctx.fillRect(34,58,238,382); ctx.globalAlpha = 1;
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.strokeRect(34,58,238,382);
        ctx.fillStyle = '#262626'; ctx.fillRect(286,90,44,235);
        ctx.fillStyle = '#c9ff67'; ctx.fillRect(294,108,28,44);
        ctx.fillStyle = '#111'; ctx.font = 'bold 15px Arial'; ctx.textAlign='center'; ctx.fillText('PAY',308,136);
        ctx.fillStyle = '#050505'; ctx.fillRect(76,472,190,38);
        ctx.strokeStyle = '#555'; ctx.strokeRect(76,472,190,38);

        const foods = foodSets[idx];
        for(let r=0;r<4;r++) {
            const y = 96 + r*82;
            ctx.fillStyle = '#f6f6f6'; ctx.fillRect(44,y+50,218,6);
            for(let col=0; col<3; col++) {
                const f = foods[(r+col)%foods.length];
                const x = 76 + col*68;
                ctx.font = '34px serif'; ctx.fillText(f[0], x, y+30);
                ctx.fillStyle = ['#ffe082','#c8e6c9','#ffcdd2','#bbdefb'][col];
                ctx.fillRect(x-29,y+36,58,18);
                ctx.fillStyle = '#333'; ctx.font = 'bold 10px Malgun Gothic, Arial'; ctx.fillText(f[1], x, y+49);
            }
        }
        return new THREE.CanvasTexture(c);
    }

    [-1.65,0,1.65].forEach((x,idx)=>{
        const body = new THREE.Mesh(new THREE.BoxGeometry(1.45,2.42,.42), shellMat);
        body.position.set(x,1.28,.02); group.add(body);
        const front = new THREE.Mesh(new THREE.PlaneGeometry(1.25,2.08), new THREE.MeshBasicMaterial({map:makeMachineFront(idx)}));
        front.position.set(x,1.35,.245); front.name='snack_machine'; group.add(front);
        const glass = new THREE.Mesh(new THREE.PlaneGeometry(.86,1.48), glassMat);
        glass.position.set(x-.13,1.58,.252); glass.name='snack_machine'; group.add(glass);
        const trayHit = new THREE.Mesh(new THREE.BoxGeometry(1.05,.28,.08), new THREE.MeshLambertMaterial({color:0x050505}));
        trayHit.position.set(x,.33,.27); trayHit.name='snack_machine'; group.add(trayHit);
    });

    group.position.set(-6.6,0,-8.65);
    group.rotation.y = 0;
    group.traverse(o=>{ if(o.isMesh){ o.castShadow=true; o.receiveShadow=true; if(!o.name && o.parent===group) o.name='snack_machine'; }});
    scene.add(group);
    makePlaneLabel('우리 회사 간식 충전소!', -3.7, 2.7, -8.83, 1.65, .32, '#111111', '#9bd44d', 0);
}

function makeCopyMachine(x, z) {
    const g = new THREE.Group();
    const bodyMat = new THREE.MeshLambertMaterial({color:0xf2f2f2});
    const darkMat = new THREE.MeshLambertMaterial({color:0x333333});
    const trayMat = new THREE.MeshLambertMaterial({color:0xcfd8dc});
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.05, .72, .72), bodyMat); base.position.y=.36; g.add(base);
    for(let i=0;i<3;i++){ const drawer = new THREE.Mesh(new THREE.BoxGeometry(.92,.03,.06), darkMat); drawer.position.set(0,.18+i*.18,.39); g.add(drawer); }
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.18,.18,.84), bodyMat); top.position.set(0,.82,0); g.add(top);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(1.0,.08,.72), darkMat); lid.position.set(0,.98,-.03); lid.rotation.x=-0.12; g.add(lid);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(.42,.05,.22), darkMat); panel.position.set(-.38,.93,.42); panel.rotation.x=.2; g.add(panel);
    const paper = new THREE.Mesh(new THREE.BoxGeometry(.52,.025,.36), new THREE.MeshLambertMaterial({color:0xffffff})); paper.position.set(.18,.96,.48); g.add(paper);
    const sideTray = new THREE.Mesh(new THREE.BoxGeometry(.7,.04,.36), trayMat); sideTray.position.set(.78,.72,.05); sideTray.rotation.z=-0.12; g.add(sideTray);
    g.position.set(x,0,z); g.rotation.y=-Math.PI/2; g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}}); scene.add(g); return g;
}

function makeOfficeDetails() {
    makeSnackBox();
    makeOfficeCabinet(7.8,-7.8);
    makeOfficeCabinet(7.8,-6.25);
    makeTrashAndPrinter();
    makeCopyMachine(7.2, -2.2);
    addDeskDecor(0,-3,0); addDeskDecor(-4,-3,0); addDeskDecor(4,-3,0); addDeskDecor(-4,2,Math.PI); addDeskDecor(4,2,Math.PI);
    makePlaneLabel('삼일 PwC AI 챌린지\nEasy View팀 1등 🏆\n우리 팀 좀 멋지다', -1.5, 2.05, -9.92, 2.55, 1.05, '#ffffff', '#333333', 0);
    makePlaneLabel('TEAMWORK\nIS POWER', 4.1, 2.7, -9.92, 1.6, .65, '#222222', '#e8c96d', 0);
    // Easy View 통창 라벨 제거됨
    // 벽시계
    const clockFace = new THREE.Mesh(new THREE.CircleGeometry(.38,32), new THREE.MeshBasicMaterial({color:0xffffff}));
    clockFace.position.set(2.0,2.65,-9.91); scene.add(clockFace);
    const hand1 = new THREE.Mesh(new THREE.BoxGeometry(.03,.28,.01), new THREE.MeshBasicMaterial({color:0x111111}));
    hand1.position.set(2.0,2.72,-9.9); hand1.rotation.z=.55; scene.add(hand1);
    const hand2 = new THREE.Mesh(new THREE.BoxGeometry(.025,.2,.01), new THREE.MeshBasicMaterial({color:0x111111}));
    hand2.position.set(2.05,2.63,-9.9); hand2.rotation.z=-1.1; scene.add(hand2);
    // 바닥 러그/휴게존 느낌
    makeBox(3.6,.025,1.2,0x4d4d4d,-6.6,.025,-7.05);
    makeBox(.85,.42,.85,0x6d4c41,-8.6,.21,6.4);
    makeBox(.9,.42,.85,0x6d4c41,-7.45,.21,6.4);
}
makeOfficeDetails();

// 화살표
const arrowGeo = new THREE.ConeGeometry(0.15, 0.4, 8);
const arrowMat = new THREE.MeshBasicMaterial({ color: 0xe8c96d });
const arrow = new THREE.Mesh(arrowGeo, arrowMat);
arrow.position.set(0, 2.2, -3);
arrow.rotation.z = Math.PI;
scene.add(arrow);

// =====================
// 동료 캐릭터
// =====================
function makeHuman(x, z, ry, shirtColor, npcData) {
    const g = new THREE.Group();

    const skinMat  = new THREE.MeshLambertMaterial({ color: 0xf5cba7 });
    const shirtMat = new THREE.MeshLambertMaterial({ color: shirtColor });
    const pantsMat = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
    const shoeMat  = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const hairMat  = new THREE.MeshLambertMaterial({ color: 0x2c1a0e });
    const whiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const eyeMat   = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const collarMat= new THREE.MeshLambertMaterial({ color: 0xfafafa });

    function npcMesh(geo, mat) {
        const m = new THREE.Mesh(geo, mat);
        m.name = 'npc'; m.userData = npcData;
        m.castShadow = true;
        return m;
    }

    // ── 다리 (왼/오른) ──────────────────────────────
    const legGeo = new THREE.BoxGeometry(0.13, 0.42, 0.13);
    const legL = npcMesh(legGeo, pantsMat); legL.position.set(-0.1, 0.21, 0); g.add(legL);
    const legR = npcMesh(legGeo, pantsMat); legR.position.set( 0.1, 0.21, 0); g.add(legR);

    // ── 신발 ────────────────────────────────────────
    const shoeGeo = new THREE.BoxGeometry(0.15, 0.07, 0.2);
    const shoeL = npcMesh(shoeGeo, shoeMat); shoeL.position.set(-0.1, 0.035, 0.03); g.add(shoeL);
    const shoeR = npcMesh(shoeGeo, shoeMat); shoeR.position.set( 0.1, 0.035, 0.03); g.add(shoeR);

    // ── 허리 벨트 ───────────────────────────────────
    const belt = npcMesh(new THREE.BoxGeometry(0.38, 0.06, 0.22), new THREE.MeshLambertMaterial({color:0x3d2b1f}));
    belt.position.set(0, 0.46, 0); g.add(belt);

    // ── 상의 (몸통) ─────────────────────────────────
    const torso = npcMesh(new THREE.BoxGeometry(0.38, 0.46, 0.22), shirtMat);
    torso.position.set(0, 0.72, 0); g.add(torso);

    // 와이셔츠 앞판 느낌 (흰 줄)
    const shirtFront = npcMesh(new THREE.PlaneGeometry(0.1, 0.32), collarMat);
    shirtFront.position.set(0, 0.72, 0.115); g.add(shirtFront);

    // ── 어깨 (둥글게) ───────────────────────────────
    const shoulderGeo = new THREE.SphereGeometry(0.09, 8, 8);
    const shoulL = npcMesh(shoulderGeo, shirtMat); shoulL.position.set(-0.22, 0.92, 0); g.add(shoulL);
    const shoulR = npcMesh(shoulderGeo, shirtMat); shoulR.position.set( 0.22, 0.92, 0); g.add(shoulR);

    // ── 팔 위/아래 (상완 + 전완) ────────────────────
    const upperArmGeo = new THREE.CylinderGeometry(0.055, 0.05, 0.22, 8);
    const lowerArmGeo = new THREE.CylinderGeometry(0.048, 0.044, 0.2, 8);

    // 왼팔
    const uArmL = npcMesh(upperArmGeo, shirtMat);
    uArmL.position.set(-0.25, 0.78, 0); uArmL.rotation.z = 0.18; g.add(uArmL);
    const lArmL = npcMesh(lowerArmGeo, skinMat);
    lArmL.position.set(-0.29, 0.58, 0); lArmL.rotation.z = 0.12; g.add(lArmL);

    // 오른팔
    const uArmR = npcMesh(upperArmGeo, shirtMat);
    uArmR.position.set( 0.25, 0.78, 0); uArmR.rotation.z = -0.18; g.add(uArmR);
    const lArmR = npcMesh(lowerArmGeo, skinMat);
    lArmR.position.set( 0.29, 0.58, 0); lArmR.rotation.z = -0.12; g.add(lArmR);

    // ── 손 ──────────────────────────────────────────
    const handGeo = new THREE.SphereGeometry(0.052, 7, 7);
    const handL = npcMesh(handGeo, skinMat); handL.position.set(-0.31, 0.46, 0); g.add(handL);
    const handR = npcMesh(handGeo, skinMat); handR.position.set( 0.31, 0.46, 0); g.add(handR);

    // ── 목 ──────────────────────────────────────────
    const neck = npcMesh(new THREE.CylinderGeometry(0.065, 0.07, 0.12, 8), skinMat);
    neck.position.set(0, 1.0, 0); g.add(neck);

    // ── 頭 (머리) ───────────────────────────────────
    // 메인 머리 (약간 직육면체 느낌 섞어서 캐릭터답게)
    const headGeo = new THREE.BoxGeometry(0.28, 0.3, 0.26);
    const head = npcMesh(headGeo, skinMat);
    head.position.set(0, 1.22, 0); g.add(head);

    // 귀 (양쪽)
    const earGeo = new THREE.BoxGeometry(0.05, 0.09, 0.05);
    const earL = npcMesh(earGeo, skinMat); earL.position.set(-0.155, 1.22, 0); g.add(earL);
    const earR = npcMesh(earGeo, skinMat); earR.position.set( 0.155, 1.22, 0); g.add(earR);

    // ── 머리카락 ────────────────────────────────────
    const hairTop = npcMesh(new THREE.BoxGeometry(0.29, 0.1, 0.27), hairMat);
    hairTop.position.set(0, 1.38, 0); g.add(hairTop);
    // 앞머리
    const hairFront = npcMesh(new THREE.BoxGeometry(0.26, 0.07, 0.06), hairMat);
    hairFront.position.set(0, 1.31, 0.135); g.add(hairFront);
    // 옆머리 (왼/오른)
    const hairSideGeo = new THREE.BoxGeometry(0.05, 0.18, 0.24);
    const hairSL = npcMesh(hairSideGeo, hairMat); hairSL.position.set(-0.148, 1.25, 0); g.add(hairSL);
    const hairSR = npcMesh(hairSideGeo, hairMat); hairSR.position.set( 0.148, 1.25, 0); g.add(hairSR);

    // ── 눈 ──────────────────────────────────────────
    const eyeGeo = new THREE.SphereGeometry(0.032, 6, 6);
    const eyeWhiteGeo = new THREE.SphereGeometry(0.042, 6, 6);
    // 흰자
    const ewL = npcMesh(eyeWhiteGeo, whiteMat); ewL.position.set(-0.075, 1.235, 0.135); g.add(ewL);
    const ewR = npcMesh(eyeWhiteGeo, whiteMat); ewR.position.set( 0.075, 1.235, 0.135); g.add(ewR);
    // 눈동자
    const eyeL = npcMesh(eyeGeo, eyeMat); eyeL.position.set(-0.075, 1.235, 0.148); g.add(eyeL);
    const eyeR = npcMesh(eyeGeo, eyeMat); eyeR.position.set( 0.075, 1.235, 0.148); g.add(eyeR);

    // ── 눈썹 ────────────────────────────────────────
    const browGeo = new THREE.BoxGeometry(0.068, 0.018, 0.015);
    const browMat = new THREE.MeshLambertMaterial({ color: 0x2c1a0e });
    const browL = new THREE.Mesh(browGeo, browMat); browL.position.set(-0.075, 1.265, 0.138); browL.rotation.z = 0.15; g.add(browL);
    const browR = new THREE.Mesh(browGeo, browMat); browR.position.set( 0.075, 1.265, 0.138); browR.rotation.z = -0.15; g.add(browR);

    // ── 코 ──────────────────────────────────────────
    const nose = npcMesh(new THREE.BoxGeometry(0.038, 0.04, 0.04), skinMat);
    nose.position.set(0, 1.21, 0.15); g.add(nose);

    // ── 입 ──────────────────────────────────────────
    const mouthMat = new THREE.MeshLambertMaterial({ color: 0xc0605a });
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.018, 0.01), mouthMat);
    mouth.position.set(0, 1.185, 0.138); g.add(mouth);

    // ── 칼라 (셔츠 목깃) ────────────────────────────
    const collarL = npcMesh(new THREE.BoxGeometry(0.08, 0.1, 0.04), collarMat);
    collarL.position.set(-0.04, 0.99, 0.1); collarL.rotation.z = -0.4; g.add(collarL);
    const collarR = npcMesh(new THREE.BoxGeometry(0.08, 0.1, 0.04), collarMat);
    collarR.position.set( 0.04, 0.99, 0.1); collarR.rotation.z =  0.4; g.add(collarR);

    if(npcData && npcData.showNameLabel) makeFloatingNameLabel(npcData.name, g);
    g.position.set(x, 0, z);
    g.rotation.y = ry;
    scene.add(g);
    return g;
}

function makeSeatedHuman(x, z, ry, shirtColor, npcData) {
    const g = new THREE.Group();
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xf5cba7 });
    const shirtMat = new THREE.MeshLambertMaterial({ color: shirtColor });
    const pantsMat = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
    const hairMat = new THREE.MeshLambertMaterial({ color: 0x2c1a0e });
    const blackMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const whiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    function part(geo, mat){ const m = new THREE.Mesh(geo, mat); m.name='npc'; m.userData=npcData; m.castShadow=true; g.add(m); return m; }
    part(new THREE.BoxGeometry(.42,.42,.24), shirtMat).position.set(0,.78,0);
    const front = part(new THREE.PlaneGeometry(.10,.30), whiteMat); front.position.set(0,.78,.125);
    part(new THREE.BoxGeometry(.30,.28,.26), skinMat).position.set(0,1.15,0);
    part(new THREE.BoxGeometry(.32,.10,.28), hairMat).position.set(0,1.31,0);
    part(new THREE.BoxGeometry(.27,.07,.06), hairMat).position.set(0,1.24,.14);
    [-.075,.075].forEach(ex=>{ part(new THREE.SphereGeometry(.04,6,6), whiteMat).position.set(ex,1.16,.14); part(new THREE.SphereGeometry(.027,6,6), blackMat).position.set(ex,1.16,.165); });
    const legL = part(new THREE.BoxGeometry(.14,.16,.48), pantsMat); legL.position.set(-.11,.49,.22); legL.rotation.x=.45;
    const legR = part(new THREE.BoxGeometry(.14,.16,.48), pantsMat); legR.position.set(.11,.49,.22); legR.rotation.x=.45;
    [-.11,.11].forEach(lx=>part(new THREE.BoxGeometry(.16,.07,.22), blackMat).position.set(lx,.34,.48));
    const armL = part(new THREE.CylinderGeometry(.045,.045,.36,8), skinMat); armL.position.set(-.31,.72,.08); armL.rotation.z=.25;
    const armR = part(new THREE.CylinderGeometry(.045,.045,.36,8), skinMat); armR.position.set(.31,.72,.08); armR.rotation.z=-.25;
    part(new THREE.SphereGeometry(.052,7,7), skinMat).position.set(-.35,.55,.13);
    part(new THREE.SphereGeometry(.052,7,7), skinMat).position.set(.35,.55,.13);
    if(npcData && npcData.showNameLabel) makeFloatingNameLabel(npcData.name, g);
    g.position.set(x,0,z); g.rotation.y=ry; scene.add(g); return g;
}

makeSeatedHuman(-4, -1.55, Math.PI, 0x3498db, {
    name: '정예원 선생님', color: '#4a7fa5', showNameLabel: true,
    conversations: {
        '안녕하세요!': { reply: '안녕하세요 선생님! 오늘 어싸인 확인 부탁드립니다. Connect 확인부터 차근차근 진행해주시면 됩니다.' },
        '오늘 업무가 많을까요?': { reply: '많아 보이지만 순서대로 하면 금방 끝납니다! Teams에 제가 오늘 업무 정리해서 보내뒀어요.' },
        '수고하세요': { reply: '네 선생님도 오늘 업무 파이팅입니다!' }
    }
});
makeSeatedHuman(4, -1.55, Math.PI, 0xe74c3c, {
    name: '박수정 선생님', color: '#a54a7f', showNameLabel: true,
    conversations: {
        '안녕하세요!': { reply: '안녕하세요~ 오늘 어싸인 확인하셨을까요? 확인 후 진행 잘 부탁드립니다!' },
        'Connect 확인 먼저 하면 될까요?': { reply: '네 맞아요! 자료 업로드 여부 확인하고 단체방에 공유해주시면 됩니다.' },
        '수고하세요': { reply: '감사합니다~ 오늘도 같이 힘내요!' }
    }
});

makeSeatedHuman(-4, 3.45, Math.PI, 0x9b59b6, {
    name: '조유나', color: '#8e44ad', showNameLabel: true,
    conversations: {
        '안녕하세요!': { reply: '안녕하세요! 뒷자리에서 업무 진행 상황 같이 확인하고 있습니다.' },
        '오늘 업무 괜찮을까요?': { reply: '네! 순서대로만 하면 충분히 끝낼 수 있어요. 파이팅입니다!' },
        '수고하세요': { reply: '네 선생님도 고생 많으십니다!' }
    }
});
makeSeatedHuman(4, 3.45, Math.PI, 0x1abc9c, {
    name: '한여원', color: '#16a085', showNameLabel: true,
    conversations: {
        '안녕하세요!': { reply: '안녕하세요! 오늘도 무사 퇴근을 위해 같이 달려봅시다.' },
        '오늘 업무 괜찮을까요?': { reply: 'Connect 확인하고 Teams 공유만 놓치지 않으면 됩니다!' },
        '수고하세요': { reply: '네 오늘도 고생 많으세요!' }
    }
});
function makePrinterExecutive() {
    const npcData = {
        name: '이제승 이사님', color: '#7fa54a', showNameLabel: true,
        conversations: {
            '안녕하세요!': { reply: '오늘 업무 진행 상황은 중간중간 공유 부탁드립니다. 마지막 Time Report까지 잊지 말아주세요.' },
            '성과평가 관련해서요': { reply: '이번 성과평가 잘 작성하셨을까요~? 오늘 Time Report도 마감합니다. 모두 5시 전까지 작성해주세요!' },
            '수고하세요': { reply: '네 고생 많습니다. 마감 전에 한 번 더 확인 부탁드립니다.' }
        }
    };
    const g = new THREE.Group();
    const skinMat  = new THREE.MeshLambertMaterial({ color: 0xf5cba7 });
    const shirtMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const pantsMat = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
    const shoeMat  = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const hairMat  = new THREE.MeshLambertMaterial({ color: 0x2c1a0e });
    const whiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const eyeMat   = new THREE.MeshLambertMaterial({ color: 0x111111 });
    function part(geo, mat){ const m = new THREE.Mesh(geo, mat); m.name='npc'; m.userData=npcData; m.castShadow=true; g.add(m); return m; }

    part(new THREE.BoxGeometry(0.13, 0.42, 0.13), pantsMat).position.set(-0.1, 0.21, 0);
    part(new THREE.BoxGeometry(0.13, 0.42, 0.13), pantsMat).position.set( 0.1, 0.21, 0);
    part(new THREE.BoxGeometry(0.15, 0.07, 0.2), shoeMat).position.set(-0.1, 0.035, 0.03);
    part(new THREE.BoxGeometry(0.15, 0.07, 0.2), shoeMat).position.set( 0.1, 0.035, 0.03);
    part(new THREE.BoxGeometry(0.38, 0.06, 0.22), new THREE.MeshLambertMaterial({color:0x3d2b1f})).position.set(0, 0.46, 0);
    part(new THREE.BoxGeometry(0.38, 0.46, 0.22), shirtMat).position.set(0, 0.72, 0);
    const shirtFront = part(new THREE.PlaneGeometry(0.1, 0.32), whiteMat); shirtFront.position.set(0, 0.72, 0.115);

    part(new THREE.SphereGeometry(0.09, 8, 8), shirtMat).position.set(-0.22, 0.92, 0);
    part(new THREE.SphereGeometry(0.09, 8, 8), shirtMat).position.set( 0.22, 0.92, 0);

    // 복합기 위 조작부를 누르는 느낌: 상완은 내려오고, 전완은 앞으로 꺾이게 구성
    const upperArmGeo = new THREE.CylinderGeometry(0.055, 0.05, 0.24, 8);
    const lowerArmGeo = new THREE.CylinderGeometry(0.048, 0.044, 0.34, 8);
    const uArmL = part(upperArmGeo, shirtMat); uArmL.position.set(-0.24, 0.82, 0.02); uArmL.rotation.z = -0.55; uArmL.rotation.x = 0.25;
    const uArmR = part(upperArmGeo, shirtMat); uArmR.position.set( 0.24, 0.82, 0.02); uArmR.rotation.z =  0.55; uArmR.rotation.x = 0.25;
    const lArmL = part(lowerArmGeo, skinMat); lArmL.position.set(-0.20, 0.68, 0.24); lArmL.rotation.x = Math.PI / 2.9; lArmL.rotation.z = -0.18;
    const lArmR = part(lowerArmGeo, skinMat); lArmR.position.set( 0.20, 0.68, 0.24); lArmR.rotation.x = Math.PI / 2.9; lArmR.rotation.z =  0.18;
    part(new THREE.SphereGeometry(0.052,7,7), skinMat).position.set(-0.19, 0.61, 0.42);
    part(new THREE.SphereGeometry(0.052,7,7), skinMat).position.set( 0.19, 0.61, 0.42);

    part(new THREE.CylinderGeometry(0.065, 0.07, 0.12, 8), skinMat).position.set(0, 1.0, 0);
    part(new THREE.BoxGeometry(0.28, 0.3, 0.26), skinMat).position.set(0, 1.22, 0);
    part(new THREE.BoxGeometry(0.29, 0.1, 0.27), hairMat).position.set(0, 1.38, 0);
    part(new THREE.BoxGeometry(0.26, 0.07, 0.06), hairMat).position.set(0, 1.31, 0.135);
    part(new THREE.BoxGeometry(0.05, 0.18, 0.24), hairMat).position.set(-0.148, 1.25, 0);
    part(new THREE.BoxGeometry(0.05, 0.18, 0.24), hairMat).position.set( 0.148, 1.25, 0);
    [-0.075,0.075].forEach(ex=>{ part(new THREE.SphereGeometry(0.042,6,6), whiteMat).position.set(ex,1.235,0.135); part(new THREE.SphereGeometry(0.032,6,6), eyeMat).position.set(ex,1.235,0.148); });
    part(new THREE.BoxGeometry(0.038,0.04,0.04), skinMat).position.set(0,1.21,0.15);
    part(new THREE.BoxGeometry(0.07,0.018,0.01), new THREE.MeshLambertMaterial({ color: 0xc0605a })).position.set(0,1.185,0.138);
    makeFloatingNameLabel(npcData.name, g);
    // 카메라 쪽에서도 얼굴이 보이도록 복합기 정면 사선에 배치
    g.position.set(6.25, 0, -1.85);
    g.rotation.y = -Math.PI / 4;
    scene.add(g);
    return g;
}
makePrinterExecutive();

// =====================
// 문 + 도어락
// =====================
const doorBody = new THREE.Mesh(new THREE.BoxGeometry(0.95,2.2,0.06), new THREE.MeshLambertMaterial({color:0xe8e0d8}));
doorBody.position.set(-3,1.1,D/2-0.05); doorBody.name='door'; scene.add(doorBody);
const doorKnob = new THREE.Mesh(new THREE.SphereGeometry(0.05,8,8), new THREE.MeshLambertMaterial({color:0xd4af37}));
doorKnob.position.set(-2.55,1.0,D/2-0.02); doorKnob.name='door'; scene.add(doorKnob);
const dorlockPanel = new THREE.Mesh(new THREE.BoxGeometry(0.25,0.35,0.04), new THREE.MeshLambertMaterial({color:0x222222}));
dorlockPanel.position.set(-2.1,1.2,D/2-0.03); dorlockPanel.name='doorlock'; scene.add(dorlockPanel);
const dorlockScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.18,0.08), new THREE.MeshBasicMaterial({color:0x00ff00}));
dorlockScreen.position.set(-2.1,1.38,D/2-0.01); dorlockScreen.name='doorlock'; scene.add(dorlockScreen);

// =====================
// 게임 상태
// =====================
const MONTH = new Date().getMonth() + 1;
const ANSWER = ['2', '5', '1', '8'];
let progress = [false, false, false, false];
let passwordRevealed = false;
let collectedClues = progress;
let doorPassword = '';
let snackBalance = 5000;

// =====================
// 인트로 애니메이션
// =====================
function playIntro() {
    const lines = ['il1','il2','il3','il4','il5','il6','il7'];
    lines.forEach((id, i) => {
        gsap.to(`#${id}`, {
            opacity: 1, y: 0, duration: 0.8,
            delay: i * 1.2 + 0.5,
            ease: 'power2.out'
        });
    });
    // 인트로 끝나면 시작화면으로
    setTimeout(() => {
        gsap.to('#intro-screen', {
            opacity: 0, duration: 1, onComplete: () => {
                document.getElementById('intro-screen').style.display = 'none';
                document.getElementById('start-screen').style.display = 'flex';
                gsap.fromTo('#start-screen', {opacity:0}, {opacity:1, duration:1});
            }
        });
    }, lines.length * 1200 + 1500);
}

document.getElementById('intro-skip').addEventListener('click', () => {
    gsap.killTweensOf('[id^=il]');
    gsap.to('#intro-screen', {opacity:0, duration:0.5, onComplete:()=>{
        document.getElementById('intro-screen').style.display='none';
        document.getElementById('start-screen').style.display='flex';
        gsap.fromTo('#start-screen',{opacity:0},{opacity:1,duration:0.5});
    }});
});

playIntro();

// =====================
// Teams 채팅
// =====================
const teamsChats = [
    { id:'jung', name:'정예원 선생님', color:'#d94f70', initials:'정', badge:1,
      messages:[
        {from:'정예원 선생님', text:'안녕하세요 선생님, 오늘 업무 확인해 주시길 바랍니다.', mine:false, time:'18:01'},
        {from:'정예원 선생님', text:'[오늘의 어싸인]\n1. Connect 확인 후 단체방에 공유\n2. 고객사 정보 수령인 추가\n - 회사명: DONG-A CHAMMED CO., LTD.\n- 정보수령인/이메일: Noh Gayoung / m2191065@donga.co.kr\n3. BI 측정값 함수 빈칸 맞추기 4. Time report 작성', mine:false, time:'18:02'}
      ], fallbacks:['오늘 업무 순서대로 처리 부탁드립니다!','완료되면 Time Report까지 작성해주세요.'] },
    { id:'team', name:'Easy View 단체방', color:'#6264a7', initials:'EV', badge:0,
      messages:[
        {from:'한여원',text:'오늘 업로드 확인 먼저 하면 될 것 같아요!',mine:false,time:'18:03'},
        {from:'심상희',text:'확인 후 단체방에 남겨주세요~',mine:false,time:'18:04'}
      ], fallbacks:['확인 감사합니다!','다음 업무도 진행해주세요.','좋습니다!'] }
]
let currentChatId = 'jung';

// =====================
// 대사창
// =====================
const dialogueBox = document.getElementById('dialogue-box');
const dialogueSpeaker = document.getElementById('dialogue-speaker');
const dialogueText = document.getElementById('dialogue-text');
let typingInterval = null;
let dialogueCallback = null;

function showDialogue(speaker, text, callback) {
    dialogueSpeaker.textContent = speaker;
    dialogueText.textContent = '';
    dialogueBox.style.display = 'block';
    dialogueCallback = callback || null;
    let i = 0;
    if(typingInterval) clearInterval(typingInterval);
    typingInterval = setInterval(()=>{
        dialogueText.textContent += text[i]; i++;
        if(i >= text.length) clearInterval(typingInterval);
    }, 28);
}

function hideDialogue() {
    gsap.to(dialogueBox, {opacity:0,duration:0.2,onComplete:()=>{
        dialogueBox.style.display='none';
        gsap.set(dialogueBox,{opacity:1});
    }});
}

dialogueBox.addEventListener('click', ()=>{
    if(dialogueCallback){ const cb=dialogueCallback; dialogueCallback=null; hideDialogue(); setTimeout(cb,300); }
    else hideDialogue();
});

// =====================
// NPC 대화
// =====================
const npcDialogue = document.getElementById('npc-dialogue');
const npcNameEl = document.getElementById('npc-name');
const npcTextEl = document.getElementById('npc-text');
const npcChoicesEl = document.getElementById('npc-choices');
let currentNpc = null;
let npcStep = 'choosing';

function showNpcDialogue(data) {
    currentNpc = data; npcStep = 'choosing';
    npcNameEl.textContent = data.name;
    npcNameEl.style.color = data.color;
    npcChoicesEl.innerHTML = '';
    typeNpcText('...', ()=>{ setTimeout(()=>renderNpcChoices(), 300); });
    npcDialogue.style.display = 'block';
    gsap.fromTo(npcDialogue,{opacity:0,y:20},{opacity:1,y:0,duration:0.3});
    document.exitPointerLock();
}

function renderNpcChoices() {
    npcChoicesEl.innerHTML = '';
    Object.keys(currentNpc.conversations).forEach(choice=>{
        const btn = document.createElement('button');
        btn.textContent = choice;
        btn.onclick = () => selectNpcChoice(choice);
        npcChoicesEl.appendChild(btn);
    });
}

function selectNpcChoice(choice) {
    if(npcStep !== 'choosing') return;
    npcStep = 'replying';
    const reply = currentNpc.conversations[choice].reply;
    npcChoicesEl.innerHTML = '';
    npcTextEl.textContent = `나: ${choice}`;
    if(choice.includes('힌트')||choice.includes('비밀번호')) {
        if(currentNpc.name.includes('민준')){ collectedClues[3]=true; updateClueUI(); }
        if(currentNpc.name.includes('건우')){ collectedClues[1]=true; updateClueUI(); }
    }
    setTimeout(()=>{
        typeNpcText(`${currentNpc.name.split(' ')[0]}: ${reply}`, ()=>{
            setTimeout(()=>hideNpcDialogue(), 1800);
        });
    }, 600);
}

function typeNpcText(text, callback) {
    npcTextEl.textContent = '';
    let i = 0;
    const interval = setInterval(()=>{
        npcTextEl.textContent += text[i]; i++;
        if(i>=text.length){ clearInterval(interval); if(callback) callback(); }
    }, 30);
}

function hideNpcDialogue() {
    gsap.to(npcDialogue,{opacity:0,y:10,duration:0.3,onComplete:()=>{
        npcDialogue.style.display='none';
        gsap.set(npcDialogue,{opacity:1,y:0});
        currentNpc=null; npcStep='choosing';
    }});
}

document.getElementById('npc-close').addEventListener('click', hideNpcDialogue);



// =====================
// 컴퓨터 화면 UI
// =====================
const computerUI = document.getElementById('computer-ui');
let currentComputerApp = 'desktop';

function openComputer() {
    document.exitPointerLock();
    computerUI.style.display = 'flex';
    openComputerApp(currentComputerApp);
    gsap.fromTo('#computer-window', {opacity:0, scale:0.96}, {opacity:1, scale:1, duration:0.22});
}

function closeComputer() {
    gsap.to('#computer-window', {opacity:0, scale:0.96, duration:0.18, onComplete:()=>{
        computerUI.style.display = 'none';
        gsap.set('#computer-window', {opacity:1, scale:1});
    }});
}

function openComputerApp(app) {
    if(app === 'teams') {
        closeComputer();
        setTimeout(openTeams, 180);
        return;
    }
    currentComputerApp = app;
    document.querySelectorAll('.computer-app').forEach(el => el.classList.remove('active'));
    const target = document.getElementById('app-' + app);
    if(target) target.classList.add('active');
    document.querySelectorAll('.browser-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.app === app));

    const urlMap = {
        'desktop': 'pwc.local/work-desktop',
        'connect': 'east.connect.pwc.com/sites/aqvi7ewys2kxdjw/team-requests',
        'connect-detail': 'east.connect.pwc.com/sites/aqvi7ewys2kxdjw/team-requests/37',
        'register': 'register.pwc.com/managed-registration',
        'bi': 'app.powerbi.com/groups/me/reports/DAXMission',
        'time-report': 'time.pwc.com/time-management/report'
    };
    const fakeUrl = document.getElementById('fake-url');
    if(fakeUrl) fakeUrl.textContent = urlMap[app] || 'pwckor.sharepoint.com';
}

if(document.getElementById('computer-close-btn')) {
    document.getElementById('computer-close-btn').addEventListener('click', closeComputer);
}

document.querySelectorAll('.browser-tab').forEach(tab => {
    tab.addEventListener('click', () => openComputerApp(tab.dataset.app));
});

document.querySelectorAll('.task-icon').forEach(icon => {
    icon.addEventListener('click', () => openComputerApp(icon.dataset.app));
});

document.querySelectorAll('.desktop-shortcut').forEach(icon => {
    icon.addEventListener('click', () => openComputerApp(icon.dataset.app));
});

document.getElementById('connect-requested-row')?.addEventListener('click', () => {
    openComputerApp('connect-detail');
});

document.querySelectorAll('.small-close').forEach(btn => {
    btn.addEventListener('click', () => {
        const app = btn.closest('.computer-app');
        if(app && app.id === 'app-connect-detail') {
            openComputerApp('connect');
        } else {
            closeComputer();
        }
    });
});

setupMissionButtons();


function showMissionToast(text) {
    const toast = document.getElementById('mission-toast');
    if(!toast) return;
    toast.classList.remove('show');
    toast.innerHTML = text;
    void toast.offsetWidth;
    toast.classList.add('show');
}

function normalizeAnswer(v) {
    return String(v || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function completeMission(index, text) {
    if(progress[index]) return;
    progress[index] = true;
    updateClueUI();
    if(text) { showMissionToast('✅ ' + text); showDialogue('✅ 업무 완료', text); }
    if(progress.every(Boolean) && !passwordRevealed) revealPassword();
}

function revealPassword() {
    passwordRevealed = true;
    const tr = document.getElementById('time-report-result');
    if(tr) {
        tr.innerHTML = '<div class="password-banner">🎉 모든 업무 완료! 도어락 비밀번호는 <b>2518</b> 입니다.</div>';
        setTimeout(() => {
            tr.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const trMain = tr.closest('.tr-main');
            if(trMain) trMain.scrollTop = trMain.scrollHeight;
        }, 150);
    }
    showDialogue('🔐 퇴근 승인', '오늘 업무를 모두 완료했습니다. 퇴근 확인을 위해 문 옆 도어락에 비밀번호 2518을 입력하세요.');
}

function setupMissionButtons() {
    document.getElementById('reg-memo-btn')?.addEventListener('click', () => {
        const memo = document.getElementById('reg-memo');
        if(memo) memo.classList.toggle('open');
    });

    document.getElementById('reg-complete')?.addEventListener('click', () => {
        const email = document.getElementById('reg-email').value.trim();
        const last = document.getElementById('reg-last').value.trim();
        const first = document.getElementById('reg-first').value.trim();
        const company = document.getElementById('reg-company').value.trim();
        const result = document.getElementById('reg-result');
        const ok = email === 'm2191065@donga.co.kr'
            && normalizeAnswer(last) === 'noh'
            && normalizeAnswer(first) === 'gayoung'
            && normalizeAnswer(company) === normalizeAnswer('DONG-A CHAMMED CO., LTD.');
        if(ok) {
            result.className = 'success-text';
            result.textContent = '✅ 고객사 정보수령인 추가 완료';
            completeMission(1, 'Chapter 2 완료! 고객사 정보수령인/이메일 추가가 완료되었습니다.');
        } else {
            result.className = 'error-text';
            result.textContent = '❌ 입력값이 어싸인 내역과 정확히 일치해야 합니다. 회사명, 이름, 이메일을 다시 확인하세요.';
        }
    });
    document.querySelectorAll('.dax-options button').forEach(btn => {
        btn.addEventListener('click', () => {
            const result = document.getElementById('dax-result');
            if(btn.dataset.answer === 'TRIM') {
                result.className = 'success-text';
                result.textContent = '✅ 정답! TRIM으로 앞뒤 공백을 제거했습니다.';
                completeMission(2, 'Chapter 3 완료! BI 측정값 함수 문제를 해결했습니다.');
            } else {
                result.className = 'error-text';
                result.textContent = '❌ 틀렸습니다. 정답 함수를 선택해야 다음 단계로 넘어갈 수 있습니다.';
            }
        });
    });
    document.getElementById('time-report-save')?.addEventListener('click', () => {
        const inputs = [...document.querySelectorAll('.work-input')].map(i=>normalizeAnswer(i.value));
        const result = document.getElementById('time-report-result');
        const answers = [
            normalizeAnswer('어싸인 확인'),
            normalizeAnswer('Connect 업로드 확인 및 공유'),
            normalizeAnswer('고객사 정보 수령인 추가'),
            normalizeAnswer('BI 측정값 함수 맞추기')
        ];
        const ok = inputs.length >= 4 && answers.every((a, idx) => inputs[idx] === a);
        if(ok) {
            result.className = 'success-text';
            result.textContent = '✅ Time Report 저장 완료';
            completeMission(3, 'Chapter 4 완료! Time Report 저장 완료! 모든 업무가 끝났습니다.');
        } else {
            result.className = 'error-text';
            result.textContent = '❌ 정답 문구를 순서대로 정확히 입력해야 합니다. 1. 어싸인 확인 / 2. Connect 업로드 확인 및 공유 / 3. 고객사 정보 수령인 추가 / 4. BI 측정값 함수 맞추기';
        }
    });
}

computerUI.addEventListener('click', e => {
    if(e.target === computerUI) closeComputer();
});

// =====================
// Teams UI
// =====================
const teamsUI = document.getElementById('teams-ui');

function openTeams() {
    teamsUI.style.display='flex';
    document.exitPointerLock();
    renderChatList();
    openChatRoom(currentChatId);
    gsap.fromTo('#teams-window',{opacity:0,scale:0.95},{opacity:1,scale:1,duration:0.25});
}

function renderChatList() {
    const list = document.getElementById('teams-chatlist-inner');
    list.innerHTML='';
    teamsChats.forEach(chat=>{
        const item=document.createElement('div');
        item.className='teams-chat-item'+(chat.id===currentChatId?' active':'');
        item.innerHTML=`
            <div class="chat-avatar" style="background:${chat.color}">${chat.initials}</div>
            <div class="chat-info">
                <div class="chat-name">${chat.name}</div>
                <div class="chat-preview">${chat.messages[chat.messages.length-1].text}</div>
            </div>
            ${chat.badge>0?`<span class="chat-badge">${chat.badge}</span>`:''}
        `;
        item.onclick=()=>{ currentChatId=chat.id; renderChatList(); openChatRoom(chat.id); };
        list.appendChild(item);
    });
}

function openChatRoom(id) {
    const chat=teamsChats.find(c=>c.id===id);
    if(!chat) return;
    chat.badge=0;
    document.getElementById('chatroom-name').textContent=chat.name;
    document.getElementById('chatroom-avatar').style.background=chat.color;
    document.getElementById('chatroom-avatar').textContent=chat.initials;
    // 정예원 채팅방: 어싸인 확인 (인트로용, 미션 카운트 없음)
    const msgs=document.getElementById('teams-messages');
    msgs.innerHTML='';
    chat.messages.forEach(m=>addMessageBubble(m,chat));
    msgs.scrollTop=msgs.scrollHeight;
}

function addMessageBubble(m, chat) {
    const msgs=document.getElementById('teams-messages');
    const row=document.createElement('div');
    row.className='msg-row'+(m.mine?' mine':'');
    const avatarColor=m.mine?'#e8c96d':chat.color;
    const avatarText=m.mine?'나':chat.initials;
    row.innerHTML=`
        <div class="msg-avatar" style="background:${avatarColor}">${avatarText}</div>
        <div class="msg-content">
            <div class="msg-sender">${m.mine?'나':m.from} · ${m.time||'지금'}</div>
            <div class="msg-bubble">${m.text}</div>
        </div>
    `;
    msgs.appendChild(row);
    msgs.scrollTop=msgs.scrollHeight;
}

function sendTeamsMessage() {
    const input=document.getElementById('teams-input');
    const text=input.value.trim();
    if(!text) return;
    const chat=teamsChats.find(c=>c.id===currentChatId);
    const now=new Date();
    const time=`${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;
    chat.messages.push({from:'나',text,mine:true,time});
    addMessageBubble({from:'나',text,mine:true,time},chat);
    // 어싸인 확인 완료 (인트로용)
    if(chat.id==='team') {
        const normalizedText = text.replace(/\s+/g, '').toLowerCase();
        const correctAnswer = '안녕하세요,오늘업로드된회사없습니다!'.replace(/\s+/g,'').toLowerCase();
        const looksLikeConnectShare = normalizedText === correctAnswer;
        if(looksLikeConnectShare) {
            completeMission(0, 'Chapter 1 완료! Connect 확인 내용을 단체방에 공유했습니다.');
        } else if(!progress[1]) {
            const warn = {from:'시스템', text:'💬 Connect 사이트창을 보고 단체방에 확인 채팅을 남겨보세요.', mine:false, time};
            chat.messages.push(warn);
            addMessageBubble(warn, chat);
        }
    }
    input.value='';
    setTimeout(()=>{
        const reply=chat.fallbacks[Math.floor(Math.random()*chat.fallbacks.length)];
        const replyMsg={from:chat.name,text:reply,mine:false,time};
        chat.messages.push(replyMsg);
        addMessageBubble(replyMsg,chat);
        renderChatList();
    }, 1000+Math.random()*800);
}

document.getElementById('teams-send-btn').addEventListener('click', sendTeamsMessage);
document.getElementById('teams-input').addEventListener('keydown', e=>{
    if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); sendTeamsMessage(); }
});
document.getElementById('teams-close-btn').addEventListener('click', ()=>{
    gsap.to('#teams-window',{opacity:0,scale:0.95,duration:0.2,onComplete:()=>{
        teamsUI.style.display='none';
        gsap.set('#teams-window',{opacity:1,scale:1});
    }});
});

// =====================
// 타자 미니게임
// =====================
const WORDS = ['보고서','결재','야근','회의','마감','클라이언트','발표','기안서','검토','승인','출근','퇴근','점심','커피','팀장','사원','대리','과장','부장','프로젝트'];
let typingGameActive = false;
let typingWords = [];
let typingScore = 0;
let typingLives = 3;
let typingTimer = 30;
let typingTimerInterval = null;
let typingSpawnInterval = null;
let typingGameCallback = null;

function openTypingGame(onSuccess) {
    document.exitPointerLock();
    typingGameCallback = onSuccess;
    const overlay = document.getElementById('minigame-overlay');
    const content = document.getElementById('minigame-content');
    overlay.style.display = 'flex';

    content.innerHTML = `
        <div class="mg-title">⌨️ 긴급 보고서 처리</div>
        <div class="mg-desc" style="margin-bottom:12px;">떨어지는 단어를 타이핑해서 처리하세요! 20점 이상이면 통과!</div>
        <div id="typing-score">점수: 0 / 생명: ❤️❤️❤️</div>
        <div id="typing-timer-bar"><div id="typing-timer-fill" style="width:100%"></div></div>
        <div id="typing-area"></div>
        <input id="typing-input" type="text" placeholder="여기에 타이핑..." autocomplete="off" spellcheck="false">
        <div id="typing-result"></div>
    `;

    typingScore = 0; typingLives = 3; typingWords = [];
    typingTimer = 30; typingGameActive = true;

    document.getElementById('typing-input').focus();
    document.getElementById('typing-input').addEventListener('input', onTypingInput);

    startTypingGame();
}

function startTypingGame() {
    typingSpawnInterval = setInterval(spawnWord, 1800);
    spawnWord();

    typingTimerInterval = setInterval(()=>{
        typingTimer -= 0.1;
        const pct = (typingTimer / 30) * 100;
        const fill = document.getElementById('typing-timer-fill');
        if(fill) {
            fill.style.width = pct + '%';
            fill.style.background = pct > 50 ? '#7eb3ff' : pct > 25 ? '#ffb347' : '#ff6b6b';
        }
        if(typingTimer <= 0) endTypingGame();
    }, 100);

    // 단어 떨어지는 애니메이션
    requestAnimationFrame(updateTypingWords);
}

function spawnWord() {
    if(!typingGameActive) return;
    const area = document.getElementById('typing-area');
    if(!area) return;
    const word = WORDS[Math.floor(Math.random()*WORDS.length)];
    const x = Math.random() * (area.offsetWidth - 80);
    const el = document.createElement('div');
    el.className = 'falling-word';
    el.textContent = word;
    el.style.left = x + 'px';
    el.style.top = '0px';
    area.appendChild(el);
    typingWords.push({ el, word, y: 0, speed: 0.4 + Math.random() * 0.3 });
}

let lastTime = 0;
function updateTypingWords(timestamp) {
    if(!typingGameActive) return;
    const delta = Math.min(timestamp - lastTime, 50);
    lastTime = timestamp;
    const area = document.getElementById('typing-area');
    if(!area) return;
    const maxY = area.offsetHeight - 30;

    typingWords = typingWords.filter(w => {
        if(!w.el.parentNode) return false;
        w.y += w.speed * delta * 0.1;
        w.el.style.top = w.y + 'px';
        if(w.y > maxY) {
            w.el.remove();
            typingLives--;
            updateTypingScore();
            if(typingLives <= 0) { endTypingGame(); return false; }
            return false;
        }
        return true;
    });

    requestAnimationFrame(updateTypingWords);
}

function onTypingInput(e) {
    if(!typingGameActive) return;
    const val = e.target.value.trim();
    const idx = typingWords.findIndex(w => w.word === val);
    if(idx !== -1) {
        // 맞춤!
        gsap.to(typingWords[idx].el, {scale:1.5, opacity:0, duration:0.3, onComplete:()=>typingWords[idx].el.remove()});
        typingWords.splice(idx, 1);
        typingScore++;
        e.target.value = '';
        updateTypingScore();

        // 20점 달성 시 즉시 통과
        if(typingScore >= 20) endTypingGame(true);
    }
}

function updateTypingScore() {
    const el = document.getElementById('typing-score');
    if(el) el.textContent = `점수: ${typingScore} / 생명: ${'❤️'.repeat(Math.max(0,typingLives))}${'🖤'.repeat(Math.max(0,3-typingLives))}`;
}

function endTypingGame(forceWin=false) {
    typingGameActive = false;
    clearInterval(typingSpawnInterval);
    clearInterval(typingTimerInterval);
    typingWords.forEach(w=>w.el.remove());
    typingWords = [];

    const win = forceWin || (typingScore >= 20 && typingLives > 0);
    const result = document.getElementById('typing-result');
    if(result) {
        result.style.color = win ? '#27ae60' : '#e74c3c';
        result.textContent = win
            ? `✅ 통과! ${typingScore}점 달성! 세 번째 숫자: 5`
            : `❌ 실패! ${typingScore}점 (20점 이상 필요)`;
    }

    if(win) {
        collectedClues[2] = true;
        updateClueUI();
        if(typingGameCallback) typingGameCallback();
    }

    setTimeout(()=>closeMiniGame(), win ? 2000 : 2500);
}

function closeMiniGame() {
    typingGameActive = false;
    clearInterval(typingSpawnInterval);
    clearInterval(typingTimerInterval);
    document.getElementById('minigame-overlay').style.display='none';
}

// 포스트잇
function openNote() {
    document.exitPointerLock();
    const overlay = document.getElementById('minigame-overlay');
    const content = document.getElementById('minigame-content');
    overlay.style.display='flex';
    content.innerHTML = `
        <div class="mg-title">📝 포스트잇</div>
        <div style="background:#ffeb3b;padding:24px;border-radius:8px;margin:16px 0;font-size:15px;line-height:2;color:#333;text-align:left;">
            도어락 비번 힌트:<br>
            1️⃣ 결재서류 → 처리 개수<br>
            2️⃣ 이번 달 숫자<br>
            3️⃣ 타자 게임 클리어 보상<br>
            4️⃣ 동료한테 물어봐요<br><br>
            <small style="color:#666;">— 박소연 메모 —</small>
        </div>
        <button class="mg-btn" onclick="closeMiniGame()">닫기</button>
    `;
    collectedClues[0] = true;
    updateClueUI();
}

document.getElementById('minigame-overlay').addEventListener('click', e=>{
    if(e.target===document.getElementById('minigame-overlay')) closeMiniGame();
});


// =====================
// 출출박스 구매 UI
// =====================
const snackProducts = [
    {name:'삼각김밥', price:1200, emoji:'🍙'},
    {name:'샌드위치', price:1800, emoji:'🥪'},
    {name:'햄버거', price:1900, emoji:'🍔'},
    {name:'음료수', price:1000, emoji:'🥤'},
    {name:'삶은달걀', price:800, emoji:'🥚'},
    {name:'바나나', price:1200, emoji:'🍌'},
    {name:'사과', price:1000, emoji:'🍎'},
    {name:'초코바', price:900, emoji:'🍫'}
];

function formatWon(n) { return n.toLocaleString('ko-KR') + '원'; }

function openSnackBox() {
    document.exitPointerLock();
    const overlay = document.getElementById('snack-overlay');
    const list = document.getElementById('snack-items');
    if(!overlay || !list) return;
    list.innerHTML = snackProducts.map((item, idx)=>`
        <button class="snack-item" onclick="buySnack(${idx})">
            <span class="snack-emoji">${item.emoji}</span>
            <span class="snack-name">${item.name}</span>
            <span class="snack-price">${formatWon(item.price)}</span>
        </button>
    `).join('');
    updateSnackBalance();
    document.getElementById('snack-result').textContent = '먹고 싶은 간식을 선택하세요. 전부 2,000원 미만입니다.';
    document.getElementById('snack-tray-item').textContent = '상품 배출구';
    overlay.style.display='flex';
}

function updateSnackBalance() {
    const el = document.getElementById('snack-balance');
    if(el) el.textContent = formatWon(snackBalance);
}

window.buySnack = function(idx) {
    const item = snackProducts[idx];
    const result = document.getElementById('snack-result');
    const tray = document.querySelector('.snack-tray');
    const trayItem = document.getElementById('snack-tray-item');
    if(!item) return;
    if(snackBalance < item.price) {
        result.textContent = `잔액 부족! ${item.name}은(는) ${formatWon(item.price)}입니다.`;
        result.style.color = '#ff6b6b';
        return;
    }
    snackBalance -= item.price;
    updateSnackBalance();
    result.style.color = '#9bd44d';
    result.textContent = `결제 완료! ${item.name}이(가) 나오는 중입니다.`;
    tray.classList.remove('dispensing');
    void tray.offsetWidth;
    tray.classList.add('dispensing');
    trayItem.textContent = `${item.emoji} ${item.name} 꺼내기`;
    showMissionToast(`🍽️ 출출박스에서 ${item.name} 구매 완료! 남은 금액 ${formatWon(snackBalance)}`);
};

window.closeSnackBox = function() {
    const overlay = document.getElementById('snack-overlay');
    if(overlay) overlay.style.display='none';
};

document.getElementById('snack-overlay')?.addEventListener('click', e=>{
    if(e.target === document.getElementById('snack-overlay')) closeSnackBox();
});

// =====================
// 도어락
// =====================
function openDoorlock() {
    document.exitPointerLock();
    if(!passwordRevealed) { showDialogue('🔐 도어락', '아직 퇴근 확인 번호가 활성화되지 않았습니다. 컴퓨터에서 오늘 업무를 모두 완료하세요.'); return; }
    document.getElementById('doorlock-overlay').style.display='flex';
    updateDoorlockDisplay();
}

function updateDoorlockDisplay() {
    document.getElementById('doorlock-display').textContent = doorPassword.padEnd(4,'_');
}

window.doorlockPress = function(num) {
    playSound(sfxLock, 0.5);   // ✅ 도어락 버튼 소리
    if(doorPassword.length >= 4) return;
    doorPassword += num;
    updateDoorlockDisplay();
    if(doorPassword.length === 4) setTimeout(()=>checkPassword(), 400);
};

window.doorlockClear = function() {
    doorPassword=''; updateDoorlockDisplay();
};

function checkPassword() {
    const correct = ANSWER.join('');
    const display = document.getElementById('doorlock-result');
    if(doorPassword === correct) {
        display.textContent = '✅ OPEN!';
        display.style.color = '#27ae60';

        // 🎉 비밀번호 맞춤! BGM 끄고 엔딩 음악 재생
        if (bgm) bgm.pause();
        playSound(sfxEnding, 0.8);

        setTimeout(()=>{
            closeDoorlock();
            showEnding();
        }, 1200);
    } else {
        display.textContent = '❌ 오류';
        display.style.color = '#e74c3c';
        setTimeout(()=>{ doorPassword=''; display.textContent=''; updateDoorlockDisplay(); }, 1000);
    }
}

function closeDoorlock() {
    document.getElementById('doorlock-overlay').style.display='none';
}

document.getElementById('doorlock-overlay').addEventListener('click', e=>{
    if(e.target===document.getElementById('doorlock-overlay')) closeDoorlock();
});

// =====================
// 엔딩
// =====================
function showEnding() {
    // 컨페티
    for(let i=0; i<80; i++) {
        setTimeout(()=>{
            const c = document.createElement('div');
            c.className = 'confetti';
            c.style.left = Math.random()*100+'vw';
            c.style.background = ['#e8c96d','#7eb3ff','#ff6b6b','#6bffb3','#ff6bff'][Math.floor(Math.random()*5)];
            c.style.animationDuration = (2+Math.random()*3)+'s';
            c.style.animationDelay = Math.random()*2+'s';
            document.body.appendChild(c);
            setTimeout(()=>c.remove(), 5000);
        }, i*50);
    }

    const ending = document.getElementById('ending-screen');
    ending.style.display='flex';

    gsap.to('#ending-title', {opacity:1, duration:1, delay:0.5});
    gsap.to('#ending-subtitle', {opacity:1, duration:1, delay:1.5});
    gsap.to('#credits', {opacity:1, duration:1.5, delay:3});

    // 화면 흔들기
    gsap.fromTo(canvas, {x:-10},{x:10,duration:0.05,repeat:20,yoyo:true, onComplete:()=>gsap.set(canvas,{x:0})});
}

// =====================
// 단서 트래커
// =====================
function updateClueUI() {
    const labels = ['Connect 공유','정보수령인 추가','BI 함수','Time Report'];
    const el = document.getElementById('clue-tracker');
    if(!el) return;
    el.style.display='block';
    const done = progress.filter(Boolean).length;
    el.innerHTML = '📌 진행률 ' + done + '/4 ' + progress.map((c,i)=>
        '<span style="color:'+(c?'#6bffb3':'#999')+';margin:0 5px;">'+(c?'✅':'⬜')+' Chapter '+(i+1)+'</span>'
    ).join('');
}

// =====================
// 앉기 모드
// =====================
let isSitting = false;
let sitYaw = 0;
let sitPitch = 0;

function sitDown() {
    isSitting=true;
    document.exitPointerLock();
    gsap.to(camera.position,{x:0,y:1.1,z:-1.5,duration:0.7,ease:'power2.out'});
    sitYaw=Math.PI; sitPitch=0;
    document.getElementById('sit-overlay').style.display='block';
    setTimeout(()=>canvas.requestPointerLock(), 800);
}

function standUp() {
    isSitting=false;
    document.getElementById('sit-overlay').style.display='none';
    document.exitPointerLock();
    gsap.to(camera.position,{x:0,y:1.6,z:-0.5,duration:0.5,ease:'power2.out'});
    yaw=0; pitch=0;
}

document.getElementById('sit-overlay').addEventListener('click', e=>{
    if(e.target===document.getElementById('sit-overlay')) standUp();
});

// =====================
// 이동 및 인터랙션
// =====================
const keys = {};
document.addEventListener('keydown', e=>{
    keys[e.code]=true;
    if(e.code==='Space' && gameStarted && isLocked && !isSitting && isGrounded){
        jumpVelocity=JUMP_FORCE;
        isGrounded=false;
        e.preventDefault();
    }
    if(e.code==='Escape'){
        if(isSitting) standUp();
        if(npcDialogue.style.display==='block') hideNpcDialogue();
        if(document.getElementById('minigame-overlay').style.display==='flex') closeMiniGame();
        if(document.getElementById('doorlock-overlay').style.display==='flex') closeDoorlock();
        if(document.getElementById('snack-overlay')?.style.display==='flex') closeSnackBox();
        if(computerUI && computerUI.style.display==='flex') closeComputer();
    }
});
document.addEventListener('keyup', e=>keys[e.code]=false);

let yaw=0, pitch=0, isLocked=false, bobTime=0, isMoving=false;
// 점프
let jumpVelocity=0, isGrounded=true;
const JUMP_FORCE=6.5, GRAVITY=18.0;

canvas.addEventListener('click', ()=>{
    if(gameStarted && teamsUI.style.display!=='flex' && computerUI.style.display!=='flex' && npcDialogue.style.display!=='block' && dialogueBox.style.display!=='block'){
        canvas.requestPointerLock();
    }
});

document.addEventListener('pointerlockchange', ()=>{
    isLocked=document.pointerLockElement===canvas;
    document.getElementById('crosshair').style.display=isLocked?'block':'none';
});

document.addEventListener('mousemove', e=>{
    if(!isLocked) return;
    if(isSitting){
        sitYaw -= e.movementX*0.002;
        sitPitch -= e.movementY*0.002;
        sitPitch=Math.max(-0.6,Math.min(0.6,sitPitch));
    } else {
        yaw -= e.movementX*0.002;
        pitch -= e.movementY*0.002;
        pitch=Math.max(-Math.PI/3,Math.min(Math.PI/3,pitch));
    }
});

const raycaster = new THREE.Raycaster();
const center = new THREE.Vector2(0,0);

document.addEventListener('keydown', e=>{
    if(e.code!=='KeyE'||!gameStarted) return;
    raycaster.setFromCamera(center,camera);
    const hits=raycaster.intersectObjects(scene.children,true);
    if(!hits.length||hits[0].distance>4) return;
    const obj=hits[0].object;
    if(obj.name==='my_monitor') openComputer();
    else if(obj.name==='my_chair') sitDown();
    else if(obj.name==='door'||obj.name==='doorlock') openDoorlock();
    else if(obj.name==='snack_machine') openSnackBox();
    else if(obj.name==='papers') openTypingGame(()=>{});
    else if(obj.name==='note') openNote();
    else if(obj.name==='npc'&&obj.userData&&obj.userData.name) showNpcDialogue(obj.userData);
});

function updateHint() {
    if(!isLocked) return;
    raycaster.setFromCamera(center,camera);
    const hits=raycaster.intersectObjects(scene.children,true);
    const hint=document.getElementById('interact-hint');
    if(hits.length>0&&hits[0].distance<4){
        const n=hits[0].object.name;
        const ud=hits[0].object.userData;
        if(['my_monitor','my_chair','door','doorlock','papers','note','snack_machine'].includes(n)||(n==='npc'&&ud&&ud.name)){
            hint.style.display='block'; return;
        }
    }
    hint.style.display='none';
}

let arrowT=0;
let gameStarted=false;

document.getElementById('start-btn').addEventListener('click', ()=>{
    playSound(bgm, 0.25);   // ✅ 기본 배경음
    const s=document.getElementById('start-screen');
    gsap.to(s,{opacity:0,duration:1,onComplete:()=>{
        s.style.display='none';
        gameStarted=true;
        document.getElementById('my-seat-hint').style.display='block';
        updateClueUI();
        setTimeout(()=>{
            showDialogue('📢 시스템','Teams를 먼저 확인해 볼까요? [WASD로 이동, E로 상호작용]');
        },300);
    }});
});

const clock = new THREE.Clock();
const speed=0.07, boundary=9, baseHeight=1.6;

function animate() {
    requestAnimationFrame(animate);
    const delta=clock.getDelta();
    arrowT+=delta;
    arrow.position.y=2.2+Math.sin(arrowT*3)*0.1;

    if(gameStarted&&isLocked&&!isSitting){
        const dir=new THREE.Vector3();
        isMoving=false;
        if(keys['KeyW']||keys['ArrowUp']){ dir.z-=1; isMoving=true; }
        if(keys['KeyS']||keys['ArrowDown']){ dir.z+=1; isMoving=true; }
        if(keys['KeyA']||keys['ArrowLeft']){ dir.x-=1; isMoving=true; }
        if(keys['KeyD']||keys['ArrowRight']){ dir.x+=1; isMoving=true; }
        dir.normalize().multiplyScalar(speed);
        dir.applyEuler(new THREE.Euler(0,yaw,0));
        camera.position.x=Math.max(-boundary,Math.min(boundary,camera.position.x+dir.x));
        camera.position.z=Math.max(-boundary,Math.min(boundary,camera.position.z+dir.z));
        if(isMoving && isGrounded){ bobTime+=delta*8; }
        // 점프 물리
        if(!isGrounded){
            jumpVelocity -= GRAVITY * delta;
            camera.position.y += jumpVelocity * delta;
            if(camera.position.y <= baseHeight){
                camera.position.y = baseHeight;
                jumpVelocity = 0;
                isGrounded = true;
            }
        } else {
            if(isMoving) camera.position.y = baseHeight + Math.sin(bobTime)*0.06;
            else camera.position.y += (baseHeight - camera.position.y)*0.1;
        }
        camera.rotation.order='YXZ';
        camera.rotation.y=yaw;
        camera.rotation.x=pitch;
    } else if(isSitting){
        camera.rotation.order='YXZ';
        camera.rotation.y=sitYaw;
        camera.rotation.x=sitPitch;
    }

    updateHint();
    renderer.render(scene,camera);
}

animate();

window.addEventListener('resize',()=>{
    camera.aspect=window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth,window.innerHeight);
});
