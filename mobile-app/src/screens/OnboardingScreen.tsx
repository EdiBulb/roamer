import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';

interface Props {
  onFinish: () => void;
}

function buildHtml(topInset: number, bottomInset: number): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no, viewport-fit=cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
  html, body { width: 100%; height: 100%; overflow: hidden; background: #0D1B2A; }

  #slider {
    display: flex;
    width: 100%;
    height: 100%;
    overflow-x: scroll;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  #slider::-webkit-scrollbar { display: none; }

  .slide {
    min-width: 100vw;
    height: 100%;
    scroll-snap-align: start;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: #0D1B2A;
  }

  .illus {
    flex: 1;
    width: 100%;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: ${topInset + 56}px 24px 12px;
  }

  .illus-inner {
    width: 100%;
    height: 100%;
    border-radius: 28px;
    overflow: hidden;
    border: 1px solid rgba(16,185,129,.28);
    box-shadow: 0 20px 60px -20px rgba(16,185,129,.4);
  }

  .text-section {
    width: 100%;
    padding: 16px 32px ${bottomInset + 120}px;
    flex-shrink: 0;
  }
  .slide-title {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 700;
    font-size: 28px;
    line-height: 1.14;
    letter-spacing: -0.6px;
    color: #f6f9fc;
    margin-bottom: 10px;
  }
  .slide-body {
    font-family: 'Manrope', sans-serif;
    font-size: 14.5px;
    line-height: 1.52;
    color: #93a4b8;
  }

  /* Skip button */
  #skip-btn {
    position: fixed;
    top: ${topInset + 8}px;
    right: 26px;
    z-index: 100;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 15px;
    font-weight: 600;
    color: #7f94ab;
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px 4px;
    letter-spacing: .2px;
  }

  /* Bottom area */
  #bottom {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100;
    padding: 18px 32px ${bottomInset + 24}px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 18px;
    pointer-events: none;
  }
  #dots {
    display: flex;
    align-items: center;
    gap: 8px;
    pointer-events: none;
  }
  .dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: rgba(255,255,255,.2);
    transition: all 0.3s ease;
    flex-shrink: 0;
  }
  .dot.active {
    width: 26px;
    border-radius: 4px;
    background: #10b981;
    box-shadow: 0 0 14px rgba(16,185,129,.7);
  }
  #cta-btn {
    display: none;
    width: 100%;
    padding: 17px;
    border: none;
    border-radius: 17px;
    background: linear-gradient(180deg, #10b981, #047857);
    color: #0D1B2A;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 17px;
    font-weight: 700;
    letter-spacing: .2px;
    cursor: pointer;
    pointer-events: all;
    box-shadow: 0 16px 34px -14px rgba(16,185,129,.75);
  }

  @keyframes ripple {
    0%   { transform: scale(.28); opacity: .9; }
    100% { transform: scale(1); opacity: 0; }
  }
  @keyframes flagWave {
    0%,100% { transform: skewY(0deg) scaleX(1); }
    30%      { transform: skewY(-5deg) scaleX(.93); }
    65%      { transform: skewY(3deg) scaleX(.97); }
  }
</style>
</head>
<body>

<button id="skip-btn" onclick="doSkip()">Skip</button>

