let estruturas = [];
let secaoAtual = "todas";
let modoProfessor = false;

async function carregarEstruturas() {
  try {
    const resposta = await fetch("/api/musculos");
    estruturas = await resposta.json();

    renderizarSecao("dorso");
    renderizarSecao("torax");
    aplicarTemaSalvo();
  } catch (erro) {
    console.error("Erro ao carregar estruturas:", erro);
    mostrarToast("Erro ao carregar os músculos.");
  }
}

function renderizarSecao(secao) {
  const tabsContainer = document.getElementById(`tabs-${secao}`);
  const panelsContainer = document.getElementById(`lista-${secao}`);

  if (!tabsContainer || !panelsContainer) return;

  const termo = (document.getElementById("searchInput")?.value || "").toLowerCase().trim();

  const itens = estruturas.filter(e => {
    const mesmaSecao = e.secao === secao;
    const bateBusca =
      !termo ||
      String(e.id).includes(termo) ||
      (e.nome || "").toLowerCase().includes(termo) ||
      (e.categoria || "").toLowerCase().includes(termo);

    if (secaoAtual === "todas") return mesmaSecao && bateBusca;
    return mesmaSecao && bateBusca && e.secao === secaoAtual;
  });

  tabsContainer.innerHTML = "";
  panelsContainer.innerHTML = "";

  if (!itens.length) {
    panelsContainer.innerHTML = `<div class="viewer-empty">Nenhuma estrutura encontrada nesta seção.</div>`;
    return;
  }

  itens.forEach((item, index) => {
    const tab = document.createElement("button");
    tab.className = `muscle-tab ${index === 0 ? "active" : ""}`;
    tab.type = "button";
    tab.textContent = `${item.id}. ${item.nome}`;
    tab.onclick = () => ativarAba(secao, item.id);
    tabsContainer.appendChild(tab);

    const panel = document.createElement("div");
    panel.className = `muscle-panel ${index === 0 ? "active" : ""}`;
    panel.id = `painel-${secao}-${item.id}`;

    panel.innerHTML = `
      <h3>${item.id}. ${item.nome}</h3>

      <div class="muscle-meta">
        <span class="muscle-chip">${item.secao.toUpperCase()}</span>
        <span class="muscle-chip">${item.categoria}</span>
      </div>

      <div class="answer-block ${modoProfessor ? "" : "locked"}">
        ${
          modoProfessor
            ? `
              <p><strong>Ação:</strong> ${item.acao}</p>
              <p><strong>Fixação proximal:</strong> ${item.fixacao_proximal}</p>
              <p><strong>Inserção:</strong> ${item.insercao}</p>
            `
            : `
              <p><strong>Ação:</strong> 🔒 bloqueada</p>
              <p><strong>Fixação proximal:</strong> 🔒 bloqueada</p>
              <p><strong>Inserção:</strong> 🔒 bloqueada</p>
            `
        }
      </div>

      <div class="muscle-actions">
        <button class="btn btn-primary" type="button" onclick="abrirImagem('${item.imagem}', '${item.nome}')">Ver imagem</button>
        <button class="btn btn-secondary" type="button" onclick="abrirGif('${item.gif}', '${item.nome}')">Ver GIF</button>
        <button class="btn btn-ghost" type="button" onclick="falarEstrutura(${item.id})">Ouvir</button>
      </div>
    `;

    panelsContainer.appendChild(panel);
  });

  const primeiro = itens[0];
  if (primeiro) atualizarResumo(primeiro);
}

function ativarAba(secao, id) {
  document.querySelectorAll(`#tabs-${secao} .muscle-tab`).forEach(btn => btn.classList.remove("active"));
  document.querySelectorAll(`#lista-${secao} .muscle-panel`).forEach(panel => panel.classList.remove("active"));

  const tabs = [...document.querySelectorAll(`#tabs-${secao} .muscle-tab`)];
  const itensDaSecao = estruturas.filter(e => {
    const termo = (document.getElementById("searchInput")?.value || "").toLowerCase().trim();
    const bateBusca =
      !termo ||
      String(e.id).includes(termo) ||
      (e.nome || "").toLowerCase().includes(termo) ||
      (e.categoria || "").toLowerCase().includes(termo);

    if (secaoAtual === "todas") return e.secao === secao && bateBusca;
    return e.secao === secao && e.secao === secaoAtual && bateBusca;
  });

  const indice = itensDaSecao.findIndex(e => e.id === id);

  if (tabs[indice]) tabs[indice].classList.add("active");

  const alvo = document.getElementById(`painel-${secao}-${id}`);
  if (alvo) alvo.classList.add("active");

  const item = estruturas.find(e => e.id === id);
  if (item) atualizarResumo(item);
}

