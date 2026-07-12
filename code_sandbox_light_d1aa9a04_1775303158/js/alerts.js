/* ============================================
   Alerts & Notifications Logic
   ============================================ */

async function loadAlerts() {
  const resp = await apiGet('alerts');
  App.alertsData = resp.data || [];

  const active = App.alertsData.filter(a => !a.is_resolved);
  const resolved = App.alertsData.filter(a => a.is_resolved);

  const grid = document.getElementById('alertsGrid');
  const emptyEl = document.getElementById('alertsEmpty');

  if (!grid) return;

  if (active.length === 0 && resolved.length === 0) {
    grid.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';

  const severityIcons = {
    critical: 'fa-fire',
    high:     'fa-exclamation-triangle',
    medium:   'fa-info-circle',
    low:      'fa-bell',
  };

  const typeLabels = {
    overdue:               'فحص متأخر',
    critical_finding:      'نتيجة حرجة',
    parameter_out_of_range:'معامل خارج النطاق',
    missed_inspection:     'فحص فائت',
  };

  grid.innerHTML = `
    ${active.length > 0 ? `
    <div style="font-size:13px;font-weight:700;color:var(--danger);margin-bottom:8px;padding:8px 16px;background:var(--danger-light);border-radius:var(--radius-sm)">
      <i class="fas fa-bell"></i> التنبيهات النشطة (${active.length})
    </div>
    ${active.map(alert => renderAlertCard(alert, false, severityIcons, typeLabels)).join('')}` : ''}

    ${resolved.length > 0 ? `
    <div style="font-size:13px;font-weight:700;color:var(--success);margin:16px 0 8px;padding:8px 16px;background:var(--success-light);border-radius:var(--radius-sm)">
      <i class="fas fa-check-circle"></i> التنبيهات المعالجة (${resolved.length})
    </div>
    ${resolved.map(alert => renderAlertCard(alert, true, severityIcons, typeLabels)).join('')}` : ''}
  `;

  // Check for overdue inspections and generate alerts
  checkOverdueInspections();
}

function renderAlertCard(alert, isResolved, icons, typeLabels) {
  const equip = App.equipmentData.find(e => e.id === alert.equipment_id) || {};
  const icon = icons[alert.severity] || 'fa-bell';
  const typeLabel = typeLabels[alert.alert_type] || alert.alert_type;

  return `
  <div class="alert-card severity-${isResolved ? 'low' : alert.severity}" style="${isResolved ? 'opacity:.7' : ''}">
    <div class="alert-icon ${isResolved ? 'low' : alert.severity}">
      <i class="fas ${icon}"></i>
    </div>
    <div class="alert-content">
      <div class="alert-title">
        ${equip.code ? `<span style="color:var(--primary)">[${equip.code}]</span> ` : ''}
        ${typeLabel}
        ${isResolved ? '<span class="badge badge-success" style="font-size:10px;margin-right:8px">معالج</span>' : ''}
      </div>
      <div class="alert-message">${alert.message || '--'}</div>
      <div class="alert-meta">
        <i class="fas fa-clock"></i> ${formatDateTime(alert.created_at)}
        ${isResolved && alert.resolved_by ? ` | معالج بواسطة: ${alert.resolved_by}` : ''}
      </div>
    </div>
    <div class="alert-actions">
      ${!isResolved ? `
      <span class="badge badge-danger" style="font-size:11px">${getSeverityLabel(alert.severity)}</span>
      <button class="btn btn-sm btn-success" onclick="resolveAlertFromList('${alert.id}')">
        <i class="fas fa-check"></i> معالجة
      </button>` : ''}
      ${equip.id ? `
      <button class="btn btn-sm btn-outline" onclick="viewEquipmentDetail('${equip.id}')">
        <i class="fas fa-cog"></i> المعدة
      </button>` : ''}
    </div>
  </div>`;
}

function getSeverityLabel(severity) {
  const map = {
    critical: 'حرج جداً',
    high: 'عالي',
    medium: 'متوسط',
    low: 'منخفض',
  };
  return map[severity] || severity;
}

async function resolveAlertFromList(alertId) {
  await apiPatch('alerts', alertId, {
    is_resolved: true,
    resolved_by: document.getElementById('inspectorName')?.value || 'System',
    resolved_at: Date.now(),
  });
  showToast('تم تحديد التنبيه كمعالج', 'success');
  loadAlerts();
  updateAlertBadge();
}

async function resolveAllAlerts() {
  const active = App.alertsData.filter(a => !a.is_resolved);
  if (active.length === 0) {
    showToast('لا توجد تنبيهات نشطة', 'info');
    return;
  }

  const resolvedBy = document.getElementById('inspectorName')?.value || 'System';

  await Promise.all(active.map(a =>
    apiPatch('alerts', a.id, {
      is_resolved: true,
      resolved_by: resolvedBy,
      resolved_at: Date.now(),
    })
  ));

  showToast(`تم معالجة ${active.length} تنبيه`, 'success');
  loadAlerts();
  updateAlertBadge();
}

async function checkOverdueInspections() {
  const insps = App.inspectionsData.length > 0
    ? App.inspectionsData
    : (await apiGet('inspections', 'limit=500')).data || [];

  for (const plan of App.plansData) {
    const planInsps = insps.filter(i => i.plan_id === plan.id);
    if (planInsps.length === 0) continue;

    const last = planInsps.sort((a, b) =>
      new Date(b.inspection_date || b.created_at) - new Date(a.inspection_date || a.created_at)
    )[0];

    const lastDate = new Date(last.inspection_date || last.created_at);
    const daysSince = Math.floor((Date.now() - lastDate.getTime()) / 86400000);
    const freqDays = parseFrequencyToDays(plan.frequency);

    if (daysSince > freqDays * 1.2) {
      // Check if alert already exists
      const existing = App.alertsData.find(a =>
        !a.is_resolved &&
        a.equipment_id === plan.equipment_id &&
        a.alert_type === 'overdue'
      );

      if (!existing) {
        await apiPost('alerts', {
          equipment_id: plan.equipment_id,
          inspection_id: last.id,
          alert_type: 'overdue',
          severity: daysSince > freqDays * 2 ? 'critical' : 'high',
          message: `خطة ${plan.plan_name} متأخرة ${daysSince - freqDays} يوم`,
          is_resolved: false,
        });
      }
    }
  }
}
