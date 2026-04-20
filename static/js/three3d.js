let cena3D;
let camera3D;
let renderizador3D;
let malha3D;
let texturaAtual3D = null;
let animacaoAtiva3D = false;

document.addEventListener("DOMContentLoaded", () => {
  iniciarCena3D();
});

function iniciarCena3D() {
  const canvas = document.getElementById("canvas3d");
  if (!canvas) return;

  cena3D = new THREE.Scene();
  cena3D.background = new THREE.Color(0x0b1f33);

  const largura = canvas.clientWidth || canvas.parentElement.clientWidth || 800;
  const altura = canvas.clientHeight || 380;

  camera3D = new THREE.PerspectiveCamera(45, largura / altura, 0.1, 1000);
  camera3D.position.set(0, 0.8, 4.2);

  renderizador3D = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    preserveDrawingBuffer: true
  });

  renderizador3D.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderizador3D.setSize(largura, altura, false);

  const luzAmbiente = new THREE.AmbientLight(0xffffff, 1.2);
  cena3D.add(luzAmbiente);

  const luzPrincipal = new THREE.DirectionalLight(0xffffff, 1.5);
  luzPrincipal.position.set(4, 6, 5);
  cena3D.add(luzPrincipal);

  const luzRecorte = new THREE.DirectionalLight(0x88ccff, 0.8);
  luzRecorte.position.set(-4, 2, -3);
  cena3D.add(luzRecorte);

  const geometria = new THREE.BoxGeometry(2.2, 2.8, 0.18);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.65,
    metalness: 0.12
  });

  malha3D = new THREE.Mesh(geometria, material);
  malha3D.rotation.x = -0.08;
  malha3D.rotation.y = 0.35;
  cena3D.add(malha3D);

  const baseGeo = new THREE.CylinderGeometry(1.35, 1.55, 0.22, 48);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x16314f,
    roughness: 0.75,
    metalness: 0.08
  });

  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = -1.7;
  cena3D.add(base);

  const anelGeo = new THREE.TorusGeometry(1.48, 0.045, 24, 90);
  const anelMat = new THREE.MeshStandardMaterial({
    color: 0x5eead4,
    emissive: 0x1e8f84,
    emissiveIntensity: 0.25,
    roughness: 0.4,
    metalness: 0.2
  });

  const anel = new THREE.Mesh(anelGeo, anelMat);
  anel.rotation.x = Math.PI / 2;
  anel.position.y = -1.58;
  cena3D.add(anel);

  window.addEventListener("resize", ajustarCanvas3D);

  if (!animacaoAtiva3D) {
    animacaoAtiva3D = true;
    animar3D();
  }
}

function animar3D() {
  requestAnimationFrame(animar3D);

  if (malha3D) {
    malha3D.rotation.y += 0.008;
  }

  if (renderizador3D && cena3D && camera3D) {
    renderizador3D.render(cena3D, camera3D);
  }
}

function ajustarCanvas3D() {
  const canvas = document.getElementById("canvas3d");
  if (!canvas || !camera3D || !renderizador3D) return;

  const largura = canvas.clientWidth || canvas.parentElement.clientWidth || 800;
  const altura = canvas.clientHeight || 380;

  camera3D.aspect = largura / altura;
  camera3D.updateProjectionMatrix();
  renderizador3D.setSize(largura, altura, false);
}

window.aplicarTextura3D = function (dataUrl) {
  if (!malha3D) return;

  const loader = new THREE.TextureLoader();

  loader.load(
    dataUrl,
    (textura) => {
      textura.colorSpace = THREE.SRGBColorSpace;
      textura.wrapS = THREE.ClampToEdgeWrapping;
      textura.wrapT = THREE.ClampToEdgeWrapping;
      textura.anisotropy = renderizador3D.capabilities.getMaxAnisotropy();

      if (texturaAtual3D) {
        texturaAtual3D.dispose();
      }

      texturaAtual3D = textura;
      malha3D.material.map = texturaAtual3D;
      malha3D.material.needsUpdate = true;
    },
    undefined,
    (erro) => {
      console.error("Erro ao aplicar textura no modelo 3D:", erro);
    }
  );
};
