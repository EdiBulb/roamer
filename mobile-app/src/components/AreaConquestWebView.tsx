import { StyleSheet, View } from 'react-native';
import WebView from 'react-native-webview';

interface Props {
  areaName: string;
  pct: number;
  onClose: () => void;
}

function buildHtml(areaName: string, pct: number): string {
  const safeName = areaName.replace(/'/g, "\\'").replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safePct = Math.max(0, Math.min(100, Math.round(pct)));
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Noto+Sans+KR:wght@500;700;900&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 100%; height: 100%; overflow: hidden; background: #0D1B2A; }
  @keyframes acRaySpin { from { transform: translate(-50%,-50%) rotate(0deg); } to { transform: translate(-50%,-50%) rotate(360deg); } }
  @keyframes acGlowPulse {
    0%,100% { opacity: .55; transform: translate(-50%,-50%) scale(1); }
    50% { opacity: 1; transform: translate(-50%,-50%) scale(1.12); }
  }
  @keyframes acCrownPop {
    0% { opacity: 0; transform: scale(0) translateY(40px) rotate(-25deg); }
    55% { opacity: 1; transform: scale(1.3) translateY(-8px) rotate(6deg); }
    72% { transform: scale(.9) translateY(4px) rotate(-3deg); }
    86% { transform: scale(1.08) translateY(-2px) rotate(1deg); }
    100% { opacity: 1; transform: scale(1) translateY(0) rotate(0deg); }
  }
  @keyframes acCrownFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
  @keyframes acRise { 0% { opacity: 0; transform: translateY(26px); } 100% { opacity: 1; transform: translateY(0); } }
  @keyframes acBadgePop { 0% { opacity: 0; transform: scale(.6); } 70% { transform: scale(1.12); } 100% { opacity: 1; transform: scale(1); } }
  @keyframes acShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
  @keyframes acBtnGlow { 0%,100% { box-shadow: 0 0 0 0 rgba(16,185,129,.45), 0 10px 30px rgba(0,0,0,.5); } 50% { box-shadow: 0 0 0 8px rgba(16,185,129,0), 0 10px 30px rgba(0,0,0,.5); } }
  @keyframes acFlash { 0% { opacity: 0; } 12% { opacity: .9; } 100% { opacity: 0; } }
  @keyframes acFlagWave { 0%,100% { transform: skewY(0deg) scaleX(1); } 30% { transform: skewY(-5deg) scaleX(.93); } 65% { transform: skewY(3deg) scaleX(.97); } }
  @keyframes barFill { from { width: 0%; } to { width: ${safePct}%; } }

  #overlay {
    position: fixed; inset: 0; z-index: 10;
    background: radial-gradient(120% 80% at 50% 34%, #12314f 0%, #0D1B2A 46%, #060d16 100%);
    overflow: hidden; font-family: 'Noto Sans KR', sans-serif;
  }
  canvas { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 5; }
  #flash { position: absolute; inset: 0; background: #fff; z-index: 4; pointer-events: none; animation: acFlash 700ms ease-out both; }
  #rays {
    position: absolute; left: 50%; top: 38%; width: 200vmax; height: 200vmax;
    background: repeating-conic-gradient(from 0deg, rgba(16,185,129,.16) 0deg 6deg, transparent 6deg 18deg);
    border-radius: 50%; transform: translate(-50%,-50%);
    animation: acRaySpin 26s linear infinite; pointer-events: none;
    -webkit-mask-image: radial-gradient(circle,#000 0%,#000 34%,transparent 66%);
    mask-image: radial-gradient(circle,#000 0%,#000 34%,transparent 66%);
  }
  #glow {
    position: absolute; left: 50%; top: 38%; width: 80vw; height: 80vw;
    background: radial-gradient(circle,rgba(16,185,129,.55) 0%,rgba(5,150,105,.22) 38%,transparent 70%);
    border-radius: 50%; transform: translate(-50%,-50%);
    animation: acGlowPulse 2.6s ease-in-out infinite; pointer-events: none;
  }
  #content {
    position: relative; z-index: 6; height: 100%; display: flex;
    flex-direction: column; align-items: center; padding: 0 26px;
  }
  #label {
    margin-top: 14vh;
    color: #10b981; font-size: 13px; font-weight: 900; letter-spacing: 4px;
    animation: acRise .5s ease-out .15s both;
  }
  #crown {
    position: relative; width: 150px; height: 158px; margin: 14px 0 4px;
    animation: acCrownPop 1.1s cubic-bezier(.22,1.4,.4,1) both, acCrownFloat 3.4s ease-in-out 1.2s infinite;
    filter: drop-shadow(0 14px 22px rgba(5,150,105,.5));
  }
  #crown-shadow { position: absolute; left: 50%; bottom: 2px; transform: translateX(-50%); width: 96px; height: 28px; border-radius: 50%; background: radial-gradient(ellipse,rgba(16,185,129,.9) 0%,rgba(5,150,105,.15) 65%,transparent 80%); }
  #crown-pole-shadow { position: absolute; left: 50%; bottom: 12px; transform: translateX(-50%); width: 46px; height: 12px; border-radius: 50%; background: rgba(0,0,0,.35); filter: blur(1px); }
  #crown-pole { position: absolute; left: 50%; bottom: 10px; transform: translateX(-50%); width: 7px; height: 140px; border-radius: 6px; background: linear-gradient(90deg,#38424f,#8b98ad 42%,#eef2f8 54%,#5a6675); }
  #crown-tip { position: absolute; left: 50%; top: 0; transform: translateX(-50%); width: 17px; height: 17px; border-radius: 50%; background: radial-gradient(circle at 35% 30%,#d1fae5,#10b981 70%); box-shadow: 0 0 14px rgba(16,185,129,.9); }
  #crown-flag { position: absolute; left: calc(50% + 3px); top: 12px; width: 82px; height: 56px; background: linear-gradient(135deg,#6ee7b7,#10b981 52%,#047857); clip-path: polygon(0 0,100% 42%,100% 58%,0 100%); box-shadow: 0 6px 14px rgba(0,0,0,.4); transform-origin: left center; animation: acFlagWave 2.8s ease-in-out 1.1s infinite; }
  #crown-orb { position: absolute; left: calc(50% + 8px); top: 23px; width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,.16); }
  #conquered {
    font-family: 'Anton', sans-serif; font-size: clamp(52px,14vw,72px); line-height: .94; letter-spacing: 1px;
    color: #10b981; text-align: center; text-shadow: 0 4px 24px rgba(5,150,105,.55);
    background: linear-gradient(100deg,#6ee7b7 0%,#10b981 30%,#d1fae5 50%,#10b981 70%,#047857 100%);
    background-size: 200% 100%; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
    animation: acRise .55s ease-out .25s both, acShimmer 3.2s linear 1s infinite;
  }
  #area-pill {
    margin-top: 22px;
    background: rgba(16,185,129,.1); border: 1px solid rgba(16,185,129,.4);
    border-radius: 999px; padding: 9px 20px;
    color: #c7f5e2; font-size: 16px; font-weight: 700; white-space: nowrap;
    animation: acRise .55s ease-out .4s both;
    max-width: 90%; overflow: hidden; text-overflow: ellipsis;
  }
  #pct-wrap {
    margin-top: 26px; text-align: center;
    animation: acBadgePop .6s cubic-bezier(.22,1.4,.4,1) .55s both;
  }
  #pct-num { font-family: 'Anton', sans-serif; font-size: 60px; color: #fff; line-height: 1; text-shadow: 0 2px 14px rgba(0,0,0,.5); }
  #pct-sym { font-size: 34px; color: #10b981; }
  #pct-label { color: #8ba0bd; font-size: 14px; font-weight: 700; letter-spacing: 2px; margin-top: 2px; }
  #bar-wrap {
    margin-top: 16px; width: 190px; height: 8px; border-radius: 8px;
    background: rgba(255,255,255,.1); overflow: hidden;
    animation: acRise .5s ease-out .7s both;
  }
  #bar-fill {
    height: 100%; width: 0%; border-radius: 8px;
    background: linear-gradient(90deg,#059669,#10b981,#a7f3d0);
    animation: barFill 1.4s cubic-bezier(.2,.7,.2,1) 0.8s forwards;
  }
  #spacer { flex: 1.2; }
  #close-btn {
    width: 100%; max-width: 315px; margin-bottom: 10vh; padding: 17px;
    border: none; border-radius: 18px;
    background: linear-gradient(180deg,#10b981,#047857);
    color: #0D1B2A; font-family: 'Noto Sans KR', sans-serif;
    font-size: 17px; font-weight: 900; letter-spacing: 1px; cursor: pointer;
    animation: acBtnGlow 2.4s ease-in-out 1s infinite;
  }
