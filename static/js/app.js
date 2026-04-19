let estruturas = [];
let filtroSecaoAtual = "todas";
let modoProfessor = false;
let deferredPrompt = null;
let clickAudio = null;

document.addEventListener("DOMContentLoaded", async () => {
  prepararAudio();
  configurarInstalacaoPWA();
  registrarServiceWorker();
  await carregarEstruturas();
});

function prepararAudio() {
  clickAudio = new Audio("/static/sounds/click.mp3");
  clickAudio.volume = 0.25;
}

function tocarClique() {
  if (!clickAudio) return;
  try {
    clickAudio.currentTime = 0;
    clickAudio.play();
  } catch (e) {
    console.warn("Não foi possível tocar o áudio de clique.", e);
  }
}

async function carregarEstruturas() {
  try {
    const resposta = await fetch("/api/musculos");
    estruturas = await resposta.json();

    renderizarEstruturas();
    mostrarToast("Estruturas carregadas com sucesso.");
  } catch (erro) {
    console.error(erro);
    mostrarToast("Erro ao carregar as estruturas.");
  }
}

function renderizarEstruturas() {
  const listaDorso = document.getElementById("lista-dorso");
  const listaTorax = document.getElementById("lista-torax");

  listaDorso.innerHTML = "";
  listaTorax.innerHTML = "";

  const termoBusca = (document.getElementById("searchInput")?.value || "").trim().toLowerCase();

  const filtradas = estruturas.filter((item) => {
    const bateSecao = filtroSecaoAtual === "todas" || item.secao === filtroSecaoAtual;
    const textoBase = `${item.id} ${item.nome} ${item.categoria || ""}`.toLowerCase();
    const bateBusca = !termoBusca || textoBase.includes(termoBusca);
    return bateSecao && bateBusca;
  });

  filtradas.forEach((item) => {
    const card = criarCardEstrutura(item);

    if (item.secao === "dorso") {
      listaDorso.appendChild(card);
    } else if (item.secao === "torax") {
      listaTorax.appendChild(card);
    }
  });

  atualizarVisibilidadeSecoes();
}

function criarCardEstrutura(item) {
  const card = document.createElement("article");
  card.className = "structure-card";
  card.dataset.secao = item.secao;
  card.dataset.id = item.id;
  card.dataset.nome = item.nome.toLowerCase();

  const respostaHtml = modoProfessor
    ? `
      <div class="answer-row">
        <span class="answer-label">Ação</span>
        <div class="answer-value">${escaparHtml(item.acao || "Não preenchido.")}</div>
      </div>
      <div class="answer-row">
        <span class="answer-label">Fixação proximal</span>
        <div class="answer-value">${escaparHtml(item.fixacao_proximal || "Não preenchido.")}</div>
      </div>
      <div class="answer-row">
        <span class="answer-label">Inserção</span>
        <div class="answer-value">${escaparHtml(item.insercao || "Não preenchido.")}</div>
      </div>
    `
    : `<div class="locked">Conteúdo protegido. Digite a senha do professor para liberar.</div>`;

  card.innerHTML = `
    <div class="structure-top">
      <div class="structure-id">${item.id}</div>
      <div class="structure-title">
        <h4>${escaparHtml(item.nome)}</h4>
        <span>${escaparHtml(item.categoria || formatarSecao(item.secao))}</span>
      </div>
    </div>

    <div class="structure-actions">
      <button class="mini-btn" type="button" onclick="alternarImagem(${item.id})">Abrir imagem</button>
      <button class="mini-btn" type="button" onclick="alternarGif(${item.id})">Abrir GIF</button>
      <button class="mini-btn" type="button" onclick="mostrarResumo(${item.id})">Resumo</button>
      <button class="mini-btn" type="button" onclick="alternarResposta(${item.id})">Resposta</button>
    </div>

    <div class="media-box" id="imagem-box-${item.id}">
      ${item.imagem ? `<img src="/static/${item.imagem}" alt="Imagem de ${escaparAtributo(item.nome)}">` : `<div class="locked">Sem imagem cadastrada.</div>`}
    </div>

    <div class="gif-box" id="gif-box-${item.id}">
      ${item.gif ? `<img src="/static/${item.gif}" alt="GIF de ${escaparAtributo(item.nome)}">` : `<div class="locked">Sem GIF cadastrado.</div>`}
    </div>

    <div class="answer-box" id="resposta-box-${item.id}">
      ${respostaHtml}
    </div>
  `;

  return card;
}

