const state = JSON.parse(localStorage.getItem('nftDepotState') || '{"balance":2480,"history":[],"deposits":[],"games":0,"collection":[],"selectedGift":""}');
state.collection = Array.isArray(state.collection) ? state.collection : [];
const save = () => { localStorage.setItem('nftDepotState', JSON.stringify(state)); render(); };
const money = value => new Intl.NumberFormat('ru-RU').format(value);
const $ = selector => document.querySelector(selector);
const toast = message => { const node = $('#toast'); node.textContent = message; node.classList.add('show'); setTimeout(() => node.classList.remove('show'), 2800); };
function render() {
  $('#collection-count').textContent = state.collection.length;
  $('#games-count').textContent = state.games;
  const history = $('#history');
  history.innerHTML = state.history.length ? state.history.slice(0, 5).map(item => `<div class="history-row"><span>${item.game}</span><span>${item.time}</span><strong class="${item.result >= 0 ? 'win' : 'loss'}">${item.result >= 0 ? '+' : ''}★ ${money(item.result)}</strong></div>`).join('') : '<p class="muted">Здесь появится история твоих игр.</p>';
  const deposits = $('#deposit-list');
  const title = '<div class="panel-title"><h3>Мои заявки</h3><span class="muted">Последние 30 минут</span></div>';
  deposits.innerHTML = title + (state.deposits.length ? state.deposits.map(item => `<div class="deposit-row"><span>${item.file}</span><span class="muted">${item.time}</span><strong class="${item.status === 'На проверке' ? 'win' : ''}">${item.status}</strong></div>`).join('') : '<p class="muted" style="margin-top:20px">Заявок пока нет.</p>');
  const recent = state.deposits.filter(item => Date.now() - item.created < 1800000).length;
  $('#limit-count').textContent = Math.max(0, 5 - recent);
}
function switchView(view) { const target = view === 'market' ? 'games' : view; document.querySelectorAll('.view').forEach(item => item.classList.remove('active-view')); $(`#view-${target}`).classList.add('active-view'); document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.view === view)); $('#page-title').textContent = { games: 'Игровой зал', market: 'Маркет', deposit: 'Пополнение', withdraw: 'Вывод', profile: 'Профиль' }[view]; if (view === 'market') document.querySelector('.nft-heading').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
document.querySelectorAll('.nav-item').forEach(button => button.addEventListener('click', () => switchView(button.dataset.view)));
document.querySelectorAll('.buy-button').forEach(button => button.addEventListener('click', () => {
  const gift = button.dataset.gift;
  if (state.collection.includes(gift)) return toast('Этот подарок уже в коллекции');
  state.collection.push(gift);
  button.innerHTML = '✓ В коллекции';
  button.disabled = true;
  save();
  toast(`${gift} добавлен в коллекцию`);
}));
document.querySelectorAll('.upgrade-button').forEach(button => button.addEventListener('click', () => {
  const gift = button.dataset.upgrade;
  if (!state.collection.includes(gift)) return toast('Сначала добавь подарок в коллекцию');
  state.selectedGift = gift;
  switchView('games');
  openGame('upgrade');
  $('#modal-title').textContent = `Апгрейд: ${gift}`;
  $('#modal-subtitle').textContent = 'Улучши выбранный Telegram-подарок';
}));
$('#clear-history').addEventListener('click', () => { state.history = []; save(); });
$('#proof-file').addEventListener('change', event => { $('#file-label').textContent = event.target.files[0]?.name || 'Выбрать изображение'; });
$('#submit-deposit').addEventListener('click', () => { const file = $('#proof-file').files[0]; const recent = state.deposits.filter(item => Date.now() - item.created < 1800000).length; if (!file) return toast('Сначала выбери изображение'); if (recent >= 5) return toast('Лимит 5 заявок за 30 минут исчерпан'); state.deposits.unshift({ file: file.name, time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }), status: 'На проверке', created: Date.now() }); $('#proof-file').value = ''; $('#file-label').textContent = 'Выбрать изображение'; save(); toast('Заявка отправлена администратору'); });
$('#withdraw-button').addEventListener('click', () => { const amount = Number($('#withdraw-amount').value); if (!amount || amount < 100) return toast('Минимальная сумма вывода: ★ 100'); if (amount > state.balance) return toast('Недостаточно ★'); if (!$('#withdraw-destination').value.trim()) return toast('Укажи кошелёк или username'); toast('Заявка на вывод создана'); });
function addGameResult(game, result) { state.balance += result; state.games += 1; state.history.unshift({ game, result, time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) }); save(); }
const modal = $('#game-modal'); const closeModal = () => modal.classList.add('hidden'); $('#close-modal').addEventListener('click', closeModal); modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });
function openGame(game) { modal.classList.remove('hidden'); $('#modal-tag').textContent = game.toUpperCase(); $('#modal-title').textContent = { mines: 'Мины', crash: 'Краш', upgrade: 'Апгрейд' }[game]; $('#modal-subtitle').textContent = { mines: 'Выбери безопасную клетку', crash: 'Забери выигрыш до падения', upgrade: 'Попробуй улучшить предмет' }[game]; const content = $('#game-content'); if (game === 'mines') { content.innerHTML = `<div class="game-controls"><input id="mines-bet" type="number" min="10" value="50"><button id="mines-start">Поставить</button></div><div class="mines-board">${Array.from({ length: 15 }, (_, i) => `<button class="mine-cell" data-cell="${i}">?</button>`).join('')}</div>`; $('#mines-start').onclick = () => { const bet = Number($('#mines-bet').value); if (bet < 10 || bet > state.balance) return toast('Проверь размер ставки'); state.balance -= bet; document.querySelectorAll('.mine-cell').forEach(cell => cell.onclick = () => { const safe = Math.random() > .25; cell.textContent = safe ? '◆' : '×'; cell.style.background = safe ? '#bdeac0' : '#ffb29d'; cell.disabled = true; if (!safe) { addGameResult('Мины', -bet); toast('Мина! Ставка потеряна'); } else { const prize = Math.round(bet * 1.35); addGameResult('Мины', prize); toast(`Безопасно! +★ ${prize}`); } }); save(); toast('Сделай ход'); }; } else if (game === 'crash') { content.innerHTML = `<div class="crash-screen"><div class="multiplier" id="multiplier">1.00x</div><p class="muted">Ставка: ★ 50</p><button id="crash-start">Запустить раунд</button></div>`; let timer; $('#crash-start').onclick = () => { const bet = 50; if (state.balance < bet) return toast('Недостаточно ★'); state.balance -= bet; let mult = 1; $('#crash-start').disabled = true; timer = setInterval(() => { mult += .11; $('#multiplier').textContent = `${mult.toFixed(2)}x`; if (Math.random() < .08) { clearInterval(timer); addGameResult('Краш', -bet); $('#multiplier').textContent = `${mult.toFixed(2)}x`; $('#crash-start').textContent = 'Раунд завершён'; toast('Краш!'); } }, 150); }; } else { content.innerHTML = `<div class="upgrade-visual">◇<p class="muted">Шанс успеха: 52%</p><button id="upgrade-start">Апгрейд за ★ 75</button></div>`; $('#upgrade-start').onclick = () => { if (state.balance < 75) return toast('Недостаточно ★'); state.balance -= 75; const win = Math.random() > .48; addGameResult('Апгрейд', win ? 130 : -75); toast(win ? 'Апгрейд успешен! +★ 130' : 'Апгрейд не удался'); closeModal(); }; } }
document.querySelectorAll('.game-card').forEach(card => card.addEventListener('click', () => openGame(card.dataset.game)));
render();
