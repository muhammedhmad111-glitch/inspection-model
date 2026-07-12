/* ============================================
   Dashboard Page Logic
   ============================================ */

async function initDashboard() {
  await refreshDashboard();
}

async function refreshDashboard() {
  // Load fresh data
  const [equipResp, inspResp, alertsResp] = await Promise.all([
    apiGet('equipment'),
    apiGet('inspections'),
    apiGet('alerts'),
  ]);

  App.equipmentData = equipResp.data || [];
  App.inspectionsData = inspResp.data || [];
  App.alertsData = alertsResp.data || [];

  renderEquipmentStatusGrid();
  updateKPIs();
  renderTodaySchedule();
  renderRecentAlerts();
  renderDashboardCharts();
  updateAlertBadge();
}

function updateKPIs() {
  const equips = App.equipmentData;
  const insps = App.inspectionsData;
  const alerts = App.alertsData;
  const today = todayStr();

  // Today's inspections
  const todayInsps = insps.filter(i => {
    const d = new Date(i.inspection_date || i.created_at);
    return d.toISOString().split('T')[0] === today;
  });

  // Active alerts
  const activeAlerts = alerts.filter(a => !a.is_resolved);

  // Compliance (completed / total in last 30 days)
  const last30 = insps.filter(i => {
    const d = new Date(i.inspection_date || i.created_at);
    return (Date.now() - d.getTime()) <= 30 * 86400000;
  });
  const completed = last30.filter(i => i.completion_percent >= 80).length;
  const compliance = last30.length > 0 ? Math.round((completed / last30.length) * 100) : 0;

  // Overdue (equipment with no inspection in expected period)
  const overdue = calculateOverdueCount();

  document.getElementById('kpi-equipment').textContent = equips.length;
  document.getElementById('kpi-today').textContent = todayInsps.length;
  document.getElementById('kpi-overdue').textContent = overdue;
  document.getElementById('kpi-alerts').textContent = activeAlerts.length;
  document.getElementById('kpi-compliance').textContent = compliance + '%';
  document.getElementById('kpi-plans').textContent = App.plansData.length;

  document.getElementById('alertCount').textContent = activeAlerts.length;
  document.getElementById('alertBadge').textContent = activeAlerts.length;
}

function calculateOverdueCount() {
  let overdue = 0;
  const insps = App.inspectionsData;

  App.plansData.forEach(plan => {
    const planInsps = insps.filter(i => i.plan_id === plan.id);
    if (planInsps.length === 0) return; // No inspection yet, not flagging here

    const lastInsp = planInsps.sort((a, b) =>
      new Date(b.inspection_date || b.created_at) - new Date(a.inspection_date || a.created_at)
    )[0];

    const lastDate = new Date(lastInsp.inspection_date || lastInsp.created_at);
    const daysSince = daysAgo(lastDate);
    const freq = plan.frequency || '1 week';
    const freqDays = parseFrequencyToDays(freq);

    if (daysSince > freqDays * 1.2) overdue++;
  });

  return overdue;
}

function parseFrequencyToDays(freq) {
  if (!freq) return 7;
  const f = freq.toLowerCase();
  if (f.includes('year')) return 365;
  if (f.includes('6 month')) return 180;
  if (f.includes('3 month')) return 90;
  if (f.includes('month')) return 30;
  if (f.includes('6 week')) return 42;
  if (f.includes('4 week')) return 28;
  if (f.includes('2 week')) return 14;
  if (f.includes('week')) return 7;
  return 7;
}

function renderEquipmentStatusGrid() {
  const grid = document.getElementById('equipStatusGrid');
  if (!grid) return;

  grid.innerHTML = App.equipmentData.map(eq => {
    const s = STATUS_MAP[eq.status] || STATUS_MAP.operational;
    const params = parseParams(eq.parameters);
    const icon = getEquipIcon(eq.type);
    const lastInsp = getLastInspectionDate(eq.id);
    const nextInsp = getNextInspectionInfo(eq.id);

    return `
    <div class="equip-status-card status-${eq.status || 'operational'}"
         onclick="navigateTo('equipment-detail', {equipmentId: '${eq.id}'})">
      <div class="equip-status-header">
        <span class="equip-code">${eq.code}</span>
        <span class="status-dot ${eq.status || 'operational'}"></span>
      </div>
      <div class="equip-status-name">${eq.name}</div>
      <div class="equip-status-type">${eq.type}</div>
      <div class="equip-status-meta">
        <div class="equip-meta-item">
          <i class="fas fa-calendar-check"></i>
          <span>آخر فحص: ${lastInsp}</span>
        </div>
        <div class="equip-meta-item">
          <i class="fas fa-calendar-plus"></i>
          <span>القادم: ${nextInsp}</span>
        </div>
        <div class="equip-meta-item">
          <i class="fas fa-list"></i>
          <span>خطط الفحص: ${App.plansData.filter(p => p.equipment_id === eq.id).length}</span>
        </div>
      </div>
      <span class="status-label ${eq.status || 'operational'}">${s.label}</span>
    </div>`;
  }).join('');
}

