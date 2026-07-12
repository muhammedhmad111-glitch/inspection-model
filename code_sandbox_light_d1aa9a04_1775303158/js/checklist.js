/* ============================================
   Checklist Execution Logic
   ============================================ */

// Pre-defined checklist templates based on Excel data
const CHECKLIST_TEMPLATES = {
  // ── APRON FEEDER E11-04 ────────────────────────────────
  'ip-e1104-01': [
    { phase: '10', sub: '10.01', component: 'Safety', item: 'Check condition of access, guardrails, housings, ladders, emergency stops', critical: true },
    { phase: '10', sub: '10.01', component: 'Safety', item: 'Check lighting', critical: false },
    { phase: '10', sub: '10.01', component: 'Safety & Environment', item: 'Check general housekeeping and cleanliness', critical: false },
    { phase: '20', sub: '20.01', component: 'Drive Unit', item: 'Check motor temperature – max 80°C', critical: true, unit: '°C', max: 80 },
    { phase: '20', sub: '20.01', component: 'Drive Unit', item: 'Check gearbox oil level – check sight glass', critical: true },
    { phase: '20', sub: '20.01', component: 'Drive Unit', item: 'Check gearbox for oil leaks', critical: true },
    { phase: '20', sub: '20.02', component: 'Drive Sprocket', item: 'Check sprocket teeth condition', critical: true },
    { phase: '20', sub: '20.02', component: 'Drive Sprocket', item: 'Check sprocket bearing temperature', critical: true, unit: '°C', max: 80 },
    { phase: '30', sub: '30.01', component: 'Apron Chain', item: 'Check chain tension – both sides equal', critical: true },
    { phase: '30', sub: '30.01', component: 'Apron Chain', item: 'Check chain links for cracks or deformation', critical: true },
    { phase: '30', sub: '30.01', component: 'Apron Chain', item: 'Check chain lubrication', critical: false },
    { phase: '40', sub: '40.01', component: 'Apron Plates', item: 'Check apron plates for wear or damage', critical: true },
    { phase: '40', sub: '40.01', component: 'Apron Plates', item: 'Check all bolts are tight', critical: false },
    { phase: '50', sub: '50.01', component: 'Rails', item: 'Check upper rail condition – initial 18mm, min 12mm', critical: true, unit: 'mm', min: 12, max: 18 },
    { phase: '50', sub: '50.01', component: 'Rails', item: 'Check lower rail condition – initial 50mm, min 46.5mm', critical: true, unit: 'mm', min: 46.5, max: 50 },
    { phase: '60', sub: '60.01', component: 'Take-up Unit', item: 'Check take-up bearing condition', critical: false },
    { phase: '60', sub: '60.01', component: 'Take-up Unit', item: 'Check take-up tension springs', critical: false },
    { phase: '70', sub: '70.01', component: 'Dust Sealing', item: 'Check all dust sealing strips condition', critical: false },
    { phase: '70', sub: '70.01', component: 'Dust Sealing', item: 'Check dust collector functioning', critical: false },
    { phase: '80', sub: '80.01', component: 'General', item: 'Check overall vibration level', critical: true },
    { phase: '80', sub: '80.01', component: 'General', item: 'Check for unusual noises', critical: true },
  ],

  // ── BELT CONVEYOR D11-01 ───────────────────────────────
  'ip-d1101-01': [
    { phase: '10', sub: '10.01', component: 'Safety', item: 'Check condition of access, guardrails, housings, ladders, emergency stops', critical: true },
    { phase: '10', sub: '10.01', component: 'Safety', item: 'Check lighting and emergency pull cords', critical: false },
    { phase: '20', sub: '20.01', component: 'Drive Unit', item: 'Check drive motor temperature', critical: true, unit: '°C', max: 80 },
    { phase: '20', sub: '20.01', component: 'Drive Unit', item: 'Check gearbox oil level and leaks', critical: true },
    { phase: '20', sub: '20.01', component: 'Drive Unit', item: 'Check coupling condition', critical: false },
    { phase: '30', sub: '30.01', component: 'Drive Drum', item: 'Check drive drum bearing temperature', critical: true, unit: '°C', max: 80 },
    { phase: '30', sub: '30.01', component: 'Drive Drum', item: 'Check drive drum for wear or damage', critical: true },
    { phase: '30', sub: '30.02', component: 'Head/Tail Drums', item: 'Check all drum bearings', critical: true },
    { phase: '40', sub: '40.01', component: 'Belt', item: 'Check belt tension – equal on both sides', critical: true },
    { phase: '40', sub: '40.01', component: 'Belt', item: 'Check belt tracking – centered on idlers', critical: true },
    { phase: '40', sub: '40.01', component: 'Belt', item: 'Check belt for tears, cuts or splice condition', critical: true },
    { phase: '40', sub: '40.02', component: 'Belt Scraper', item: 'Check primary and secondary scrapers', critical: false },
    { phase: '50', sub: '50.01', component: 'Idlers', item: 'Check all carrying idlers – rotate freely', critical: true },
    { phase: '50', sub: '50.01', component: 'Idlers', item: 'Check return idlers condition', critical: false },
    { phase: '50', sub: '50.01', component: 'Idlers', item: 'Check impact idlers at loading point', critical: true },
    { phase: '60', sub: '60.01', component: 'Take-up Unit', item: 'Check take-up weight and travel', critical: true },
    { phase: '60', sub: '60.01', component: 'Take-up Unit', item: 'Check take-up pulley condition', critical: false },
    { phase: '70', sub: '70.01', component: 'Chutes & Covers', item: 'Check feed chute for wear', critical: false },
    { phase: '70', sub: '70.01', component: 'Chutes & Covers', item: 'Check all covers in place', critical: false },
    { phase: '80', sub: '80.01', component: 'General', item: 'Check belt running without noise/vibration', critical: true },
  ],

  // ── DYNAMIC SEPARATOR E11-23 ───────────────────────────
  'ip-e1123-01': [
    { phase: '10', sub: '10.01', component: 'Safety', item: 'Check condition of access, guardrails, housings, ladders, emergency stops', critical: true },
    { phase: '10', sub: '10.01', component: 'Safety', item: 'Check lighting', critical: false },
    { phase: '20', sub: '20.01', component: 'Drive Unit', item: 'Check separator drive motor temperature', critical: true, unit: '°C', max: 80 },
    { phase: '20', sub: '20.01', component: 'Drive Unit', item: 'Check VFD/inverter condition and cooling', critical: true },
    { phase: '20', sub: '20.01', component: 'Drive Unit', item: 'Check drive belt/coupling condition', critical: false },
    { phase: '30', sub: '30.01', component: 'Separator Body', item: 'Check separator housing for cracks', critical: true },
    { phase: '30', sub: '30.01', component: 'Separator Body', item: 'Check air inlet duct condition', critical: false },
    { phase: '30', sub: '30.02', component: 'Rotor', item: 'Check rotor cage condition and wear', critical: true },
    { phase: '30', sub: '30.02', component: 'Rotor', item: 'Check rotor shaft seal condition', critical: true },
    { phase: '40', sub: '40.01', component: 'Bearings', item: 'Check upper bearing temperature – max 75°C', critical: true, unit: '°C', max: 75 },
    { phase: '40', sub: '40.01', component: 'Bearings', item: 'Check lower bearing temperature', critical: true, unit: '°C', max: 75 },
    { phase: '40', sub: '40.01', component: 'Bearings', item: 'Check bearing lubrication – grease quantity', critical: true },
    { phase: '50', sub: '50.01', component: 'Reject Cone', item: 'Check reject cone thickness and wear', critical: true },
    { phase: '50', sub: '50.01', component: 'Reject Cone', item: 'Check cone valve position', critical: false },
    { phase: '60', sub: '60.01', component: 'General', item: 'Check separator for vibration', critical: true },
    { phase: '60', sub: '60.01', component: 'General', item: 'Check separator current – compare with nameplate', critical: true },
  ],

  // ── ROLLER MILL E11-21 ─────────────────────────────────
  'ip-e1121-01': [
    { phase: '10', sub: '10.01', component: 'Safety', item: 'Check condition of access, guardrails, housings, ladders, emergency stops', critical: true },
    { phase: '10', sub: '10.01', component: 'Safety', item: 'Check lighting', critical: false },
    { phase: '20', sub: '20.01', component: 'Main Drive', item: 'Check main motor temperature', critical: true, unit: '°C', max: 80 },
    { phase: '20', sub: '20.01', component: 'Main Drive', item: 'Check main gearbox oil level and pressure', critical: true },
    { phase: '20', sub: '20.01', component: 'Main Drive', item: 'Check gearbox oil temperature', critical: true, unit: '°C', max: 60 },
    { phase: '20', sub: '20.01', component: 'Main Drive', item: 'Check gearbox for vibration', critical: true },
    { phase: '30', sub: '30.01', component: 'Grinding Rollers', item: 'Check roller bearing temperatures – max 80°C', critical: true, unit: '°C', max: 80 },
    { phase: '30', sub: '30.01', component: 'Grinding Rollers', item: 'Check roller for unusual vibration', critical: true },
    { phase: '30', sub: '30.02', component: 'Tyre & Race', item: 'Check tyre and race wear – compare to reference data', critical: true },
    { phase: '30', sub: '30.02', component: 'Tyre & Race', item: 'Check material build-up between tyre and race', critical: false },
    { phase: '40', sub: '40.01', component: 'Grinding Table', item: 'Check grinding table condition', critical: true },
    { phase: '40', sub: '40.01', component: 'Grinding Table', item: 'Check wear plates – measure and compare to limits', critical: true },
    { phase: '40', sub: '40.01', component: 'Grinding Table', item: 'Check table rotation – no unusual sounds', critical: false },
    { phase: '50', sub: '50.01', component: 'Hydraulic System', item: 'Check hydraulic oil level', critical: true },
    { phase: '50', sub: '50.01', component: 'Hydraulic System', item: 'Check hydraulic pressure – compare to set point', critical: true },
    { phase: '50', sub: '50.01', component: 'Hydraulic System', item: 'Check for hydraulic oil leaks', critical: true },
    { phase: '60', sub: '60.01', component: 'Classifier', item: 'Check classifier bearing temperatures', critical: true, unit: '°C', max: 75 },
    { phase: '60', sub: '60.01', component: 'Classifier', item: 'Check classifier speed (RPM)', critical: true },
    { phase: '70', sub: '70.01', component: 'Air System', item: 'Check hot gas inlet temperature', critical: true },
    { phase: '70', sub: '70.01', component: 'Air System', item: 'Check mill exit temperature', critical: true },
    { phase: '70', sub: '70.01', component: 'Air System', item: 'Check mill inlet temperature', critical: false },
    { phase: '80', sub: '80.01', component: 'General', item: 'Check mill vibration level – trip limit', critical: true },
    { phase: '80', sub: '80.01', component: 'General', item: 'Check for material spillage around mill', critical: false },
  ],

  // ── ROTARY VALVE E11-18 ────────────────────────────────
  'ip-e1118-01': [
    { phase: '10', sub: '10.01', component: 'Safety', item: 'Check condition of access, guardrails, housings, ladders, emergency stops', critical: true },
    { phase: '10', sub: '10.01', component: 'Safety', item: 'Check lighting', critical: false },
    { phase: '20', sub: '20.01', component: 'Drive Unit', item: 'Check motor temperature – max 80°C', critical: true, unit: '°C', max: 80 },
    { phase: '20', sub: '20.01', component: 'Drive Unit', item: 'Check drive chain/coupling condition', critical: false },
    { phase: '30', sub: '30.01', component: 'Rotor', item: 'Check rotor rotation – smooth without sticking', critical: true },
    { phase: '30', sub: '30.01', component: 'Rotor', item: 'Check rotor vanes for wear or damage', critical: true },
    { phase: '30', sub: '30.01', component: 'Rotor', item: 'Check clearance between rotor and casing – min specs', critical: true },
    { phase: '40', sub: '40.01', component: 'Bearings', item: 'Check inlet bearing temperature', critical: true, unit: '°C', max: 80 },
    { phase: '40', sub: '40.01', component: 'Bearings', item: 'Check outlet bearing temperature', critical: true, unit: '°C', max: 80 },
    { phase: '40', sub: '40.01', component: 'Bearings', item: 'Check bearing lubrication', critical: true },
    { phase: '50', sub: '50.01', component: 'Sealing', item: 'Check air seal condition and function', critical: true },
    { phase: '50', sub: '50.01', component: 'Sealing', item: 'Check for dust leakage around seals', critical: false },
    { phase: '60', sub: '60.01', component: 'General', item: 'Check operating current – compare to nameplate', critical: true },
    { phase: '60', sub: '60.01', component: 'General', item: 'Check for unusual noise or vibration', critical: true },
    { phase: '60', sub: '60.01', component: 'General', item: 'Check housing for cracks or damage', critical: false },
  ],

  // ── BRIDGE RECLAIMER C11-03 ─────────────────────────────
  'ip-c1103-01': [
    { phase: '10', sub: '10.01', component: 'Safety', item: 'Check condition of access, guardrails, housings, ladders, emergency stops', critical: true },
    { phase: '10', sub: '10.01', component: 'Safety', item: 'Check lighting on bridge', critical: false },
    { phase: '10', sub: '10.01', component: 'Safety', item: 'Check anemometer (wind speed) functioning', critical: true },
    { phase: '20', sub: '20.01', component: 'Travel Drive', item: 'Check bridge travel drive motors – temperature', critical: true, unit: '°C', max: 80 },
    { phase: '20', sub: '20.01', component: 'Travel Drive', item: 'Check bridge rail wheels condition', critical: true },
    { phase: '20', sub: '20.01', component: 'Travel Drive', item: 'Check travel gear box oil level', critical: true },
    { phase: '30', sub: '30.01', component: 'Bucket Wheel', item: 'Check bucket wheel drive motor temperature', critical: true, unit: '°C', max: 80 },
    { phase: '30', sub: '30.01', component: 'Bucket Wheel', item: 'Check bucket wheel for wear or damage', critical: true },
    { phase: '30', sub: '30.01', component: 'Bucket Wheel', item: 'Check bucket wheel speed', critical: true },
    { phase: '30', sub: '30.02', component: 'Slewing', item: 'Check slewing drive motor temperature', critical: true, unit: '°C', max: 80 },
    { phase: '30', sub: '30.02', component: 'Slewing', item: 'Check slewing ring condition', critical: true },
    { phase: '40', sub: '40.01', component: 'Boom Conveyor', item: 'Check boom conveyor belt condition and tracking', critical: true },
    { phase: '40', sub: '40.01', component: 'Boom Conveyor', item: 'Check boom conveyor drive motor', critical: true, unit: '°C', max: 80 },
    { phase: '50', sub: '50.01', component: 'Electrical', item: 'Check festoon cable system condition', critical: true },
    { phase: '50', sub: '50.01', component: 'Electrical', item: 'Check control cabin equipment', critical: false },
    { phase: '60', sub: '60.01', component: 'Harrow', item: 'Check harrow teeth for wear or damage', critical: true },
    { phase: '60', sub: '60.01', component: 'Harrow', item: 'Check harrow drive functioning', critical: true },
    { phase: '70', sub: '70.01', component: 'Rails', item: 'Check bridge travel rails for wear', critical: true },
    { phase: '70', sub: '70.01', component: 'Rails', item: 'Check buffer stops at both ends', critical: true },
    { phase: '80', sub: '80.01', component: 'Lubrication', item: 'Check central lubrication system', critical: true },
    { phase: '80', sub: '80.01', component: 'Lubrication', item: 'Check grease level in central reservoir', critical: false },
    { phase: '90', sub: '90.01', component: 'General', item: 'Check overall vibration level', critical: true },
    { phase: '90', sub: '90.01', component: 'General', item: 'Check for unusual noises', critical: true },
  ],
};

