const video = document.getElementById('video');
const boton = document.getElementById('iniciar');
const estado = document.getElementById('estado');

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

// Cargar modelos
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
  faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
])
.then(() => {
  estado.innerText = "Modelos cargados. Presiona 'Iniciar detección'";
})
.catch(err => {
  estado.innerText = "Error cargando modelos";
  console.error(err);
});

// Iniciar cámara
boton.addEventListener('click', () => {
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      video.srcObject = stream;
      estado.innerText = "Cámara activada. Detectando emociones...";
    })
    .catch(err => {
      estado.innerText = "Error al acceder a la cámara";
      console.error(err);
    });
});

video.addEventListener('play', () => {
  const canvas = document.getElementById('canvas');
  const displaySize = { width: video.offsetWidth, height: video.offsetHeight };
  canvas.width = displaySize.width;
  canvas.height = displaySize.height;
  faceapi.matchDimensions(canvas, displaySize);

  let deteccionHecha = false;
  let emocionFinal = null;

  const intervalo = setInterval(async () => {
    if (deteccionHecha) return;

    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
      .withFaceExpressions();

    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

    if (detections.length > 0) {
      const emociones = detections[0].expressions;
      const emocionPrincipal = Object.keys(emociones).reduce((a, b) => emociones[a] > emociones[b] ? a : b);
      emocionFinal = emocionPrincipal;
    }
  }, 200);

  setTimeout(() => {
    clearInterval(intervalo);
    video.pause();
    if (!emocionFinal) emocionFinal = "neutral";

    const infoBebidas = {
      happy: {
        bebida: "Jugo de naranja natural",
        frutas: ["Naranja"],
        beneficios: [
          "Refrescante y dulce",
          "Llena de energía positiva",
          "Aporta vitamina C",
          "Mejora el ánimo",
          "Fortalece el sistema inmunológico",
          "Hidrata naturalmente"
        ],
        ingredientes: ["Exprimir la naranja", "Servir natural, sin agua ni azúcar"]
      },
      sad: {
        bebida: "Jugo de sandía natural",
        frutas: ["Sandía"],
        beneficios: [
          "Muy jugosa y natural",
          "Levanta el ánimo",
          "Hidrata profundamente",
          "Rica en antioxidantes",
          "Favorece digestión",
          "Refresca y revitaliza"
        ],
        ingredientes: ["Cortar la sandía", "Servir natural, sin agua ni azúcar"]
      },
      angry: {
        bebida: "Jugo de melón natural",
        frutas: ["Melón"],
        beneficios: [
          "Refrescante y calmante",
          "Relaja el cuerpo y la mente",
          "Aporta vitaminas",
          "Favorece la hidratación",
          "Alivia tensión y estrés",
          "Dulce natural sin azúcar"
        ],
        ingredientes: ["Cortar el melón", "Servir natural, sin agua ni azúcar"]
      },
      fearful: {
        bebida: "Jugo de mandarina natural",
        frutas: ["Mandarina"],
        beneficios: [
          "Aroma cítrico y suave",
          "Brinda tranquilidad",
          "Rico en vitamina C",
          "Estimula positividad",
          "Fortalece sistema inmunológico",
          "Ayuda a la concentración"
        ],
        ingredientes: ["Exprimir la mandarina", "Servir natural, sin agua ni azúcar"]
      },
      disgusted: {
        bebida: "Jugo de piña natural",
        frutas: ["Piña"],
        beneficios: [
          "Tropical y purificadora",
          "Limpia emociones negativas",
          "Refuerza digestión",
          "Aporta vitaminas y minerales",
          "Estimula energía natural",
          "Antiinflamatoria"
        ],
        ingredientes: ["Cortar la piña", "Servir natural, sin agua ni azúcar"]
      },
      surprised: {
        bebida: "Jugo de toronja natural",
        frutas: ["Toronja (pomelo)"],
        beneficios: [
          "Cítrica y jugosa",
          "Despierta los sentidos",
          "Da energía",
          "Aporta antioxidantes",
          "Favorece digestión",
          "Refresca y revitaliza"
        ],
        ingredientes: ["Exprimir la toronja", "Servir natural, sin agua ni azúcar"]
      },
      neutral: {
        bebida: "Jugo de papaya natural",
        frutas: ["Papaya"],
        beneficios: [
          "Suave y dulce",
          "Equilibrada y armoniosa",
          "Mantiene calma y bienestar",
          "Favorece digestión",
          "Rica en vitaminas A y C",
          "Refresca naturalmente"
        ],
        ingredientes: ["Cortar la papaya", "Servir natural, sin agua ni azúcar"]
      }
    };

    const bebidaInfo = infoBebidas[emocionFinal];

    document.getElementById('emocionDetectada').innerText = traducirEmocion(emocionFinal);
    document.getElementById('bebida').innerText = bebidaInfo.bebida;
    document.getElementById('beneficios').innerHTML = "<ul>" + bebidaInfo.beneficios.map(b => `<li>${b}</li>`).join("") + "</ul>";
    document.getElementById('ingredientes').innerHTML = "<ol>" + bebidaInfo.ingredientes.map(i => `<li>${i}</li>`).join("") + "</ol>";
    document.getElementById('resultado').classList.remove('hidden');
  }, 6000);

  // Guardar foto y datos con modal
  document.getElementById('guardar').addEventListener('click', () => {
    const nombreInput = document.getElementById('nombre');
    const edadInput = document.getElementById('edad');
    const nombre = nombreInput.value.trim();
    const edad = edadInput.value.trim();

    if (!nombre || !edad) return alert("Por favor ingresa nombre y edad");

    const foto = canvas.toDataURL('image/png');

    fetch('/guardar', {
      method: 'POST',
      body: JSON.stringify({
        nombre,
        edad,
        emocion: document.getElementById('emocionDetectada').innerText,
        bebida: document.getElementById('bebida').innerText,
        beneficios: document.getElementById('beneficios').innerText,
        ingredientes: document.getElementById('ingredientes').innerText,
        foto
      }),
      headers: { 'Content-Type': 'application/json' }
    })
    .then(res => res.json())
    .then(data => {
      const modal = document.getElementById('modal');
      const fotoModal = document.getElementById('fotoModal');
      const infoModal = document.getElementById('infoModal');

      fotoModal.src = foto;
      infoModal.innerHTML = `Nombre: ${nombre}<br>Edad: ${edad}<br>Estado: ${document.getElementById('emocionDetectada').innerText}<br>Bebida: ${document.getElementById('bebida').innerText}<br>Beneficios: ${document.getElementById('beneficios').innerHTML}<br>Ingredientes: ${document.getElementById('ingredientes').innerHTML}`;

      modal.classList.remove('hidden');
      nombreInput.value = '';
      edadInput.value = '';
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      setTimeout(() => {
        modal.classList.add('hidden');
        document.getElementById('resultado').classList.add('hidden');
        video.play();
        deteccionHecha = false;
      }, 3000);
    })
    .catch(err => console.error(err));
  });
});

// Función para traducir emociones
function traducirEmocion(emocion) {
  const traduccion = {
    happy: "Feliz",
    sad: "Triste",
    angry: "Enojado",
    fearful: "Temeroso",
    disgusted: "Disgustado",
    surprised: "Sorprendido",
    neutral: "Neutral"
  };
  return traduccion[emocion] || emocion;
}
