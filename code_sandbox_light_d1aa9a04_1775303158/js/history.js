/* ============================================
   History & Reports Logic
   ============================================ */

async function initHistory() {
  // Set date range: last 30 days
  const today = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);

  document.getElementById('histEndDate').value = today.toISOString().split('T')[0];
  document.getElementById('histStartDate').value = start.toISOString().split('T')[0];

  await loadHistory();
}

async function loadHistory() {
  const startDate = document.getElementById('histStartDate')?.value;
  const endDate   = document.getElementById('histEndDate')?.value;
  const equipFilter = document.getElementById('histEquipFilter')?.value;

  const resp = await apiGet('inspections');
  let data = resp.data || [];

  // Filter by date range
  if (startDate) {
    data = data.filter(i => {
      const d = new Date(i.inspection_date || i.created_at);
      return d >= new Date(startDate);
    });
  }

  if (endDate) {
    data = data.filter(i => {
      const d = new Date(i.inspection_date || i.created_at);
      return d <= new Date(endDate + 'T23:59:59');
    });
  }

  if (equipFilter) {
    data = data.filter(i => i.equipment_id === equipFilter);
  }

  data.sort((a, b) =>
    new Date(b.inspection_date || b.created_at) - new Date(a.inspection_date || a.created_at)
  );

  renderHistoryTable(data);
  renderHistoryCharts(data);
}

function renderHistoryTable(data) {
  const tbody = document.getElementById('historyBody');
  const emptyEl = document.getElementById('histEmpty');

  if (!tbody) return;

  if (data.length === 0) {
    tbody.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';

  tbody.innerHTML = data.map(insp => {
    const equip = App.equipmentData.find(e => e.id === insp.equipment_id) || {};
    const plan  = App.plansData.find(p => p.id === insp.plan_id) || {};
    const pct   = insp.completion_percent || 0;

    const shiftBadge = {
      Morning: '<span class="badge badge-info">صباحي</span>',
      Afternoon: '<span class="badge badge-warning">مسائي</span>',
      Night: '<span class="badge badge-purple">ليلي</span>',
    }[insp.shift] || '';

    return `
    <tr>
      <td><strong>${formatDate(insp.inspection_date)}</strong><br>
          <span style="font-size:10px;color:var(--text-muted)">${new Date(insp.inspection_date || insp.created_at).toLocaleDateString('en-US', {weekday:'short'})}</span></td>
      <td><span style="font-weight:700;color:var(--primary)">${equip.code || '--'}</span><br>
          <span style="font-size:11px;color:var(--text-muted)">${equip.name || '--'}</span></td>
      <td style="font-size:11px">${plan.plan_name || '--'}</td>
      <td>${insp.inspector_name || '--'}</td>
      <td>${shiftBadge}</td>
      <td>${getProgressBar(pct)}</td>
      <td>${getResultBadge(insp.overall_status)}</td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="openInspectionDetail('${insp.id}')">
          <i class="fas fa-eye"></i> عرض
        </button>
      </td>
    </tr>`;
  }).join('');
}

function renderHistoryCharts(data) {
  renderHistEquipChart(data);
  renderHistResultChart(data);
}

function renderHistEquipChart(data) {
  const ctx = document.getElementById('histEquipChart');
  if (!ctx) return;

  const equipCounts = {};
  App.equipmentData.forEach(eq => { equipCounts[eq.code] = 0; });
  data.forEach(insp => {
    const eq = App.equipmentData.find(e => e.id === insp.equipment_id);
    if (eq) equipCounts[eq.code] = (equipCounts[eq.code] || 0) + 1;
  });

  if (App.charts['histEquip']) App.charts['histEquip'].destroy();

  App.charts['histEquip'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(equipCounts),
      datasets: [{
        label: 'عدد الفحوصات',
        data: Object.values(equipCounts),
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

function renderHistResultChart(data) {
  const ctx = document.getElementById('histResultChart');
  if (!ctx) return;

  const counts = { Good: 0, Warning: 0, Critical: 0, Incomplete: 0 };
  data.forEach(insp => {
    const s = insp.overall_status || 'Incomplete';
    if (counts[s] !== undefined) counts[s]++;
    else counts.Incomplete++;
  });

  if (App.charts['histResult']) App.charts['histResult'].destroy();

  App.charts['histResult'] = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['جيد', 'تحذير', 'حرج', 'غير مكتمل'],
      datasets: [{
        data: [counts.Good, counts.Warning, counts.Critical, counts.Incomplete],
        backgroundColor: ['#0e9f6e', '#e3a008', '#e02424', '#94a3b8'],
        borderWidth: 3, borderColor: '#fff',
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { font: { family: 'Cairo', size: 11 }, padding: 10 } }
      }
    }
  });
}

// ── Reports ──────────────────────────────────────────────
async function loadReports() {
  const resp = await apiGet('inspections');
  const allInsps = resp.data || [];

  renderMonthlyTrendChart(allInsps);
  renderEquipCompChart(allInsps);
  renderPlanComplianceChart();
  renderEquipPerfTable(allInsps);
}

function renderMonthlyTrendChart(insps) {
  const ctx = document.getElementById('monthlyTrendChart');
  if (!ctx) return;

  const months = [];
  const goodCounts = [], warnCounts = [], critCounts = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const y = d.getFullYear(), m = d.getMonth();
    months.push(d.toLocaleDateString('ar-EG', { month: 'short', year: 'numeric' }));

    const monthInsps = insps.filter(insp => {
      const id = new Date(insp.inspection_date || insp.created_at);
      return id.getFullYear() === y && id.getMonth() === m;
    });

    goodCounts.push(monthInsps.filter(i => i.overall_status === 'Good').length);
    warnCounts.push(monthInsps.filter(i => i.overall_status === 'Warning').length);
    critCounts.push(monthInsps.filter(i => i.overall_status === 'Critical').length);
  }

  if (App.charts['monthlyTrend']) App.charts['monthlyTrend'].destroy();

  App.charts['monthlyTrend'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        { label: 'جيد', data: goodCounts, backgroundColor: '#0e9f6e', borderRadius: 4 },
        { label: 'تحذير', data: warnCounts, backgroundColor: '#e3a008', borderRadius: 4 },
        { label: 'حرج', data: critCounts, backgroundColor: '#e02424', borderRadius: 4 },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { font: { family: 'Cairo', size: 12 }, padding: 16 } }
      },
      scales: {
        x: { stacked: true, ticks: { font: { family: 'Cairo', size: 11 } } },
        y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } }
      }
    }
  });
}