// Generate template for any plan ID (fallback)
function generateGenericChecklist(plan) {
  const items = [];
  const phases = [
    { phase: '10', sub: '10.01', component: 'Safety & Environment', items: ['Check access, guardrails, emergency stops', 'Check lighting', 'Check housekeeping'] },
    { phase: '20', sub: '20.01', component: 'Drive Unit', items: ['Check motor temperature', 'Check gearbox oil level', 'Check coupling condition'] },
    { phase: '30', sub: '30.01', component: 'Main Component', items: ['Check main component condition', 'Check for wear or damage', 'Check alignment'] },
    { phase: '40', sub: '40.01', component: 'Bearings', items: ['Check bearing temperatures', 'Check bearing lubrication', 'Check bearing clearance'] },
    { phase: '50', sub: '50.01', component: 'Sealing', items: ['Check seals condition', 'Check for leaks'] },
    { phase: '60', sub: '60.01', component: 'General', items: ['Check for unusual noise', 'Check for unusual vibration', 'Check operating parameters'] },
  ];

  let num = 1;
  phases.forEach(p => {
    p.items.forEach(item => {
      items.push({
        phase: p.phase, sub: p.sub, component: p.component,
        item: item, critical: false
      });
      num++;
    });
  });

  return items;
}

async function loadChecklist() {
  if (!App.currentInspectionId || !App.currentPlanId) {
    document.getElementById('checklistContent').innerHTML =
      '<div class="empty-state"><i class="fas fa-tasks"></i><p>يرجى اختيار فحص أولاً</p></div>';
    return;
  }

  const plan = App.plansData.find(p => p.id === App.currentPlanId);
  const equip = App.equipmentData.find(e => e.id === App.currentEquipmentId);

  if (!plan || !equip) return;

  // Render info bar
  document.getElementById('checklistInfoBar').innerHTML = `
    <div class="insp-info-item"><i class="fas fa-cog"></i><span><strong>${equip.code}</strong> – ${equip.name}</span></div>
    <div class="insp-info-item"><i class="fas fa-list-check"></i><span>${plan.plan_name}</span></div>
    <div class="insp-info-item"><i class="fas fa-sync-alt"></i><span>${plan.frequency}</span></div>
    <div class="insp-info-item"><i class="fas fa-user-hard-hat"></i><span><strong>${document.getElementById('inspectorName')?.value || 'المفتش'}</strong></span></div>
    <div class="insp-info-item"><i class="fas fa-calendar"></i><span>${formatDate(new Date())}</span></div>
    <div class="insp-info-item"><i class="fas fa-clock"></i><span>${document.getElementById('shiftSelect')?.value || 'Morning'}</span></div>
  `;

  // Get checklist items
  let items = CHECKLIST_TEMPLATES[App.currentPlanId] || null;
  if (!items) {
    // Try to find template for same equipment different plan
    const equipPlans = App.plansData.filter(p => p.equipment_id === App.currentEquipmentId);
    for (const ep of equipPlans) {
      if (CHECKLIST_TEMPLATES[ep.id]) {
        items = CHECKLIST_TEMPLATES[ep.id];
        break;
      }
    }
  }
  if (!items) items = generateGenericChecklist(plan);

  App.checklistItems = items;

  // Group by phase
  const groups = {};
  items.forEach((item, idx) => {
    const key = item.phase;
    if (!groups[key]) groups[key] = { phase: item.phase, sub: item.sub, component: item.component, items: [] };
    groups[key].items.push({ ...item, idx });
  });

  const phaseLabels = {
    '10': 'السلامة والبيئة',
    '20': 'وحدة الإدارة',
    '30': 'المكوّن الرئيسي',
    '40': 'المحامل',
    '50': 'الختم والعزل',
    '60': 'الحالة العامة',
    '70': 'نظام الهواء',
    '80': 'ملاحظات عامة',
    '90': 'الفحص الختامي',
  };

  let html = '';
  Object.values(groups).forEach((group, groupIdx) => {
    html += `
    <div class="checklist-group" id="group-${group.phase}">
      <div class="checklist-group-header" onclick="toggleGroup('${group.phase}')">
        <div class="checklist-group-title">
          <span class="phase-badge">${group.phase}</span>
          ${phaseLabels[group.phase] || group.component}
          <span style="font-size:11px;color:var(--text-muted);margin-right:8px">(${group.items.length} بند)</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <span class="group-progress badge badge-muted" id="group-prog-${group.phase}">0/${group.items.length}</span>
          <i class="fas fa-chevron-down collapse-icon" id="collapse-icon-${group.phase}"></i>
        </div>
      </div>
      <div class="checklist-group-body" id="group-body-${group.phase}">
        ${group.items.map(item => renderChecklistItem(item)).join('')}
      </div>
    </div>`;
  });

  document.getElementById('checklistContent').innerHTML = html;
  updateChecklistProgress();
}

