/* ============================================
   CIMPOR AMREYAH – Main App Controller
   ============================================ */

// Global State
const App = {
  currentPage: 'dashboard',
  currentEquipmentId: null,
  currentInspectionId: null,
  currentPlanId: null,
  inspectorName: 'المفتش',
  shift: 'Morning',
  charts: {},
  equipmentData: [],
  inspectionsData: [],
  plansData: [],
  checklistItems: [],
  currentChecklistResults: {},
  currentPhotos: [],
  alertsData: [],
  refreshTimer: null
};

// Equipment type icons
const EQUIP_ICONS = {
  'Apron Feeder': 'fa-conveyor-belt',
  'Belt Conveyor': 'fa-route',
  'Dynamic Separator': 'fa-fan',
  'Roller Mill': 'fa-circle-notch',
  'Rotary Valve': 'fa-valve',
  'Bridge Reclaimer': 'fa-crane',
};

const getEquipIcon = (type) => {
  for (const [key, icon] of Object.entries(EQUIP_ICONS)) {
    if (type && type.includes(key.split(' ')[0])) return icon;
  }
  return 'fa-cog';
};

const STATUS_MAP = {
  operational: { label: 'تشغيل', class: 'badge-success', dotClass: 'operational' },
  warning:     { label: 'تحذير', class: 'badge-warning', dotClass: 'warning' },
  critical:    { label: 'حرج',   class: 'badge-danger',  dotClass: 'critical' },
  offline:     { label: 'إيقاف', class: 'badge-muted',   dotClass: 'offline' },
};

const RESULT_STATUS_MAP = {
  Good:       { class: 'badge-success', label: 'جيد' },
  Warning:    { class: 'badge-warning', label: 'تحذير' },
  Critical:   { class: 'badge-danger',  label: 'حرج' },
  Incomplete: { class: 'badge-muted',   label: 'غير مكتمل' },
};

// ── API Helpers ──────────────────────────────────────────
async function apiGet(table, params = '') {
  try {
    const separator = params ? '&' : '?';
    const limitParam = params.includes('limit') ? '' : `${separator}limit=500`;
    const resp = await fetch(`tables/${table}${params ? '?' + params : ''}${limitParam}`);
    if (!resp.ok) throw new Error(resp.statusText);
    return await resp.json();
  } catch (e) {
    console.error('GET error:', e);
    return { data: [] };
  }
}

async function apiPost(table, data) {
  try {
    const resp = await fetch(`tables/${table}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await resp.json();
  } catch (e) {
    console.error('POST error:', e);
    return null;
  }
}

async function apiPatch(table, id, data) {
  try {
    const resp = await fetch(`tables/${table}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await resp.json();
  } catch (e) {
    console.error('PATCH error:', e);
    return null;
  }
}

async function apiDelete(table, id) {
  try {
    await fetch(`tables/${table}/${id}`, { method: 'DELETE' });
    return true;
  } catch (e) {
    return false;
  }
}

// ── Navigation ──────────────────────────────────────────
function navigateTo(page, params = {}) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  // Show target page
  const target = document.getElementById(`page-${page}`);
  if (target) target.classList.add('active');

  // Update sidebar
  document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
  const menuItem = document.querySelector(`.menu-item[data-page="${page}"]`);
  if (menuItem) menuItem.classList.add('active');

  // Update breadcrumb
  const pageNames = {
    'dashboard': 'لوحة التحكم',
    'equipment': 'المعدات',
    'equipment-detail': 'تفاصيل المعدة',
    'inspections': 'الفحوصات اليومية',
    'new-inspection': 'فحص جديد',
    'checklist': 'تنفيذ الشيك ليست',
    'history': 'السجل التاريخي',
    'reports': 'التقارير',
    'alerts': 'التنبيهات',
    'admin': 'الإدارة',
  };

  document.getElementById('pageName').textContent = pageNames[page] || page;
  App.currentPage = page;

  // Store params
  if (params.equipmentId) App.currentEquipmentId = params.equipmentId;
  if (params.planId) App.currentPlanId = params.planId;

  // Load page data
  switch (page) {
    case 'dashboard':    initDashboard(); break;
    case 'equipment':    loadEquipmentList(); break;
    case 'equipment-detail': loadEquipmentDetail(App.currentEquipmentId); break;
    case 'inspections':  loadInspections(); break;
    case 'new-inspection': initNewInspection(); break;
    case 'checklist':    loadChecklist(); break;
    case 'history':      initHistory(); break;
    case 'reports':      loadReports(); break;
    case 'alerts':       loadAlerts(); break;
    case 'admin':        loadAdmin(); break;
  }

  window.scrollTo(0, 0);
}

// ── Sidebar Toggle ──────────────────────────────────────
document.getElementById('sidebarToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('collapsed');
});

document.getElementById('menuBtn').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('collapsed');
});

// ── Menu clicks ─────────────────────────────────────────
document.querySelectorAll('.menu-item[data-page]').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const page = item.getAttribute('data-page');
    if (page !== 'equipment-detail') {
      navigateTo(page);
    }
  });
});

