const statusEl = document.getElementById('status');
const socket = io();
socket.on('connect', ()=> statusEl.textContent = 'online');
socket.on('disconnect', ()=> statusEl.textContent = 'offline');

async function refreshProducts(){
  const res = await fetch('/api/products'); const products = await res.json();
  const tbody = document.querySelector('#productsTable tbody'); tbody.innerHTML = '';
  products.slice().reverse().forEach(p=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${p.name}</td><td>${p.category}</td><td>${p.favourite?'✅':'—'}</td><td>${p.cogs ?? '—'}</td><td>${p.price ?? '—'}</td>`;
    tbody.appendChild(tr);
  });
}
document.getElementById('btnRefreshProducts').onclick = refreshProducts;
socket.on('products:update', refreshProducts);
refreshProducts();

document.getElementById('btnQuickAdd').onclick = async () => {
  const quickText = document.getElementById('quickText').value.trim();
  const ingredientsText = document.getElementById('ingredientsText').value.trim();
  const payload = { quickAddText: quickText || null, ingredientsText: ingredientsText || null };
  const res = await fetch('/api/products', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
  const out = await res.json();
  const div = document.getElementById('quickResult');
  if(out.error){ div.textContent = 'Error: '+out.error; return; }
  div.innerHTML = `<b>Saved:</b> ${out.item.name} @ ${out.item.price ?? 'no price'} (COGS ${out.item.cogs ?? 'n/a'})`;
  document.getElementById('quickText').value='';
  document.getElementById('ingredientsText').value='';
  refreshProducts();
};

// Prep markers
async function refreshMarkers() {
  const res = await fetch('/api/markers'); const list = await res.json();
  const ul = document.getElementById('markersList'); ul.innerHTML = '';
  list.slice().reverse().forEach(m=>{
    const li = document.createElement('li');
    const minsAgo = Math.round((Date.now()-m.start)/60000);
    li.innerHTML = `<b>${m.label}</b> • ${m.minutes}m • started ${minsAgo}m ago <button data-id="${m.id}">clear</button>`;
    ul.appendChild(li);
  });
  ul.onclick = async e => {
    if(e.target.tagName === 'BUTTON'){
      const id = e.target.getAttribute('data-id');
      await fetch('/api/markers/'+id, {method:'DELETE'});
      refreshMarkers();
    }
  }
}
document.getElementById('btnAddMarker').onclick = async ()=>{
  const label = document.getElementById('markerLabel').value;
  const minutes = parseInt(document.getElementById('markerMinutes').value || '5', 10);
  await fetch('/api/markers', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({label, minutes})});
  refreshMarkers();
};
socket.on('markers:update', refreshMarkers);
refreshMarkers();
