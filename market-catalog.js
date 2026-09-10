const catalogApi = 'https://api.github.com/repos/denzyve/cdn-telegram-gifts/git/trees/main?recursive=1';
const catalogRaw = 'https://raw.githubusercontent.com/denzyve/cdn-telegram-gifts/main/assets/webp/';
const catalogPrices = [15, 25, 50, 100, 200, 350, 500, 1000, 2000, 5000, 10000, 20000];
const catalogColors = ['nft-sun', 'nft-wave', 'nft-flame'];

function catalogCard(id, index) {
  const price = catalogPrices[index % catalogPrices.length];
  const color = catalogColors[index % catalogColors.length];
  const gift = `Telegram Gift ${id}`;
  return `<article class="nft-card ${color}"><div class="nft-art"><img src="${catalogRaw}gift_${id}.webp" alt="Telegram gift ${id}" loading="lazy"></div><div><span class="nft-id">GIFT #${id}</span><h3>Telegram Gift</h3><p>Limited edition</p><button class="buy-button" data-gift="${gift}" data-price="${price}">★ ${price.toLocaleString('ru-RU')} <span>Купить</span></button><button class="upgrade-button" data-upgrade="${gift}">◇ В апгрейд</button></div></article>`;
}

function bindCatalogActions() {
  document.querySelectorAll('.buy-button').forEach(button => button.onclick = () => {
    const state = JSON.parse(localStorage.getItem('nftDepotState') || '{"collection":[]}');
    state.collection = Array.isArray(state.collection) ? state.collection : [];
    const gift = button.dataset.gift;
    if (state.collection.includes(gift)) return window.alert('Этот подарок уже в коллекции');
    state.collection.push(gift);
    localStorage.setItem('nftDepotState', JSON.stringify(state));
    button.innerHTML = '✓ В коллекции';
    button.disabled = true;
  });
  document.querySelectorAll('.upgrade-button').forEach(button => button.onclick = () => {
    const state = JSON.parse(localStorage.getItem('nftDepotState') || '{"collection":[]}');
    state.collection = Array.isArray(state.collection) ? state.collection : [];
    if (!state.collection.includes(button.dataset.upgrade)) return window.alert('Сначала добавь подарок в коллекцию');
    window.switchView('games');
    window.openGame('upgrade');
    document.querySelector('#modal-title').textContent = `Апгрейд: ${button.dataset.upgrade}`;
  });
}

async function loadFullCatalog() {
  const grid = document.querySelector('#market-grid');
  if (!grid) return;
  try {
    const response = await fetch(catalogApi);
    if (!response.ok) throw new Error('Catalog unavailable');
    const data = await response.json();
    const ids = data.tree.filter(item => /^assets\/webp\/gift_\d+\.webp$/.test(item.path)).map(item => item.path.match(/gift_(\d+)\.webp$/)[1]);
    grid.innerHTML = ids.map(catalogCard).join('');
    bindCatalogActions();
    const heading = document.querySelector('.nft-heading');
    if (heading) heading.querySelector('h2').textContent = `Подарки Telegram · ${ids.length}`;
  } catch (error) {
    bindCatalogActions();
  }
}

window.addEventListener('load', loadFullCatalog);