// ── Clock & Date ─────────────────────────────────────────
function updateClock() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('ar-EG');
  const dateStr = now.toLocaleDateString('ar-EG', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const el = document.getElementById('sidebarTime');
  if (el) el.textContent = now.toLocaleTimeString('en-US', { hour12: false });

  const dateEl = document.getElementById('topbarDate');
  if (dateEl) dateEl.textContent = dateStr;

  const todayBadge = document.getElementById('todayBadge');
  if (todayBadge) todayBadge.textContent = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

setInterval(updateClock, 1000);
updateClock();

// ── Modal Helpers ─────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

// ── Toast Notifications ───────────────────────────────────
function showToast(message, type = 'info', duration = 3500) {
  const icons = {
    success: '<i class="fas fa-check-circle toast-icon success"></i>',
    warning: '<i class="fas fa-exclamation-triangle toast-icon warning"></i>',
    error:   '<i class="fas fa-times-circle toast-icon error"></i>',
    info:    '<i class="fas fa-info-circle toast-icon info"></i>',
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `${icons[type] || icons.info} <span>${message}</span>`;

  const container = document.getElementById('toastContainer');
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-30px)';
    toast.style.transition = 'all .3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── Status Helpers ────────────────────────────────────────
function getStatusBadge(status) {
  const s = STATUS_MAP[status] || STATUS_MAP.operational;
  return `<span class="badge ${s.class}">${s.label}</span>`;
}

function getResultBadge(result) {
  const map = {
    Good:       '<span class="badge badge-success"><i class="fas fa-check"></i> جيد</span>',
    Warning:    '<span class="badge badge-warning"><i class="fas fa-exclamation"></i> تحذير</span>',
    Critical:   '<span class="badge badge-danger"><i class="fas fa-times"></i> حرج</span>',
    Incomplete: '<span class="badge badge-muted"><i class="fas fa-clock"></i> غير مكتمل</span>',
  };
  return map[result] || `<span class="badge badge-muted">${result || '--'}</span>`;
}

function getProgressBar(pct) {
  const cls = pct >= 80 ? 'good' : pct >= 50 ? 'warning' : 'danger';
  return `
    <div style="display:flex;align-items:center;gap:6px;">
      <div class="progress-wrap">
        <div class="progress-fill ${cls}" style="width:${pct}%"></div>
      </div>
      <span style="font-size:12px;font-weight:700;color:var(--text-muted)">${pct}%</span>
    </div>`;
}

// ── Utilities ────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '--';
  try {
    const d = new Date(typeof dateStr === 'number' ? dateStr : dateStr);
    return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return dateStr; }
}

function formatDateTime(dateStr) {
  if (!dateStr) return '--';
  try {
    const d = new Date(typeof dateStr === 'number' ? dateStr : dateStr);
    return d.toLocaleString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return dateStr; }
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function parseParams(paramStr) {
  try { return JSON.parse(paramStr || '{}'); } catch { return {}; }
}

function daysAgo(d) {
  if (!d) return Infinity;
  const diff = Date.now() - new Date(d).getTime();
  return Math.floor(diff / 86400000);
}

// ── Global Status Change ─────────────────────────────────
let statusChangeEquipId = null;

function openStatusModal(equipId) {
  statusChangeEquipId = equipId;
  const equip = App.equipmentData.find(e => e.id === equipId);
  if (equip) {
    document.getElementById('newStatus').value = equip.status || 'operational';
  }
  openModal('statusModal');
}

async function confirmStatusChange() {
  if (!statusChangeEquipId) return;
  const newStatus = document.getElementById('newStatus').value;
  const note = document.getElementById('statusNote').value;

  const result = await apiPatch('equipment', statusChangeEquipId, {
    status: newStatus,
    notes: note
  });

  if (result) {
    showToast('تم تحديث حالة المعدة بنجاح', 'success');
    closeModal('statusModal');
    // Reload equipment data
    const resp = await apiGet('equipment');
    App.equipmentData = resp.data || [];

    if (App.currentPage === 'dashboard') initDashboard();
    if (App.currentPage === 'equipment') loadEquipmentList();
    if (App.currentPage === 'equipment-detail') loadEquipmentDetail(App.currentEquipmentId);
  }
}

// ── Inspector & Shift sync ───────────────────────────────
document.getElementById('inspectorName').addEventListener('change', (e) => {
  App.inspectorName = e.target.value;
});

document.getElementById('shiftSelect').addEventListener('change', (e) => {
  App.shift = e.target.value;
});

// ── Initial Load ─────────────────────────────────────────
async function initApp() {
  // Load core data
  const [equipResp, plansResp] = await Promise.all([
    apiGet('equipment'),
    apiGet('inspection_plans')
  ]);

  App.equipmentData = equipResp.data || [];
  App.plansData = plansResp.data || [];

  // Populate equipment filters
  populateEquipFilters();

  // Set today's date on date inputs
  const today = todayStr();
  ['inspDateFilter', 'histStartDate', 'histEndDate'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = today;
  });

  // Init first page
  navigateTo('dashboard');

  // Auto-refresh every 60s
  App.refreshTimer = setInterval(() => {
    if (App.currentPage === 'dashboard') refreshDashboard();
    updateAlertBadge();
  }, 60000);
}

function populateEquipFilters() {
  const selects = ['inspEquipFilter', 'histEquipFilter'];
  selects.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '<option value="">كل المعدات</option>';
    App.equipmentData.forEach(eq => {
      el.innerHTML += `<option value="${eq.id}">${eq.code} – ${eq.name}</option>`;
    });
  });
}

async function updateAlertBadge() {
  const resp = await apiGet('alerts', 'limit=200');
  const alerts = (resp.data || []).filter(a => !a.is_resolved);
  const count = alerts.length;
  document.getElementById('alertCount').textContent = count;
  document.getElementById('alertBadge').textContent = count;
  App.alertsData = alerts;
}

// Start app after all scripts loaded
window.addEventListener('load', initApp);