function renderChecklistItem(item) {
  const critical = item.critical ? 'critical-item' : '';
  const critIcon = item.critical ? '<i class="fas fa-exclamation-circle" style="color:var(--danger);font-size:10px;margin-left:4px" title="بند حرج"></i>' : '';

  return `
  <div class="checklist-item-row ${critical}" id="item-row-${item.idx}">
    <div class="item-number">${item.idx + 1}</div>
    <div class="item-content">
      <div class="item-component">${item.component} ${item.sub ? `› ${item.sub}` : ''} ${critIcon}</div>
      <div class="item-check">${item.item}</div>
      ${item.unit ? `<div style="font-size:11px;color:var(--text-muted)">القيمة: ${item.unit}${item.min !== undefined ? ` | Min: ${item.min}` : ''}${item.max !== undefined ? ` | Max: ${item.max}` : ''}</div>` : ''}
      ${item.normal_state ? `<div class="item-normal"><i class="fas fa-check-circle"></i> الحالة الطبيعية: ${item.normal_state}</div>` : ''}
    </div>
    <div class="item-controls">
      ${item.unit ? `<input type="number" class="item-note-input" style="width:80px"
        placeholder="${item.unit}" id="val-${item.idx}"
        onchange="updateResult(${item.idx}, null, this.value)">` : ''}
      <button class="result-btn ok" id="btn-ok-${item.idx}" onclick="setResult(${item.idx}, 'OK')">OK</button>
      <button class="result-btn warning" id="btn-warn-${item.idx}" onclick="setResult(${item.idx}, 'Warning')">⚠</button>
      <button class="result-btn nok" id="btn-nok-${item.idx}" onclick="setResult(${item.idx}, 'NOK')">NOK</button>
      <button class="result-btn na" id="btn-na-${item.idx}" onclick="setResult(${item.idx}, 'N/A')">N/A</button>
      <input type="text" class="item-note-input" placeholder="ملاحظة..." id="note-${item.idx}"
             onchange="updateNote(${item.idx}, this.value)">
    </div>
  </div>`;
}

