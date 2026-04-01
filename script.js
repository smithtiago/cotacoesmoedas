async function loadData(){
 const res = await fetch('cotacao.txt?ts='+Date.now());
 const txt = await res.text();

 const lines = txt.split('\n');
 const items = [];

 lines.forEach(l=>{
  const m = l.match(/(US\$|USD|EUR|GBP).*?([\d,]+)/);
  if(m){
    let code = m[1].replace('US$','USD');
    let val = m[2];
    items.push({code, val});
  }
 });

 render(items);
}

function render(items){
 const a = document.getElementById('ticker-group-a');
 const b = document.getElementById('ticker-group-b');
 a.innerHTML=''; b.innerHTML='';

 items.forEach(i=>{
   const el = document.createElement('div');
   el.className='ticker-item';
   el.innerHTML = `<b>${i.code}</b> 1 = R$ ${i.val}`;
   a.appendChild(el);
   b.appendChild(el.cloneNode(true));
 });
}

loadData();
setInterval(loadData,60000);