function alternarImagem(id) {
  tocarClique();
  fecharBoxIrma("imagem", id);
  const box = document.getElementById(`imagem-box-${id}`);
  if (!box) return;

  box.classList.toggle("show");
  if (box.classList.contains("show")) {
    const item = estruturas.find((e) => e.id === id);
    atualizarViewer("imagem", item);
  }
}

function alternarGif(id) {
  tocarClique();
  fecharBoxIrma("gif", id);
  const box = document.getElementById(`gif-box-${id}`);
  if (!box) return;

  box.classList.toggle("show");
  if (box.classList.contains("show")) {
    const item = estruturas.find((e) => e.id === id);
    atualizarViewer("gif", item);
  }
}

function alternarResposta(id) {
  tocarClique();
  const box = document.getElementById(`resposta-box-${id}`);
  if (!box) return;

  if (!modoProfessor) {
    mostrarToast("Resposta bloqueada. Ative o modo professor.");
    box.classList.add("show");
    return;
  }

  box.classList.toggle("show");
}

function fecharBoxIrma(tipo, idAtual) {
  const seletor = tipo === "imagem" ? `[id^="imagem-box-"]` : `[id^="gif-box-"]`;
  const boxes = document.querySelectorAll(seletor);

  boxes.forEach((box) => {
    const idBox = Number(box.id.split("-").pop());
    if (idBox !== idAtual) {
      box.classList.remove("show");
    }
  });
}

function mostrarResumo(id) {
  tocarClique();
  const item = estruturas.find((e) => e.id === id);
  if (!item) return;

  const resumo = document.getElementById("resumoEstrutura");
  resumo.className = "";
  resumo.innerHTML = `
    <div class="answer-row">
      <span class="answer-label">Estrutura</span>
      <div class="answer-value">${escaparHtml(item.nome)}</div>
    </div>
    <div class="answer-row">
      <span class="answer-label">Seção</span>
      <div class="answer-value">${escaparHtml(formatarSecao(item.secao))}</div>
    </div>
    <div class="answer-row">
      <span class="answer-label">Categoria</span>
      <div class="answer-value">${escaparHtml(item.categoria || "Não informada")}</div>
    </div>
    ${
      modoProfessor
        ? `
        <div class="answer-row">
          <span class="answer-label">Ação</span>
          <div class="answer-value">${escaparHtml(item.acao || "Não preenchido.")}</div>
        </div>
        <div class="answer-row">
          <span class="answer-label">Fixação proximal</span>
          <div class="answer-value">${escaparHtml(item.fixacao_proximal || "Não preenchido.")}</div>
        </div>
        <div class="answer-row">
          <span class="answer-label">Inserção</span>
          <div class="answer-value">${escaparHtml(item.insercao || "Não preenchido.")}</div>
        </div>
        `
        : `
        <div class="locked" style="margin-top:10px;">
          As respostas anatômicas ficam visíveis apenas no modo professor.
        </div>
        `
    }
  `;
}

function atualizarViewer(tipo, item) {
  if (!item) return;

  const viewerEmpty = document.getElementById("viewerEmpty");
  const viewerImage = document.getElementById("viewerImage");
  const viewerGif = document.getElementById("viewerGif");

  viewerEmpty.classList.add("hidden");
  viewerImage.classList.add("hidden");
  viewerGif.classList.add("hidden");

  if (tipo === "imagem" && item.imagem) {
    viewerImage.src = `/static/${item.imagem}`;
    viewerImage.alt = `Imagem ampliada de ${item.nome}`;
    viewerImage.classList.remove("hidden");
  } else if (tipo === "gif" && item.gif) {
    viewerGif.src = `/static/${item.gif}`;
    viewerGif.alt = `GIF ampliado de ${item.nome}`;
    viewerGif.classList.remove("hidden");
  } else {
    viewerEmpty.textContent = "Recurso visual não cadastrado.";
    viewerEmpty.classList.remove("hidden");
  }

  mostrarResumo(item.id);
}

function ativarModoProfessor() {
  tocarClique();
  const senha = document.getElementById("senhaProfessor").value;
  const status = document.getElementById("profStatus");

  if (senha === "pinheiro") {
    modoProfessor = true;
    status.textContent = "Modo professor ativado.";
    document.getElementById("senhaProfessor").value = "";
    renderizarEstruturas();
    mostrarToast("Modo professor liberado.");
  } else {
    modoProfessor = false;
    status.textContent = "Senha incorreta.";
    mostrarToast("Senha incorreta.");
  }
}

