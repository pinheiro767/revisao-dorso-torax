let estruturas = [];
let filtroSecaoAtual = "todas";
let modoProfessor = false;
let deferredPrompt = null;
let clickAudio = null;

document.addEventListener("DOMContentLoaded", async () => {
  prepararAudio();
  configurarInstalacaoPWA();
  registrarServiceWorker();
  inicializarTema();
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
    console.error("Erro ao carregar estruturas:", erro);
    mostrarToast("Erro ao carregar as estruturas.");
  }
}

function renderizarEstruturas() {
  const listaDorso = document.getElementById("lista-dorso");
  const listaTorax = document.getElementById("lista-torax");

  if (!listaDorso || !listaTorax) return;

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
}

function criarCardEstrutura(item) {
  const card = document.createElement("article");
  card.className = "muscle-card";
  card.dataset.secao = item.secao;
  card.dataset.id = item.id;

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
    <div class="muscle-card-top">
      <div class="structure-id">${item.id}</div>
      <div class="muscle-card-title">
        <h4>${escaparHtml(item.nome)}</h4>
        <span>${escaparHtml(item.categoria || formatarSecao(item.secao))}</span>
      </div>
    </div>

    <div class="action-row wrap">
      <button class="pill-btn" type="button" onclick="alternarImagem(${item.id})">Abrir imagem</button>
      <button class="pill-btn" type="button" onclick="alternarGif(${item.id})">Abrir GIF</button>
      <button class="pill-btn" type="button" onclick="mostrarResumo(${item.id})">Resumo</button>
      <button class="pill-btn" type="button" onclick="alternarResposta(${item.id})">Resposta</button>
    </div>

    <div class="media-box" id="imagem-box-${item.id}">
      ${
        item.imagem
          ? `<img class="img-estrutura" src="/static/${item.imagem}" crossorigin="anonymous" loading="eager" alt="Imagem de ${escaparAtributo(item.nome)}">`
          : `<div class="locked">Sem imagem cadastrada.</div>`
      }
    </div>

    <div class="gif-box" id="gif-box-${item.id}">
      ${
        item.gif
          ? `<img class="gif-estrutura" src="/static/${item.gif}" crossorigin="anonymous" loading="eager" alt="GIF de ${escaparAtributo(item.nome)}">`
          : `<div class="locked">Sem GIF cadastrado.</div>`
      }
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
    box.classList.add("show");
    mostrarToast("Resposta bloqueada. Ative o modo professor.");
    return;
  }

  box.classList.toggle("show");
}

function fecharBoxIrma(tipo, idAtual) {
  const seletor = tipo === "imagem" ? `[id^="imagem-box-"]` : `[id^="gif-box-"]`;
  const boxes = document.querySelectorAll(seletor);

  boxes.forEach((box) => {
    const partes = box.id.split("-");
    const idBox = Number(partes[partes.length - 1]);
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
  if (!resumo) return;

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

  if (!viewerEmpty || !viewerImage || !viewerGif) return;

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

  const senha = document.getElementById("senhaProfessor")?.value || "";
  const status = document.getElementById("profStatus");

  if (senha === "pinheiro") {
    modoProfessor = true;
    if (status) status.textContent = "Modo professor ativado.";
    const campo = document.getElementById("senhaProfessor");
    if (campo) campo.value = "";
    renderizarEstruturas();
    mostrarToast("Modo professor liberado.");
  } else {
    modoProfessor = false;
    if (status) status.textContent = "Senha incorreta.";
    mostrarToast("Senha incorreta.");
  }
}

function desativarModoProfessor() {
  tocarClique();
  modoProfessor = false;

  const status = document.getElementById("profStatus");
  if (status) status.textContent = "Modo professor bloqueado.";

  renderizarEstruturas();
  mostrarToast("Modo professor bloqueado.");
}

function filtrarEstruturas() {
  renderizarEstruturas();
}

function formatarSecao(secao) {
  if (secao === "dorso") return "Dorso";
  if (secao === "torax") return "Tórax";
  return secao || "";
}

function abrirAbaLateral(idAba, botao) {
  tocarClique();

  document.querySelectorAll(".content-pane").forEach((pane) => {
    pane.classList.remove("active");
  });

  document.querySelectorAll(".side-tab").forEach((tab) => {
    tab.classList.remove("active");
  });

  const aba = document.getElementById(idAba);
  if (aba) aba.classList.add("active");

  if (botao) botao.classList.add("active");

  fecharMenuMobile();
}

function abrirMenuMobile() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("mobileOverlay");

  if (sidebar) sidebar.classList.add("open");
  if (overlay) overlay.classList.add("show");
}

function fecharMenuMobile() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("mobileOverlay");

  if (sidebar) sidebar.classList.remove("open");
  if (overlay) overlay.classList.remove("show");
}

