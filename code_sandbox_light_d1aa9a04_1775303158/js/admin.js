/* ============================================
   Admin Panel Logic
   ============================================ */

async function loadAdmin() {
  const [equipResp, plansResp] = await Promise.all([
    apiGet('equipment'),
    apiGet('inspection_plans'),
  ]);

  App.equipmentData = equipResp.data || [];
  App.plansData = plansResp.data || [];

  renderAdminEquipTable();
  renderAdminPlansTable();
}

function renderAdminEquipTable() {
  const tbody = document.getElementById('adminEquipTable');
  if (!tbody) return;

  tbody.innerHTML = App.equipmentData.map(eq => {
    const s = STATUS_MAP[eq.status] || STATUS_MAP.operational;
    return `
    <tr>
      <td><span class="badge badge-info">${eq.code}</span></td>
      <td style="font-weight:600">${eq.name}</td>
      <td style="font-size:12px;color:var(--text-muted)">${eq.type}</td>
      <td>${getStatusBadge(eq.status)}</td>
      <td>
        <div style="display:flex;gap:4px">
          <button class="btn btn-sm btn-outline" onclick="viewEquipmentDetail('${eq.id}')">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn btn-sm btn-warning" onclick="openStatusModal('${eq.id}')">
            <i class="fas fa-edit"></i>
          </button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function renderAdminPlansTable() {
  const tbody = document.getElementById('adminPlansTable');
  if (!tbody) return;

  tbody.innerHTML = App.plansData.map(plan => {
    const equip = App.equipmentData.find(e => e.id === plan.equipment_id) || {};
    const freqColor = {
      '1 week': '#3f83f8', '2 weeks': '#3f83f8',
      '4 weeks': '#0e9f6e', '1 month': '#0e9f6e',
      '3 months': '#e3a008', '6 months': '#e3a008',
      '1 year': '#e02424',
    }[plan.frequency] || '#64748b';

    return `
    <tr>
      <td style="font-size:10px;font-family:monospace">${plan.plan_code}</td>
      <td><span style="font-weight:600;color:var(--primary)">${equip.code || '--'}</span></td>
      <td>
        <span style="background:${freqColor}15;color:${freqColor};font-size:11px;font-weight:700;padding:3px 8px;border-radius:20px">
          ${plan.frequency}
        </span>
      </td>
      <td style="font-weight:700">${plan.items_count || 0}</td>
      <td>
        <span style="color:${plan.is_active ? 'var(--success)' : 'var(--danger)'}">
          <i class="fas fa-${plan.is_active ? 'check' : 'times'}-circle"></i>
          ${plan.is_active ? 'نشط' : 'غير نشط'}
        </span>
      </td>
    </tr>`;
  }).join('');
}

function showAddEquipModal() {
  showToast('ميزة الإضافة اليدوية قيد التطوير', 'info');
}