function setResult(idx, result) {
  // Clear all buttons for this item
  ['ok', 'warn', 'nok', 'na'].forEach(t => {
    const btn = document.getElementById(`btn-${t}-${idx}`);
    if (btn) btn.classList.remove('selected');
  });

  // Set selected
  const map = { 'OK': 'ok', 'Warning': 'warn', 'NOK': 'nok', 'N/A': 'na' };
  const btn = document.getElementById(`btn-${map[result]}-${idx}`);
  if (btn) btn.classList.add('selected');

  // Store result
  if (!App.currentChecklistResults[idx]) App.currentChecklistResults[idx] = {};
  App.currentChecklistResults[idx].result = result;

  // Update row highlight
  const row = document.getElementById(`item-row-${idx}`);
  if (row) {
    row.style.background = '';
    if (result === 'NOK') row.style.background = '#fff5f5';
    else if (result === 'Warning') row.style.background = '#fffbeb';
    else if (result === 'OK') row.style.background = '#f0fdf4';
  }

  updateChecklistProgress();
  updateGroupProgress(App.checklistItems[idx]?.phase);

  // Alert if critical NOK
  if (result === 'NOK' && App.checklistItems[idx]?.critical) {
    showToast(`⚠️ بند حرج: ${App.checklistItems[idx]?.item?.substring(0, 40)}...`, 'error', 5000);
    createAlertForCriticalNOK(idx);
  }
}

