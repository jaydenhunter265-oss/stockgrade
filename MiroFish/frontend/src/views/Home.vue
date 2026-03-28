<template>
  <div class="page">

    <!-- ═══ AMBIENT BACKGROUND ═══ -->
    <div class="bg-grid" aria-hidden="true"></div>
    <div class="bg-orb bg-orb-1" aria-hidden="true"></div>
    <div class="bg-orb bg-orb-2" aria-hidden="true"></div>

    <!-- ═══════════════════════════════════════
         NAVBAR
    ═══════════════════════════════════════ -->
    <nav class="navbar">
      <div class="nav-inner">
        <div class="nav-brand">
          <svg class="brand-svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L22 20H2L12 2Z" stroke="#00D4FF" stroke-width="1.5" fill="rgba(0,212,255,0.08)"/>
            <path d="M12 8L16.5 16H7.5L12 8Z" fill="#00D4FF" opacity="0.5"/>
          </svg>
          <span class="brand-name">MIROFISH</span>
          <span class="brand-pill">v0.1</span>
        </div>
        <div class="nav-links">
          <a class="nav-link" href="#dashboard">Dashboard</a>
          <a class="nav-link" href="#">Markets</a>
          <a class="nav-link" href="#">Portfolio</a>
          <a class="nav-link" href="#">AI Insights</a>
          <a class="nav-link nav-github" href="https://github.com/666ghj/MiroFish" target="_blank">
            GitHub ↗
          </a>
        </div>
        <button class="nav-cta" @click="scrollToUpload">
          Launch App
          <span class="nav-cta-arr">→</span>
        </button>
      </div>
    </nav>

    <!-- ═══════════════════════════════════════
         LIVE TICKER STRIP
    ═══════════════════════════════════════ -->
    <div class="ticker-strip">
      <div class="ticker-live-badge">LIVE</div>
      <div class="ticker-overflow">
        <div class="ticker-track">
          <template v-for="rep in 2" :key="rep">
            <div
              v-for="(item, i) in tickerData"
              :key="`${rep}-${i}`"
              class="ticker-item"
              :class="item.change >= 0 ? 'up' : 'down'"
            >
              <span class="t-sym">{{ item.symbol }}</span>
              <span class="t-price">${{ item.price.toFixed(2) }}</span>
              <span class="t-chg">
                {{ item.change >= 0 ? '▲' : '▼' }} {{ Math.abs(item.change).toFixed(2) }}%
              </span>
            </div>
          </template>
        </div>
      </div>
      <div class="ticker-fade"></div>
    </div>

    <!-- ═══════════════════════════════════════
         HERO
    ═══════════════════════════════════════ -->
    <section class="hero">
      <div class="hero-left">
        <div class="hero-badge">
          <span class="hb-pulse"></span>
          AI-POWERED · REAL-TIME · MULTI-AGENT
        </div>

        <h1 class="hero-title">
          Next-Gen<br>
          <span class="hero-grad">Stock</span><br>
          Intelligence
        </h1>

        <p class="hero-sub">
          Upload any financial report. Our million-agent simulation
          predicts market outcomes before they happen.
        </p>

        <div class="hero-actions">
          <button class="btn-primary" @click="scrollToUpload">
            Start Analysis
            <span class="btn-arr">→</span>
          </button>
          <button class="btn-ghost">Watch Demo</button>
        </div>

        <div class="hero-chips">
          <div class="hero-chip">
            <div class="hc-num">$5</div>
            <div class="hc-lab">Per simulation</div>
          </div>
          <div class="hc-sep"></div>
          <div class="hero-chip">
            <div class="hc-num">1M+</div>
            <div class="hc-lab">Agents / run</div>
          </div>
          <div class="hc-sep"></div>
          <div class="hero-chip">
            <div class="hc-num">5ms</div>
            <div class="hc-lab">Avg latency</div>
          </div>
        </div>
      </div>

      <div class="hero-right">
        <!-- Main animated chart card -->
        <div class="hcc">
          <div class="hcc-header">
            <div class="hcc-sym-row">
              <span class="hcc-sym">PORTFOLIO</span>
              <span class="hcc-badge">+4.82% ▲</span>
            </div>
            <div class="hcc-price-row">
              <span class="hcc-price">$284,520</span>
              <span class="hcc-sub up">↑ $13,042 today</span>
            </div>
          </div>

          <div class="hcc-chart">
            <svg viewBox="0 0 600 160" preserveAspectRatio="none" class="hcc-svg">
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#00D4FF" stop-opacity="0.22"/>
                  <stop offset="100%" stop-color="#00D4FF" stop-opacity="0"/>
                </linearGradient>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stop-color="#7C3AED"/>
                  <stop offset="55%" stop-color="#00D4FF"/>
                  <stop offset="100%" stop-color="#22D3EE"/>
                </linearGradient>
                <filter id="glow" x="-10%" y="-80%" width="120%" height="260%">
                  <feGaussianBlur stdDeviation="3.5" result="b"/>
                  <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>
              <path :d="heroFill" fill="url(#areaGrad)"/>
              <path :d="heroLine" fill="none" stroke="url(#lineGrad)" stroke-width="2.5" filter="url(#glow)"/>
              <!-- live cursor -->
              <circle :cx="lastX" :cy="lastY" r="5" fill="#00D4FF">
                <animate attributeName="opacity" values="0.5;1;0.5" dur="1.6s" repeatCount="indefinite"/>
              </circle>
              <circle :cx="lastX" :cy="lastY" r="10" fill="none" stroke="#00D4FF" stroke-width="1" opacity="0.5">
                <animate attributeName="r" values="6;20;6" dur="1.6s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.5;0;0.5" dur="1.6s" repeatCount="indefinite"/>
              </circle>
            </svg>
          </div>

          <div class="hcc-times">
            <span>9:30</span><span>11:00</span><span>12:30</span><span>14:00</span><span>15:30</span>
          </div>

          <div class="hcc-stats">
            <div class="hcs-item">
              <div class="hcs-label">Volume</div>
              <div class="hcs-val">$2.8B</div>
            </div>
            <div class="hcs-sep"></div>
            <div class="hcs-item">
              <div class="hcs-label">High</div>
              <div class="hcs-val up">$291,040</div>
            </div>
            <div class="hcs-sep"></div>
            <div class="hcs-item">
              <div class="hcs-label">Low</div>
              <div class="hcs-val down">$271,830</div>
            </div>
          </div>
        </div>

        <!-- Floating watchlist card -->
        <div class="hero-wl">
          <div class="hwl-title">
            <span class="hwl-dot"></span>
            Live Watchlist
          </div>
          <div
            v-for="s in miniWL"
            :key="s.sym"
            class="hwl-row"
            :class="{ 'hwl-flicker': s.flicker }"
          >
            <span class="hwl-sym">{{ s.sym }}</span>
            <span class="hwl-price" :class="s.dir">{{ s.price }}</span>
            <span class="hwl-chg" :class="s.dir">{{ s.chg }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════
         DASHBOARD MOCKUP
    ═══════════════════════════════════════ -->
    <section class="dash-section" id="dashboard">
      <div class="sec-head">
        <div class="sec-eyebrow">◈ PLATFORM</div>
        <h2 class="sec-h2">Your Intelligence <span class="grad-text">Command Center</span></h2>
        <p class="sec-p">Market data, AI predictions, and portfolio analytics — unified in one interface</p>
      </div>

      <div class="dash-mock">
        <!-- Sidebar -->
        <aside class="dm-sidebar">
          <div class="dms-logo">◈</div>
          <div v-for="item in sidebarItems" :key="item.label" class="dms-item" :class="{ active: item.active }">
            <span class="dms-icon">{{ item.icon }}</span>
            <span class="dms-label">{{ item.label }}</span>
          </div>
          <div class="dms-spacer"></div>
          <div class="dms-item">
            <span class="dms-icon">⚙</span>
            <span class="dms-label">Settings</span>
          </div>
        </aside>

        <!-- Main content -->
        <main class="dm-main">
          <div class="dm-cards-row">
            <div class="dm-card" v-for="card in portfolioCards" :key="card.label">
              <div class="dmc-label">{{ card.label }}</div>
              <div class="dmc-val" :class="card.cls">{{ card.value }}</div>
              <div class="dmc-sub" :class="card.subcls">{{ card.sub }}</div>
              <div class="dmc-bar-track">
                <div class="dmc-bar" :style="{ width: card.pct + '%', background: card.color }"></div>
              </div>
            </div>
          </div>

          <div class="dm-row2">
            <div class="dm-chart-box">
              <div class="dcb-header">
                <span class="dcb-title">AAPL · Daily</span>
                <div class="dcb-tabs">
                  <span class="dcb-tab active">1D</span>
                  <span class="dcb-tab">1W</span>
                  <span class="dcb-tab">1M</span>
                  <span class="dcb-tab">1Y</span>
                </div>
              </div>
              <svg viewBox="0 0 400 85" preserveAspectRatio="none" class="dcb-svg">
                <defs>
                  <linearGradient id="aaplGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#00FF88" stop-opacity="0.18"/>
                    <stop offset="100%" stop-color="#00FF88" stop-opacity="0"/>
                  </linearGradient>
                </defs>
                <path :d="aaplFill" fill="url(#aaplGrad)"/>
                <path :d="aaplLine" fill="none" stroke="#00FF88" stroke-width="1.5"/>
              </svg>
              <div class="dcb-price">$219.44 <span class="up">+2.34%</span></div>
            </div>

            <div class="dm-activity-box">
              <div class="dab-title">Live Activity</div>
              <div
                v-for="(act, i) in activityFeed"
                :key="i"
                class="dab-row"
                :class="act.cls"
              >
                <span class="dab-dot"></span>
                <div>
                  <div class="dab-msg">{{ act.msg }}</div>
                  <div class="dab-time">{{ act.time }}</div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <!-- Right watchlist panel -->
        <div class="dm-right">
          <div class="dmr-title">Watchlist</div>
          <div
            v-for="stock in watchlistData"
            :key="stock.sym"
            class="dmr-row"
            :class="{ flicker: stock.flicker }"
          >
            <div class="dmr-info">
              <div class="dmr-sym">{{ stock.sym }}</div>
              <div class="dmr-name">{{ stock.name }}</div>
            </div>
            <svg width="48" height="20" viewBox="0 0 48 20" class="dmr-spark">
              <polyline
                :points="stock.spark"
                fill="none"
                :stroke="stock.chg >= 0 ? '#00FF88' : '#FF4D4D'"
                stroke-width="1.5"
                stroke-linejoin="round"
                stroke-linecap="round"
              />
            </svg>
            <div class="dmr-data">
              <div class="dmr-price">{{ stock.price }}</div>
              <div class="dmr-chg" :class="stock.chg >= 0 ? 'up' : 'down'">
                {{ stock.chg >= 0 ? '+' : '' }}{{ stock.chg.toFixed(2) }}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════
         FEATURES
    ═══════════════════════════════════════ -->
    <section class="features-section">
      <div class="sec-head">
        <div class="sec-eyebrow">◈ FEATURES</div>
        <h2 class="sec-h2">Built for <span class="grad-text">Serious Traders</span></h2>
        <p class="sec-p">Every tool you need to stay ahead of the market, powered by collective AI intelligence</p>
      </div>
      <div class="features-grid">
        <div class="feat-card" v-for="feat in features" :key="feat.title">
          <div class="feat-icon-box">{{ feat.icon }}</div>
          <h3 class="feat-title">{{ feat.title }}</h3>
          <p class="feat-desc">{{ feat.desc }}</p>
          <div class="feat-glow"></div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════
         STATS
    ═══════════════════════════════════════ -->
    <section class="stats-section">
      <div class="stats-grid">
        <div class="stat-item" v-for="stat in statsData" :key="stat.label">
          <div class="stat-num">{{ stat.display }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════
         UPLOAD CONSOLE (FUNCTIONAL)
    ═══════════════════════════════════════ -->
    <section class="upload-wrap" id="upload-section" ref="uploadSection">
      <div class="sec-head">
        <div class="sec-eyebrow">◈ LAUNCH ANALYSIS</div>
        <h2 class="sec-h2">Start Your <span class="grad-text">Simulation</span></h2>
        <p class="sec-p">Upload financial reports and let our million-agent AI simulate the market</p>
      </div>

      <div class="upload-layout">
        <!-- Workflow steps (left) -->
        <div class="workflow-col">
          <div class="wf-item" v-for="step in workflowSteps" :key="step.num">
            <div class="wf-num">{{ step.num }}</div>
            <div class="wf-body">
              <div class="wf-title">{{ step.title }}</div>
              <div class="wf-desc">{{ step.desc }}</div>
            </div>
          </div>
        </div>

        <!-- Console panel (right) -->
        <div class="console-panel">
          <!-- Upload zone -->
          <div class="cp-block">
            <div class="cp-label-row">
              <span class="cp-num">01</span>
              Reality Seeds
              <span class="cp-meta">PDF · MD · TXT</span>
            </div>
            <div
              class="upload-zone"
              :class="{ dragover: isDragOver, 'has-files': files.length > 0 }"
              @dragover.prevent="handleDragOver"
              @dragleave.prevent="handleDragLeave"
              @drop.prevent="handleDrop"
              @click="triggerFileInput"
            >
              <input
                ref="fileInput"
                type="file"
                multiple
                accept=".pdf,.md,.txt"
                @change="handleFileSelect"
                style="display:none"
                :disabled="loading"
              />
              <div v-if="files.length === 0" class="uz-empty">
                <div class="uz-icon">↑</div>
                <div class="uz-title">Drop files here</div>
                <div class="uz-hint">or click to browse</div>
              </div>
              <div v-else class="uz-files">
                <div v-for="(file, i) in files" :key="i" class="uz-file-row">
                  <span class="uz-ext">{{ file.name.split('.').pop().toUpperCase() }}</span>
                  <span class="uz-fname">{{ file.name }}</span>
                  <button class="uz-del" @click.stop="removeFile(i)">×</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Divider -->
          <div class="cp-divider"><span>PARAMETERS</span></div>

          <!-- Prompt input -->
          <div class="cp-block">
            <div class="cp-label-row">
              <span class="cp-num">02</span>
              Simulation Directive
            </div>
            <div class="prompt-box" :class="{ focused: promptFocused }">
              <textarea
                v-model="formData.simulationRequirement"
                class="prompt-ta"
                placeholder="// Describe the scenario to simulate (e.g., 'If Apple announces a $100B buyback, how will market sentiment shift over 48 hours?')"
                rows="5"
                :disabled="loading"
                @focus="promptFocused = true"
                @blur="promptFocused = false"
              ></textarea>
              <div class="prompt-bar">
                <span class="engine-tag">⚡ MiroFish-V1.0</span>
                <span class="char-count">{{ formData.simulationRequirement.length }}</span>
              </div>
            </div>
          </div>

          <!-- Launch button -->
          <button class="launch-btn" @click="startSimulation" :disabled="!canSubmit || loading">
            <span v-if="!loading" class="lb-content">
              <span class="lb-icon">⚡</span>
              Launch Simulation Engine
            </span>
            <span v-else class="lb-content">
              <span class="lb-spin"></span>
              Initializing...
            </span>
            <span class="lb-arr">→</span>
          </button>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════
         FOOTER
    ═══════════════════════════════════════ -->
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <span class="footer-name">MIROFISH</span>
          <span class="footer-tag">Next-Gen Stock Intelligence</span>
        </div>
        <div class="footer-links">
          <a href="https://github.com/666ghj/MiroFish" target="_blank" class="footer-link">GitHub ↗</a>
          <a href="#" class="footer-link">Docs</a>
          <a href="#" class="footer-link">API</a>
        </div>
        <div class="footer-status">
          <span class="fst-dot"></span>
          All systems operational
        </div>
      </div>
      <div class="footer-bottom">
        <span>© 2025 MiroFish — Collective Intelligence Engine</span>
        <span>v0.1 Preview Release</span>
      </div>
    </footer>

    <!-- History database (existing component) -->
    <HistoryDatabase />

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import HistoryDatabase from '../components/HistoryDatabase.vue'

const router = useRouter()

// ── Refs ───────────────────────────────────────────────────────────────────
const uploadSection = ref(null)
const fileInput = ref(null)
const promptFocused = ref(false)

// ── Form state ─────────────────────────────────────────────────────────────
const formData = ref({ simulationRequirement: '' })
const files = ref([])
const loading = ref(false)
const isDragOver = ref(false)

const canSubmit = computed(() =>
  formData.value.simulationRequirement.trim() !== '' && files.value.length > 0
)

const scrollToUpload = () => uploadSection.value?.scrollIntoView({ behavior: 'smooth' })

// ── File handling ──────────────────────────────────────────────────────────
const triggerFileInput = () => { if (!loading.value) fileInput.value?.click() }
const handleFileSelect  = (e) => addFiles(Array.from(e.target.files))
const handleDragOver    = () => { if (!loading.value) isDragOver.value = true }
const handleDragLeave   = () => { isDragOver.value = false }
const handleDrop        = (e) => {
  isDragOver.value = false
  if (!loading.value) addFiles(Array.from(e.dataTransfer.files))
}
const addFiles = (newFiles) => {
  files.value.push(...newFiles.filter(f =>
    ['pdf', 'md', 'txt'].includes(f.name.split('.').pop().toLowerCase())
  ))
}
const removeFile = (i) => files.value.splice(i, 1)

const startSimulation = () => {
  if (!canSubmit.value || loading.value) return
  import('../store/pendingUpload.js').then(({ setPendingUpload }) => {
    setPendingUpload(files.value, formData.value.simulationRequirement)
    router.push({ name: 'Process', params: { projectId: 'new' } })
  })
}

// ── Ticker data ────────────────────────────────────────────────────────────
const tickerData = ref([
  { symbol: 'AAPL',  price: 219.44,   change:  2.34  },
  { symbol: 'TSLA',  price: 348.12,   change: -1.23  },
  { symbol: 'NVDA',  price: 875.50,   change:  4.12  },
  { symbol: 'MSFT',  price: 412.30,   change:  0.87  },
  { symbol: 'AMZN',  price: 198.60,   change:  1.45  },
  { symbol: 'GOOGL', price: 171.82,   change: -0.34  },
  { symbol: 'META',  price: 527.49,   change:  2.89  },
  { symbol: 'SPY',   price: 542.80,   change:  0.62  },
  { symbol: 'QQQ',   price: 463.21,   change:  1.04  },
  { symbol: 'BTC',   price: 94200.00, change: -1.78  },
])

// ── Mini watchlist (hero floating card) ────────────────────────────────────
const miniWL = ref([
  { sym: 'AAPL', price: '$219.44', chg: '+2.34%', dir: 'up',   flicker: false },
  { sym: 'NVDA', price: '$875.50', chg: '+4.12%', dir: 'up',   flicker: false },
  { sym: 'TSLA', price: '$348.12', chg: '-1.23%', dir: 'down', flicker: false },
  { sym: 'META', price: '$527.49', chg: '+2.89%', dir: 'up',   flicker: false },
])

// ── Dashboard watchlist ────────────────────────────────────────────────────
const watchlistData = ref([
  { sym: 'AAPL', name: 'Apple Inc.',       price: '$219.44', chg:  2.34, flicker: false, spark: '0,16 6,13 12,15 18,9  24,11 30,6 36,8 42,4 48,5'  },
  { sym: 'NVDA', name: 'NVIDIA Corp.',     price: '$875.50', chg:  4.12, flicker: false, spark: '0,18 6,15 12,13 18,10 24,8  30,6 36,4 42,3 48,2'  },
  { sym: 'TSLA', name: 'Tesla, Inc.',      price: '$348.12', chg: -1.23, flicker: false, spark: '0,4  6,6  12,5  18,9  24,11 30,13 36,15 42,17 48,18' },
  { sym: 'MSFT', name: 'Microsoft Corp.',  price: '$412.30', chg:  0.87, flicker: false, spark: '0,12 6,11 12,10 18,9  24,7  30,6  36,5  42,5 48,4'  },
  { sym: 'META', name: 'Meta Platforms',   price: '$527.49', chg:  2.89, flicker: false, spark: '0,16 6,14 12,12 18,10 24,8  30,6  36,5  42,4 48,3'  },
])

// ── Activity feed ──────────────────────────────────────────────────────────
const activityFeed = ref([
  { msg: 'AAPL ↑ +2.34% — Bullish momentum confirmed',  time: 'Just now', cls: 'up'      },
  { msg: 'NVDA ↑ +4.12% — Volume surge 340%',            time: '2m ago',   cls: 'up'      },
  { msg: 'TSLA ↓ -1.23% — Resistance at $350',           time: '5m ago',   cls: 'down'    },
  { msg: 'SPY approaching 52-week high',                  time: '8m ago',   cls: 'neutral' },
  { msg: 'META ↑ +2.89% — AI revenue beat expectations', time: '12m ago',  cls: 'up'      },
])

const activityPool = [
  { msg: 'AAPL volume spike — 3.2x above average',         cls: 'up'      },
  { msg: 'AI: NVDA momentum confirmed, target $920',        cls: 'up'      },
  { msg: 'TSLA broke $350 support — watch $340',            cls: 'down'    },
  { msg: 'New simulation started: Q1 earnings impact',      cls: 'neutral' },
  { msg: 'SPY approaching all-time high resistance',        cls: 'neutral' },
  { msg: 'MSFT earnings beat — AI segment +47%',            cls: 'up'      },
  { msg: 'GOOGL ↓ ad revenue miss — Q2 concern',           cls: 'down'    },
  { msg: 'BTC -1.8% — crypto correlation with growth sells', cls: 'down'  },
]

// ── Portfolio cards ────────────────────────────────────────────────────────
const portfolioCards = ref([
  { label: 'Total Balance',  value: '$284,520', sub: '↑ $13,042 today',    cls: '',   subcls: 'up', pct: 78, color: '#00D4FF' },
  { label: 'Daily P&L',      value: '+$4,820',  sub: '+1.73% vs yesterday', cls: 'up', subcls: 'up', pct: 62, color: '#00FF88' },
  { label: 'Open Positions', value: '12',       sub: '8 profitable',        cls: '',   subcls: '',   pct: 67, color: '#7C3AED' },
])

const sidebarItems = ref([
  { icon: '⬛', label: 'Dashboard',   active: true  },
  { icon: '◉',  label: 'Markets',     active: false },
  { icon: '◈',  label: 'Portfolio',   active: false },
  { icon: '⚡',  label: 'AI Insights', active: false },
  { icon: '◎',  label: 'Alerts',      active: false },
])

// ── Features ───────────────────────────────────────────────────────────────
const features = ref([
  { icon: '⚡', title: 'Real-Time Analytics',  desc: 'Live market data with sub-millisecond updates across 10,000+ instruments globally.' },
  { icon: '🧠', title: 'AI Predictions',       desc: 'Million-agent simulations powered by collective intelligence for unprecedented market foresight.' },
  { icon: '◎',  title: 'Smart Alerts',         desc: 'Custom threshold alerts with AI-generated context and actionable analysis.' },
  { icon: '◈',  title: 'Portfolio Tracking',   desc: 'Unified portfolio view with risk analytics, P&L visualization, and rebalancing tools.' },
  { icon: '◉',  title: 'Scenario Modeling',    desc: 'Upload reports, inject variables, and test market hypotheses across parallel simulations.' },
  { icon: '⬛', title: 'Deep Interaction',     desc: 'Converse with any simulated market agent for granular post-simulation insight.' },
])

// ── Stats ──────────────────────────────────────────────────────────────────
const statsData = ref([
  { label: 'Active Traders',  target: 10000, display: '0',   prefix: '',  suffix: '+',  isFloat: false },
  { label: 'Volume Tracked',  target: 1,     display: '0',   prefix: '$', suffix: 'B+', isFloat: true  },
  { label: 'Simulations Run', target: 50000, display: '0',   prefix: '',  suffix: '+',  isFloat: false },
  { label: 'AI Accuracy',     target: 99.7,  display: '0%',  prefix: '',  suffix: '%',  isFloat: true  },
])

// ── Workflow steps ─────────────────────────────────────────────────────────
const workflowSteps = ref([
  { num: '01', title: 'Graph Build',       desc: 'Reality seed extraction & memory injection & GraphRAG construction' },
  { num: '02', title: 'Environment Setup', desc: 'Entity-relation extraction & persona generation & agent parameter configuration' },
  { num: '03', title: 'Simulation',        desc: 'Dual-platform parallel simulation & auto-parsed prediction requirements' },
  { num: '04', title: 'Report Generation', desc: 'ReportAgent deep interaction with the post-simulation environment' },
  { num: '05', title: 'Deep Interaction',  desc: 'Converse with any simulated agent for further granular market insight' },
])

// ── Hero chart ─────────────────────────────────────────────────────────────
const heroPts = ref([])

const heroLine = computed(() => {
  if (heroPts.value.length < 2) return ''
  return heroPts.value.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
})
const heroFill = computed(() => {
  if (heroPts.value.length < 2) return ''
  const pts = heroPts.value
  return `${heroLine.value} L${pts[pts.length - 1].x},160 L0,160 Z`
})
const lastX = computed(() => heroPts.value[heroPts.value.length - 1]?.x ?? 595)
const lastY = computed(() => heroPts.value[heroPts.value.length - 1]?.y ?? 80)

const buildHeroChart = () => {
  const pts = []
  let y = 118
  for (let i = 0; i < 60; i++) {
    y += (Math.random() - 0.44) * 11
    y = Math.max(18, Math.min(148, y))
    pts.push({ x: Math.round((i / 59) * 600), y: Math.round(y) })
  }
  heroPts.value = pts
}

const tickHeroChart = () => {
  if (heroPts.value.length === 0) return
  const last = heroPts.value[heroPts.value.length - 1]
  const newY = Math.max(18, Math.min(148, last.y + (Math.random() - 0.44) * 9))
  heroPts.value = [...heroPts.value.slice(1), { x: 600, y: Math.round(newY) }]
}

// ── AAPL dashboard chart ───────────────────────────────────────────────────
const aaplLine = ref('')
const aaplFill = ref('')

const buildAaplChart = () => {
  const pts = []
  let y = 60
  for (let i = 0; i < 30; i++) {
    y += (Math.random() - 0.45) * 6
    y = Math.max(8, Math.min(78, y))
    pts.push({ x: Math.round((i / 29) * 400), y: Math.round(y) })
  }
  aaplLine.value = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  aaplFill.value = `${aaplLine.value} L400,85 L0,85 Z`
}

// ── Price simulation ───────────────────────────────────────────────────────
const flickerPrices = () => {
  // Ticker
  tickerData.value = tickerData.value.map(t => ({
    ...t,
    price:  Math.max(1, t.price + (Math.random() - 0.5) * 0.7),
    change: t.change + (Math.random() - 0.5) * 0.1,
  }))
  // Dashboard watchlist
  watchlistData.value = watchlistData.value.map(s => ({
    ...s,
    flicker: Math.random() > 0.62,
    chg:     s.chg + (Math.random() - 0.5) * 0.12,
  }))
  // Hero watchlist
  miniWL.value = miniWL.value.map(s => ({ ...s, flicker: Math.random() > 0.68 }))

  setTimeout(() => {
    watchlistData.value = watchlistData.value.map(s => ({ ...s, flicker: false }))
    miniWL.value = miniWL.value.map(s => ({ ...s, flicker: false }))
  }, 320)
}

// ── Activity feed ──────────────────────────────────────────────────────────
const pushActivity = () => {
  const event = activityPool[Math.floor(Math.random() * activityPool.length)]
  activityFeed.value = [
    { ...event, time: 'Just now' },
    ...activityFeed.value.slice(0, 4).map((e, i) => ({ ...e, time: `${(i + 1) * 3}m ago` })),
  ]
}

// ── Stats counter animation ────────────────────────────────────────────────
const animateStats = () => {
  statsData.value.forEach((stat, idx) => {
    const dur = 2400
    const t0  = Date.now()
    const tick = () => {
      const prog  = Math.min((Date.now() - t0) / dur, 1)
      const eased = 1 - Math.pow(1 - prog, 3)
      const val   = stat.target * eased
      let display
      if (stat.suffix === '%') {
        display = val.toFixed(1) + stat.suffix
      } else if (val >= 1000) {
        display = stat.prefix + Math.floor(val).toLocaleString() + stat.suffix
      } else {
        display = stat.prefix + val.toFixed(1) + stat.suffix
      }
      statsData.value[idx] = { ...stat, display }
      if (prog < 1) requestAnimationFrame(tick)
    }
    setTimeout(() => requestAnimationFrame(tick), idx * 180)
  })
}

// ── Lifecycle ──────────────────────────────────────────────────────────────
const timers = []

onMounted(() => {
  buildHeroChart()
  buildAaplChart()
  timers.push(setInterval(tickHeroChart,  1600))
  timers.push(setInterval(flickerPrices,  2400))
  timers.push(setInterval(pushActivity,   5500))
  setTimeout(animateStats, 900)
})

onUnmounted(() => timers.forEach(clearInterval))
</script>

<style scoped>
/* ═══════════════════════════════════════════════════════
   PAGE & BACKGROUND
═══════════════════════════════════════════════════════ */
.page {
  min-height: 100vh;
  background: #0A0F1C;
  color: #E2E8F0;
  font-family: 'DM Sans', sans-serif;
  overflow-x: hidden;
  position: relative;
}

/* Animated dot-grid background */
.bg-grid {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background-image:
    linear-gradient(rgba(0, 212, 255, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 212, 255, 0.035) 1px, transparent 1px);
  background-size: 52px 52px;
  animation: grid-drift 30s linear infinite;
}
@keyframes grid-drift {
  from { background-position: 0 0; }
  to   { background-position: 52px 52px; }
}

/* Ambient glowing orbs */
.bg-orb {
  position: fixed;
  pointer-events: none;
  z-index: 0;
  border-radius: 50%;
  filter: blur(120px);
  animation: orb-drift 9s ease-in-out infinite;
}
.bg-orb-1 {
  width: 700px; height: 700px;
  top: -150px; left: -150px;
  background: radial-gradient(ellipse, rgba(0,212,255,0.07) 0%, transparent 70%);
}
.bg-orb-2 {
  width: 550px; height: 550px;
  bottom: 10%; right: -120px;
  background: radial-gradient(ellipse, rgba(124,58,237,0.07) 0%, transparent 70%);
  animation-delay: -4.5s;
}
@keyframes orb-drift {
  0%, 100% { transform: translate(0, 0); }
  50%       { transform: translate(25px, -35px); }
}

/* Ensure content sits above background layers */
.navbar, .ticker-strip, .hero, .dash-section,
.features-section, .stats-section, .upload-wrap, .footer {
  position: relative;
  z-index: 1;
}

/* ═══════════════════════════════════════════════════════
   NAVBAR
═══════════════════════════════════════════════════════ */
.navbar {
  position: sticky;
  top: 0;
  z-index: 200;
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  background: rgba(10, 15, 28, 0.82);
  border-bottom: 1px solid rgba(255,255,255,0.07);
}
.nav-inner {
  max-width: 1380px;
  margin: 0 auto;
  padding: 0 32px;
  height: 64px;
  display: flex;
  align-items: center;
  gap: 36px;
}
.nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.brand-svg { flex-shrink: 0; }
.brand-name {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  font-size: 1.25rem;
  letter-spacing: 2.5px;
  color: #E2E8F0;
}
.brand-pill {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.62rem;
  color: rgba(0,212,255,0.55);
  border: 1px solid rgba(0,212,255,0.2);
  padding: 2px 7px;
  border-radius: 4px;
  letter-spacing: 0.5px;
}
.nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}
.nav-link {
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748B;
  padding: 6px 14px;
  border-radius: 7px;
  transition: color 0.2s, background 0.2s;
}
.nav-link:hover { color: #E2E8F0; background: rgba(255,255,255,0.05); }
.nav-github { margin-left: auto; }
.nav-cta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  background: linear-gradient(135deg, rgba(0,212,255,0.14), rgba(124,58,237,0.14));
  border: 1px solid rgba(0,212,255,0.28);
  color: #00D4FF;
  padding: 9px 22px;
  border-radius: 9px;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.25s;
  white-space: nowrap;
}
.nav-cta:hover {
  background: linear-gradient(135deg, rgba(0,212,255,0.24), rgba(124,58,237,0.24));
  box-shadow: 0 0 24px rgba(0,212,255,0.22);
  transform: translateY(-1px);
}
.nav-cta-arr { transition: transform 0.2s; }
.nav-cta:hover .nav-cta-arr { transform: translateX(4px); }

/* ═══════════════════════════════════════════════════════
   LIVE TICKER
═══════════════════════════════════════════════════════ */
.ticker-strip {
  position: relative;
  height: 38px;
  background: rgba(0,0,0,0.28);
  border-bottom: 1px solid rgba(255,255,255,0.05);
  display: flex;
  align-items: center;
  overflow: hidden;
}
.ticker-live-badge {
  flex-shrink: 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 2px;
  color: #00FF88;
  padding: 0 14px;
  border-right: 1px solid rgba(255,255,255,0.07);
  height: 100%;
  display: flex;
  align-items: center;
  background: rgba(0,255,136,0.05);
  z-index: 2;
  position: relative;
}
.ticker-overflow { flex: 1; overflow: hidden; }
.ticker-track {
  display: flex;
  width: max-content;
  animation: ticker-run 38s linear infinite;
}
@keyframes ticker-run {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.ticker-item {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0 22px;
  border-right: 1px solid rgba(255,255,255,0.04);
  font-size: 0.76rem;
  white-space: nowrap;
}
.t-sym {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  color: #CBD5E1;
  font-size: 0.74rem;
  letter-spacing: 0.5px;
}
.t-price {
  font-family: 'JetBrains Mono', monospace;
  color: #64748B;
  font-size: 0.73rem;
}
.t-chg {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  font-weight: 600;
}
.ticker-item.up  .t-chg { color: #00FF88; }
.ticker-item.down .t-chg { color: #FF4D4D; }
.ticker-fade {
  position: absolute;
  right: 0; top: 0;
  width: 90px; height: 100%;
  background: linear-gradient(90deg, transparent, #0A0F1C);
  pointer-events: none;
  z-index: 2;
}

/* ═══════════════════════════════════════════════════════
   HERO
═══════════════════════════════════════════════════════ */
.hero {
  max-width: 1380px;
  margin: 0 auto;
  padding: 88px 32px 110px;
  display: flex;
  align-items: center;
  gap: 64px;
}
.hero-left { flex: 1; min-width: 0; }

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.68rem;
  letter-spacing: 2px;
  color: #00D4FF;
  background: rgba(0,212,255,0.07);
  border: 1px solid rgba(0,212,255,0.2);
  padding: 7px 16px;
  border-radius: 100px;
  margin-bottom: 32px;
}
.hb-pulse {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: #00FF88;
  box-shadow: 0 0 10px #00FF88;
  flex-shrink: 0;
  animation: dot-pulse 2.2s ease-in-out infinite;
}
@keyframes dot-pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 10px #00FF88; }
  50%       { opacity: 0.45; box-shadow: 0 0 4px #00FF88; }
}

.hero-title {
  font-family: 'Rajdhani', sans-serif;
  font-size: clamp(2.8rem, 6.5vw, 5.5rem);
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #E2E8F0;
  margin-bottom: 26px;
}
.hero-grad {
  background: linear-gradient(135deg, #00D4FF 0%, #7C3AED 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: inline-block;
}
.hero-sub {
  font-size: 1.08rem;
  color: #64748B;
  line-height: 1.75;
  max-width: 500px;
  margin-bottom: 38px;
}
.hero-actions {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 52px;
  flex-wrap: wrap;
}
.btn-primary {
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, #00D4FF, #7C3AED);
  color: #fff;
  border: none;
  padding: 14px 30px;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  transition: all 0.25s;
  position: relative;
  overflow: hidden;
}
.btn-primary::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.12), transparent);
  opacity: 0;
  transition: opacity 0.25s;
}
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 35px rgba(0,212,255,0.32); }
.btn-primary:hover::after { opacity: 1; }
.btn-arr { transition: transform 0.2s; font-size: 1.05rem; }
.btn-primary:hover .btn-arr { transform: translateX(4px); }
.btn-ghost {
  background: transparent;
  color: #64748B;
  border: 1px solid rgba(255,255,255,0.1);
  padding: 14px 30px;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.25s;
}
.btn-ghost:hover { color: #CBD5E1; border-color: rgba(255,255,255,0.22); background: rgba(255,255,255,0.04); }

.hero-chips { display: flex; align-items: center; }
.hero-chip { padding: 0 28px 0 0; }
.hero-chip:first-child { padding-left: 0; }
.hc-num {
  font-family: 'Rajdhani', sans-serif;
  font-size: 2rem;
  font-weight: 700;
  color: #00D4FF;
  line-height: 1;
  margin-bottom: 5px;
}
.hc-lab { font-size: 0.74rem; color: #334155; font-weight: 500; }
.hc-sep { width: 1px; height: 40px; background: rgba(255,255,255,0.07); margin: 0 28px 0 0; }

/* Hero right: chart + floating watchlist */
.hero-right {
  flex: 0 0 530px;
  position: relative;
}
/* Main chart card */
.hcc {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 18px;
  padding: 26px;
  backdrop-filter: blur(24px);
  box-shadow: 0 4px 50px rgba(0,0,0,0.45), 0 0 70px rgba(0,212,255,0.05);
}
.hcc-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 22px;
}
.hcc-sym-row { display: flex; align-items: center; gap: 10px; }
.hcc-sym {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  font-weight: 700;
  color: #64748B;
  letter-spacing: 1.5px;
}
.hcc-badge {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 5px;
  background: rgba(0,255,136,0.1);
  color: #00FF88;
  border: 1px solid rgba(0,255,136,0.2);
}
.hcc-price-row { text-align: right; }
.hcc-price {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.75rem;
  font-weight: 700;
  color: #E2E8F0;
  display: block;
  line-height: 1;
  margin-bottom: 4px;
}
.hcc-sub {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
}
.hcc-chart { height: 160px; }
.hcc-svg { width: 100%; height: 100%; }
.hcc-times {
  display: flex;
  justify-content: space-between;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  color: #1E293B;
  margin: 10px 0 18px;
}
.hcc-stats {
  display: flex;
  align-items: center;
  border-top: 1px solid rgba(255,255,255,0.06);
  padding-top: 16px;
}
.hcs-item { flex: 1; }
.hcs-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.62rem;
  color: #334155;
  margin-bottom: 5px;
}
.hcs-val {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.05rem;
  font-weight: 600;
  color: #94A3B8;
}
.hcs-sep { width: 1px; height: 32px; background: rgba(255,255,255,0.06); margin: 0 16px; }

/* Floating watchlist */
.hero-wl {
  position: absolute;
  right: -18px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(11, 17, 30, 0.92);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 13px;
  padding: 16px 18px;
  backdrop-filter: blur(30px);
  box-shadow: 0 10px 40px rgba(0,0,0,0.6), 0 0 20px rgba(0,212,255,0.06);
  min-width: 200px;
  z-index: 10;
}
.hwl-title {
  display: flex;
  align-items: center;
  gap: 7px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.62rem;
  letter-spacing: 1.5px;
  color: #334155;
  margin-bottom: 12px;
  text-transform: uppercase;
}
.hwl-dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  background: #00FF88;
  box-shadow: 0 0 7px #00FF88;
  flex-shrink: 0;
}
.hwl-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 0;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  transition: background 0.2s;
}
.hwl-row:last-child { border-bottom: none; }
.hwl-sym {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.76rem;
  font-weight: 700;
  color: #CBD5E1;
  width: 44px;
  flex-shrink: 0;
}
.hwl-price {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.73rem;
  flex: 1;
  color: #94A3B8;
}
.hwl-chg {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.68rem;
  font-weight: 700;
}
.hwl-row.hwl-flicker { animation: flicker-bg 0.35s ease; }
@keyframes flicker-bg {
  0%   { background: transparent; }
  30%  { background: rgba(0,212,255,0.1); }
  100% { background: transparent; }
}