function alternarTema() {
  tocarClique();

  const body = document.body;
  body.classList.toggle("light-theme");

  const temaAtual = body.classList.contains("light-theme") ? "light" : "dark";
  localStorage.setItem("uemTemaAtlas", temaAtual);

  mostrarToast(temaAtual === "light" ? "Tema claro ativado." : "Tema escuro ativado.");
}

function inicializarTema() {
  const temaSalvo = localStorage.getItem("uemTemaAtlas");
  if (temaSalvo === "light") {
    document.body.classList.add("light-theme");
  }
}

async function gerarPDF(idSecao, nomeArquivo) {
  tocarClique();

  const elemento = document.getElementById(idSecao);
  if (!elemento) {
    mostrarToast("Seção não encontrada.");
    return;
  }

  let estadosOriginais = [];

  try {
    mostrarToast("Preparando PDF...");

    elemento.classList.add("exportando-pdf");

    const caixas = elemento.querySelectorAll(".media-box, .gif-box, .answer-box");
    estadosOriginais = Array.from(caixas).map((box) => ({
      elemento: box,
      classeShow: box.classList.contains("show")
    }));

    caixas.forEach((box) => box.classList.add("show"));

    const imagens = elemento.querySelectorAll("img");

    await Promise.all(
      Array.from(imagens).map((img) => {
        return new Promise((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
          } else {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }
        });
      })
    );

    await new Promise((resolve) => setTimeout(resolve, 500));

    const canvas = await html2canvas(elemento, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#0b1f33",
      logging: false,
      imageTimeout: 20000
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");

    const larguraPagina = 210;
    const alturaPagina = 297;
    const margem = 8;
    const larguraImagem = larguraPagina - margem * 2;
    const alturaImagem = (canvas.height * larguraImagem) / canvas.width;

    let alturaRestante = alturaImagem;
    let y = margem;

    pdf.setFillColor(11, 31, 51);
    pdf.rect(0, 0, larguraPagina, alturaPagina, "F");
    pdf.addImage(imgData, "JPEG", margem, y, larguraImagem, alturaImagem);

    alturaRestante -= (alturaPagina - margem * 2);

    while (alturaRestante > 0) {
      y = margem - (alturaImagem - alturaRestante);
      pdf.addPage();
      pdf.setFillColor(11, 31, 51);
      pdf.rect(0, 0, larguraPagina, alturaPagina, "F");
      pdf.addImage(imgData, "JPEG", margem, y, larguraImagem, alturaImagem);
      alturaRestante -= (alturaPagina - margem * 2);
    }

    pdf.save(nomeArquivo);
    mostrarToast("PDF gerado com sucesso.");
  } catch (erro) {
    console.error("Erro ao gerar PDF:", erro);
    mostrarToast("Erro ao gerar o PDF.");
  } finally {
    elemento.classList.remove("exportando-pdf");

    estadosOriginais.forEach((item) => {
      if (!item.classeShow) {
        item.elemento.classList.remove("show");
      }
    });
  }
}

function configurarInstalacaoPWA() {
  const installBtn = document.getElementById("installBtn");
  if (!installBtn) return;

  installBtn.addEventListener("click", async () => {
    tocarClique();

    if (!deferredPrompt) {
      mostrarToast("Abra no navegador compatível para instalar o app.");
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

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = "inline-flex";
  });

  window.addEventListener("appinstalled", () => {
    mostrarToast("App instalado com sucesso.");
    deferredPrompt = null;
  });
}

function registrarServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js")
      .then(() => {
        console.log("Service Worker registrado com sucesso.");
      })
      .catch((erro) => {
        console.warn("Falha ao registrar Service Worker:", erro);
      });
  }
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

    if (preview) {
      preview.src = dataUrl;
      preview.classList.add("show");
    }

    if (typeof window.aplicarTextura3D === "function") {
      window.aplicarTextura3D(dataUrl);
      mostrarToast("Foto aplicada no modelo 3D.");
    } else {
      mostrarToast("Área 3D ainda não carregada.");
    }
  };

  leitor.readAsDataURL(arquivo);
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
