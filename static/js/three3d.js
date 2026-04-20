let scene, camera, renderer, mesh;

document.addEventListener("DOMContentLoaded", () => {
  iniciarCena3D();
});

function iniciarCena3D() {
  const canvas = document.getElementById("canvas3d");
  if (!canvas) return;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b1220);

  const largura = canvas.clientWidth || canvas.parentElement.clientWidth || 600;
  const altura = 380;

  camera = new THREE.PerspectiveCamera(45, largura / altura, 0.1, 1000);
  camera.position.z = 3;

  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: false
  });

  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setSize(largura, altura, false);

  const geometry = new THREE.PlaneGeometry(2.4, 2.4);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide
  });

  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  const luz1 = new THREE.DirectionalLight(0xffffff, 1.2);
  luz1.position.set(2, 2, 3);
  scene.add(luz1);

  const luz2 = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(luz2);

  animar3D();
  window.addEventListener("resize", ajustarCanvas3D);
}

function ajustarCanvas3D() {
  const canvas = document.getElementById("canvas3d");
  if (!canvas || !renderer || !camera) return;

  const largura = canvas.clientWidth || canvas.parentElement.clientWidth || 600;
  const altura = 380;

  camera.aspect = largura / altura;
  camera.updateProjectionMatrix();
  renderer.setSize(largura, altura, false);
}

function animar3D() {
  requestAnimationFrame(animar3D);

  if (mesh) {
    mesh.rotation.y += 0.004;
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

function aplicarFotoNo3D() {
  const input = document.getElementById("foto3d");
  const preview = document.getElementById("previewFoto3d");

  if (!input || !input.files || !input.files[0]) {
    mostrarToast("Selecione uma foto primeiro.");
    return;
  }

  const arquivo = input.files[0];

  if (!arquivo.type.startsWith("image/")) {
    mostrarToast("Escolha um arquivo de imagem.");
    return;
  }

  const leitor = new FileReader();

  leitor.onload = function (evento) {
    const dataUrl = evento.target.result;

    if (preview) {
      preview.src = dataUrl;
      preview.classList.add("show");
      preview.style.display = "block";
    }

    const imagem = new Image();
    imagem.onload = function () {
      const textura = new THREE.Texture(imagem);
      textura.needsUpdate = true;
      textura.minFilter = THREE.LinearFilter;
      textura.magFilter = THREE.LinearFilter;
      textura.wrapS = THREE.ClampToEdgeWrapping;
      textura.wrapT = THREE.ClampToEdgeWrapping;

      if (mesh) {
        mesh.material.map = textura;
        mesh.material.needsUpdate = true;
      }

      mostrarToast("Foto aplicada no plano 3D.");
    };

    imagem.onerror = function () {
      mostrarToast("Erro ao carregar a imagem.");
    };

    imagem.src = dataUrl;
  };

  leitor.onerror = function () {
    mostrarToast("Não foi possível ler a foto.");
  };

  leitor.readAsDataURL(arquivo);
}
