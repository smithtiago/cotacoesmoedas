async function iniciarTicker() {
  try {
    const response = await fetch("./cotacao.txt?ts=" + Date.now(), {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Não foi possível carregar cotacao.txt");
    }

    const texto = await response.text();
    const data = extrairCotacoes(texto);
    montarTicker(data.items);
  } catch (error) {
    console.error(error);
    exibirErro("Não foi possível carregar as cotações.");
  }
}

function extrairCotacoes(texto) {
  const linhas = texto
    .split(/\r?\n/)
    .map((linha) => linha.trim())
    .filter(Boolean);

  const atuais = {};
  const anteriores = {};

  let secao = "atual";

  for (const linha of linhas) {
    if (/^anterior[:]?$/i.test(linha)) {
      secao = "anterior";
      continue;
    }

    const item = lerLinhaCotacao(linha);
    if (!item) continue;

    if (secao === "atual") {
      atuais[item.codeKey] = item;
    } else {
      anteriores[item.codeKey] = item;
    }
  }

  const ordem = ["USD", "GBP", "EUR"];
  const items = [];

  ordem.forEach((key) => {
    if (!atuais[key]) return;

    const atual = atuais[key];
    const anterior = anteriores[key];

    items.push({
      label: atual.label,
      valueNumber: atual.valueNumber,
      valueFormatted: formatarReal(atual.valueNumber),
      change: anterior ? calcularVariacao(atual.valueNumber, anterior.valueNumber) : null
    });
  });

  return { items };
}

function lerLinhaCotacao(linha) {
  const regex = /^(US\$|USD|GBP|EUR)\s*1\s*=\s*([\d]+(?:[.,]\d+)?)$/i;
  const match = linha.match(regex);

  if (!match) return null;

  const rawCode = match[1].toUpperCase();
  const rawValue = match[2];

  const valueNumber = parseFloat(rawValue.replace(",", "."));
  if (isNaN(valueNumber)) return null;

  let codeKey = rawCode;
  let label = rawCode;

  if (rawCode === "US$" || rawCode === "USD") {
    codeKey = "USD";
    label = "US$1";
  } else if (rawCode === "GBP") {
    codeKey = "GBP";
    label = "£1";
  } else if (rawCode === "EUR") {
    codeKey = "EUR";
    label = "€1";
  }

  return {
    codeKey,
    label,
    valueNumber
  };
}

function calcularVariacao(atual, anterior) {
  if (!anterior || anterior === 0) return null;
  return ((atual - anterior) / anterior) * 100;
}

function formatarReal(numero) {
  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatarVariacao(valor) {
  if (valor === null || Number.isNaN(valor)) return null;

  const arredondado = Math.abs(valor).toFixed(2).replace(".", ",");
  const classe = valor > 0 ? "up" : valor < 0 ? "down" : "neutral";
  const seta = valor > 0 ? "▲" : valor < 0 ? "▼" : "•";

  return {
    classe,
    texto: `${arredondado}%`,
    seta
  };
}

function montarTicker(items) {
  const groupA = document.getElementById("ticker-group-a");
  const groupB = document.getElementById("ticker-group-b");
  const viewport = document.getElementById("ticker-viewport");

  groupA.innerHTML = "";
  groupB.innerHTML = "";

  if (!items.length) {
    exibirErro("Nenhuma cotação válida encontrada.");
    return;
  }

  const baseItems = items.map(criarItem);

  baseItems.forEach((el) => groupA.appendChild(el));

  // repete até preencher com sobra a largura visível
  let tentativas = 0;
  while (groupA.scrollWidth < viewport.clientWidth * 1.5 && tentativas < 10) {
    items.forEach((item) => groupA.appendChild(criarItem(item)));
    tentativas++;
  }

  groupB.innerHTML = groupA.innerHTML;
}

function criarItem(item) {
  const div = document.createElement("div");
  div.className = "ticker-item";

  const code = document.createElement("span");
  code.className = "ticker-code";
  code.textContent = item.label;

  const equals = document.createElement("span");
  equals.className = "ticker-equals";
  equals.textContent = "=";

  const value = document.createElement("span");
  value.className = "ticker-value";
  value.textContent = item.valueFormatted;

  div.appendChild(code);
  div.appendChild(equals);
  div.appendChild(value);

  const variacao = formatarVariacao(item.change);
  if (variacao) {
    const change = document.createElement("span");
    change.className = "ticker-change " + variacao.classe;

    const arrow = document.createElement("span");
    arrow.className = "change-arrow";
    arrow.textContent = variacao.seta;

    const txt = document.createElement("span");
    txt.textContent = variacao.texto;

    change.appendChild(arrow);
    change.appendChild(txt);
    div.appendChild(change);
  }

  return div;
}

function exibirErro(mensagem) {
  const groupA = document.getElementById("ticker-group-a");
  const groupB = document.getElementById("ticker-group-b");

  const html = `
    <div class="ticker-item">
      <span class="ticker-code">COTAÇÕES</span>
      <span class="ticker-value">${mensagem}</span>
    </div>
  `;

  groupA.innerHTML = html;
  groupB.innerHTML = html;
}

iniciarTicker();
setInterval(iniciarTicker, 60000);
window.addEventListener("resize", iniciarTicker);