function updateNote(idx, note) {
  if (!App.currentChecklistResults[idx]) App.currentChecklistResults[idx] = {};
  App.currentChecklistResults[idx].note = note;
}

function updateResult(idx, result, value) {
  if (!App.currentChecklistResults[idx]) App.currentChecklistResults[idx] = {};
  if (result) App.currentChecklistResults[idx].result = result;
  if (value) App.currentChecklistResults[idx].measured_value = value;
}

function updateChecklistProgress() {
  const total = App.checklistItems.length;
  const done = Object.keys(App.currentChecklistResults)
    .filter(k => App.currentChecklistResults[k].result).length;

  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const bar = document.getElementById('checklistProgressBar');
  const text = document.getElementById('checklistProgressText');

  if (bar) bar.style.setProperty('--prog', pct + '%');
  if (text) text.textContent = pct + '%';
}

function updateGroupProgress(phase) {
  if (!phase) return;
  const items = App.checklistItems.filter(i => i.phase === phase);
  const done = items.filter(i => App.currentChecklistResults[i.idx]?.result).length;
  const progEl = document.getElementById(`group-prog-${phase}`);
  if (progEl) {
    progEl.textContent = `${done}/${items.length}`;
    progEl.className = 'group-progress badge ' + (done === items.length ? 'badge-success' : done > 0 ? 'badge-warning' : 'badge-muted');
  }
}

