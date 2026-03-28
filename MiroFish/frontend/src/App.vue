<template>
  <router-view />
</template>

<script setup></script>

<style>
*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --bg:           #0A0F1C;
  --bg2:          #0D1421;
  --bg3:          #111827;
  --neon:         #00D4FF;
  --neon-dim:     rgba(0, 212, 255, 0.15);
  --purple:       #7C3AED;
  --purple-dim:   rgba(124, 58, 237, 0.15);
  --cyan:         #22D3EE;
  --green:        #00FF88;
  --red:          #FF4D4D;
  --yellow:       #FACC15;
  --text:         #E2E8F0;
  --text-2:       #94A3B8;
  --text-3:       #475569;
  --text-4:       #334155;
  --border:       rgba(255, 255, 255, 0.08);
  --border-hi:    rgba(255, 255, 255, 0.15);
  --glass:        rgba(255, 255, 255, 0.04);
  --glass-2:      rgba(255, 255, 255, 0.07);
  --radius:       12px;
  --radius-lg:    16px;
  --radius-xl:    20px;
  --font-display: 'Rajdhani', sans-serif;
  --font-body:    'DM Sans', sans-serif;
  --font-mono:    'JetBrains Mono', monospace;
}

html, body {
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
}

#app {
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--text);
  background: var(--bg);
  min-height: 100vh;
}

::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: var(--bg2); }
::-webkit-scrollbar-thumb { background: rgba(0, 212, 255, 0.25); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(0, 212, 255, 0.45); }

button { font-family: inherit; cursor: pointer; }
a { text-decoration: none; color: inherit; }
</style>
