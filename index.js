// === 🔁 IMPORTACIONES Y CONFIGURACIÓN ===
import multer from 'multer';
import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const PORT = process.env.PORT || 3000;

// === 💬 IA: PREGUNTA DESDE EL FRONTEND ===
app.post('/ask', async (req, res) => {
  const { prompt } = req.body;
  console.log("📩 Pregunta recibida:", prompt);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Actúa como un asistente de programación ético, responsable y respetuoso. Responde de forma clara, constructiva y promueve buenas prácticas de desarrollo. No apoyes ni fomentes usos dañinos del código.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7
    })
  });

  const data = await response.json();
  let reply = "Sin respuesta válida.";
  if (data.choices && data.choices.length > 0) {
    reply = data.choices[0].message.content;
  } else if (data.error) {
    reply = `Error de OpenAI: ${data.error.message}`;
  }

  res.json({ reply });

  const historyItem = {
    timestamp: new Date().toISOString(),
    prompt,
    reply
  };

  console.log("📚 Guardando en historial...");
  fs.readFile('./history.json', 'utf8', (err, content) => {
    const history = err ? [] : JSON.parse(content || '[]');
    history.push(historyItem);

    fs.writeFile('./history.json', JSON.stringify(history, null, 2), (err) => {
      if (err) {
        console.error("❌ Error al guardar historial:", err);
      } else {
        console.log("📝 Historial actualizado");
      }
    });
  });
});

// === 📜 RUTA PARA MOSTRAR HISTORIAL ===
app.get('/historial', (req, res) => {
  fs.readFile('./history.json', 'utf8', (err, data) => {
    if (err) {
      res.status(500).json({ error: 'No se pudo leer el historial.' });
    } else {
      res.json(JSON.parse(data));
    }
  });
});

// === 📘 ENSEÑANZA: RUTA PARA MOSTRAR LECCIONES DE JAVASCRIPT ===
app.get('/learn/javascript', (req, res) => {
  fs.readFile('./codex/javascript.json', 'utf8', (err, data) => {
    if (err) {
      res.status(500).json({ error: 'No se pudo cargar la lección de JavaScript.' });
    } else {
      res.json(JSON.parse(data));
    }
  });
});

// === 📂 IA: ANALIZAR ARCHIVOS TXT (PDF desactivado por estabilidad) ===
const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.single('archivo'), async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ reply: "No se envió ningún archivo." });
  }

  let texto = '';

  if (file.mimetype === 'text/plain') {
    texto = fs.readFileSync(file.path, 'utf8');
  } else {
    return res.status(400).json({ reply: "Solo se permite texto plano (.txt) por ahora." });
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Eres un asistente ético de programación. Analiza el contenido del archivo de forma constructiva, fomenta buenas prácticas y no promuevas ningún uso dañino o inseguro del código.`
        },
        {
          role: 'user',
          content: `Lee y analiza este contenido:\n\n${texto}`
        }
      ],
      temperature: 0.7
    })
  });

  const data = await response.json();
  let reply = "Sin respuesta válida.";
  if (data.choices && data.choices.length > 0) {
    reply = data.choices[0].message.content;
  } else if (data.error) {
    reply = `Error de OpenAI: ${data.error.message}`;
  }

  res.json({ reply });
});

// === 🚀 INICIO DEL SERVIDOR ===
app.listen(PORT, () => {
  console.log(`✅ ALMA Codex corriendo en http://localhost:${PORT}`);
});
