import WebView from 'react-native-webview';
import { StyleSheet, View } from 'react-native';

interface Props {
  areaAName: string;
  areaBName: string;
  mergedName: string;
}

function buildHtml(areaAName: string, areaBName: string, mergedName: string): string {
  const safe = (s: string) => s.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden;background:#0D0D1A;font-family:-apple-system,'Apple SD Gothic Neo','Malgun Gothic','Segoe UI',sans-serif;-webkit-font-smoothing:antialiased}
@keyframes amDot{0%,80%,100%{opacity:.25;transform:scale(.7)}40%{opacity:1;transform:scale(1)}}
</style>
</head>
<body>
<div style="position:relative;width:100vw;height:100vh;overflow:hidden;background:#0D0D1A">
  <canvas id="c" style="position:absolute;inset:0;width:100%;height:100%;display:block"></canvas>

  <div id="pillA" style="position:absolute;display:inline-flex;align-items:center;gap:7px;padding:7px 13px;border-radius:999px;font-size:13px;font-weight:600;letter-spacing:-.2px;white-space:nowrap;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.13);color:#EDEDF5;will-change:opacity;transform:translateX(-50%)">
    <span style="width:8px;height:8px;border-radius:50%;background:#FFD700;box-shadow:0 0 8px rgba(255,215,0,.8);flex-shrink:0"></span>
    <span>${safe(areaAName)}</span>
  </div>

  <div id="pillB" style="position:absolute;display:inline-flex;align-items:center;gap:7px;padding:7px 13px;border-radius:999px;font-size:13px;font-weight:600;letter-spacing:-.2px;white-space:nowrap;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.13);color:#EDEDF5;will-change:opacity;transform:translateX(-50%)">
    <span style="width:8px;height:8px;border-radius:50%;background:#00CED1;box-shadow:0 0 8px rgba(0,206,209,.8);flex-shrink:0"></span>
    <span>${safe(areaBName)}</span>
  </div>

  <div id="pillC" style="position:absolute;display:inline-flex;align-items:center;gap:7px;padding:8px 15px;border-radius:999px;font-size:14px;font-weight:700;letter-spacing:-.2px;white-space:nowrap;opacity:0;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.18);color:#FFFFFF;will-change:opacity,transform;transform:translateX(-50%)">
    <span style="width:9px;height:9px;border-radius:50%;background:linear-gradient(90deg,#FFD700,#00CED1);box-shadow:0 0 10px rgba(120,220,220,.8);flex-shrink:0"></span>
    <span>${safe(mergedName)}</span>
  </div>

  <div style="position:absolute;bottom:16vh;left:0;right:0;text-align:center;padding:0 32px">
    <div style="font-size:21px;font-weight:700;letter-spacing:-.4px;color:#FFFFFF">Merging areas...</div>
    <div style="margin-top:9px;font-size:14px;letter-spacing:-.2px;color:#8A8AA0">Fetching streets for the new territory</div>
    <div style="margin-top:26px;display:flex;justify-content:center;gap:8px">
      <span style="width:7px;height:7px;border-radius:50%;background:#FFD700;display:inline-block;animation:amDot 1.4s ease-in-out infinite"></span>
      <span style="width:7px;height:7px;border-radius:50%;background:#5FD9BD;display:inline-block;animation:amDot 1.4s ease-in-out .2s infinite"></span>
      <span style="width:7px;height:7px;border-radius:50%;background:#00CED1;display:inline-block;animation:amDot 1.4s ease-in-out .4s infinite"></span>
    </div>
  </div>
</div>
<script>
(function(){
  var W=window.innerWidth, H=window.innerHeight;
  var cx=W/2, cy=H*0.4;
  var rBase=56, sepMax=80, rMerged=92;
  var GOLD=[255,215,0], TEAL=[0,206,209], BURST=[190,235,255];
  var period=5200;

  var canvas=document.getElementById('c');
  var pA=document.getElementById('pillA');
  var pB=document.getElementById('pillB');
  var pC=document.getElementById('pillC');

  var dpr=Math.min(window.devicePixelRatio||1,2.5);
  canvas.width=W*dpr; canvas.height=H*dpr;
  var ctx=canvas.getContext('2d');
  ctx.setTransform(dpr,0,0,dpr,0,0);

  var stars=[];
  for(var i=0;i<46;i++){
    stars.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.1+.3,a:Math.random()*.5+.15});
  }

  // Initial pill positions
  pA.style.top = pB.style.top = pC.style.top = (cy+rBase+18)+'px';
  pC.style.left = cx+'px';

  function lerp(a,b,t){return a+(b-a)*t;}
  function clamp(v,a,b){return Math.max(a===undefined?0:a,Math.min(b===undefined?1:b,v));}
  function smooth(t){t=clamp(t);return t*t*(3-2*t);}

  function drawGlow(x,y,r,rgb,alpha){
    if(alpha<=0.01)return;
    var c=rgb[0]+','+rgb[1]+','+rgb[2];
    var g=ctx.createRadialGradient(x,y,0,x,y,r*1.9);
    g.addColorStop(0,'rgba('+c+','+(0.85*alpha)+')');
    g.addColorStop(0.32,'rgba('+c+','+(0.33*alpha)+')');
    g.addColorStop(1,'rgba('+c+',0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r*1.9,0,Math.PI*2); ctx.fill();
    var g2=ctx.createRadialGradient(x,y,0,x,y,r*0.62);
    g2.addColorStop(0,'rgba('+c+','+(0.55*alpha)+')');
    g2.addColorStop(1,'rgba('+c+',0)');
    ctx.fillStyle=g2; ctx.beginPath(); ctx.arc(x,y,r*0.62,0,Math.PI*2); ctx.fill();
  }

  function drawHex(x,y,r,alpha){
    if(alpha<0.05)return;
    var s=12;
    ctx.save();
    ctx.beginPath(); ctx.arc(x,y,r*0.9,0,Math.PI*2); ctx.clip();
    ctx.lineWidth=1;
    ctx.strokeStyle='rgba(255,255,255,'+(0.12*alpha)+')';
    var hs=Math.sqrt(3)*s, vs=1.5*s;
    for(var row=-Math.ceil(r/vs)-1;row<=Math.ceil(r/vs)+1;row++){
      var cy2=y+row*vs, off=(row&1)?hs/2:0;
      for(var col=-Math.ceil(r/hs)-1;col<=Math.ceil(r/hs)+1;col++){
        var cx2=x+col*hs+off;
        ctx.beginPath();
        for(var k=0;k<6;k++){var ang=Math.PI/180*(60*k+30);var px=cx2+s*Math.cos(ang),py=cy2+s*Math.sin(ang);k===0?ctx.moveTo(px,py):ctx.lineTo(px,py);}
        ctx.closePath(); ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawFrame(elapsed){
    var u=((elapsed%period)+period)%period/period;
    var sep;
    if(u<0.30){sep=lerp(sepMax,0,smooth(u/0.30));}
    else if(u<0.55){sep=0;}
    else if(u<0.85){sep=lerp(0,sepMax,smooth((u-0.55)/0.30));}
    else{sep=sepMax;}

    var mc=smooth(clamp((rBase-sep)/rBase));
    var twoAlpha=1-smooth(clamp((mc-0.62)/0.38));
    var mergedAlpha=smooth(clamp((mc-0.55)/0.45));
    var burst=Math.sin(Math.PI*clamp((mc-0.12)/0.72))*0.95;
    var pulse=1+0.05*Math.sin(elapsed/240);

    ctx.globalCompositeOperation='source-over';
    ctx.fillStyle='#0D0D1A';
    ctx.fillRect(0,0,W,H);

    for(var i=0;i<stars.length;i++){
      var s=stars[i];
      ctx.fillStyle='rgba(255,255,255,'+(s.a*(0.6+0.4*Math.sin(elapsed/700+s.x)))+')';
      ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill();
    }

    var xA=cx-sep, xB=cx+sep;
    ctx.globalCompositeOperation='lighter';
    drawGlow(xA,cy,rBase,GOLD,twoAlpha);
    drawGlow(xB,cy,rBase,TEAL,twoAlpha);
    if(burst>0.01) drawGlow(cx,cy,28+46*burst,BURST,burst*0.9);
    var pr=rBase;
    if(mergedAlpha>0.01){
      pr=lerp(rBase*1.12,rMerged,mergedAlpha)*pulse;
      drawGlow(cx-15,cy,pr,GOLD,mergedAlpha);
      drawGlow(cx+15,cy,pr,TEAL,mergedAlpha);
      drawGlow(cx,cy,pr*0.7,BURST,mergedAlpha*0.35);
    }

    ctx.globalCompositeOperation='source-over';
    drawHex(xA,cy,rBase,twoAlpha);
    drawHex(xB,cy,rBase,twoAlpha);
    if(mergedAlpha>0.05) drawHex(cx,cy,pr*0.92,mergedAlpha);

    pA.style.opacity=twoAlpha.toFixed(3);
    pB.style.opacity=twoAlpha.toFixed(3);
    pC.style.opacity=mergedAlpha.toFixed(3);
    pA.style.left=xA+'px';
    pB.style.left=xB+'px';
    pC.style.transform='translateX(-50%) scale('+(0.94+0.06*mergedAlpha).toFixed(3)+')';
  }

  var start=performance.now();
  function loop(now){drawFrame(now-start);requestAnimationFrame(loop);}
  requestAnimationFrame(loop);
})();
</script>
</body>
</html>`;
}

export function MergeLoadingWebView({ areaAName, areaBName, mergedName }: Props) {
  return (
    <View style={styles.container}>
      <WebView
        source={{ html: buildHtml(areaAName, areaBName, mergedName) }}
        style={styles.webview}
        scrollEnabled={false}
        bounces={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        overScrollMode="never"
        javaScriptEnabled
        originWhitelist={['*']}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  webview: { flex: 1, backgroundColor: '#0D0D1A' },
});