function toggleGroup(phase) {
  const body = document.getElementById(`group-body-${phase}`);
  const icon = document.getElementById(`collapse-icon-${phase}`);
  const group = document.getElementById(`group-${phase}`);

  if (!body) return;

  const isOpen = body.style.maxHeight !== '0px' && body.style.maxHeight !== '';

  if (isOpen) {
    body.style.maxHeight = '0px';
    body.style.overflow = 'hidden';
    if (icon) icon.style.transform = 'rotate(-90deg)';
  } else {
    body.style.maxHeight = body.scrollHeight + 'px';
    body.style.overflow = '';
    if (icon) icon.style.transform = '';
  }
}

async function saveInspection() {
  if (!App.currentInspectionId) return;

  const total = App.checklistItems.length;
  const results = App.currentChecklistResults;
  const done = Object.keys(results).filter(k => results[k].result).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  // Determine overall status
  const hasNOK = Object.values(results).some(r => r.result === 'NOK');
  const hasWarn = Object.values(results).some(r => r.result === 'Warning');
  const overallStatus = hasNOK ? 'Critical' : hasWarn ? 'Warning' : pct >= 80 ? 'Good' : 'Incomplete';

  // Save inspection results to DB
  const resultPromises = Object.entries(results).map(([idx, res]) => {
    const item = App.checklistItems[parseInt(idx)];
    if (!item || !res.result) return null;
    return apiPost('inspection_results', {
      inspection_id: App.currentInspectionId,
      checklist_item_id: `${App.currentPlanId}-${idx}`,
      result: res.result,
      measured_value: res.measured_value || '',
      notes: res.note || '',
      photo_urls: [],
    });
  }).filter(Boolean);

  await Promise.all(resultPromises);

  // Update inspection record
  await apiPatch('inspections', App.currentInspectionId, {
    completion_percent: pct,
    overall_status: overallStatus,
    photo_urls: App.currentPhotos,
  });

  showToast('تم حفظ نتائج الفحص بنجاح', 'success');
}

