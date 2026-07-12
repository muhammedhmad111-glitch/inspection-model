/* ============================================
   Inspection Creation & Management Logic
   ============================================ */

async function initNewInspection() {
  // Populate equipment dropdown
  const equipSel = document.getElementById('ni-equipment');
  if (!equipSel) return;

  equipSel.innerHTML = '<option value="">اختر المعدة...</option>';
  App.equipmentData.forEach(eq => {
    equipSel.innerHTML += `<option value="${eq.id}">${eq.code} – ${eq.name}</option>`;
  });

  // If equipment already selected from navigation
  if (App.currentEquipmentId) {
    equipSel.value = App.currentEquipmentId;
    await loadPlansForEquipment();

    // If plan also pre-selected
    if (App.currentPlanId) {
      const planSel = document.getElementById('ni-plan');
      if (planSel) {
        planSel.value = App.currentPlanId;
        updatePlanPreview();
      }
    }
  }

  // Set today's date
  document.getElementById('ni-date').value = todayStr();

  // Set inspector name from topbar
  const inspector = document.getElementById('inspectorName')?.value;
  document.getElementById('ni-inspector').value = inspector || '';

  // Set shift
  const shift = document.getElementById('shiftSelect')?.value;
  document.getElementById('ni-shift').value = shift || 'Morning';
}

async function loadPlansForEquipment() {
  const equipId = document.getElementById('ni-equipment')?.value;
  const planSel = document.getElementById('ni-plan');
  if (!planSel) return;

  planSel.innerHTML = '<option value="">اختر خطة الفحص...</option>';
  document.getElementById('planPreview').style.display = 'none';

  if (!equipId) return;

  const plans = App.plansData.filter(p => p.equipment_id === equipId && p.is_active);
  plans.forEach(plan => {
    planSel.innerHTML += `<option value="${plan.id}">${plan.plan_name} (${plan.frequency})</option>`;
  });

  planSel.addEventListener('change', updatePlanPreview);
}

function updatePlanPreview() {
  const planId = document.getElementById('ni-plan')?.value;
  if (!planId) {
    document.getElementById('planPreview').style.display = 'none';
    return;
  }

  const plan = App.plansData.find(p => p.id === planId);
  if (!plan) return;

  const preview = document.getElementById('planPreview');
  preview.style.display = 'block';

  document.getElementById('planPreviewContent').innerHTML = `
  <div class="plan-preview-grid">
    <div class="plan-preview-item">
      <div class="ppl">كود الخطة</div>
      <div class="ppv">${plan.plan_code}</div>
    </div>
    <div class="plan-preview-item">
      <div class="ppl">التكرار</div>
      <div class="ppv">${plan.frequency}</div>
    </div>
    <div class="plan-preview-item">
      <div class="ppl">شرط التنفيذ</div>
      <div class="ppv">${plan.condition}</div>
    </div>
    <div class="plan-preview-item">
      <div class="ppl">عدد البنود</div>
      <div class="ppv" style="color:var(--primary)">${plan.items_count || 0}</div>
    </div>
    <div class="plan-preview-item" style="grid-column:1/-1">
      <div class="ppl">نطاق الفحص</div>
      <div class="ppv" style="font-size:11px;line-height:1.5;font-weight:400">${plan.scope || '--'}</div>
    </div>
  </div>`;
}

async function createAndStartInspection() {
  const equipId = document.getElementById('ni-equipment')?.value;
  const planId  = document.getElementById('ni-plan')?.value;
  const date    = document.getElementById('ni-date')?.value;
  const shift   = document.getElementById('ni-shift')?.value;
  const inspector = document.getElementById('ni-inspector')?.value;
  const notes   = document.getElementById('ni-notes')?.value;

  if (!equipId || !planId || !date || !inspector) {
    showToast('يرجى تعبئة جميع الحقول المطلوبة', 'warning');
    return;
  }

  const newInsp = await apiPost('inspections', {
    equipment_id: equipId,
    plan_id: planId,
    inspection_date: date,
    inspector_name: inspector,
    shift: shift,
    overall_status: 'Incomplete',
    completion_percent: 0,
    notes: notes || '',
    photo_urls: [],
  });

  if (newInsp && newInsp.id) {
    App.currentInspectionId = newInsp.id;
    App.currentEquipmentId = equipId;
    App.currentPlanId = planId;
    App.currentChecklistResults = {};
    App.currentPhotos = [];

    showToast('تم إنشاء الفحص بنجاح', 'success');
    navigateTo('checklist');
  } else {
    showToast('فشل إنشاء الفحص، يرجى المحاولة مرة أخرى', 'error');
  }
}