function getLastInspectionDate(equipId) {
  const insps = App.inspectionsData.filter(i => i.equipment_id === equipId);
  if (insps.length === 0) return 'لم يُفحص';
  const last = insps.sort((a, b) =>
    new Date(b.inspection_date || b.created_at) - new Date(a.inspection_date || a.created_at)
  )[0];
  return formatDate(last.inspection_date || last.created_at);
}

function getNextInspectionInfo(equipId) {
  const plans = App.plansData.filter(p => p.equipment_id === equipId && p.is_active);
  if (plans.length === 0) return '--';
  const insps = App.inspectionsData.filter(i => i.equipment_id === equipId);

  let minNext = Infinity;
  plans.forEach(plan => {
    const planInsps = insps.filter(i => i.plan_id === plan.id);
    const freq = parseFrequencyToDays(plan.frequency);
    let nextDate;

    if (planInsps.length > 0) {
      const last = planInsps.sort((a, b) =>
        new Date(b.inspection_date || b.created_at) - new Date(a.inspection_date || a.created_at)
      )[0];
      nextDate = new Date(last.inspection_date || last.created_at).getTime() + freq * 86400000;
    } else {
      nextDate = Date.now(); // Overdue now
    }

    if (nextDate < minNext) minNext = nextDate;
  });

  if (minNext === Infinity) return '--';
  const daysLeft = Math.ceil((minNext - Date.now()) / 86400000);
  if (daysLeft < 0) return `<span style="color:var(--danger)">متأخر ${Math.abs(daysLeft)} يوم</span>`;
  if (daysLeft === 0) return '<span style="color:var(--warning)">اليوم</span>';
  return `خلال ${daysLeft} يوم`;
}

function renderTodaySchedule() {
  const container = document.getElementById('todaySchedule');
  if (!container) return;
  const today = todayStr();

  // Build schedule from plans (weekly ones are due today if conditions met)
  const weeklyPlans = App.plansData.filter(p =>
    p.frequency === '1 week' || p.frequency === '2 weeks'
  ).slice(0, 8);

  if (weeklyPlans.length === 0) {
    container.innerHTML = '<div class="empty-state" style="padding:30px"><i class="fas fa-calendar-check"></i><p>لا توجد فحوصات مجدولة</p></div>';
    return;
  }

  const insps = App.inspectionsData;

  container.innerHTML = weeklyPlans.map(plan => {
    const equip = App.equipmentData.find(e => e.id === plan.equipment_id) || {};
    const done = insps.some(i => {
      const d = new Date(i.inspection_date || i.created_at).toISOString().split('T')[0];
      return i.plan_id === plan.id && d === today;
    });

    const icon = getEquipIcon(equip.type || '');
    const statusClass = done ? 'badge-success' : 'badge-warning';
    const statusLabel = done ? 'مكتمل' : 'معلق';

    return `
    <div class="schedule-item" onclick="startPlanInspection('${equip.id}', '${plan.id}')">
      <div class="schedule-icon" style="background:var(--primary-light);color:var(--primary)">
        <i class="fas ${icon}"></i>
      </div>
      <div class="schedule-info">
        <div class="schedule-name">${equip.code || ''} – ${plan.plan_name}</div>
        <div class="schedule-sub">${plan.frequency} • ${plan.condition} • ${plan.items_count || 0} بند</div>
      </div>
      <span class="schedule-status badge ${statusClass}">${statusLabel}</span>
    </div>`;
  }).join('');
}

function startPlanInspection(equipId, planId) {
  App.currentEquipmentId = equipId;
  App.currentPlanId = planId;
  navigateTo('new-inspection');
}

