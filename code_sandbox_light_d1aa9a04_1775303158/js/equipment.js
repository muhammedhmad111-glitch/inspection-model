/* ============================================
   Equipment Management Logic
   ============================================ */

async function loadEquipmentList() {
  const [equipResp, inspResp] = await Promise.all([
    apiGet('equipment'),
    apiGet('inspections'),
  ]);
  App.equipmentData = equipResp.data || [];
  App.inspectionsData = inspResp.data || [];
  renderEquipmentCards(App.equipmentData);
}

function filterEquipment() {
  const search = (document.getElementById('equipSearch')?.value || '').toLowerCase();
  const statusF = document.getElementById('statusFilter')?.value || '';

  let filtered = App.equipmentData.filter(eq => {
    const matchSearch = !search ||
      (eq.name || '').toLowerCase().includes(search) ||
      (eq.code || '').toLowerCase().includes(search) ||
      (eq.type || '').toLowerCase().includes(search);
    const matchStatus = !statusF || eq.status === statusF;
    return matchSearch && matchStatus;
  });

  renderEquipmentCards(filtered);
}

function renderEquipmentCards(list) {
  const grid = document.getElementById('equipmentCardsGrid');
  if (!grid) return;

  if (list.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <i class="fas fa-cogs"></i><p>لا توجد معدات مطابقة</p></div>`;
    return;
  }

  grid.innerHTML = list.map(eq => {
    const s = STATUS_MAP[eq.status] || STATUS_MAP.operational;
    const params = parseParams(eq.parameters);
    const plans = App.plansData.filter(p => p.equipment_id === eq.id);
    const icon = getEquipIcon(eq.type);
    const lastInsp = App.inspectionsData.length > 0 ? getLastInspectionDate(eq.id) : (eq.last_inspection ? formatDate(eq.last_inspection) : 'لم يُفحص');

    // Build param badges from equipment parameters
    const paramEntries = Object.entries(params).filter(([k, v]) =>
      typeof v !== 'object' && !['Equipment_ID', 'Type'].includes(k)
    ).slice(0, 4);

    return `
    <div class="equipment-card" onclick="viewEquipmentDetail('${eq.id}')">
      <div class="equip-card-header">
        <span class="equip-card-code"><i class="fas fa-barcode"></i> ${eq.code}</span>
        <span class="badge ${s.class}">${s.label}</span>
      </div>
      <div class="equip-card-body">
        <div class="equip-card-name">
          <i class="fas ${icon}" style="color:var(--primary);margin-left:6px"></i>${eq.name}
        </div>
        <div class="equip-card-type">${eq.type} • ${eq.area || ''}</div>
        
        <div class="equip-params-grid">
          ${paramEntries.map(([k, v]) => `
          <div class="param-badge">
            <div class="param-badge-label">${formatParamKey(k)}</div>
            <div class="param-badge-value">${v}</div>
          </div>`).join('')}
          <div class="param-badge">
            <div class="param-badge-label">خطط الفحص</div>
            <div class="param-badge-value">${plans.length}</div>
          </div>
          <div class="param-badge">
            <div class="param-badge-label">آخر فحص</div>
            <div class="param-badge-value" style="font-size:10px">${lastInsp}</div>
          </div>
        </div>
      </div>
      <div class="equip-card-footer">
        <div style="font-size:11px;color:var(--text-muted)">
          <i class="fas fa-map-marker-alt"></i> ${eq.plant || 'AMREYAH PLANT'}
        </div>
        <div style="display:flex;gap:6px">
          <button class="btn btn-sm btn-primary" onclick="event.stopPropagation();startEquipInspection('${eq.id}')">
            <i class="fas fa-play"></i> فحص
          </button>
          <button class="btn btn-sm btn-outline" onclick="event.stopPropagation();openStatusModal('${eq.id}')">
            <i class="fas fa-edit"></i>
          </button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function formatParamKey(key) {
  const map = {
    'IJPs': 'خطط الفحص',
    'FLIR_Frequency': 'FLIR',
    'FLIS_Frequency': 'FLIS',
    'SIS_Frequency': 'SIS',
    'Model': 'الموديل',
    'Tyre_Points': 'نقاط الإطار',
    'Rails_Upper_Initial_mm': 'ريل علوي (mm)',
    'Rails_Lower_Initial_mm': 'ريل سفلي (mm)',
    'Bearing_Clearance_SIS': 'فحص المحامل',
    'Drive_Sprocket_Bearing_SIS': 'محمل السبروكيت',
    'FLIR_Condition': 'حالة FLIR',
  };
  return map[key] || key.replace(/_/g, ' ');
}

function viewEquipmentDetail(equipId) {
  App.currentEquipmentId = equipId;
  document.getElementById('nav-equip-detail').style.display = 'flex';
  navigateTo('equipment-detail', { equipmentId: equipId });
}

function startEquipInspection(equipId) {
  App.currentEquipmentId = equipId;
  App.currentPlanId = null;
  navigateTo('new-inspection');
}

function startInspectionFromEquip() {
  navigateTo('new-inspection');
}

async function loadEquipmentDetail(equipId) {
  if (!equipId) return;

  const equip = App.equipmentData.find(e => e.id === equipId);
  if (!equip) return;

  const params = parseParams(equip.parameters);
  const plans = App.plansData.filter(p => p.equipment_id === equipId);
  const inspections = App.inspectionsData.filter(i => i.equipment_id === equipId)
    .sort((a, b) => new Date(b.inspection_date || b.created_at) - new Date(a.inspection_date || a.created_at))
    .slice(0, 10);

  const icon = getEquipIcon(equip.type);
  const s = STATUS_MAP[equip.status] || STATUS_MAP.operational;

  document.getElementById('equipDetailTitle').innerHTML =
    `<i class="fas ${icon}"></i> ${equip.name}`;

  document.getElementById('startInspBtn').setAttribute('data-equip', equipId);

  const container = document.getElementById('equipDetailContent');

  container.innerHTML = `
  <div class="equip-detail-grid">
    <!-- Info Card -->
    <div class="equip-detail-info-card">
      <div class="equip-detail-hero">
        <div class="equip-detail-icon"><i class="fas ${icon}"></i></div>
        <div class="equip-detail-code-hero">${equip.code}</div>
        <div class="equip-detail-name-hero">${equip.name}</div>
        <div class="equip-detail-type-hero">${equip.type}</div>
        <div style="margin-top:12px">
          <span class="status-label ${equip.status || 'operational'}" style="background:rgba(255,255,255,.2);color:#fff">
            ${s.label}
          </span>
        </div>
      </div>
      <div class="equip-detail-params">
        <div class="param-row">
          <span class="param-row-label">كود المعدة</span>
          <span class="param-row-value">${params.Equipment_ID || equip.code}</span>
        </div>
        <div class="param-row">
          <span class="param-row-label">النوع</span>
          <span class="param-row-value">${equip.type}</span>
        </div>
        <div class="param-row">
          <span class="param-row-label">المصنع</span>
          <span class="param-row-value">${equip.plant}</span>
        </div>
        <div class="param-row">
          <span class="param-row-label">المنطقة</span>
          <span class="param-row-value">${equip.area || '--'}</span>
        </div>
        ${Object.entries(params)
          .filter(([k]) => !['Equipment_ID', 'Type'].includes(k))
          .map(([k, v]) => `
        <div class="param-row">
          <span class="param-row-label">${formatParamKey(k)}</span>
          <span class="param-row-value">${v}</span>
        </div>`).join('')}
        <div style="padding:12px 0">
          <button class="btn btn-outline btn-sm" onclick="openStatusModal('${equipId}')">
            <i class="fas fa-edit"></i> تحديث الحالة
          </button>
        </div>
      </div>
    </div>

    <!-- Plans & History -->
    <div>
      <!-- Inspection Plans -->
      <div class="section-card" style="margin-bottom:20px">
        <div class="section-header">
          <h2><i class="fas fa-list-check"></i> خطط الفحص (${plans.length})</h2>
        </div>
        <div style="padding:16px">
          <div class="plans-tabs">
            ${plans.map((plan, idx) => `
            <button class="plan-tab-btn ${idx === 0 ? 'active' : ''}"
                    onclick="selectPlanTab('${plan.id}', this)">
              ${plan.plan_name}
            </button>`).join('')}
          </div>
          <div id="planTabContent">
            ${plans.length > 0 ? renderPlanDetails(plans[0]) : '<p style="color:var(--text-muted)">لا توجد خطط فحص</p>'}
          </div>
        </div>
      </div>

      <!-- Recent Inspections -->
      <div class="section-card">
        <div class="section-header">
          <h2><i class="fas fa-history"></i> آخر الفحوصات</h2>
          <button class="btn btn-sm btn-primary" onclick="startEquipInspection('${equipId}')">
            <i class="fas fa-plus"></i> فحص جديد
          </button>
        </div>
        ${inspections.length === 0
          ? '<div class="empty-state" style="padding:30px"><i class="fas fa-clipboard"></i><p>لا توجد فحوصات</p></div>'
          : `<table class="data-table">
            <thead><tr>
              <th>التاريخ</th><th>الخطة</th><th>المفتش</th>
              <th>الإنجاز</th><th>الحالة</th>
            </tr></thead>
            <tbody>
              ${inspections.map(insp => {
                const plan = App.plansData.find(p => p.id === insp.plan_id) || {};
                return `<tr>
                  <td>${formatDate(insp.inspection_date)}</td>
                  <td style="font-size:11px">${plan.plan_name || '--'}</td>
                  <td>${insp.inspector_name || '--'}</td>
                  <td>${getProgressBar(insp.completion_percent || 0)}</td>
                  <td>${getResultBadge(insp.overall_status)}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>`}
      </div>
    </div>
  </div>

  <!-- Photo Gallery Section -->
  <div class="section-card">
    <div class="section-header">
      <h2><i class="fas fa-images"></i> صور المعدة</h2>
      <button class="btn btn-sm btn-outline" onclick="document.getElementById('equipPhotoInput').click()">
        <i class="fas fa-camera"></i> إضافة صور
      </button>
    </div>
    <input type="file" id="equipPhotoInput" multiple accept="image/*" style="display:none"
           onchange="handleEquipPhotoUpload(event, '${equipId}')">
    <div id="equipPhotoGallery" style="display:flex;flex-wrap:wrap;gap:12px;padding:16px">
      ${(equip.photo_urls && equip.photo_urls.length > 0)
        ? equip.photo_urls.map(url => `
          <div class="photo-preview-item" style="width:120px;height:120px">
            <img src="${url}" alt="equipment photo">
          </div>`).join('')
        : '<p style="color:var(--text-muted);font-size:13px;padding:20px">لا توجد صور مرفوعة</p>'}
    </div>
  </div>`;

  // Store plans in memory for tab switching
  App._equipPlans = plans;
}

function renderPlanDetails(plan) {
  if (!plan) return '';
  const freqColors = {
    '1 week': '#3f83f8', '2 weeks': '#3f83f8',
    '4 weeks': '#0e9f6e', '1 month': '#0e9f6e',
    '3 months': '#e3a008', '6 months': '#e3a008',
    '1 year': '#e02424',
  };
  const color = freqColors[plan.frequency] || '#1a56db';

  return `
  <div style="border:1px solid var(--border);border-radius:var(--radius-sm);padding:16px;margin-top:8px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
      <span style="background:${color}15;color:${color};font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px">
        ${plan.frequency}
      </span>
      <span class="badge ${plan.condition === 'Running' ? 'badge-success' : 'badge-warning'}">
        ${plan.condition}
      </span>
      <span style="font-size:11px;color:var(--text-muted)">${plan.items_count || 0} بند</span>
    </div>
    <div style="font-size:12px;color:var(--text-muted);line-height:1.6;margin-bottom:12px">
      ${plan.scope || '--'}
    </div>
    <div style="font-size:11px;color:var(--text-light);font-family:monospace">${plan.plan_code}</div>
    <div style="margin-top:12px">
      <button class="btn btn-sm btn-primary" onclick="startPlanInspection('${plan.equipment_id}', '${plan.id}')">
        <i class="fas fa-play"></i> تنفيذ هذه الخطة
      </button>
    </div>
  </div>`;
}

function selectPlanTab(planId, btn) {
  // Update active tab
  document.querySelectorAll('.plan-tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  // Render plan details
  const plan = App._equipPlans?.find(p => p.id === planId);
  const content = document.getElementById('planTabContent');
  if (content && plan) content.innerHTML = renderPlanDetails(plan);
}

async function handleEquipPhotoUpload(event, equipId) {
  const files = Array.from(event.target.files);
  const existingEquip = App.equipmentData.find(e => e.id === equipId);
  const existingPhotos = existingEquip?.photo_urls || [];

  // In a real app we'd upload to storage. Here we use local object URLs
  const newUrls = files.map(f => URL.createObjectURL(f));
  const allPhotos = [...existingPhotos, ...newUrls];

  await apiPatch('equipment', equipId, { photo_urls: allPhotos });
  showToast(`تم رفع ${files.length} صورة بنجاح`, 'success');

  // Update gallery
  const gallery = document.getElementById('equipPhotoGallery');
  if (gallery) {
    gallery.innerHTML = allPhotos.map(url => `
      <div class="photo-preview-item" style="width:120px;height:120px">
        <img src="${url}" alt="equipment photo">
      </div>`).join('');
  }

  // Refresh local data
  const updatedEquip = App.equipmentData.find(e => e.id === equipId);
  if (updatedEquip) updatedEquip.photo_urls = allPhotos;
}