function renderEquipCompChart(insps) {
  const ctx = document.getElementById('equipCompChart');
  if (!ctx) return;

  const labels = App.equipmentData.map(e => e.code);
  const completions = App.equipmentData.map(eq => {
    const eInsps = insps.filter(i => i.equipment_id === eq.id);
    if (eInsps.length === 0) return 0;
    const avg = eInsps.reduce((sum, i) => sum + (i.completion_percent || 0), 0) / eInsps.length;
    return Math.round(avg);
  });

  if (App.charts['equipComp']) App.charts['equipComp'].destroy();

  App.charts['equipComp'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'متوسط الإنجاز %',
        data: completions,
        backgroundColor: completions.map(v => v >= 80 ? '#0e9f6e' : v >= 50 ? '#e3a008' : '#e02424'),
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: { legend: { display: false } },
      scales: {
        x: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' } },
        y: { ticks: { font: { family: 'Cairo', size: 11 } } }
      }
    }
  });
}

function renderPlanComplianceChart() {
  const ctx = document.getElementById('planComplianceChart');
  if (!ctx) return;

  // Frequencies compliance
  const freqGroups = ['1 week', '2 weeks', '4 weeks', '1 month', '3 months', '6 months', '1 year'];
  const complianceData = freqGroups.map(() => Math.floor(Math.random() * 40 + 60)); // Demo

  if (App.charts['planComp']) App.charts['planComp'].destroy();

  App.charts['planComp'] = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: freqGroups,
      datasets: [{
        label: 'الامتثال %',
        data: complianceData,
        backgroundColor: 'rgba(26,86,219,.15)',
        borderColor: '#1a56db',
        pointBackgroundColor: '#1a56db',
        pointRadius: 4,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        r: {
          beginAtZero: true, max: 100,
          ticks: { stepSize: 20, callback: v => v + '%' },
        }
      },
      plugins: { legend: { display: false } }
    }
  });
}

function renderEquipPerfTable(insps) {
  const tbody = document.getElementById('equipPerfBody');
  if (!tbody) return;

  tbody.innerHTML = App.equipmentData.map(eq => {
    const eInsps = insps.filter(i => i.equipment_id === eq.id);
    const good = eInsps.filter(i => i.overall_status === 'Good').length;
    const warn = eInsps.filter(i => i.overall_status === 'Warning').length;
    const crit = eInsps.filter(i => i.overall_status === 'Critical').length;
    const compliance = eInsps.length > 0
      ? Math.round((eInsps.filter(i => (i.completion_percent || 0) >= 80).length / eInsps.length) * 100)
      : 0;

    const lastInsp = eInsps.length > 0
      ? eInsps.sort((a, b) =>
          new Date(b.inspection_date || b.created_at) - new Date(a.inspection_date || a.created_at)
        )[0]
      : null;

    return `
    <tr>
      <td><strong>${eq.name}</strong></td>
      <td><span class="badge badge-info">${eq.code}</span></td>
      <td>${eInsps.length}</td>
      <td><span style="color:var(--success);font-weight:700">${good}</span></td>
      <td><span style="color:var(--warning);font-weight:700">${warn}</span></td>
      <td><span style="color:var(--danger);font-weight:700">${crit}</span></td>
      <td>
        <div style="display:flex;align-items:center;gap:6px">
          <div class="perf-bar"><div class="perf-bar-fill" style="width:${compliance}%"></div></div>
          <span style="font-weight:700;font-size:12px">${compliance}%</span>
        </div>
      </td>
      <td style="font-size:12px">${lastInsp ? formatDate(lastInsp.inspection_date || lastInsp.created_at) : 'لم يُفحص'}</td>
    </tr>`;
  }).join('');
}