<div id="slider">

  <!-- SLIDE 1: WELCOME -->
  <div class="slide">
    <div class="illus">
      <div class="illus-inner" style="background:radial-gradient(120% 90% at 70% 20%,#12283b 0%,#0b1725 60%,#081119 100%);">
        <svg viewBox="0 0 327 460" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%">
          <g stroke="#8aa0be" stroke-opacity=".16" stroke-width="2">
            <line x1="12" y1="0" x2="12" y2="460"/><line x1="48" y1="0" x2="48" y2="460"/>
            <line x1="84" y1="0" x2="84" y2="460"/><line x1="120" y1="0" x2="120" y2="460"/>
            <line x1="192" y1="0" x2="192" y2="460"/><line x1="228" y1="0" x2="228" y2="460"/>
            <line x1="264" y1="0" x2="264" y2="460"/><line x1="300" y1="0" x2="300" y2="460"/>
            <line x1="0" y1="24" x2="327" y2="24"/><line x1="0" y1="74" x2="327" y2="74"/>
            <line x1="0" y1="124" x2="327" y2="124"/><line x1="0" y1="174" x2="327" y2="174"/>
            <line x1="0" y1="324" x2="327" y2="324"/><line x1="0" y1="374" x2="327" y2="374"/>
            <line x1="0" y1="424" x2="327" y2="424"/>
          </g>
          <g stroke="#9fb4d0" stroke-opacity=".26" stroke-width="4">
            <line x1="156" y1="0" x2="156" y2="460"/>
            <line x1="0" y1="224" x2="327" y2="224"/>
          </g>
          <polyline points="84,424 84,274 192,274 192,124 300,124" fill="none" stroke="#10b981" stroke-width="12" stroke-opacity=".2" stroke-linecap="round" stroke-linejoin="round"/>
          <polyline points="84,424 84,274 192,274 192,124 300,124" fill="none" stroke="#10b981" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="84" cy="424" r="11" fill="#10b981" fill-opacity=".2"/>
          <circle cx="84" cy="424" r="5" fill="#10b981"/>
          <circle cx="300" cy="124" r="14" fill="#10b981" fill-opacity=".18"/>
          <circle cx="300" cy="124" r="6" fill="#10b981"/>
        </svg>
      </div>
    </div>
    <div class="text-section">
      <div class="slide-title">How well do you know your city?</div>
      <div class="slide-body">Every street you run gets painted on your map. Build your territory, one run at a time.</div>
    </div>
  </div>

  <!-- SLIDE 2: DRAW YOUR TERRITORY -->
  <div class="slide">
    <div class="illus">
      <div class="illus-inner" style="background:radial-gradient(120% 90% at 40% 30%,#0f2236 0%,#0b1725 60%,#081119 100%);">
        <svg viewBox="0 0 327 460" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%">
          <g stroke="#8aa0be" stroke-opacity=".12" stroke-width="1.5">
            <line x1="36" y1="0" x2="36" y2="460"/><line x1="72" y1="0" x2="72" y2="460"/>
            <line x1="108" y1="0" x2="108" y2="460"/><line x1="144" y1="0" x2="144" y2="460"/>
            <line x1="180" y1="0" x2="180" y2="460"/><line x1="216" y1="0" x2="216" y2="460"/>
            <line x1="252" y1="0" x2="252" y2="460"/><line x1="288" y1="0" x2="288" y2="460"/>
            <line x1="0" y1="46" x2="327" y2="46"/><line x1="0" y1="92" x2="327" y2="92"/>
            <line x1="0" y1="138" x2="327" y2="138"/><line x1="0" y1="184" x2="327" y2="184"/>
            <line x1="0" y1="230" x2="327" y2="230"/><line x1="0" y1="276" x2="327" y2="276"/>
            <line x1="0" y1="322" x2="327" y2="322"/><line x1="0" y1="368" x2="327" y2="368"/>
            <line x1="0" y1="414" x2="327" y2="414"/>
          </g>
          <!-- polygon fill -->
          <polygon points="90,95 245,75 275,195 225,345 78,325 58,188" fill="#10b981" fill-opacity=".07"/>
          <!-- polygon dashed border -->
          <polygon points="90,95 245,75 275,195 225,345 78,325 58,188" fill="none" stroke="#10b981" stroke-width="2.5" stroke-dasharray="8 6" stroke-linejoin="round"/>
          <!-- vertices -->
          <circle cx="90"  cy="95"  r="7" fill="#0b1725" stroke="#10b981" stroke-width="2.5"/>
          <circle cx="245" cy="75"  r="7" fill="#0b1725" stroke="#10b981" stroke-width="2.5"/>
          <circle cx="275" cy="195" r="7" fill="#0b1725" stroke="#10b981" stroke-width="2.5"/>
          <circle cx="225" cy="345" r="7" fill="#0b1725" stroke="#10b981" stroke-width="2.5"/>
          <circle cx="78"  cy="325" r="7" fill="#0b1725" stroke="#10b981" stroke-width="2.5"/>
          <!-- active vertex with ripple -->
          <circle cx="58" cy="188" r="34" fill="none" stroke="#10b981" stroke-width="1.5" stroke-opacity=".7" style="animation:ripple 2s ease-out infinite"/>
          <circle cx="58" cy="188" r="34" fill="none" stroke="#10b981" stroke-width="1.5" stroke-opacity=".7" style="animation:ripple 2s ease-out infinite 1s"/>
          <circle cx="58" cy="188" r="9" fill="#10b981"/>
          <!-- tip label -->
          <rect x="100" y="390" width="130" height="28" rx="14" fill="#10b981" fill-opacity=".14" stroke="#10b981" stroke-opacity=".4" stroke-width="1"/>
          <text x="165" y="408" text-anchor="middle" font-family="'Space Grotesk',sans-serif" font-weight="600" font-size="12" fill="#6ee7b7">Journey → Draw</text>
        </svg>
      </div>
    </div>
    <div class="text-section">
      <div class="slide-title">Draw your territory</div>
      <div class="slide-body">In the Journey tab, tap the map to draw a polygon around the area you want to conquer.</div>
    </div>
  </div>

  <!-- SLIDE 3: EVERY STEP COUNTS -->
  <div class="slide">
    <div class="illus">
      <div class="illus-inner" style="background:radial-gradient(110% 80% at 50% 40%,#0e2232 0%,#0a1520 65%,#060e18 100%);">
        <svg viewBox="0 0 327 460" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%">
          <!-- uncolored streets -->
          <g stroke="#243446" stroke-width="7" stroke-linecap="round">
            <line x1="0"   y1="80"  x2="327" y2="80"/>
            <line x1="0"   y1="180" x2="327" y2="180"/>
            <line x1="0"   y1="350" x2="327" y2="350"/>
            <line x1="0"   y1="420" x2="327" y2="420"/>
            <line x1="80"  y1="0"   x2="80"  y2="460"/>
            <line x1="220" y1="0"   x2="220" y2="460"/>
            <line x1="290" y1="0"   x2="290" y2="460"/>
          </g>
          <!-- colored streets (explored) with glow -->
          <line x1="0" y1="260" x2="327" y2="260" stroke="#10b981" stroke-width="14" stroke-opacity=".18" stroke-linecap="round"/>
          <line x1="0" y1="260" x2="327" y2="260" stroke="#10b981" stroke-width="7"  stroke-opacity=".9"  stroke-linecap="round"/>
          <line x1="150" y1="0" x2="150" y2="460" stroke="#10b981" stroke-width="14" stroke-opacity=".18" stroke-linecap="round"/>
          <line x1="150" y1="0" x2="150" y2="460" stroke="#10b981" stroke-width="7"  stroke-opacity=".9"  stroke-linecap="round"/>
          <!-- partial colored -->
          <line x1="0"   y1="180" x2="220" y2="180" stroke="#10b981" stroke-width="14" stroke-opacity=".14" stroke-linecap="round"/>
          <line x1="0"   y1="180" x2="220" y2="180" stroke="#10b981" stroke-width="7"  stroke-opacity=".75" stroke-linecap="round"/>
          <line x1="80"  y1="180" x2="80"  y2="460" stroke="#10b981" stroke-width="14" stroke-opacity=".14" stroke-linecap="round"/>
          <line x1="80"  y1="180" x2="80"  y2="460" stroke="#10b981" stroke-width="7"  stroke-opacity=".75" stroke-linecap="round"/>
          <!-- runner dot at intersection -->
          <circle cx="150" cy="180" r="26" fill="#10b981" fill-opacity=".1"/>
          <circle cx="150" cy="180" r="17" fill="#10b981" fill-opacity=".25"/>
          <circle cx="150" cy="180" r="10" fill="#10b981"/>
          <!-- painted streets badge -->
          <rect x="168" y="246" width="144" height="28" rx="14" fill="#10b981" fill-opacity=".18" stroke="#10b981" stroke-opacity=".5" stroke-width="1"/>
          <circle cx="186" cy="260" r="5" fill="#10b981"/>
          <text x="200" y="265" font-family="'Space Grotesk',sans-serif" font-weight="600" font-size="13" fill="#6ee7b7">+3 streets painted</text>
        </svg>
      </div>
    </div>
    <div class="text-section">
      <div class="slide-title">Every step counts</div>
      <div class="slide-body">Streets light up in real time as you run them. Watch your map come alive.</div>
    </div>
  </div>

  <!-- SLIDE 4: SAVE & SHARE -->
  <div class="slide">
    <div class="illus">
      <div class="illus-inner" style="background:#060e18;">
        <svg viewBox="0 0 327 460" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%">
          <!-- card background -->
          <rect x="28" y="28" width="271" height="404" rx="20" fill="#0d1d2e" stroke="rgba(16,185,129,.18)" stroke-width="1.5"/>
          <!-- map preview area -->
          <rect x="28" y="28" width="271" height="210" rx="20" fill="#0a1520"/>
          <rect x="28" y="218" width="271" height="20" fill="#0d1d2e"/>
          <!-- map route -->
          <polyline points="55,110 90,85 130,130 175,95 230,125 275,105" fill="none" stroke="#10b981" stroke-width="10" stroke-opacity=".18" stroke-linecap="round" stroke-linejoin="round"/>
          <polyline points="55,110 90,85 130,130 175,95 230,125 275,105" fill="none" stroke="#10b981" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
          <polyline points="70,165 120,158 175,163 240,152" fill="none" stroke="#10b981" stroke-width="8" stroke-opacity=".14" stroke-linecap="round" stroke-linejoin="round"/>
          <polyline points="70,165 120,158 175,163 240,152" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          <!-- area label -->
          <text x="47" y="255" font-family="'Space Grotesk',sans-serif" font-weight="600" font-size="10" letter-spacing="2.5" fill="#3d5468">MY AREA</text>
          <!-- distance big -->
          <text x="47" y="295" font-family="'Space Grotesk',sans-serif" font-weight="700" font-size="44" fill="#f6f9fc" letter-spacing="-1">5.2</text>
          <text x="116" y="295" font-family="'Manrope',sans-serif" font-weight="500" font-size="17" fill="#93a4b8"> km</text>
          <!-- stat pills -->
          <rect x="47" y="308" width="106" height="38" rx="10" fill="#111e2c"/>
          <text x="57" y="322" font-family="'Space Grotesk',sans-serif" font-size="9" font-weight="700" fill="#3d5468" letter-spacing="1">PACE</text>
          <text x="57" y="338" font-family="'Space Grotesk',sans-serif" font-size="17" font-weight="700" fill="#cfe0f0">5:09</text>
          <rect x="163" y="308" width="106" height="38" rx="10" fill="#111e2c"/>
          <text x="173" y="322" font-family="'Space Grotesk',sans-serif" font-size="9" font-weight="700" fill="#3d5468" letter-spacing="1">TIME</text>
          <text x="173" y="338" font-family="'Space Grotesk',sans-serif" font-size="17" font-weight="700" fill="#cfe0f0">38:12</text>
          <!-- progress bar -->
          <rect x="47" y="360" width="230" height="5" rx="3" fill="#1c2e3e"/>
          <rect x="47" y="360" width="138" height="5" rx="3" fill="#10b981"/>
          <text x="47" y="378" font-family="'Manrope',sans-serif" font-size="11" fill="#3d5468">60% of area explored</text>
          <!-- buttons -->
          <rect x="47" y="390" width="106" height="32" rx="11" fill="#10b981"/>
          <text x="100" y="410" text-anchor="middle" font-family="'Space Grotesk',sans-serif" font-weight="700" font-size="13" fill="#0D1B2A">💾  Save</text>
          <rect x="163" y="390" width="114" height="32" rx="11" fill="none" stroke="rgba(255,255,255,.15)" stroke-width="1.5"/>
          <text x="220" y="410" text-anchor="middle" font-family="'Space Grotesk',sans-serif" font-weight="700" font-size="13" fill="#cfe0f0">Share  →</text>
        </svg>
      </div>
    </div>
    <div class="text-section">
      <div class="slide-title">Show your progress</div>
      <div class="slide-body">After each run, see your stats and share a beautiful run card with friends.</div>
    </div>
  </div>

  <!-- SLIDE 5: CONQUER & MERGE -->
  <div class="slide">
    <div class="illus">
      <div class="illus-inner" style="background:radial-gradient(120% 90% at 50% 40%,#12283b 0%,#0b1725 65%,#081119 100%);">
        <svg viewBox="0 0 327 460" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%">
          <!-- two territory circles -->
          <circle cx="122" cy="220" r="112" fill="#10b981" fill-opacity=".08" stroke="#10b981" stroke-width="2.5" stroke-dasharray="8 7" stroke-opacity=".8"/>
          <circle cx="210" cy="220" r="112" fill="#10b981" fill-opacity=".08" stroke="#10b981" stroke-width="2.5" stroke-dasharray="8 7" stroke-opacity=".8"/>
          <!-- overlap center glow -->
          <circle cx="166" cy="220" r="50" fill="#10b981" fill-opacity=".18"/>
          <circle cx="166" cy="220" r="42" fill="#0b1826" stroke="#10b981" stroke-width="2.5"/>
          <!-- flag in center -->
          <line x1="166" y1="198" x2="166" y2="246" stroke="#8b98ad" stroke-width="4" stroke-linecap="round"/>
          <circle cx="166" cy="196" r="5" fill="#6ee7b7"/>
          <polygon points="170,200 198,212 170,224" fill="#10b981" style="animation:flagWave 2.8s ease-in-out infinite" transform-origin="170 212"/>
          <!-- 80% badges -->
          <rect x="52" y="350" width="66" height="26" rx="13" fill="#10b981" fill-opacity=".15" stroke="#10b981" stroke-opacity=".5" stroke-width="1"/>
          <text x="85" y="367" text-anchor="middle" font-family="'Space Grotesk',sans-serif" font-weight="700" font-size="12" fill="#6ee7b7">80% ✓</text>
          <rect x="210" y="350" width="66" height="26" rx="13" fill="#10b981" fill-opacity=".15" stroke="#10b981" stroke-opacity=".5" stroke-width="1"/>
          <text x="243" y="367" text-anchor="middle" font-family="'Space Grotesk',sans-serif" font-weight="700" font-size="12" fill="#6ee7b7">80% ✓</text>
          <!-- merge label -->
          <rect x="104" y="390" width="120" height="28" rx="14" fill="#10b981" fill-opacity=".12" stroke="#10b981" stroke-opacity=".35" stroke-width="1"/>
          <text x="164" y="408" text-anchor="middle" font-family="'Space Grotesk',sans-serif" font-weight="600" font-size="12" fill="#6ee7b7">⊕ Merge areas</text>
        </svg>
      </div>
    </div>
    <div class="text-section">
      <div class="slide-title">Plant your flag</div>
      <div class="slide-body">Explore 80% of an area to conquer it 🚩. Conquer two adjacent areas and merge them into one.</div>
    </div>
  </div>

  <!-- SLIDE 6: BUILD THE HABIT -->
  <div class="slide">
    <div class="illus">
      <div class="illus-inner" style="background:#060e18;">
        <svg viewBox="0 0 327 460" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%">
          <!-- month label -->
          <text x="164" y="44" text-anchor="middle" font-family="'Space Grotesk',sans-serif" font-weight="700" font-size="17" fill="#f6f9fc">July 2026</text>
          <!-- weekday labels -->
          <g font-family="'Space Grotesk',sans-serif" font-size="10" font-weight="600" fill="#3d5468" text-anchor="middle">
            <text x="26" y="68">Mo</text><text x="68" y="68">Tu</text><text x="110" y="68">We</text>
            <text x="152" y="68">Th</text><text x="194" y="68">Fr</text><text x="236" y="68">Sa</text><text x="278" y="68">Su</text>
          </g>
          <!-- week 1 -->
          <rect x="10"  y="76" width="32" height="32" rx="8" fill="#10b981" fill-opacity=".7"/><text x="26"  y="97" text-anchor="middle" font-family="'Manrope',sans-serif" font-size="13" font-weight="700" fill="#0D1B2A">1</text>
          <rect x="52"  y="76" width="32" height="32" rx="8" fill="#111e2c"/><text x="68"  y="97" text-anchor="middle" font-family="'Manrope',sans-serif" font-size="13" fill="#3d5468">2</text>
          <rect x="94"  y="76" width="32" height="32" rx="8" fill="#10b981" fill-opacity=".4"/><text x="110" y="97" text-anchor="middle" font-family="'Manrope',sans-serif" font-size="13" font-weight="600" fill="#6ee7b7">3</text>
          <rect x="136" y="76" width="32" height="32" rx="8" fill="#10b981" fill-opacity=".7"/><text x="152" y="97" text-anchor="middle" font-family="'Manrope',sans-serif" font-size="13" font-weight="700" fill="#0D1B2A">4</text>
          <rect x="178" y="76" width="32" height="32" rx="8" fill="#111e2c"/><text x="194" y="97" text-anchor="middle" font-family="'Manrope',sans-serif" font-size="13" fill="#3d5468">5</text>
          <rect x="220" y="76" width="32" height="32" rx="8" fill="#10b981" fill-opacity=".9"/><text x="236" y="97" text-anchor="middle" font-family="'Manrope',sans-serif" font-size="13" font-weight="700" fill="#0D1B2A">6</text>
          <rect x="262" y="76" width="32" height="32" rx="8" fill="#10b981" fill-opacity=".5"/><text x="278" y="97" text-anchor="middle" font-family="'Manrope',sans-serif" font-size="13" font-weight="700" fill="#6ee7b7">7</text>
          <!-- week 2 -->
          <rect x="10"  y="116" width="32" height="32" rx="8" fill="#111e2c"/><text x="26"  y="137" text-anchor="middle" font-family="'Manrope',sans-serif" font-size="13" fill="#3d5468">8</text>
          <rect x="52"  y="116" width="32" height="32" rx="8" fill="#10b981" fill-opacity=".6"/><text x="68"  y="137" text-anchor="middle" font-family="'Manrope',sans-serif" font-size="13" font-weight="700" fill="#0D1B2A">9</text>
          <rect x="94"  y="116" width="32" height="32" rx="8" fill="#10b981" fill-opacity=".6"/><text x="110" y="137" text-anchor="middle" font-family="'Manrope',sans-serif" font-size="13" font-weight="700" fill="#0D1B2A">10</text>
          <rect x="136" y="116" width="32" height="32" rx="8" fill="#111e2c"/><text x="152" y="137" text-anchor="middle" font-family="'Manrope',sans-serif" font-size="13" fill="#3d5468">11</text>
          <rect x="178" y="116" width="32" height="32" rx="8" fill="#10b981" fill-opacity=".35"/><text x="194" y="137" text-anchor="middle" font-family="'Manrope',sans-serif" font-size="13" font-weight="600" fill="#6ee7b7">12</text>
          <rect x="220" y="116" width="32" height="32" rx="8" fill="#10b981" fill-opacity=".8"/><text x="236" y="137" text-anchor="middle" font-family="'Manrope',sans-serif" font-size="13" font-weight="700" fill="#0D1B2A">13</text>
          <rect x="262" y="116" width="32" height="32" rx="8" fill="#10b981" fill-opacity=".5"/><text x="278" y="137" text-anchor="middle" font-family="'Manrope',sans-serif" font-size="13" font-weight="700" fill="#6ee7b7">14</text>
          <!-- streak badge -->
          <rect x="64" y="166" width="200" height="38" rx="14" fill="#10b981" fill-opacity=".12" stroke="#10b981" stroke-opacity=".35" stroke-width="1"/>
          <text x="164" y="181" text-anchor="middle" font-family="'Space Grotesk',sans-serif" font-size="10" font-weight="600" fill="#3d5468" letter-spacing="1">CURRENT STREAK</text>
          <text x="164" y="197" text-anchor="middle" font-family="'Space Grotesk',sans-serif" font-size="15" font-weight="700" fill="#6ee7b7">🔥 9 days</text>
          <!-- run history cards -->
          <rect x="16" y="222" width="295" height="56" rx="12" fill="#0d1d2e" stroke="rgba(255,255,255,.06)" stroke-width="1"/>
          <circle cx="40" cy="250" r="14" fill="#10b981" fill-opacity=".15"/>
          <text x="40" y="255" text-anchor="middle" font-size="14">🏃</text>
          <text x="62" y="243" font-family="'Space Grotesk',sans-serif" font-weight="700" font-size="13" fill="#cfe0f0">Tuesday Evening Run</text>
          <text x="62" y="260" font-family="'Manrope',sans-serif" font-size="11" fill="#3d5468">5.2 km · 38:12 · 5:09 /km</text>
          <text x="299" y="252" text-anchor="end" font-family="'Space Grotesk',sans-serif" font-size="11" fill="#10b981" font-weight="600">Jul 13</text>

          <rect x="16" y="290" width="295" height="56" rx="12" fill="#0d1d2e" stroke="rgba(255,255,255,.06)" stroke-width="1"/>
          <circle cx="40" cy="318" r="14" fill="#10b981" fill-opacity=".15"/>
          <text x="40" y="323" text-anchor="middle" font-size="14">🏃</text>
          <text x="62" y="311" font-family="'Space Grotesk',sans-serif" font-weight="700" font-size="13" fill="#cfe0f0">Sunday Morning Run</text>
          <text x="62" y="328" font-family="'Manrope',sans-serif" font-size="11" fill="#3d5468">3.8 km · 24:05 · 6:20 /km</text>
          <text x="299" y="320" text-anchor="end" font-family="'Space Grotesk',sans-serif" font-size="11" fill="#10b981" font-weight="600">Jul 6</text>

          <rect x="16" y="358" width="295" height="56" rx="12" fill="#0d1d2e" stroke="rgba(255,255,255,.06)" stroke-width="1"/>
          <circle cx="40" cy="386" r="14" fill="#10b981" fill-opacity=".15"/>
          <text x="40" y="391" text-anchor="middle" font-size="14">🏃</text>
          <text x="62" y="379" font-family="'Space Grotesk',sans-serif" font-weight="700" font-size="13" fill="#cfe0f0">Friday Afternoon Run</text>
          <text x="62" y="396" font-family="'Manrope',sans-serif" font-size="11" fill="#3d5468">6.1 km · 41:30 · 6:48 /km</text>
          <text x="299" y="388" text-anchor="end" font-family="'Space Grotesk',sans-serif" font-size="11" fill="#10b981" font-weight="600">Jul 4</text>
        </svg>
      </div>
    </div>
    <div class="text-section">
      <div class="slide-title">Track your journey</div>
      <div class="slide-body">Discoveries keeps your run history. Trail tab shows your weekly streak and habits.</div>
    </div>
  </div>

