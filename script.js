async function iniciarTicker() {
  try {
    const response = await fetch("./cotacao.txt?ts=" + Date.now(), {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Não foi possível carregar cotacao.txt");
    }

    const texto = await response.text();
    const items = extrairCotacoes(texto);
    montarTicker(items);
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

  const itens = [];

  for (const linha of linhas) {
    const item = lerLinhaCotacao(linha);
    if (item) itens.push(item);
  }

  return itens;
}

function lerLinhaCotacao(linha) {
  const regex = /^(US\$|USD|GBP|EUR)\s*1\s*=\s*([\d]+(?:[.,]\d+)?)$/i;
  const match = linha.match(regex);

  if (!match) return null;

  let code = match[1].toUpperCase();
  const valorBruto = match[2];

  if (code === "USD") {
    code = "US$";
  }

  return {
    code,
    value: formatarReal(valorBruto)
  };
}

function formatarReal(valorBruto) {
  const numero = parseFloat(valorBruto.replace(",", "."));

  if (isNaN(numero)) return "R$ --";

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function montarTicker(items) {
  const groupA = document.getElementById("ticker-group-a");
  const groupB = document.getElementById("ticker-group-b");

  groupA.innerHTML = "";
  groupB.innerHTML = "";

  if (!items.length) {
    exibirErro("Nenhuma cotação válida encontrada.");
    return;
  }

  items.forEach((item) => {
    groupA.appendChild(criarItem(item));
    groupB.appendChild(criarItem(item));
  });
}

function criarItem(item) {
  const div = document.createElement("div");
  div.className = "ticker-item";

  const code = document.createElement("span");
  code.className = "ticker-code";
  code.textContent = item.code + "1";

  const equals = document.createElement("span");
  equals.className = "ticker-equals";
  equals.textContent = "=";

  const value = document.createElement("span");
  value.className = "ticker-value";
  value.textContent = item.value;

  div.appendChild(code);
  div.appendChild(equals);
  div.appendChild(value);

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