function desativarModoProfessor() {
  tocarClique();
  modoProfessor = false;
  document.getElementById("profStatus").textContent = "Modo professor bloqueado.";
  renderizarEstruturas();
  mostrarToast("Modo professor bloqueado.");
}

function filtrarEstruturas() {
  renderizarEstruturas();
}

function filtrarPorSecao(secao, botao) {
  tocarClique();
  filtroSecaoAtual = secao;

  document.querySelectorAll(".filter-btn").forEach((btn) => btn.classList.remove("active"));
  if (botao) botao.classList.add("active");

  renderizarEstruturas();
}

function atualizarVisibilidadeSecoes() {
  const secaoDorso = document.getElementById("secao-dorso");
  const secaoTorax = document.getElementById("secao-torax");
  const listaDorso = document.getElementById("lista-dorso");
  const listaTorax = document.getElementById("lista-torax");

  secaoDorso.style.display = listaDorso.children.length ? "block" : "none";
  secaoTorax.style.display = listaTorax.children.length ? "block" : "none";
}

function rolarPara(id) {
  tocarClique();
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function gerarPDF(idSecao, nomeArquivo) {
  tocarClique();

  const elemento = document.getElementById(idSecao);
  if (!elemento) {
    mostrarToast("Seção não encontrada.");
    return;
  }

  try {
    mostrarToast("Gerando PDF...");
    const canvas = await html2canvas(elemento, {
      scale: 2,
      backgroundColor: "#0b1f33"
    });

    const imgData = canvas.toDataURL("image/png");
    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF("p", "mm", "a4");
    const larguraPdf = 210;
    const alturaPdf = 297;

    const larguraImg = larguraPdf - 10;
    const alturaImg = (canvas.height * larguraImg) / canvas.width;

    let alturaRestante = alturaImg;
    let posicao = 5;

    pdf.addImage(imgData, "PNG", 5, posicao, larguraImg, alturaImg);
    alturaRestante -= alturaPdf;

    while (alturaRestante > 0) {
      posicao = alturaRestante - alturaImg + 5;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 5, posicao, larguraImg, alturaImg);
      alturaRestante -= alturaPdf;
    }

    pdf.save(nomeArquivo);
    mostrarToast("PDF gerado com sucesso.");
  } catch (erro) {
    console.error(erro);
    mostrarToast("Erro ao gerar o PDF.");
  }
}

function configurarInstalacaoPWA() {
  const installBtn = document.getElementById("installBtn");

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn) installBtn.style.display = "inline-flex";
  });

  if (installBtn) {
    installBtn.addEventListener("click", async () => {
      tocarClique();

      if (!deferredPrompt) {
        mostrarToast("Abra no navegador compatível para instalar.");
        return;
      }

      deferredPrompt.prompt();
      const escolha = await deferredPrompt.userChoice;
      if (escolha.outcome === "accepted") {
        mostrarToast("Instalação iniciada.");
      } else {
        mostrarToast("Instalação cancelada.");
      }
      deferredPrompt = null;
    });
  }

  window.addEventListener("appinstalled", () => {
    mostrarToast("App instalado com sucesso.");
  });
}

function registrarServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js")
      .then(() => {
        console.log("Service Worker registrado.");
      })
      .catch((erro) => {
        console.warn("Falha ao registrar Service Worker:", erro);
      });
  }
}

function mostrarToast(texto) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = texto;
  toast.classList.add("show");

  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2400);
}

function aplicarFotoNo3D() {
  tocarClique();

  const input = document.getElementById("foto3d");
  const preview = document.getElementById("previewFoto3d");

  if (!input || !input.files || !input.files[0]) {
    mostrarToast("Selecione uma foto primeiro.");
    return;
  }

  const arquivo = input.files[0];
  const leitor = new FileReader();

  leitor.onload = function (evento) {
    const dataUrl = evento.target.result;
    preview.src = dataUrl;
    preview.classList.add("show");

    if (typeof window.aplicarTextura3D === "function") {
      window.aplicarTextura3D(dataUrl);
      mostrarToast("Foto aplicada no modelo 3D.");
    } else {
      mostrarToast("Área 3D ainda não carregada.");
    }
  };

  leitor.readAsDataURL(arquivo);
}

function formatarSecao(secao) {
  if (secao === "dorso") return "Dorso";
  if (secao === "torax") return "Tórax";
  return secao || "";
}

function escaparHtml(texto) {
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escaparAtributo(texto) {
  return escaparHtml(texto);
}