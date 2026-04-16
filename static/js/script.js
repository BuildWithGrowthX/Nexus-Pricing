// Global variables
let weights = { demand: 0.45, scarcity: 0.30, comp: 0.15, time: 0.10, seg: 0.08, season: 0.07 };
let currency = '$';
let theme = localStorage.getItem('nexus_theme') || 'dark'; // Local fallback to prevent flicker
let isOffline = false;

if (theme === 'light') document.body.classList.add('light-theme');
else document.body.classList.remove('light-theme');

// Global charts
let simChart;
let calcDebounce;

document.addEventListener('DOMContentLoaded', async () => {
    initPriceDynamicsChart();
    initRadarChart();
    initRevenueChart();
    initDemandChart();
    setupListeners();
    syncOfflineQueue(); // Attempt to sync on load

    // Load global settings
    await loadGlobalSettings();

    // Update currency labels across the app
    document.querySelectorAll('.currency-label').forEach(el => el.innerText = currency);

    // Trigger initial route logic
    const path = window.location.pathname;
    if (path === '/' || path.includes('dashboard')) {
        await renderDashboardStats();
        calculateLive();
    } else if (path.includes('simulator')) {
        calcSim('a'); calcSim('b');
    } else if (path.includes('analytics')) {
        await renderAnalytics();
    } else if (path.includes('history')) {
        await renderHistory();
    } else if (path.includes('settings')) {
        renderSettingsUI();
    }
});

// ==========================================
// API FETCH WRAPPER AND OFFLINE MODE
// ==========================================
async function apiFetch(url, options = {}) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error("Unauthorized");
            }
            throw new Error(`Server response not ok: ${response.status}`);
        }
        const data = await response.json();
        setOfflineStatus(false);
        return data;
    } catch (error) {
        console.error("API Call Failed:", error);
        if (error.message !== "Unauthorized") {
            setOfflineStatus(true);
        }
        throw error;
    }
}

function setOfflineStatus(status) {
    isOffline = status;
    const banner = document.getElementById('offline-banner');
    const syncIcon = document.getElementById('banner-sync-icon');
    const syncText = document.getElementById('banner-sync-text');
    
    if (isOffline) {
        if(banner) banner.style.display = 'block';
        if(syncIcon) syncIcon.innerText = '⚠️';
        if(syncText) syncText.innerText = 'Offline';
    } else {
        if(banner) banner.style.display = 'none';
        if(syncIcon) syncIcon.innerText = '☁️';
        if(syncText) syncText.innerText = 'Synced';
        syncOfflineQueue();
    }
}

function showToast(message, isError = false) {
    const container = document.getElementById('toast-container');
    if(!container) return;
    const toast = document.createElement('div');
    toast.className = 'glass-panel fade-in';
    toast.style.background = isError ? 'rgba(239, 68, 68, 0.9)' : 'rgba(16, 185, 129, 0.9)';
    toast.style.color = 'white';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '5px';
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

function getOfflineQueue() {
    return JSON.parse(localStorage.getItem('nexus_offline_queue') || '[]');
}

async function syncOfflineQueue() {
    if(isOffline) return;
    let queue = getOfflineQueue();
    if(queue.length === 0) return;
    
    // Attempt to sync
    let remaining = [];
    for(let i=0; i<queue.length; i++) {
        try {
            await fetch('/api/save-pricing', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(queue[i])
            });
        } catch(e) {
            remaining.push(queue[i]);
        }
    }
    
    localStorage.setItem('nexus_offline_queue', JSON.stringify(remaining));
    if(remaining.length < queue.length) {
        showToast(`Synced ${queue.length - remaining.length} records from offline queue!`);
        if (window.location.pathname === '/' || window.location.pathname.includes('dashboard')) {
            renderDashboardStats();
        }
    }
}

// ==========================================
// DATA LOADING
// ==========================================
async function loadGlobalSettings() {
    try {
        const s = await apiFetch('/api/settings');
        weights = {
            demand: s.demand_weight, scarcity: s.scarcity_weight, comp: s.competition_weight,
            time: s.time_weight, seg: s.segment_weight, season: s.season_weight
        };
        currency = s.currency;
        if (s.theme) {
            theme = s.theme;
            localStorage.setItem('nexus_theme', theme);
            if (theme === 'light') document.body.classList.add('light-theme');
            else document.body.classList.remove('light-theme');
        }
    } catch(e) {
        console.log("Using default settings due to offline.");
    }
    
    // Ensure labels fetch the updated valid currency
    document.querySelectorAll('.currency-label').forEach(el => el.innerText = currency);
}

