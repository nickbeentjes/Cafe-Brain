const statusEl = document.getElementById('status');
const socket = io();
socket.on('connect', ()=> statusEl.textContent = 'online');
socket.on('disconnect', ()=> statusEl.textContent = 'offline');

async function refreshOrders(){
  const res = await fetch('/api/orders'); const orders = await res.json();
  const ul = document.getElementById('orders'); ul.innerHTML = '';
  orders.slice(-10).reverse().forEach(o=>{
    const li = document.createElement('li');
    const items = o.items.map(i=> `${i.qty}× ${i.name}`).join(', ');
    li.textContent = `#${o.id.slice(0,6)} • ${items} • ${new Date(o.createdAt).toLocaleTimeString()}`;
    ul.appendChild(li);
  });
}
async function refreshPrep(){
  const res = await fetch('/api/markers'); const markers = await res.json();
  const ul = document.getElementById('prepTimers'); ul.innerHTML = '';
  markers.slice().reverse().forEach(m=>{
    const end = m.start + m.minutes*60000;
    const remaining = Math.max(0, end - Date.now());
    const mins = Math.floor(remaining/60000);
    const secs = Math.floor((remaining%60000)/1000).toString().padStart(2,'0');
    const li = document.createElement('li');
    li.textContent = `${m.label}: ${mins}:${secs}`;
    ul.appendChild(li);
  });
}
socket.on('orders:new', ()=> { refreshOrders(); });
socket.on('markers:update', ()=> { refreshPrep(); });
setInterval(refreshPrep, 1000);
refreshOrders(); refreshPrep();