</style>
</head>
<body>
<div id="overlay">
  <canvas id="canvas"></canvas>
  <div id="flash"></div>
  <div id="rays"></div>
  <div id="glow"></div>
  <div id="content">
    <div id="label">AREA CONQUERED</div>
    <div id="crown">
      <div id="crown-shadow"></div>
      <div id="crown-pole-shadow"></div>
      <div id="crown-pole"></div>
      <div id="crown-tip"></div>
      <div id="crown-flag"></div>
      <div id="crown-orb"></div>
    </div>
    <div id="conquered">CONQUERED!</div>
    <div id="area-pill">📍 ${safeName}</div>
    <div id="pct-wrap">
      <div id="pct-num"><span id="pct-val">0</span><span id="pct-sym">%</span></div>
      <div id="pct-label">EXPLORED</div>
    </div>
    <div id="bar-wrap"><div id="bar-fill"></div></div>
    <div id="spacer"></div>
    <button id="close-btn" onclick="closeModal()">CLOSE</button>
  </div>
</div>
<script>
const TARGET_PCT = ${safePct};

function closeModal() {
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage('close');
  }
}

// Count-up animation
(function countUp() {
  const el = document.getElementById('pct-val');
  const dur = 1300, t0 = performance.now();
  function step(now) {
    const k = Math.min(1, (now - t0) / dur);
    const eased = 1 - Math.pow(1 - k, 3);
    el.textContent = Math.round(eased * TARGET_PCT);
    if (k < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
})();

// Canvas confetti
(function initConfetti() {
  const canvas = document.getElementById('canvas');
  const W = canvas.offsetWidth || window.innerWidth;
  const H = canvas.offsetHeight || window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = W * dpr; canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const particles = [];
  const cols = ['#10B981','#059669','#FFF2B0','#ffffff','#8ba0bd','#34d399'];

  function burst(n, xFrac, yFrac, speedMult) {
    const ox = W * xFrac, oy = H * yFrac;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = (4 + Math.random() * 9) * (speedMult || 1);
      particles.push({
        x: ox, y: oy,
        vx: Math.cos(a) * sp * (0.6 + Math.random()),
        vy: Math.sin(a) * sp - 3,
        g: 0.14 + Math.random() * 0.1,
        s: 5 + Math.random() * 7,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        col: cols[(Math.random() * cols.length) | 0],
        life: 0, max: 150 + Math.random() * 120,
        shape: Math.random() < 0.5 ? 'rect' : 'circ',
      });
    }
  }

  burst(280, 0.5, 0.32);
  setTimeout(() => burst(110, 0.18, 0.28, 0.8), 350);
  setTimeout(() => burst(110, 0.82, 0.28, 0.8), 550);
  setTimeout(() => burst(90, 0.5, 0.32), 800);

  function loop() {
    requestAnimationFrame(loop);
    ctx.clearRect(0, 0, W, H);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vy += p.g; p.vx *= 0.99; p.x += p.vx; p.y += p.vy;
      p.rot += p.vr; p.life++;
      const alpha = p.life > p.max ? Math.max(0, 1 - (p.life - p.max) / 40) : 1;
      if (p.y > H + 30 || alpha <= 0) { particles.splice(i, 1); continue; }
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.col;
      if (p.shape === 'rect') ctx.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * 0.66);
      else { ctx.beginPath(); ctx.arc(0, 0, p.s / 2, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
  }
  loop();
})();
</script>
</body>
</html>`;
}

export function AreaConquestWebView({ areaName, pct, onClose }: Props) {
  return (
    <View style={styles.container}>
      <WebView
        source={{ html: buildHtml(areaName, pct) }}
        scrollEnabled={false}
        bounces={false}
        javaScriptEnabled
        originWhitelist={['*']}
        onMessage={(e) => {
          if (e.nativeEvent.data === 'close') onClose();
        }}
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, zIndex: 100 },
  webview: { flex: 1, backgroundColor: '#0D1B2A' },
});