async function renderDashboardStats() {
    const elCalcs = document.getElementById('banner-calcs');
    if(!elCalcs) return; // Not on dashboard
    
    try {
        const stats = await apiFetch('/api/dashboard-stats');
        elCalcs.innerText = stats.total_calculations;
        const rf = document.getElementById('banner-rev');
        if(rf) rf.innerText = (stats.currency || '$') + stats.revenue_optimized.toLocaleString();
        const rs = document.getElementById('banner-strat');
        if(rs) rs.innerText = stats.best_strategy;

    } catch(e) {
        elCalcs.innerText = 'N/A';
    }
}

// ==========================================
// LOGIC
// ==========================================
async function calculateLive() {
    if(!document.getElementById('base_price')) return;

    let base = parseFloat(document.getElementById('base_price').value) || 0;
    let comp = parseFloat(document.getElementById('comp_price').value) || 0;
    let demVal = parseFloat(document.getElementById('demand').value) || 1.0;
    let stockVal = parseInt(document.getElementById('stock').value) || 50;

    let sum = computeScores(base, comp, demVal, stockVal,
        document.getElementById('time').value,
        document.getElementById('segment').value,
        document.getElementById('season').value
    );

    let res = executeStaticML(base, sum);
    
    // Update local UI (rule-based)
    document.getElementById('res-rule').innerText = currency + res.price.toFixed(2);
    document.getElementById('res-conf').innerText = Math.round(res.conf) + '%';
    document.getElementById('res-strat').innerText = res.strat;
    document.getElementById('res-mult').innerText = 'Multiplier: ' + res.mult.toFixed(2) + 'x';
    updateExplain(sum);

    // Debounce predict
    clearTimeout(calcDebounce);
    calcDebounce = setTimeout(async () => {
        try {
            document.getElementById('res-ml').innerText = '...';
            const payload = {
                base_price: base, 
                demand_level: demVal, 
                stock: stockVal, 
                competitor_price: comp,
                category: document.getElementById('category').value,
                time: document.getElementById('time').value,
                segment: document.getElementById('segment').value,
                season: document.getElementById('season').value
            };
            const predictRes = await apiFetch('/api/predict', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });
            document.getElementById('res-ml').innerText = currency + predictRes.predicted_price.toFixed(2);
        } catch(e) {
            document.getElementById('res-ml').innerText = currency + res.price.toFixed(2);
        }
        updateRadarChart();
        updateRevenueChart();
        updateDemandChart();
    }, 500);
}

function computeScores(base, comp, dem_raw, stock, time_val, seg_raw, sea_raw) {
    let dem_score = parseFloat(dem_raw) - 1.0; 
    let sca_score = (100 - parseFloat(stock)) / 100.0;
    let comp_score = base === 0 ? 0 : (comp - base) / base;
    let time_score = parseFloat(time_val) * 0.33;
    let seg_score = parseFloat(seg_raw) - 1.0;
    let sea_score = parseFloat(sea_raw) - 1.0;
    return { dem_score, sca_score, comp_score, time_score, seg_score, sea_score };
}

function executeStaticML(base, scores) {
    let mult = 1 + (weights.demand * scores.dem_score) 
                 + (weights.scarcity * scores.sca_score)
                 + (weights.comp * scores.comp_score)
                 + (weights.time * scores.time_score)
                 + (weights.seg * scores.seg_score)
                 + (weights.season * scores.sea_score);
    
    mult = Math.max(0.5, mult);
    let price = base * mult;
    let extremeSum = Math.abs(scores.dem_score) + Math.abs(scores.sca_score) + Math.abs(scores.comp_score);
    let conf = Math.max(75, 98 - (extremeSum * 5)); 
    
    let strat = "Competitive Pricing";
    if (mult < 0.9) strat = "Penetration Pricing";
    else if (mult >= 0.9 && mult <= 1.1) strat = "Competitive Pricing";
    else if (mult > 1.1 && mult <= 1.4) strat = "Value-Based Pricing";
    else if (mult > 1.4 && mult <= 1.8) strat = "Peak Pricing";
    else if (mult > 1.8) strat = "Surge Pricing";

    return { price, mult, conf, strat };
}

