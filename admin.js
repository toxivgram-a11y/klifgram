const money = value => new Intl.NumberFormat('ru-RU').format(value);
const toast = message => { const node = document.querySelector('#toast'); node.textContent = message; node.classList.add('show'); setTimeout(() => node.classList.remove('show'), 2600); };
let dashboard = { pending: [], accruals: [] };
const headers = () => ({ 'Content-Type': 'application/json', 'x-admin-token': document.querySelector('#admin-token').value.trim() });
async function loadDashboard() {
  const response = await fetch('/api/admin/summary', { headers: headers() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Не удалось загрузить панель');
  dashboard = data;
  render();
}
function render() {
  const pending = dashboard.pending;
  document.querySelector('#pending-count').textContent = pending.length;
  document.querySelector('#admin-deposits').innerHTML = pending.length ? pending.map(item => `<div class="row"><div><strong>${item.file || 'NFT-подарок'}</strong><small>${item.createdAt || item.time || ''}</small></div><button class="approve" data-id="${item.id}">Подтвердить</button></div>`).join('') : '<p class="muted">Новых заявок нет.</p>';
  document.querySelector('#admin-history').innerHTML = dashboard.accruals.length ? dashboard.accruals.map(item => `<div class="row"><div><strong>${item.user}</strong><small>${item.reason} · ${item.createdAt}</small></div><span class="credit">+★ ${money(item.amount)}</span></div>`).join('') : '<p class="muted">Начислений пока нет.</p>';
  document.querySelectorAll('[data-id]').forEach(button => button.addEventListener('click', async () => { const response = await fetch(`/api/admin/deposits/${button.dataset.id}/approve`, { method: 'POST', headers: headers() }); const data = await response.json(); if (!response.ok) return toast(data.error || 'Ошибка подтверждения'); await loadDashboard(); toast('Заявка подтверждена'); }));
}
document.querySelector('#credit-form').addEventListener('submit', async event => { event.preventDefault(); const response = await fetch('/api/admin/accrual', { method: 'POST', headers: headers(), body: JSON.stringify({ user: document.querySelector('#admin-user').value.trim(), amount: Number(document.querySelector('#admin-amount').value), reason: document.querySelector('#admin-reason').value.trim() }) }); const data = await response.json(); if (!response.ok) return toast(data.error || 'Ошибка начисления'); document.querySelector('#admin-user').value = ''; document.querySelector('#admin-amount').value = ''; document.querySelector('#admin-reason').value = ''; await loadDashboard(); toast('Начисление сохранено на сервере'); });
document.querySelector('#admin-token').addEventListener('change', () => loadDashboard().catch(error => toast(error.message)));