function atualizarResumo(item) {
  const resumo = document.getElementById("resumoEstrutura");
  if (!resumo) return;

  resumo.innerHTML = `
    <strong>${item.id}. ${item.nome}</strong><br>
    <span>${item.categoria}</span><br><br>
    ${
      modoProfessor
        ? `
          <strong>Ação:</strong> ${item.acao}<br>
          <strong>Fixação proximal:</strong> ${item.fixacao_proximal}<br>
          <strong>Inserção:</strong> ${item.insercao}
        `
        : `Ative o modo professor para visualizar ação, fixação proximal e inserção.`
    }
  `;
}

function abrirImagem(caminho, nome) {
  const viewerEmpty = document.getElementById("viewerEmpty");
  const viewerImage = document.getElementById("viewerImage");
  const viewerGif = document.getElementById("viewerGif");

  if (viewerEmpty) viewerEmpty.classList.add("hidden");

  if (viewerGif) {
    viewerGif.classList.add("hidden");
    viewerGif.src = "";
  }

  if (viewerImage) {
    viewerImage.src = `/static/${caminho}`;
    viewerImage.alt = nome;
    viewerImage.classList.remove("hidden");
  }

  tocarClique();
}

function abrirGif(caminho, nome) {
  const viewerEmpty = document.getElementById("viewerEmpty");
  const viewerImage = document.getElementById("viewerImage");
  const viewerGif = document.getElementById("viewerGif");

  if (viewerEmpty) viewerEmpty.classList.add("hidden");

  if (viewerImage) {
    viewerImage.classList.add("hidden");
    viewerImage.src = "";
  }

  if (viewerGif) {
    viewerGif.src = `/static/${caminho}`;
    viewerGif.alt = nome;
    viewerGif.classList.remove("hidden");
  }

  tocarClique();
}

function ativarModoProfessor() {
  const senha = document.getElementById("senhaProfessor")?.value || "";
  const status = document.getElementById("profStatus");

  if (senha === "pinheiro") {
    modoProfessor = true;
    if (status) status.textContent = "Modo professor liberado.";
    renderizarSecao("dorso");
    renderizarSecao("torax");
    mostrarToast("Modo professor ativado.");
  } else {
    if (status) status.textContent = "Senha incorreta.";
    mostrarToast("Senha incorreta.");
  }
}

function desativarModoProfessor() {
  modoProfessor = false;
  const status = document.getElementById("profStatus");
  if (status) status.textContent = "Modo professor bloqueado.";
  renderizarSecao("dorso");
  renderizarSecao("torax");
  mostrarToast("Modo professor bloqueado.");
}

function filtrarEstruturas() {
  renderizarSecao("dorso");
  renderizarSecao("torax");
}

function filtrarPorSecao(secao, botao) {
  secaoAtual = secao;

  document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
  if (botao) botao.classList.add("active");

  const secaoDorso = document.getElementById("secao-dorso");
  const secaoTorax = document.getElementById("secao-torax");

  if (secao === "dorso") {
    secaoDorso.style.display = "block";
    secaoTorax.style.display = "none";
  } else if (secao === "torax") {
    secaoDorso.style.display = "none";
    secaoTorax.style.display = "block";
  } else {
    secaoDorso.style.display = "block";
    secaoTorax.style.display = "block";
  }

  renderizarSecao("dorso");
  renderizarSecao("torax");
}

function rolarPara(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function falarEstrutura(id) {
  const item = estruturas.find(e => e.id === id);
  if (!item || !("speechSynthesis" in window)) return;

  const texto = modoProfessor
    ? `${item.nome}. Ação: ${item.acao}. Fixação proximal: ${item.fixacao_proximal}. Inserção: ${item.insercao}.`
    : `${item.nome}. Ative o modo professor para ouvir as respostas completas.`;

  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(texto);
  utter.lang = "pt-BR";
  window.speechSynthesis.speak(utter);
}

function tocarClique() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(650, ctx.currentTime);
    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) {}
}

function alternarTema() {
  const body = document.body;
  const atual = body.getAttribute("data-theme") || "dark";
  const novo = atual === "dark" ? "light" : "dark";
  body.setAttribute("data-theme", novo);
  localStorage.setItem("temaAtlas", novo);
}

function aplicarTemaSalvo() {
  const salvo = localStorage.getItem("temaAtlas") || "dark";
  document.body.setAttribute("data-theme", salvo);
}

function mostrarToast(texto) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = texto;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

document.addEventListener("DOMContentLoaded", () => {
  aplicarTemaSalvo();
  carregarEstruturas();

  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", alternarTema);
  }
});