function updateExplain(sum) {
    const tbody = document.getElementById('explain-body');
    if(!tbody) return;
    const trs = [];
    const formatRow = (name, w, s) => {
        let val = (w * s);
        let pContrib = (val * 100).toFixed(1) + '%';
        let tag = val > 0.05 ? '<span class="tag badge-green">Price Up</span>' : 
                  val < -0.05 ? '<span class="tag badge-red">Price Down</span>' : '<span class="tag" style="background:#333;color:white">Neutral</span>';
        return `<tr><td>${name}</td><td>${w.toFixed(2)}</td><td>${val > 0 ? '+':''}${pContrib}</td><td>${tag}</td></tr>`;
    };
    trs.push(formatRow('Demand', weights.demand, sum.dem_score));
    trs.push(formatRow('Scarcity', weights.scarcity, sum.sca_score));
    trs.push(formatRow('Competition', weights.comp, sum.comp_score));
    trs.push(formatRow('Time Sens', weights.time, sum.time_score));
    trs.push(formatRow('Segment', weights.seg, sum.seg_score));
    trs.push(formatRow('Season', weights.season, sum.sea_score));
    tbody.innerHTML = trs.join('');
}

async function saveRecord() {
    const btn = document.getElementById('btn-save');
    const old = btn.innerText; btn.innerText = "Saving...";

    let p = document.getElementById('prod_name').value || 'Un-named Product';
    let base = parseFloat(document.getElementById('base_price').value) || 0;
    let mlPriceText = document.getElementById('res-ml').innerText;
    let ml = parseFloat(mlPriceText.replace(/[^\d.-]/g, '')) || base;
    let multText = document.getElementById('res-mult').innerText;
    let mult = parseFloat(multText.replace(/[^\d.-]/g, '')) || 1.0;
    let confText = document.getElementById('res-conf').innerText;
    
    let payload = {
        product_name: p,
        category: document.getElementById('category').value,
        base_price: base,
        competitor_price: parseFloat(document.getElementById('comp_price').value)||0,
        final_price: ml, // Storing ML price as final
        ml_predicted_price: ml,
        multiplier: mult,
        strategy: document.getElementById('res-strat').innerText,
        confidence: parseFloat(confText.replace(/[^\d.-]/g, '')) || 85.0,
        demand: document.getElementById('demand').options[document.getElementById('demand').selectedIndex].text,
        inventory: parseInt(document.getElementById('stock').value) || 50,
        time_sensitivity: document.getElementById('time').value,
        customer_segment: document.getElementById('segment').options[document.getElementById('segment').selectedIndex].text,
        season: document.getElementById('season').options[document.getElementById('season').selectedIndex].text,
    };

    try {
        await apiFetch('/api/save-pricing', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        showToast("Saved to database successfully");
        renderDashboardStats();
    } catch(e) {
        let q = getOfflineQueue();
        q.push(payload);
        localStorage.setItem('nexus_offline_queue', JSON.stringify(q));
        showToast("Offline: Record queued locally.", true);
    }
    
    btn.innerText = "Saved!";
    setTimeout(() => btn.innerText = old, 1500);
}

// ==========================================
// RENDERERS
// ==========================================

async function renderAnalytics() {
    const totalEl = document.getElementById('stat-total');
    if(!totalEl) return;

    try {
        totalEl.parentElement.classList.add('loading-skeleton'); // fake class just for logic if we had CSS, but we'll show text
        totalEl.innerText = '...';
        
        const data = await apiFetch('/api/analytics');
        document.getElementById('stat-total').innerText = data.total_records;
        document.getElementById('stat-avg-mult').innerText = data.avg_multiplier + 'x';
        document.getElementById('stat-highest').innerText = currency + (data.highest_price || 0).toLocaleString();
        document.getElementById('stat-lowest').innerText = currency + (data.lowest_price || 0).toLocaleString();
        
        // Let's populate the table placeholder we have on analytics page (we'd need a separate endpoint for all history, 
        // wait, analytics.html usually uses HistoryData).
        // The prompt says "Fetch all stats from GET /api/analytics on page load". For the table we fetched GET /api/history.
        const histData = await apiFetch('/api/history?limit=50');
        const tb = document.getElementById('analytics-tbody');
        if(tb && histData) {
            tb.innerHTML = histData.map(d => `
                <tr>
                    <td>${new Date(d.timestamp.$date).toLocaleString()}</td>
                    <td>${d.product_name}</td>
                    <td>${currency}${d.base_price.toFixed(2)}</td>
                    <td>${currency}${d.final_price.toFixed(2)}</td>
                    <td>${d.multiplier.toFixed(2)}x</td>
                    <td>${d.strategy}</td>
                    <td>${d.demand}</td>
                </tr>
            `).join('') || '<tr><td colspan="7">No records found.</td></tr>';
        }

    } catch(e) {
        showToast("Failed to load Analytics", true);
        totalEl.innerText = 'Err';
    }
}

async function renderHistory() {
    const tl = document.getElementById('history-timeline');
    if(!tl) return;
    
    tl.innerHTML = '<div style="text-align:center; padding: 20px;"><div class="spinner"></div> Loading...</div>';
    
    try {
        const hist = await apiFetch('/api/history');
        if (hist.length === 0) {
            tl.innerHTML = '<p class="text-muted" style="text-align:center;">No pricing history yet. Go to Dashboard and calculate your first price!</p>';
            return;
        }
        
        tl.innerHTML = hist.map(d => `
            <div class="d-flex justify-between align-center" style="padding:1rem; border-bottom:1px solid rgba(255,255,255,0.05)">
                <div>
                    <div style="font-weight:600">${d.product_name}</div>
                    <div class="text-muted" style="font-size:0.8rem">${new Date(d.timestamp.$date).toLocaleString('en-GB', {day: 'numeric', month: 'short', year:'numeric', hour:'numeric', minute:'2-digit'})} • Multiplier: ${d.multiplier.toFixed(2)}x</div>
                </div>
                <div class="d-flex align-center gap-4">
                    <div><span class="badge badge-orange">${d.strategy}</span></div>
                    <div style="font-weight:700; font-size:1.1rem">${currency}${d.final_price.toFixed(2)}</div>
                    <button class="btn-red" style="padding:0.25rem 0.6rem; font-size:0.8rem;" onclick="deleteHistoryRecord('${d._id.$oid}')">Delete</button>
                </div>
            </div>
        `).join('');
    } catch(e) {
        tl.innerHTML = '<p class="text-red">Offline or error loading history.</p>';
        showToast("Failed to fetch History", true);
    }
}

window.deleteHistoryRecord = async function(id) {
    if(confirm('Delete this single record?')) {
        try {
            await apiFetch(`/api/history/${id}`, {method: 'DELETE'});
            showToast("Record deleted");
            renderHistory();
        } catch(e) {
            showToast("Failed to delete", true);
        }
    }
};

window.clearAllHistory = async function() {
    if(confirm('Delete ALL records?')) {
        try {
            await apiFetch(`/api/history/all`, {method: 'DELETE'});
            showToast("All history cleared");
            renderHistory();
        } catch(e) { showToast("Failed to clear", true); }
    }
}

function renderSettingsUI() {
    fillVal('set_currency', currency);
    fillVal('set_theme', theme);
    fillVal('w_demand', weights.demand);
    fillVal('w_scarcity', weights.scarcity);
    fillVal('w_comp', weights.comp);
    
    if(document.getElementById('wt_dem')) document.getElementById('wt_dem').innerText = weights.demand;
    if(document.getElementById('wt_sca')) document.getElementById('wt_sca').innerText = weights.scarcity;
    if(document.getElementById('wt_comp')) document.getElementById('wt_comp').innerText = weights.comp;
}

// ==========================================
// UTILITIES AND LISTENERS
// ==========================================

/* ============================================
   CHART 1 — PRICE DYNAMICS
   ============================================ */

async function initPriceDynamicsChart() {
    const res = await fetch('/api/user-history');
    const data = await res.json();
    
    const labels = data.map((_, i) => 'T-' + (data.length - i));
    const finalPrices = data.map(d => parseFloat(d.final_price) || 0);
    const basePrices = data.map(d => parseFloat(d.base_price) || 0);
    
    const ctx = document.getElementById('priceDynChart').getContext('2d');
    
    if (window.priceDynamicsInstance) {
        window.priceDynamicsInstance.destroy();
    }
    
    // Hide placeholder if data exists
    const pCanvas = document.getElementById('priceDynChart');
    const pPlaceholder = document.getElementById('priceDynPlaceholder');
    if(data.length === 0) {
        if(pCanvas) pCanvas.style.visibility = 'hidden';
        if(pPlaceholder) pPlaceholder.style.display = 'block';
    } else {
        if(pCanvas) pCanvas.style.visibility = 'visible';
        if(pPlaceholder) pPlaceholder.style.display = 'none';
    }
    
    window.priceDynamicsInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.length ? labels : ['No Data'],
            datasets: [
                {
                    label: 'Final Price',
                    data: finalPrices,
                    borderColor: '#7c3aed',
                    backgroundColor: 'rgba(124,58,237,0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Base Price',
                    data: basePrices,
                    borderColor: '#94a3b8',
                    borderDash: [5,5],
                    tension: 0.4,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return '\u20B9' + value.toLocaleString('en-IN');
                        }
                    }
                }
            }
        }
    });
}