async function completeInspection() {
  await saveInspection();

  // Update equipment status based on results
  const hasNOK = Object.values(App.currentChecklistResults).some(r => r.result === 'NOK');
  const hasWarn = Object.values(App.currentChecklistResults).some(r => r.result === 'Warning');
  const newStatus = hasNOK ? 'critical' : hasWarn ? 'warning' : 'operational';

  if (App.currentEquipmentId) {
    await apiPatch('equipment', App.currentEquipmentId, {
      status: newStatus,
      last_inspection: new Date().toISOString(),
    });
  }

  showToast('تم إتمام الفحص بنجاح! 🎉', 'success', 5000);
  navigateTo('inspections');
}

async function createAlertForCriticalNOK(itemIdx) {
  const item = App.checklistItems[itemIdx];
  if (!item) return;

  await apiPost('alerts', {
    equipment_id: App.currentEquipmentId,
    inspection_id: App.currentInspectionId,
    alert_type: 'critical_finding',
    severity: 'critical',
    message: `بند حرج (NOK): ${item.item} – ${item.component}`,
    is_resolved: false,
  });

  updateAlertBadge();
}

// ── Photo Upload ─────────────────────────────────────────
function handlePhotoUpload(event) {
  const files = Array.from(event.target.files);
  files.forEach(file => {
    const url = URL.createObjectURL(file);
    App.currentPhotos.push(url);
    addPhotoPreview(url, App.currentPhotos.length - 1);
  });

  const badge = document.getElementById('photoCountBadge');
  if (badge) badge.textContent = App.currentPhotos.length + ' صور';
}

function addPhotoPreview(url, idx) {
  const grid = document.getElementById('photosPreviewGrid');
  if (!grid) return;

  const div = document.createElement('div');
  div.className = 'photo-preview-item';
  div.innerHTML = `
    <img src="${url}" alt="inspection photo">
    <button class="photo-remove-btn" onclick="removePhoto(${idx})">
      <i class="fas fa-times"></i>
    </button>`;
  grid.appendChild(div);
}

function removePhoto(idx) {
  App.currentPhotos.splice(idx, 1);
  const grid = document.getElementById('photosPreviewGrid');
  if (grid) grid.innerHTML = '';
  App.currentPhotos.forEach((url, i) => addPhotoPreview(url, i));
  const badge = document.getElementById('photoCountBadge');
  if (badge) badge.textContent = App.currentPhotos.length + ' صور';
}