</div><!-- #slider -->

<!-- Fixed bottom -->
<div id="bottom">
  <div id="dots">
    <div class="dot active"></div>
    <div class="dot"></div>
    <div class="dot"></div>
    <div class="dot"></div>
    <div class="dot"></div>
    <div class="dot"></div>
  </div>
  <button id="cta-btn" onclick="doComplete()">Start Exploring &nbsp;→</button>
</div>

<script>
const slider = document.getElementById('slider');
const allDots = document.querySelectorAll('.dot');
const skipBtn = document.getElementById('skip-btn');
const ctaBtn  = document.getElementById('cta-btn');
const dotsEl  = document.getElementById('dots');
const TOTAL   = 6;

function updateUI() {
  const idx = Math.round(slider.scrollLeft / window.innerWidth);
  allDots.forEach((d, i) => d.classList.toggle('active', i === idx));
  const last = idx === TOTAL - 1;
  skipBtn.style.display = last ? 'none' : 'block';
  dotsEl.style.display  = last ? 'none' : 'flex';
  ctaBtn.style.display  = last ? 'block' : 'none';
}

slider.addEventListener('scroll', updateUI, { passive: true });

function doSkip()     { window.ReactNativeWebView && window.ReactNativeWebView.postMessage('finish'); }
function doComplete() { window.ReactNativeWebView && window.ReactNativeWebView.postMessage('finish'); }
</script>
</body>
</html>`;
}

export function OnboardingScreen({ onFinish }: Props) {
  const insets = useSafeAreaInsets();
  const html = buildHtml(insets.top, insets.bottom);

  return (
    <View style={styles.container}>
      <WebView
        source={{ html }}
        scrollEnabled={false}
        bounces={false}
        javaScriptEnabled
        originWhitelist={['*']}
        onMessage={(e) => {
          if (e.nativeEvent.data === 'finish') onFinish();
        }}
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1B2A' },
  webview: { flex: 1 },
});
