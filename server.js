const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json({ limit: '50mb' }));

// Carpeta para guardar la información de los usuarios
const DOCUMENTACION_PATH = path.join(__dirname, 'Documentacion');
if (!fs.existsSync(DOCUMENTACION_PATH)) fs.mkdirSync(DOCUMENTACION_PATH);

// Endpoint para guardar datos y foto
app.post('/guardar', (req, res) => {
  const { nombre, edad, emocion, bebida, beneficios, ingredientes, foto } = req.body;
  if (!nombre || !edad || !foto)
    return res.status(400).json({ error: "Faltan datos" });

  const userFolder = path.join(DOCUMENTACION_PATH, nombre);
  if (!fs.existsSync(userFolder)) fs.mkdirSync(userFolder);

  const base64Data = foto.replace(/^data:image\/png;base64,/, "");
  fs.writeFileSync(path.join(userFolder, 'foto.png'), base64Data, 'base64');

  const info = `
Nombre: ${nombre}
Edad: ${edad}
Estado Emocional: ${emocion}
Bebida Recomendada: ${bebida}
Beneficios: ${beneficios}
Ingredientes: ${ingredientes}
  `.trim();

  fs.writeFileSync(path.join(userFolder, 'info.txt'), info);

  res.json({ success: true, message: "Datos guardados correctamente" });
});

// Servir frontend
app.use(express.static(path.join(__dirname)));

// Puerto dinámico para Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