/* ═══════════════════════════════════════════════════════
   SECTION SHARED
═══════════════════════════════════════════════════════ */
.sec-head {
  max-width: 680px;
  margin: 0 auto 64px;
  text-align: center;
}
.sec-eyebrow {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.68rem;
  letter-spacing: 3px;
  color: #00D4FF;
  margin-bottom: 16px;
}
.sec-h2 {
  font-family: 'Rajdhani', sans-serif;
  font-size: clamp(2rem, 4vw, 3.2rem);
  font-weight: 700;
  line-height: 1.12;
  color: #E2E8F0;
  margin-bottom: 16px;
  text-transform: uppercase;
}
.grad-text {
  background: linear-gradient(135deg, #00D4FF, #7C3AED);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.sec-p { font-size: 1rem; color: #475569; line-height: 1.7; }

/* ═══════════════════════════════════════════════════════
   DASHBOARD MOCKUP
═══════════════════════════════════════════════════════ */
.dash-section {
  max-width: 1380px;
  margin: 0 auto;
  padding: 60px 32px 100px;
}
.dash-mock {
  display: flex;
  background: rgba(255,255,255,0.028);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 22px;
  overflow: hidden;
  box-shadow: 0 4px 70px rgba(0,0,0,0.55), 0 0 90px rgba(0,212,255,0.04);
  min-height: 480px;
}

/* Sidebar */
.dm-sidebar {
  width: 172px;
  flex-shrink: 0;
  background: rgba(0,0,0,0.28);
  border-right: 1px solid rgba(255,255,255,0.055);
  padding: 20px 0;
  display: flex;
  flex-direction: column;
}
.dms-logo {
  font-size: 1.2rem;
  color: #00D4FF;
  text-align: center;
  padding: 6px 0 20px;
  border-bottom: 1px solid rgba(255,255,255,0.055);
  margin-bottom: 10px;
}
.dms-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  font-size: 0.78rem;
  font-weight: 500;
  color: #334155;
  cursor: pointer;
  border-left: 2px solid transparent;
  transition: all 0.2s;
}
.dms-item:hover { color: #64748B; background: rgba(255,255,255,0.03); }
.dms-item.active {
  color: #00D4FF;
  background: rgba(0,212,255,0.06);
  border-left-color: #00D4FF;
}
.dms-icon { font-size: 0.85rem; }
.dms-spacer { flex: 1; }

/* Main */
.dm-main {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
  overflow: hidden;
}
.dm-cards-row { display: flex; gap: 12px; }
.dm-card {
  flex: 1;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 13px;
  padding: 16px 18px;
  transition: border-color 0.25s, box-shadow 0.25s;
}
.dm-card:hover {
  border-color: rgba(0,212,255,0.2);
  box-shadow: 0 0 22px rgba(0,212,255,0.06);
}
.dmc-label {
  font-size: 0.68rem;
  color: #334155;
  font-family: 'JetBrains Mono', monospace;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.dmc-val {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.45rem;
  font-weight: 700;
  color: #E2E8F0;
  margin-bottom: 4px;
  line-height: 1;
}
.dmc-val.up { color: #00FF88; }
.dmc-sub { font-size: 0.7rem; color: #334155; margin-bottom: 12px; }
.dmc-bar-track { height: 3px; background: rgba(255,255,255,0.06); border-radius: 2px; overflow: hidden; }
.dmc-bar { height: 100%; border-radius: 2px; transition: width 1.2s ease; }

.dm-row2 { flex: 1; display: flex; gap: 12px; min-height: 0; }

.dm-chart-box {
  flex: 1;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 13px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.dcb-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.dcb-title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  font-weight: 700;
  color: #64748B;
  letter-spacing: 0.5px;
}
.dcb-tabs { display: flex; gap: 4px; }
.dcb-tab {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.62rem;
  padding: 3px 8px;
  border-radius: 4px;
  color: #334155;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}
.dcb-tab.active { background: rgba(0,255,136,0.1); color: #00FF88; border-color: rgba(0,255,136,0.2); }
.dcb-svg { flex: 1; width: 100%; }
.dcb-price {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.08rem;
  font-weight: 600;
  color: #94A3B8;
  margin-top: 8px;
}

.dm-activity-box {
  width: 215px;
  flex-shrink: 0;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 13px;
  padding: 16px;
  overflow: hidden;
}
.dab-title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.66rem;
  color: #334155;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin-bottom: 12px;
}
.dab-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 7px 0;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  animation: slide-in 0.35s ease;
}
@keyframes slide-in {
  from { opacity: 0; transform: translateY(-5px); }
  to   { opacity: 1; transform: translateY(0); }
}
.dab-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  margin-top: 4px;
  flex-shrink: 0;
}
.dab-row.up    .dab-dot { background: #00FF88; box-shadow: 0 0 7px #00FF88; }
.dab-row.down  .dab-dot { background: #FF4D4D; box-shadow: 0 0 7px #FF4D4D; }
.dab-row.neutral .dab-dot { background: #FACC15; }
.dab-msg { font-size: 0.7rem; color: #64748B; line-height: 1.4; margin-bottom: 2px; }
.dab-time { font-family: 'JetBrains Mono', monospace; font-size: 0.58rem; color: #1E293B; }

/* Right panel */
.dm-right {
  width: 195px;
  flex-shrink: 0;
  border-left: 1px solid rgba(255,255,255,0.055);
  background: rgba(0,0,0,0.18);
  padding: 20px 14px;
  overflow: hidden;
}
.dmr-title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.66rem;
  color: #334155;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin-bottom: 14px;
}
.dmr-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 0;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  cursor: pointer;
  transition: background 0.15s;
  border-radius: 4px;
}
.dmr-row:hover { background: rgba(255,255,255,0.03); }
.dmr-row.flicker { animation: flicker-bg 0.35s ease; }
.dmr-sym { font-family: 'JetBrains Mono', monospace; font-size: 0.73rem; font-weight: 700; color: #CBD5E1; }
.dmr-name { font-size: 0.62rem; color: #1E293B; margin-top: 1px; }
.dmr-spark { flex-shrink: 0; }
.dmr-data { text-align: right; flex: 1; }
.dmr-price { font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; color: #64748B; }
.dmr-chg { font-family: 'JetBrains Mono', monospace; font-size: 0.66rem; font-weight: 700; }

/* ═══════════════════════════════════════════════════════
   FEATURES GRID
═══════════════════════════════════════════════════════ */
.features-section {
  max-width: 1380px;
  margin: 0 auto;
  padding: 60px 32px 100px;
}
.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.feat-card {
  position: relative;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 18px;
  padding: 30px 28px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.28s, border-color 0.28s, box-shadow 0.28s;
}
.feat-card:hover {
  transform: translateY(-5px);
  border-color: rgba(0,212,255,0.24);
  box-shadow: 0 10px 45px rgba(0,0,0,0.35), 0 0 35px rgba(0,212,255,0.07);
}
.feat-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 50% -10%, rgba(0,212,255,0.07), transparent 65%);
  opacity: 0;
  transition: opacity 0.35s;
  pointer-events: none;
}
.feat-card:hover .feat-glow { opacity: 1; }
.feat-icon-box {
  width: 46px; height: 46px;
  background: rgba(0,212,255,0.07);
  border: 1px solid rgba(0,212,255,0.18);
  border-radius: 11px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.25rem;
  margin-bottom: 20px;
  transition: box-shadow 0.28s;
}
.feat-card:hover .feat-icon-box { box-shadow: 0 0 24px rgba(0,212,255,0.22); }
.feat-title {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.18rem;
  font-weight: 700;
  color: #CBD5E1;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.feat-desc { font-size: 0.875rem; color: #475569; line-height: 1.65; }

/* ═══════════════════════════════════════════════════════
   STATS SECTION
═══════════════════════════════════════════════════════ */
.stats-section {
  padding: 70px 32px;
  position: relative;
}
.stats-section::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(0,212,255,0.04), rgba(124,58,237,0.04));
  pointer-events: none;
}
.stats-grid {
  max-width: 900px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background: rgba(255,255,255,0.07);
  border-radius: 18px;
  overflow: hidden;
  position: relative;
}
.stat-item {
  background: #0A0F1C;
  padding: 44px 28px;
  text-align: center;
}
.stat-num {
  font-family: 'Rajdhani', sans-serif;
  font-size: 3rem;
  font-weight: 700;
  background: linear-gradient(135deg, #00D4FF, #7C3AED);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
  margin-bottom: 10px;
}
.stat-label { font-size: 0.78rem; color: #334155; font-weight: 500; }

/* ═══════════════════════════════════════════════════════
   UPLOAD CONSOLE
═══════════════════════════════════════════════════════ */
.upload-wrap {
  max-width: 1380px;
  margin: 0 auto;
  padding: 60px 32px 100px;
}
.upload-layout {
  display: flex;
  gap: 60px;
  align-items: flex-start;
}

/* Workflow column */
.workflow-col {
  flex: 0 0 360px;
  display: flex;
  flex-direction: column;
}
.wf-item {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  padding: 20px 0;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.wf-item:last-child { border-bottom: none; }
.wf-num {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.68rem;
  font-weight: 700;
  color: rgba(0,212,255,0.35);
  flex-shrink: 0;
  padding-top: 3px;
  width: 26px;
}
.wf-title {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.98rem;
  font-weight: 700;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 5px;
}
.wf-desc { font-size: 0.78rem; color: #334155; line-height: 1.55; }

/* Console panel */
.console-panel {
  flex: 1;
  background: rgba(255,255,255,0.028);
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 18px;
  overflow: hidden;
}
.cp-block { padding: 24px; }
.cp-label-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  color: #475569;
  margin-bottom: 14px;
}
.cp-num { color: #00D4FF; font-weight: 700; font-size: 0.75rem; }
.cp-meta { margin-left: auto; color: #1E293B; }

.upload-zone {
  border: 1px dashed rgba(255,255,255,0.1);
  border-radius: 13px;
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.25s, background 0.25s, box-shadow 0.25s;
  background: rgba(0,0,0,0.18);
  position: relative;
  overflow: hidden;
}
.upload-zone::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 50% 50%, rgba(0,212,255,0.05), transparent 65%);
  opacity: 0;
  transition: opacity 0.25s;
  pointer-events: none;
}
.upload-zone:hover { border-color: rgba(0,212,255,0.28); }
.upload-zone:hover::before { opacity: 1; }
.upload-zone.dragover {
  border-color: #00D4FF;
  background: rgba(0,212,255,0.05);
  box-shadow: 0 0 35px rgba(0,212,255,0.12);
}
.upload-zone.has-files { align-items: flex-start; }

.uz-empty { text-align: center; pointer-events: none; }
.uz-icon {
  width: 50px; height: 50px;
  border: 1px solid rgba(0,212,255,0.18);
  border-radius: 11px;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 16px;
  color: #00D4FF;
  font-size: 1.4rem;
  background: rgba(0,212,255,0.06);
}
.uz-title { font-size: 0.88rem; font-weight: 500; color: #CBD5E1; margin-bottom: 5px; }
.uz-hint { font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; color: #334155; }

.uz-files { width: 100%; padding: 16px; display: flex; flex-direction: column; gap: 8px; }
.uz-file-row {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 8px;
  padding: 10px 14px;
}
.uz-ext {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.62rem;
  font-weight: 700;
  color: #00D4FF;
  background: rgba(0,212,255,0.09);
  border: 1px solid rgba(0,212,255,0.18);
  padding: 2px 7px;
  border-radius: 4px;
  flex-shrink: 0;
}
.uz-fname { flex: 1; color: #64748B; font-size: 0.82rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.uz-del {
  background: none;
  border: none;
  color: #334155;
  font-size: 1.1rem;
  width: 24px; height: 24px;
  border-radius: 5px;
  display: flex; align-items: center; justify-content: center;
  transition: color 0.2s, background 0.2s;
  flex-shrink: 0;
}
.uz-del:hover { color: #FF4D4D; background: rgba(255,77,77,0.1); }

.cp-divider {
  display: flex;
  align-items: center;
  padding: 0 24px;
}
.cp-divider::before, .cp-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(255,255,255,0.06);
}
.cp-divider span {
  padding: 0 16px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  letter-spacing: 2.5px;
  color: #1E293B;
}

.prompt-box {
  position: relative;
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 11px;
  background: rgba(0,0,0,0.22);
  overflow: hidden;
  transition: border-color 0.25s, box-shadow 0.25s;
}
.prompt-box.focused {
  border-color: rgba(0,212,255,0.28);
  box-shadow: 0 0 24px rgba(0,212,255,0.08);
}
.prompt-ta {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  padding: 18px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  color: #94A3B8;
  line-height: 1.75;
  resize: vertical;
}
.prompt-ta::placeholder { color: #1E293B; }
.prompt-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 18px;
  border-top: 1px solid rgba(255,255,255,0.055);
  background: rgba(0,0,0,0.2);
}
.engine-tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.62rem;
  color: rgba(0,212,255,0.4);
}
.char-count { font-family: 'JetBrains Mono', monospace; font-size: 0.62rem; color: #1E293B; }

.launch-btn {
  width: 100%;
  background: linear-gradient(135deg, rgba(0,212,255,0.1), rgba(124,58,237,0.1));
  border: 1px solid rgba(0,212,255,0.22);
  color: #00D4FF;
  padding: 19px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.08rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  transition: all 0.28s;
  position: relative;
  overflow: hidden;
}
.launch-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(0,212,255,0.1), rgba(124,58,237,0.1));
  opacity: 0;
  transition: opacity 0.28s;
}
.launch-btn:not(:disabled):hover {
  border-color: rgba(0,212,255,0.45);
  box-shadow: 0 0 45px rgba(0,212,255,0.18);
  transform: translateY(-1px);
}
.launch-btn:not(:disabled):hover::before { opacity: 1; }
.launch-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.lb-content { display: flex; align-items: center; gap: 10px; position: relative; z-index: 1; }
.lb-icon { font-size: 1rem; }
.lb-arr { font-size: 1.2rem; transition: transform 0.2s; position: relative; z-index: 1; }
.launch-btn:not(:disabled):hover .lb-arr { transform: translateX(5px); }
.lb-spin {
  width: 16px; height: 16px;
  border: 2px solid rgba(0,212,255,0.25);
  border-top-color: #00D4FF;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ═══════════════════════════════════════════════════════
   FOOTER
═══════════════════════════════════════════════════════ */
.footer {
  border-top: 1px solid rgba(255,255,255,0.06);
  padding: 52px 32px 36px;
  max-width: 1380px;
  margin: 0 auto;
}
.footer-inner {
  display: flex;
  align-items: center;
  gap: 40px;
  margin-bottom: 36px;
  flex-wrap: wrap;
}
.footer-brand { flex: 1; min-width: 180px; }
.footer-name {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: 2.5px;
  color: #CBD5E1;
  display: block;
  margin-bottom: 5px;
}
.footer-tag { font-size: 0.76rem; color: #1E293B; }
.footer-links { display: flex; gap: 6px; }
.footer-link {
  font-size: 0.82rem;
  color: #334155;
  padding: 7px 14px;
  border-radius: 7px;
  border: 1px solid transparent;
  transition: all 0.2s;
}
.footer-link:hover { color: #64748B; background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.07); }
.footer-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.76rem;
  color: #334155;
}
.fst-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #00FF88;
  box-shadow: 0 0 9px #00FF88;
  animation: dot-pulse 3s ease-in-out infinite;
}
.footer-bottom {
  display: flex;
  justify-content: space-between;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.62rem;
  color: #1E293B;
  flex-wrap: wrap;
  gap: 8px;
}

/* ═══════════════════════════════════════════════════════
   COLOR UTILITIES
═══════════════════════════════════════════════════════ */
.up   { color: #00FF88; }
.down { color: #FF4D4D; }

/* ═══════════════════════════════════════════════════════
   RESPONSIVE
═══════════════════════════════════════════════════════ */
@media (max-width: 1100px) {
  .hero { flex-direction: column; gap: 52px; padding: 60px 24px 80px; }
  .hero-right { flex: none; width: 100%; max-width: 520px; margin: 0 auto; }
  .hero-wl { display: none; }
  .dash-mock { flex-wrap: wrap; min-height: auto; }
  .dm-sidebar { width: 100%; flex-direction: row; overflow-x: auto; border-right: none; border-bottom: 1px solid rgba(255,255,255,0.055); padding: 8px 12px; }
  .dms-logo { display: none; }
  .dm-right { display: none; }
  .features-grid { grid-template-columns: repeat(2, 1fr); }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .upload-layout { flex-direction: column; gap: 40px; }
  .workflow-col { flex: none; width: 100%; }
}

@media (max-width: 768px) {
  .nav-links { display: none; }
  .hero-title { font-size: 2.8rem; }
  .hero { padding: 48px 20px 64px; }
  .dash-section, .features-section, .stats-section, .upload-wrap { padding-left: 20px; padding-right: 20px; }
  .features-grid { grid-template-columns: 1fr; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .dm-cards-row { flex-direction: column; }
  .dm-row2 { flex-direction: column; }
  .dm-activity-box { width: 100%; }
}
</style>