// ── Load Inspections List ────────────────────────────────
async function loadInspections() {
  const dateFilter  = document.getElementById('inspDateFilter')?.value;
  const equipFilter = document.getElementById('inspEquipFilter')?.value;

  const resp = await apiGet('inspections');
  let data = resp.data || [];

  // Filter
  if (dateFilter) {
    data = data.filter(i => {
      const d = new Date(i.inspection_date || i.created_at).toISOString().split('T')[0];
      return d === dateFilter;
    });
  }

  if (equipFilter) {
    data = data.filter(i => i.equipment_id === equipFilter);
  }

  App.inspectionsData = resp.data || [];

  // Sort newest first
  data.sort((a, b) =>
    new Date(b.inspection_date || b.created_at) - new Date(a.inspection_date || a.created_at)
  );

  const tbody = document.getElementById('inspectionsBody');
  const emptyEl = document.getElementById('inspEmpty');

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
      <td><strong>${formatDate(insp.inspection_date)}</strong></td>
      <td>
        <span style="font-weight:700;color:var(--primary)">${equip.code || '--'}</span><br>
        <span style="font-size:11px;color:var(--text-muted)">${equip.name || '--'}</span>
      </td>
      <td style="font-size:11px">${plan.plan_name || '--'}</td>
      <td>${insp.inspector_name || '--'}</td>
      <td>${shiftBadge}</td>
      <td>${getProgressBar(pct)}</td>
      <td>${getResultBadge(insp.overall_status)}</td>
      <td>
        <div style="display:flex;gap:4px">
          <button class="btn btn-sm btn-outline" onclick="openInspectionDetail('${insp.id}')">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn btn-sm btn-primary" onclick="continueInspection('${insp.id}','${insp.equipment_id}','${insp.plan_id}')">
            <i class="fas fa-play"></i>
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteInspection('${insp.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function continueInspection(inspId, equipId, planId) {
  App.currentInspectionId = inspId;
  App.currentEquipmentId = equipId;
  App.currentPlanId = planId;
  App.currentChecklistResults = {};
  App.currentPhotos = [];
  navigateTo('checklist');
}

async function deleteInspection(inspId) {
  if (!confirm('هل تريد حذف هذا الفحص؟')) return;
  await apiDelete('inspections', inspId);
  showToast('تم حذف الفحص', 'info');
  loadInspections();
}

async function openInspectionDetail(inspId) {
  const resp = await fetch(`tables/inspections/${inspId}`);
  const insp = await resp.json();

  const equip = App.equipmentData.find(e => e.id === insp.equipment_id) || {};
  const plan  = App.plansData.find(p => p.id === insp.plan_id) || {};

  // Load results
  const resultsResp = await apiGet('inspection_results');
  const results = (resultsResp.data || []).filter(r => r.inspection_id === inspId);

  const okCount = results.filter(r => r.result === 'OK').length;
  const nokCount = results.filter(r => r.result === 'NOK').length;
  const warnCount = results.filter(r => r.result === 'Warning').length;

  document.getElementById('inspDetailTitle').textContent = `تفاصيل الفحص – ${equip.name || ''}`;

  document.getElementById('inspDetailBody').innerHTML = `
  <div class="insp-detail-grid">
    <div class="insp-detail-item">
      <div class="insp-detail-label">المعدة</div>
      <div class="insp-detail-value">${equip.code} – ${equip.name}</div>
    </div>
    <div class="insp-detail-item">
      <div class="insp-detail-label">خطة الفحص</div>
      <div class="insp-detail-value">${plan.plan_name || '--'}</div>
    </div>
    <div class="insp-detail-item">
      <div class="insp-detail-label">التاريخ</div>
      <div class="insp-detail-value">${formatDate(insp.inspection_date)}</div>
    </div>
    <div class="insp-detail-item">
      <div class="insp-detail-label">المفتش</div>
      <div class="insp-detail-value">${insp.inspector_name || '--'}</div>
    </div>
    <div class="insp-detail-item">
      <div class="insp-detail-label">الوردية</div>
      <div class="insp-detail-value">${insp.shift || '--'}</div>
    </div>
    <div class="insp-detail-item">
      <div class="insp-detail-label">الإنجاز</div>
      <div class="insp-detail-value">${insp.completion_percent || 0}%</div>
    </div>
  </div>

  <div class="result-summary-grid">
    <div class="result-summary-item">
      <div class="rsv" style="color:var(--success)">${okCount}</div>
      <div class="rsl">جيد (OK)</div>
    </div>
    <div class="result-summary-item">
      <div class="rsv" style="color:var(--warning)">${warnCount}</div>
      <div class="rsl">تحذير</div>
    </div>
    <div class="result-summary-item">
      <div class="rsv" style="color:var(--danger)">${nokCount}</div>
      <div class="rsl">خلل (NOK)</div>
    </div>
    <div class="result-summary-item">
      <div class="rsv">${results.length}</div>
      <div class="rsl">إجمالي البنود</div>
    </div>
  </div>

  ${insp.notes ? `<div style="background:var(--bg-main);padding:12px;border-radius:8px;font-size:13px;margin-bottom:16px">
    <strong>ملاحظات:</strong> ${insp.notes}</div>` : ''}

  ${(insp.photo_urls && insp.photo_urls.length > 0) ? `
  <div style="margin-bottom:16px">
    <h4 style="font-size:13px;margin-bottom:8px"><i class="fas fa-images"></i> صور الفحص</h4>
    <div style="display:flex;flex-wrap:wrap;gap:8px">
      ${insp.photo_urls.map(url => `
      <div style="width:80px;height:80px;border-radius:6px;overflow:hidden;border:2px solid var(--border)">
        <img src="${url}" style="width:100%;height:100%;object-fit:cover">
      </div>`).join('')}
    </div>
  </div>` : ''}

  ${results.length > 0 ? `
  <h4 style="font-size:13px;margin-bottom:8px"><i class="fas fa-list"></i> نتائج البنود المُسجَّلة</h4>
  <table class="data-table">
    <thead>
      <tr><th>#</th><th>المكوّن</th><th>النتيجة</th><th>ملاحظات</th></tr>
    </thead>
    <tbody>
      ${results.map((r, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td style="font-size:11px">${r.checklist_item_id || '--'}</td>
        <td>${
          r.result === 'OK' ? '<span class="badge badge-success">OK</span>' :
          r.result === 'NOK' ? '<span class="badge badge-danger">NOK</span>' :
          r.result === 'Warning' ? '<span class="badge badge-warning">Warning</span>' :
          `<span class="badge badge-muted">${r.result}</span>`
        }</td>
        <td style="font-size:11px">${r.notes || '--'}</td>
      </tr>`).join('')}
    </tbody>
  </table>` : '<p style="color:var(--text-muted);font-size:13px">لم تُسجَّل نتائج بعد</p>'}
  `;

  openModal('inspDetailModal');
}
