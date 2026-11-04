/* KRESF Habitat Lab: real, depth-tested WebGL geometry and orbit camera.
 * Original educational 3D artwork. No remote libraries, telemetry or real hazard data.
 * The prior 2D SVG remains as the complete fallback when WebGL is unavailable.
 */
(()=>{
  'use strict';
  const scene=document.getElementById('habitat-scene');
  const canvas=document.getElementById('habitat-webgl');
  if(!scene||!canvas)return;
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
  const state={active:false,ready:false,fence:false,under:false,speed:false,virtual:false,night:false,
    phase:'idle',crossStarted:0,yaw:0.64,elevation:0.48,radius:17.8,frames:0};
  let gl,program,loc,meshes,frame=0,lastFrame=0,drag=null,lost=false;
  const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  const v3=(x,y,z)=>[x,y,z];
  const norm=(v)=>{const d=Math.hypot(...v)||1;return v.map(x=>x/d)};
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  function mul(a,b){
    const o=new Float32Array(16);
    for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];
    return o;
  }
  function projection(aspect){
    const f=1/Math.tan(Math.PI/5.2),near=.15,far=90;
    return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0]);
  }
  function cameraMatrix(){
    const x=Math.sin(state.yaw)*Math.cos(state.elevation)*state.radius;
    const z=Math.cos(state.yaw)*Math.cos(state.elevation)*state.radius;
    const y=Math.sin(state.elevation)*state.radius+1.1;
    const eye=[x,y,z],target=[0,.8,0],forward=norm(eye.map((v,i)=>v-target[i]));
    const right=norm(cross([0,1,0],forward)),up=cross(forward,right);
    return new Float32Array([
      right[0],up[0],forward[0],0,
      right[1],up[1],forward[1],0,
      right[2],up[2],forward[2],0,
      -dot(right,eye),-dot(up,eye),-dot(forward,eye),1
    ]);
  }
  function model(x,y,z,sx,sy,sz,angle=0){
    const c=Math.cos(angle),s=Math.sin(angle);
    return new Float32Array([c*sx,0,-s*sx,0,0,sy,0,0,s*sz,0,c*sz,0,x,y,z,1]);
  }
  const cube=()=>{
    const out=[];
    const faces=[
      [[0,0,1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]],
      [[0,0,-1],[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1]],
      [[1,0,0],[1,-1,1],[1,-1,-1],[1,1,-1],[1,1,1]],
      [[-1,0,0],[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,1,-1]],
      [[0,1,0],[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1]],
      [[0,-1,0],[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1]]
    ];
    for(const [n,a,b,c,d] of faces)for(const p of [a,b,c,a,c,d])out.push(...p,...n);
    return out;
  };
  function sphere(rings=11,segments=15){
    const out=[];
    const vertex=(theta,phi)=>[Math.sin(theta)*Math.cos(phi),Math.cos(theta),Math.sin(theta)*Math.sin(phi)];
    for(let i=0;i<rings;i++)for(let j=0;j<segments;j++){
      const a=vertex(Math.PI*i/rings,Math.PI*2*j/segments);
      const b=vertex(Math.PI*(i+1)/rings,Math.PI*2*j/segments);
      const c=vertex(Math.PI*(i+1)/rings,Math.PI*2*(j+1)/segments);
      const d=vertex(Math.PI*i/rings,Math.PI*2*(j+1)/segments);
      for(const q of [a,c,b,a,d,c])out.push(...q,...q);
    }
    return out;
  }
  function cylinder(segments=14){
    const out=[];
    for(let j=0;j<segments;j++){
      const a=2*Math.PI*j/segments,b=2*Math.PI*(j+1)/segments;
      const p=[Math.cos(a),-1,Math.sin(a)],q=[Math.cos(b),-1,Math.sin(b)];
      const r=[Math.cos(b),1,Math.sin(b)],t=[Math.cos(a),1,Math.sin(a)];
      for(const x of [p,r,q,p,t,r]){
        const n=norm([x[0],0,x[2]]);
        out.push(...x,...n);
      }
      for(const x of [[0,1,0],r,t])out.push(...x,0,1,0);
      for(const x of [[0,-1,0],p,q])out.push(...x,0,-1,0);
    }
    return out;
  }
  function mesh(arr){
    const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(arr),gl.STATIC_DRAW);
    return {buffer:b,count:arr.length/6};
  }
  function compile(type,source){
    const sh=gl.createShader(type);gl.shaderSource(sh,source);gl.compileShader(sh);
    if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error('Shader: '+gl.getShaderInfoLog(sh));
    return sh;
  }
  function init(){
    if(state.ready)return true;
    try{
      gl=canvas.getContext('webgl',{alpha:false,antialias:true,powerPreference:'low-power'})
        ||canvas.getContext('experimental-webgl');
      if(!gl)throw Error('WebGL unavailable');
      const vertex=compile(gl.VERTEX_SHADER,`
        attribute vec3 aPosition;attribute vec3 aNormal;
        uniform mat4 uMvp;varying float vLight;
        void main(){gl_Position=uMvp*vec4(aPosition,1.0);
          vLight=0.43+0.57*max(0.0,dot(normalize(aNormal),normalize(vec3(0.42,0.9,0.65))));
        }`);
      const fragment=compile(gl.FRAGMENT_SHADER,`
        precision mediump float;uniform vec3 uColor;uniform float uNight;varying float vLight;
        void main(){vec3 c=uColor*vLight*(1.0-uNight*0.48);gl_FragColor=vec4(c,1.0);}
      `);
      program=gl.createProgram();gl.attachShader(program,vertex);gl.attachShader(program,fragment);
      gl.linkProgram(program);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
      gl.useProgram(program);
      loc={position:gl.getAttribLocation(program,'aPosition'),normal:gl.getAttribLocation(program,'aNormal'),
        mvp:gl.getUniformLocation(program,'uMvp'),color:gl.getUniformLocation(program,'uColor'),
        night:gl.getUniformLocation(program,'uNight')};
      meshes={cube:mesh(cube()),sphere:mesh(sphere()),cylinder:mesh(cylinder())};
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.cullFace(gl.BACK);
      state.ready=true;state.active=true;
      scene.classList.add('webgl-active');
      canvas.hidden=false;
      canvas.addEventListener('pointerdown',e=>{
        if(!state.active)return;
        drag={x:e.clientX,y:e.clientY,yaw:state.yaw,elevation:state.elevation};
        canvas.setPointerCapture(e.pointerId);
      });
      canvas.addEventListener('pointermove',e=>{
        if(!drag)return;
        state.yaw=drag.yaw+(e.clientX-drag.x)*.012;
        state.elevation=clamp(drag.elevation+(e.clientY-drag.y)*.009,.17,1.23);
      });
      const release=()=>{drag=null};
      canvas.addEventListener('pointerup',release);
      canvas.addEventListener('pointercancel',release);
      canvas.addEventListener('wheel',e=>{
        if(!state.active)return;
        e.preventDefault();
        state.radius=clamp(state.radius+Math.sign(e.deltaY)*1.2,9,27);
      },{passive:false});
      canvas.addEventListener('webglcontextlost',e=>{
        e.preventDefault();lost=true;state.ready=false;state.active=false;
        scene.classList.remove('webgl-active');canvas.hidden=true;
        document.getElementById('habitat-view-label').textContent='▤ 2D fallback (graphics unavailable)';
      });
      canvas.addEventListener('webglcontextrestored',()=>{
        lost=false;state.ready=false;init();
      });
      requestAnimationFrame(render);
      return true;
    }catch(error){
      console.warn('KRESF 3D fallback:',error.message);
      state.ready=false;state.active=false;
      scene.classList.remove('webgl-active');canvas.hidden=true;
      document.getElementById('habitat-view-label').textContent='▤ 2D fallback (3D unsupported)';
      return false;
    }
  }
  const colors={
    forest:[.24,.46,.27],grass:[.29,.56,.34],grass2:[.39,.64,.39],
    road:[.26,.30,.35],soil:[.53,.39,.26],stone:[.70,.72,.67],
    tunnel:[.16,.24,.25],white:[.91,.93,.82],yellow:[.93,.71,.24],
    tree:[.38,.26,.17],leaf:[.14,.40,.28],leaf2:[.22,.53,.34],
    koala:[.53,.59,.57],koalaLight:[.72,.76,.69],nose:[.16,.20,.23],
    eye:[.09,.13,.16],ear:[.65,.52,.51],blue:[.12,.40,.63],
    car2:[.73,.31,.17],window:[.62,.84,.89],tire:[.12,.15,.16],fence:[.76,.79,.72],
    post:[.30,.37,.33],sky:[.63,.83,.87]
  };
  let viewProjection;
  function draw(shape,x,y,z,sx,sy,sz,color,rot=0){
    const data=meshes[shape],m=model(x,y,z,sx,sy,sz,rot);
    gl.bindBuffer(gl.ARRAY_BUFFER,data.buffer);
    gl.enableVertexAttribArray(loc.position);gl.vertexAttribPointer(loc.position,3,gl.FLOAT,false,24,0);
    gl.enableVertexAttribArray(loc.normal);gl.vertexAttribPointer(loc.normal,3,gl.FLOAT,false,24,12);
    gl.uniformMatrix4fv(loc.mvp,false,mul(viewProjection,m));
    gl.uniform3fv(loc.color,color);
    gl.drawArrays(gl.TRIANGLES,0,data.count);
  }
  function box(x,y,z,sx,sy,sz,c,rot=0){draw('cube',x,y,z,sx/2,sy/2,sz/2,c,rot)}
  function ball(x,y,z,sx,sy,sz,c){draw('sphere',x,y,z,sx,sy,sz,c)}
  function post(x,y,z,rad,height,c){draw('cylinder',x,y,z,rad,height/2,rad,c)}
  function vegetation(){
    box(0,-.23,0,28,.42,19,colors.grass);
    for(const [x,z,r] of [[-9,-6,1.1],[-6,-7,.8],[7,-6,.95],[10,6,1.2],
      [-10,5,1.1],[-5,7,.9],[6,7,1.2],[3,-7,.7]]){
      box(x,.04,z,r*2,.12,r*2,colors.grass2);
      post(x,.8,z,.17,1.6,colors.tree);
      ball(x,1.8,z,.85*r,.95*r,.77*r,colors.leaf);
      ball(x-.36*r,2.25,z,.65*r,.62*r,.65*r,colors.leaf2);
    }
    for(const [x,z] of [[-3,-5],[2,-5],[-4,5],[5,5],[-8,2],[8,-2]]){
      ball(x,.1,z,.58,.12,.48,colors.forest);
    }
  }
  function road(){
    box(0,.65,0,27,1.38,3.8,colors.soil);
    box(0,1.35,0,27,.25,3.7,colors.stone);
    box(0,1.51,0,27,.12,3.55,colors.road);
    box(0,1.6,-1.65,27,.19,.12,colors.white);
    box(0,1.6,1.65,27,.19,.12,colors.white);
    for(let x=-12;x<13;x+=2.6)box(x,1.59,0,1.35,.04,.08,colors.yellow);
    // Structural opening and visible passage under the raised deck at x=0.
    box(-2.1,.72,0,.55,1.35,3.9,colors.stone);
    box(2.1,.72,0,.55,1.35,3.9,colors.stone);
    box(0,1.14,0,3.7,.37,4.0,colors.stone);
    box(0,.03,0,1.8,.06,8.2,colors.soil);
    // Dark back wall of the arched-looking, three-dimensional underpass.
    if(state.under){
      for(const z of [-2.05,2.05]){
        box(-1.23,.65,z,.24,1.3,.25,colors.stone);
        box(1.23,.65,z,.24,1.3,.25,colors.stone);
        box(0,1.25,z,2.7,.27,.27,colors.stone);
      }
      box(0,.05,0,1.95,.07,8.5,colors.grass2);
    }
  }
  function fence(){
    if(!state.fence)return;
    for(const z of [-2.45,2.45]){
      for(let x=-12;x<=12;x+=1.2)post(x,.58,z,.055,1.15,colors.post);
      box(0,.83,z,25,.055,.06,colors.fence);
      box(0,.43,z,25,.045,.055,colors.fence);
    }
    // Guidance returns, leaving the underpass opening accessible.
    for(const x of [-1.7,1.7]){
      for(let z=-3.4;z<=3.4;z+=.8)post(x,.48,z,.04,.95,colors.post);
      box(x,.85,0,.06,.045,7.0,colors.fence);
    }
  }
  function vehicle(x,z,color){
    box(x,1.92,z,1.65,.40,.82,color);
    box(x-.1,2.28,z,.98,.34,.71,color);
    box(x-.10,2.33,z,.82,.23,.73,colors.window);
    for(const dx of [-.54,.54])for(const dz of [-.44,.44])
      ball(x+dx,1.74,z+dz,.19,.19,.12,colors.tire);
    box(x+.84,1.97,z,.08,.13,.55,colors.white);
    box(x-.85,1.97,z,.07,.13,.55,colors.car2);
  }
  function koala(x,z,scale=1){
    const y=.42,greys=colors;
    ball(x,y,z,.40*scale,.35*scale,.36*scale,greys.koala);
    ball(x,y+.39*scale,z+.19*scale,.31*scale,.30*scale,.28*scale,greys.koalaLight);
    for(const side of [-1,1]){
      ball(x+side*.29*scale,y+.61*scale,z+.15*scale,.17*scale,.19*scale,.14*scale,greys.koala);
      ball(x+side*.30*scale,y+.61*scale,z+.27*scale,.10*scale,.12*scale,.06*scale,greys.ear);
      ball(x+side*.13*scale,y+.43*scale,z+.46*scale,.045*scale,.052*scale,.042*scale,greys.eye);
      ball(x+side*.23*scale,y-.16*scale,z+.18*scale,.15*scale,.13*scale,.18*scale,greys.koala);
    }
    ball(x,y+.32*scale,z+.48*scale,.105*scale,.16*scale,.09*scale,greys.nose);
  }
  function render(time){
    if(!state.ready||lost)return;
    frame=requestAnimationFrame(render);
    if(document.hidden || !state.active || !scene.closest('.app-view.active'))return;
    if(time-lastFrame<30)return;
    lastFrame=time;
    const rect=canvas.getBoundingClientRect();
    const w=Math.max(1,Math.round(rect.width*Math.min(devicePixelRatio||1,1.6)));
    const h=Math.max(1,Math.round(rect.height*Math.min(devicePixelRatio||1,1.6)));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    gl.viewport(0,0,w,h);
    gl.clearColor(...(state.night?[.075,.13,.20,1]:[.66,.83,.87,1]));
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.uniform1f(loc.night,state.night?1:0);
    viewProjection=mul(projection(w/h),cameraMatrix());
    vegetation();road();fence();
    const speed=state.speed?10:5.2;
    const cycle=reduced?0:(time/1000/speed)%1;
    vehicle(-12+cycle*24,-.85,colors.blue);
    vehicle(12-cycle*24,.85,colors.car2);
    if(state.virtual){
      post(-3.5,2.6,2.6,.06,2.0,colors.post);
      ball(-3.5,3.6,2.6,.22,.22,.22,colors.yellow);
    }
    if(state.speed){
      post(4.7,2.38,2.7,.07,1.65,colors.post);
      box(4.7,3.23,2.7,.7,.72,.12,colors.yellow);
      box(4.7,3.23,2.79,.50,.12,.05,colors.nose);
    }
    const crossing=state.phase==='crossing'||state.phase==='celebrating';
    const progress=crossing?(state.phase==='celebrating'?1:clamp((performance.now()-state.crossStarted)/5500,0,1)):0;
    koala(-.45,4.25-progress*8.1,1.0);
    koala(.65,5.45-progress*8.1,.67);
    state.frames++;
  }
  function sync(values){
    const wasCrossing=state.phase==='crossing';
    Object.assign(state,values);
    if(state.phase==='crossing'&&!wasCrossing)state.crossStarted=performance.now();
  }
  function setMode(enabled){
    const on=Boolean(enabled&&state.ready&&!lost);
    state.active=on;scene.classList.toggle('webgl-active',on);
    canvas.hidden=!on;
    return on;
  }
  function zoom(factor){
    state.radius=clamp(state.radius+factor,9,27);
  }
  function resetCamera(){
    state.yaw=.64;state.elevation=.48;state.radius=17.8;
  }
  window.KresfHabitat3D={init,sync,setMode,zoom,resetCamera,state,
    supported:()=>state.ready};
})();