function renderRecentAlerts() {
  const container = document.getElementById('recentAlerts');
  if (!container) return;

  const activeAlerts = App.alertsData.filter(a => !a.is_resolved).slice(0, 6);

  if (activeAlerts.length === 0) {
    container.innerHTML = `
      <div style="padding:30px;text-align:center;color:var(--text-muted)">
        <i class="fas fa-shield-check" style="font-size:32px;display:block;margin-bottom:10px;color:var(--success)"></i>
        <p style="font-size:13px">لا توجد تنبيهات نشطة</p>
      </div>`;
    return;
  }

  const severityIcons = {
    critical: { icon: 'fa-fire', cls: 'critical' },
    high:     { icon: 'fa-exclamation-triangle', cls: 'high' },
    medium:   { icon: 'fa-info-circle', cls: 'medium' },
    low:      { icon: 'fa-check-circle', cls: 'low' },
  };

  container.innerHTML = activeAlerts.map(alert => {
    const sv = severityIcons[alert.severity] || severityIcons.medium;
    const equip = App.equipmentData.find(e => e.id === alert.equipment_id) || {};
    return `
    <div class="schedule-item">
      <div class="schedule-icon alert-icon ${alert.severity}" style="background:var(--danger-light);color:var(--danger)">
        <i class="fas ${sv.icon}"></i>
      </div>
      <div class="schedule-info">
        <div class="schedule-name">${equip.code || ''} – ${alert.alert_type || 'تنبيه'}</div>
        <div class="schedule-sub">${alert.message || ''}</div>
      </div>
      <button class="btn btn-sm btn-outline" onclick="resolveAlert('${alert.id}')">معالجة</button>
    </div>`;
  }).join('');
}

async function resolveAlert(alertId) {
  await apiPatch('alerts', alertId, { is_resolved: true, resolved_by: App.inspectorName, resolved_at: Date.now() });
  showToast('تم تحديد التنبيه كمعالج', 'success');
  await refreshDashboard();
}

function renderDashboardCharts() {
  renderEquipStatusChart();
  renderWeeklyInspChart();
  renderComplianceChart();
}

function renderEquipStatusChart() {
  const ctx = document.getElementById('equipStatusChart');
  if (!ctx) return;

  const counts = { operational: 0, warning: 0, critical: 0, offline: 0 };
  App.equipmentData.forEach(e => {
    const s = e.status || 'operational';
    if (counts[s] !== undefined) counts[s]++;
  });

  if (App.charts['equipStatus']) App.charts['equipStatus'].destroy();

  App.charts['equipStatus'] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['تشغيل', 'تحذير', 'حرج', 'إيقاف'],
      datasets: [{
        data: [counts.operational, counts.warning, counts.critical, counts.offline],
        backgroundColor: ['#0e9f6e', '#e3a008', '#e02424', '#94a3b8'],
        borderWidth: 3, borderColor: '#fff',
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { font: { family: 'Cairo', size: 12 }, padding: 12 } }
      }
    }
  });
}

function renderWeeklyInspChart() {
  const ctx = document.getElementById('weeklyInspChart');
  if (!ctx) return;

  const days = [];
  const counts = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    days.push(d.toLocaleDateString('ar-EG', { weekday: 'short', month: 'numeric', day: 'numeric' }));
    counts.push(App.inspectionsData.filter(insp => {
      const id = new Date(insp.inspection_date || insp.created_at).toISOString().split('T')[0];
      return id === dateStr;
    }).length);
  }

  if (App.charts['weeklyInsp']) App.charts['weeklyInsp'].destroy();

  App.charts['weeklyInsp'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: days,
      datasets: [{
        label: 'فحوصات',
        data: counts,
        backgroundColor: 'rgba(26,86,219,.7)',
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } },
        x: { ticks: { font: { family: 'Cairo', size: 10 } } }
      }
    }
  });
}

function renderComplianceChart() {
  const ctx = document.getElementById('complianceChart');
  if (!ctx) return;

  const months = [];
  const rates = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const y = d.getFullYear(), m = d.getMonth();
    months.push(d.toLocaleDateString('ar-EG', { month: 'short', year: 'numeric' }));

    const monthInsps = App.inspectionsData.filter(insp => {
      const id = new Date(insp.inspection_date || insp.created_at);
      return id.getFullYear() === y && id.getMonth() === m;
    });

    const rate = monthInsps.length > 0
      ? Math.round((monthInsps.filter(i => (i.completion_percent || 0) >= 80).length / monthInsps.length) * 100)
      : 0;
    rates.push(rate);
  }

  if (App.charts['compliance']) App.charts['compliance'].destroy();

  App.charts['compliance'] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [{
        label: 'معدل الامتثال %',
        data: rates,
        borderColor: '#0e9f6e',
        backgroundColor: 'rgba(14,159,110,.1)',
        tension: 0.4, fill: true, pointRadius: 4,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' } },
        x: { ticks: { font: { family: 'Cairo', size: 10 } } }
      }
    }
  });
}