/* ============================================
   CHART 2 — MULTI-VARIABLE ANALYSIS (Radar)
   ============================================ */

var radarChart;
function initRadarChart() {
    const ctx = document.getElementById('radarChart').getContext('2d');
    radarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Demand','Scarcity','Competition','Time','Segment','Season'],
            datasets: [{
                label: 'Current Profile',
                data: [0, 0, 0, 0, 0, 0],
                backgroundColor: 'rgba(16,185,129,0.2)',
                borderColor: '#10b981',
                pointBackgroundColor: '#10b981'
            }]
        },
        options: {
            scales: {
                r: {
                    min: 0,
                    max: 1,
                    ticks: { stepSize: 0.2 }
                }
            }
        }
    });
}

function updateRadarChart() {
    const radarCanvas = document.getElementById('radarChart');
    const radarPlaceholder = document.getElementById('radarPlaceholder');
    if (radarCanvas) radarCanvas.style.visibility = 'visible';
    if (radarPlaceholder) radarPlaceholder.style.display = 'none';

    // Map exact dropdown values (e.g. "0.2") to requested 0.1, 0.3... values
    const demandMap = {
        '0.2': 0.1, '0.5': 0.3, '1.0': 0.5, 
        '1.5': 0.8, '2.0': 0.9, '3.0': 1.0
    };
    const segmentMap = {
        '1.0': 0.3, '1.3': 0.7, '1.5': 0.9, '0.8': 0.1
    };
    const seasonMap = {
        '1.0': 0.2, '0.7': 0.1, 
        '1.4': 0.6, '1.6': 1.0, '1.2': 0.4
    };

    const demandVal = demandMap[document.getElementById('demand').value] || 0.5;
    const inventory = parseFloat(document.getElementById('stock').value) || 50;
    const scarcityVal = parseFloat(((100 - inventory) / 100).toFixed(2));
    const baseP = parseFloat(document.getElementById('base_price').value) || 1;
    const compP = parseFloat(document.getElementById('comp_price').value) || 1;
    const compVal = baseP > compP ? 0.3 : (baseP < compP ? 0.7 : 0.5);
    const timeVal = parseFloat(document.getElementById('time').value) / 3 || 0.5;
    const segVal = segmentMap[document.getElementById('segment').value] || 0.3;
    const seasonVal = seasonMap[document.getElementById('season').value] || 0.2;

    radarChart.data.datasets[0].data = [
        demandVal, scarcityVal, compVal, timeVal, segVal, seasonVal
    ];
    radarChart.update();
}

