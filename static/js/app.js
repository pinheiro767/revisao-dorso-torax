let estruturas = [];
let modoProfessor = false;
let deferredPrompt = null;

/* =========================
   INICIALIZAÇÃO
========================= */
document.addEventListener("DOMContentLoaded", () => {
  aplicarTemaSalvo();
  configurarInstalacaoPWA();
  carregarEstruturas();

  abrirAbaLateral("aba-inicio", document.querySelector(".side-tab.active"));
});

/* =========================
   CARREGAR DADOS
========================= */
async function carregarEstruturas() {
  try {
    const resposta = await fetch("/api/musculos");
    if (!resposta.ok) {
      throw new Error("Falha ao buscar /api/musculos");
    }

    estruturas = await resposta.json();

    renderizarSecao("dorso");
    renderizarSecao("torax");

    if (estruturas.length > 0) {
      atualizarResumo(estruturas[0]);
    }
  } catch (erro) {
    console.error("Erro ao carregar estruturas:", erro);
    mostrarToast("Erro ao carregar músculos.");
  }
}

/* =========================
   RENDERIZAÇÃO
========================= */
function renderizarSecao(secao) {
  const container = document.getElementById(`lista-${secao}`);
  if (!container) return;

  const termo = (document.getElementById("searchInput")?.value || "").toLowerCase().trim();

  const itens = estruturas.filter(item => {
    if (item.secao !== secao) return false;

    if (!termo) return true;

    return (
      String(item.id).includes(termo) ||
      (item.nome || "").toLowerCase().includes(termo) ||
      (item.categoria || "").toLowerCase().includes(termo)
    );
  });

  container.innerHTML = "";

  if (!itens.length) {
    container.innerHTML = `<div class="viewer-empty">Nenhuma estrutura encontrada.</div>`;
    return;
  }

  itens.forEach(item => {
    const card = document.createElement("div");
    card.className = "muscle-card";

    card.innerHTML = `
      <div class="muscle-header" onclick="toggleCard(this)">
        <div class="muscle-header-left">
          <h3>${item.id}. ${item.nome}</h3>
          <span class="muscle-subtitle">${item.categoria || "Sem categoria"}</span>
        </div>
        <span class="muscle-arrow">▼</span>
      </div>

      <div class="muscle-content">
        <div class="muscle-meta">
          <span class="muscle-chip">${item.secao.toUpperCase()}</span>
          <span class="muscle-chip">${item.categoria || "Sem categoria"}</span>
        </div>

        <div class="answer-block ${modoProfessor ? "" : "locked"}">
          ${
            modoProfessor
              ? `
                <p><strong>Ação:</strong> ${item.acao || "-"}</p>
                <p><strong>Fixação proximal:</strong> ${item.fixacao_proximal || "-"}</p>
                <p><strong>Inserção:</strong> ${item.insercao || "-"}</p>
              `
              : `
                <p><strong>Ação:</strong> 🔒 bloqueada</p>
                <p><strong>Fixação proximal:</strong> 🔒 bloqueada</p>
                <p><strong>Inserção:</strong> 🔒 bloqueada</p>
              `
          }
        </div>

        <div class="muscle-actions">
          <button
            class="btn btn-primary"
            type="button"
            onclick="abrirImagem('${item.imagem}', '${escapeHtml(item.nome)}', ${item.id}); event.stopPropagation();"
          >
            Ver imagem
          </button>

          <button
            class="btn btn-secondary"
            type="button"
            onclick="abrirGif('${item.gif}', '${escapeHtml(item.nome)}', ${item.id}); event.stopPropagation();"
          >
            Ver GIF
          </button>

          <button
            class="btn btn-ghost"
            type="button"
            onclick="falarEstrutura(${item.id}); event.stopPropagation();"
          >
            Ouvir
          </button>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

function toggleCard(header) {
  const card = header.closest(".muscle-card");
  if (!card) return;

  const content = card.querySelector(".muscle-content");
  const arrow = card.querySelector(".muscle-arrow");

  if (!content) return;

  const aberto = content.classList.contains("open");

  content.classList.toggle("open", !aberto);
  card.classList.toggle("expanded", !aberto);

  if (arrow) {
    arrow.textContent = aberto ? "▼" : "▲";
  }
}

/* =========================
   BUSCA
========================= */
function filtrarEstruturas() {
  renderizarSecao("dorso");
  renderizarSecao("torax");
}

/* =========================
   VISUALIZAÇÃO
========================= */
function abrirImagem(caminho, nome, id) {
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

  const item = estruturas.find(e => e.id === id);
  if (item) atualizarResumo(item);

  tocarClique();
}

function abrirGif(caminho, nome, id) {
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

  const item = estruturas.find(e => e.id === id);
  if (item) atualizarResumo(item);

  tocarClique();
}

function atualizarResumo(item) {
  const resumo = document.getElementById("resumoEstrutura");
  if (!resumo || !item) return;

  resumo.innerHTML = `
    <strong>${item.id}. ${item.nome}</strong><br>
    <span>${item.categoria || ""}</span><br><br>
    ${
      modoProfessor
        ? `
          <strong>Ação:</strong> ${item.acao || "-"}<br>
          <strong>Fixação proximal:</strong> ${item.fixacao_proximal || "-"}<br>
          <strong>Inserção:</strong> ${item.insercao || "-"}
        `
        : `Ative o modo professor para visualizar ação, fixação proximal e inserção.`
    }
  `;
}

/* =========================
   MODO PROFESSOR
========================= */
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

/* =========================
   TEMA
========================= */
function alternarTema() {
  const html = document.documentElement;
  const atual = html.getAttribute("data-theme") || "dark";
  const novo = atual === "dark" ? "light" : "dark";

  html.setAttribute("data-theme", novo);
  document.body.setAttribute("data-theme", novo);
  localStorage.setItem("temaAtlas", novo);

  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) {
    themeMeta.setAttribute("content", novo === "dark" ? "#0f172a" : "#e2e8f0");
  }
}

function aplicarTemaSalvo() {
  const salvo = localStorage.getItem("temaAtlas") || "dark";

  document.documentElement.setAttribute("data-theme", salvo);
  document.body.setAttribute("data-theme", salvo);

  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) {
    themeMeta.setAttribute("content", salvo === "dark" ? "#0f172a" : "#e2e8f0");
  }
}

/* =========================
   ABAS LATERAIS
========================= */
function abrirAbaLateral(idAba, botao) {
  document.querySelectorAll(".content-pane").forEach(pane => {
    pane.classList.remove("active");
  });

  document.querySelectorAll(".side-tab").forEach(tab => {
    tab.classList.remove("active");
  });

  const aba = document.getElementById(idAba);
  if (aba) aba.classList.add("active");

  if (botao) {
    botao.classList.add("active");
  } else {
    const btn = [...document.querySelectorAll(".side-tab")].find(el =>
      el.getAttribute("onclick")?.includes(idAba)
    );
    if (btn) btn.classList.add("active");
  }

  fecharMenuMobile();
}

/* =========================
   MENU MOBILE
========================= */
function abrirMenuMobile() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("mobileOverlay");

  sidebar?.classList.add("open");
  overlay?.classList.add("show");
}

function fecharMenuMobile() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("mobileOverlay");

  sidebar?.classList.remove("open");
  overlay?.classList.remove("show");
}

/* =========================
   PDF
========================= */
async function gerarPDF(idElemento, nomeArquivo) {
  const elemento = document.getElementById(idElemento);

  if (!elemento) {
    mostrarToast("Seção não encontrada.");
    return;
  }

  try {
    mostrarToast("Preparando PDF...");

    abrirAbaLateral(idElemento);
    await new Promise(resolve => setTimeout(resolve, 400));

    const canvas = await html2canvas(elemento, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false
    });

    const imgData = canvas.toDataURL("image/png");
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;

    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin;

    pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
    heightLeft -= (pageHeight - margin * 2);

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - margin * 2);
    }

    pdf.save(nomeArquivo);
    mostrarToast("PDF gerado com sucesso.");
  } catch (erro) {
    console.error("Erro ao gerar PDF:", erro);
    mostrarToast("Erro ao gerar PDF. Veja o console.");
  }
}

/* =========================
   ÁUDIO
========================= */
function falarEstrutura(id) {
  const item = estruturas.find(e => e.id === id);
  if (!item || !("speechSynthesis" in window)) return;

  const texto = modoProfessor
    ? `${item.nome}. Ação: ${item.acao || ""}. Fixação proximal: ${item.fixacao_proximal || ""}. Inserção: ${item.insercao || ""}.`
    : `${item.nome}. Ative o modo professor para ouvir as respostas completas.`;

  window.speechSynthesis.cancel();
  const fala = new SpeechSynthesisUtterance(texto);
  fala.lang = "pt-BR";
  window.speechSynthesis.speak(fala);
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

/* =========================
   PWA
========================= */
function configurarInstalacaoPWA() {
  const installBtn = document.getElementById("installBtn");
  if (!installBtn) return;

  installBtn.addEventListener("click", async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      return;
    }

    mostrarToast("Se não abrir a instalação, use o menu do navegador e toque em 'Instalar app' ou 'Adicionar à tela inicial'.");
  });

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = "inline-flex";
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    mostrarToast("App instalado com sucesso.");
  });
}

/* =========================
   TOAST
========================= */
function mostrarToast(texto) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = texto;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

/* =========================
   UTIL
========================= */
function escapeHtml(texto) {
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* =========================
   SERVICE WORKER
========================= */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("/sw.js");
      console.log("Service Worker registrado com sucesso.");
    } catch (erro) {
      console.error("Erro ao registrar Service Worker:", erro);
    }
  });
}
