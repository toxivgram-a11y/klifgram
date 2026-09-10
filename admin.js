const state = JSON.parse(localStorage.getItem('nftDepotState') || '{"deposits":[],"adminHistory":[]}');
state.deposits = Array.isArray(state.deposits) ? state.deposits : [];
state.adminHistory = Array.isArray(state.adminHistory) ? state.adminHistory : [];
const save = () => localStorage.setItem('nftDepotState', JSON.stringify(state));
const money = value => new Intl.NumberFormat('ru-RU').format(value);
const toast = message => { const node = document.querySelector('#toast'); node.textContent = message; node.classList.add('show'); setTimeout(() => node.classList.remove('show'), 2600); };
function render() {
  const pending = state.deposits.filter(item => item.status === 'На проверке');
  document.querySelector('#pending-count').textContent = pending.length;
  document.querySelector('#admin-deposits').innerHTML = pending.length ? pending.map(item => `<div class="row"><div><strong>${item.file}</strong><small>${item.time}</small></div><button class="approve" data-index="${state.deposits.indexOf(item)}">Подтвердить</button></div>`).join('') : '<p class="muted">Новых заявок нет.</p>';
  document.querySelector('#admin-history').innerHTML = state.adminHistory.length ? state.adminHistory.slice(0, 12).map(item => `<div class="row"><div><strong>${item.user}</strong><small>${item.reason} · ${item.time}</small></div><span class="credit">+★ ${money(item.amount)}</span></div>`).join('') : '<p class="muted">Начислений пока нет.</p>';
  document.querySelectorAll('[data-index]').forEach(button => button.addEventListener('click', () => { const item = state.deposits[Number(button.dataset.index)]; if (!item || item.status !== 'На проверке') return; item.status = 'Подтверждено'; save(); render(); toast('Заявка подтверждена'); }));
}
document.querySelector('#credit-form').addEventListener('submit', event => { event.preventDefault(); const user = document.querySelector('#admin-user').value.trim(); const amount = Number(document.querySelector('#admin-amount').value); const reason = document.querySelector('#admin-reason').value.trim() || 'Ручное начисление'; if (!user.startsWith('@')) return toast('Username должен начинаться с @'); if (!amount || amount < 1) return toast('Укажи сумму'); state.adminHistory.unshift({ user, amount, reason, time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) }); save(); event.target.reset(); render(); toast(`Начислено ★ ${money(amount)} пользователю ${user}`); });
render();