/* ============================================
   CHART 3 — REVENUE OPTIMIZATION SCENARIOS
   ============================================ */

var revenueChart;
function initRevenueChart() {
    const ctx = document.getElementById('revChart').getContext('2d');
    revenueChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Discount', 'Base', 'Peak', 'Surge', 'Premium'],
            datasets: [{
                label: 'Est Revenue',
                data: [0, 0, 0, 0, 0],
                backgroundColor: 'rgba(99,102,241,0.7)'
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '\u20B9' + value.toLocaleString('en-IN');
                        }
                    }
                }
            }
        }
    });
}

function updateRevenueChart() {
    const base = parseFloat(document.getElementById('base_price').value) || 250;
    const values = [
        parseFloat((base * 0.85).toFixed(2)),
        parseFloat((base * 1.00).toFixed(2)),
        parseFloat((base * 1.30).toFixed(2)),
        parseFloat((base * 1.65).toFixed(2)),
        parseFloat((base * 2.10).toFixed(2))
    ];
    revenueChart.data.datasets[0].data = values;
    revenueChart.options.scales.y.max = parseFloat((base * 2.5).toFixed(2));
    revenueChart.update();
}

/* ============================================
   CHART 4 — DEMAND vs PRICE CURVE
   ============================================ */

var demandChart;
function initDemandChart() {
    const ctx = document.getElementById('demandCurveChart').getContext('2d');
    demandChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['10%','20%','30%','40%','50%','60%','70%','80%','90%'],
            datasets: [{
                label: 'Price elasticity',
                data: [0,0,0,0,0,0,0,0,0],
                borderColor: '#7c3aed',
                backgroundColor: 'rgba(124,58,237,0.15)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return '\u20B9' + value.toLocaleString('en-IN');
                        }
                    }
                }
            }
        }
    });
}

function updateDemandChart() {
    const base = parseFloat(document.getElementById('base_price').value) || 250;
    const multipliers = [1.60,1.50,1.40,1.28,1.15,1.00,0.88,0.78,0.70];
    const values = multipliers.map(m => parseFloat((base * m).toFixed(2)));
    demandChart.data.datasets[0].data = values;
    demandChart.options.scales.y.min = parseFloat((base * 0.65).toFixed(2));
    demandChart.options.scales.y.max = parseFloat((base * 1.70).toFixed(2));
    demandChart.update();
}

function setupListeners() {
    const inputs = document.querySelectorAll('#pricing-form input, #pricing-form select');
    inputs.forEach(inp => {
        inp.addEventListener('input', (e) => {
            if(e.target.id === 'stock') document.getElementById('stock-val').innerText = e.target.value + ' units';
            if(e.target.id === 'time') document.getElementById('time-val').innerText = ['Low','Medium','High','Urgent'][e.target.value];
            calculateLive();
        });
    });

    const btnSave = document.getElementById('btn-save');
    if(btnSave) btnSave.addEventListener('click', saveRecord);

    const btnCalc = document.getElementById('btn-calc');
    if(btnCalc) btnCalc.addEventListener('click', () => { calculateLive(); });

    const btnClear = document.getElementById('btn-clear-history');
    if(btnClear) btnClear.addEventListener('click', clearAllHistory);

    const btnSaveSet = document.getElementById('btn-save-settings');
    if(btnSaveSet) btnSaveSet.addEventListener('click', async () => {
        theme = document.getElementById('set_theme').value;
        currency = document.getElementById('set_currency').value;
        localStorage.setItem('nexus_theme', theme);
        
        let pyld = {
            currency: currency, theme: theme,
            demand_weight: parseFloat(document.getElementById('w_demand').value),
            scarcity_weight: parseFloat(document.getElementById('w_scarcity').value),
            competition_weight: parseFloat(document.getElementById('w_comp').value),
        };
        try {
            await apiFetch('/api/settings', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(pyld)
            });
            showToast("Settings saved to cloud");
            setTimeout(()=>window.location.reload(), 1000);
        } catch(e) {
            showToast("Offline. Cannot save to cloud", true);
        }
    });

    document.querySelectorAll('.ml-weight').forEach(w => {
        w.addEventListener('input', (e) => {
            e.target.parentElement.querySelector('.range-val').innerText = e.target.value;
        });
    });
}

function fillVal(id, v) { if(document.getElementById(id)) document.getElementById(id).value = v; }

function calcSim(col) {
    if(!document.getElementById(`base_${col}`)) return;
    let base = parseFloat(document.getElementById(`base_${col}`).value)||0;
    let comp = parseFloat(document.getElementById(`comp_${col}`).value)||0;
    
    let sum = computeScores(base, comp, document.getElementById(`dem_${col}`).value, document.getElementById(`stock_${col}`).value, 1, 1, 1);
    let res = executeStaticML(base, sum);
    
    let revenue = res.price * document.getElementById(`stock_${col}`).value;
    document.getElementById(`res_${col}`).innerText = currency + res.price.toFixed(2);
    document.getElementById(`rev_${col}`).innerText = currency + revenue.toFixed(2);
}
