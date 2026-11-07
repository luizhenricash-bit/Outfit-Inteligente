require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 3001;
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8001";
const DEFAULT_USER_ID = 1; // Usuário padrão criado no seed.sql

app.use(cors());
app.use(express.json());

// ============================================================================
// 1. STATUS DOS SERVIÇOS (MySQL via Prisma + Serviço Python ML)
// ============================================================================
app.get("/api/health", async (req, res) => {
  let mlOnline = false;
  try {
    const mlRes = await fetch(`${ML_SERVICE_URL}/`);
    mlOnline = mlRes.ok;
  } catch {
    mlOnline = false;
  }

  try {
    const totalPecas = await prisma.wardrobe_items.count({
      where: { user_id: DEFAULT_USER_ID },
    });
    res.json({
      node: "online",
      mysql_prisma: "online",
      ml_python: mlOnline ? "online" : "offline",
      total_pecas: totalPecas,
    });
  } catch (err) {
    res.status(500).json({ erro: "Falha ao conectar no MySQL via Prisma", detalhe: err.message });
  }
});

// ============================================================================
// 2. CLIMA REAL DA CIDADE (Open-Meteo API gratuita + Fallback Offline)
// ============================================================================
app.get("/api/weather", async (req, res) => {
  const city = req.query.city || "São Paulo";
  try {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=pt&format=json`
    );
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      return res.status(404).json({ erro: `Cidade '${city}' não encontrada.` });
    }

    const { latitude, longitude, name, admin1 } = geoData.results[0];
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,precipitation,weather_code&timezone=auto`
    );
    const weatherData = await weatherRes.json();

    const temp = Math.round(weatherData.current.temperature_2m);
    const code = weatherData.current.weather_code;
    const chovendo = weatherData.current.precipitation > 0 || code >= 51;

    res.json({
      cidade: admin1 ? `${name}, ${admin1}` : name,
      temperatura: temp,
      chovendo,
      condicao: chovendo ? "Chuva / Instável" : temp < 18 ? "Frio / Ameno" : "Ensolarado / Limpo",
      fonte: "Open-Meteo (Tempo Real)",
    });
  } catch {
    // Fallback caso esteja sem internet na hora da apresentação
    res.json({
      cidade: city,
      temperatura: 20,
      chovendo: false,
      condicao: "Clima Ameno (Modo Offline)",
      fonte: "Simulador Local",
    });
  }
});

// ============================================================================
// 3. CRUD DO GUARDA-ROUPA (Node.js + Prisma ORM -> MySQL)
// ============================================================================
app.get("/api/wardrobe", async (req, res) => {
  try {
    const items = await prisma.wardrobe_items.findMany({
      where: { user_id: DEFAULT_USER_ID },
      orderBy: { id: "desc" },
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao listar guarda-roupa", detalhe: err.message });
  }
});

app.post("/api/wardrobe", async (req, res) => {
  try {
    const { name, category, color, ideal_temp, formality_level, rain_resistant } = req.body;

    if (!name || !category || !color) {
      return res.status(400).json({ erro: "Preencha nome, categoria e cor da peça." });
    }

    const novaPeca = await prisma.wardrobe_items.create({
      data: {
        user_id: DEFAULT_USER_ID,
        name: String(name).trim(),
        category,
        color: String(color).trim().toLowerCase(),
        ideal_temp: Number(ideal_temp),
        formality_level: Number(formality_level),
        rain_resistant: Boolean(rain_resistant),
      },
    });

    res.status(201).json(novaPeca);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao cadastrar peça", detalhe: err.message });
  }
});

app.delete("/api/wardrobe/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    // Remove primeiro eventuais logs que apontem para essa peça (respeitando FK)
    await prisma.$transaction([
      prisma.outfit_logs.deleteMany({
        where: {
          OR: [
            { top_item_id: id },
            { bottom_item_id: id },
            { footwear_item_id: id },
            { outerwear_item_id: id },
          ],
        },
      }),
      prisma.wardrobe_items.delete({ where: { id } }),
    ]);
    res.json({ sucesso: true, mensagem: "Peça removida com sucesso." });
  } catch (err) {
    res.status(500).json({ erro: "Erro ao excluir peça", detalhe: err.message });
  }
});

// ============================================================================
// 4. ORQUESTRAÇÃO DE IA (Node.js -> Python FastAPI K-Means)
// ============================================================================
app.post("/api/recommend", async (req, res) => {
  try {
    const respostaML = await fetch(`${ML_SERVICE_URL}/api/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    if (!respostaML.ok) {
      const erroTexto = await respostaML.text();
      return res.status(502).json({ erro: "Erro no serviço Python de ML", detalhe: erroTexto });
    }

    const dados = await respostaML.json();
    res.json(dados);
  } catch (err) {
    res.status(503).json({
      erro: "Serviço de IA Python (porta 8001) está desligado! Ligue o uvicorn.",
      detalhe: err.message,
    });
  }
});

app.post("/api/swap", async (req, res) => {
  try {
    const { categoria, peca_atual_id, temperatura, ocasiao, formalidade, ids_vistos = [] } = req.body;

    const respostaML = await fetch(`${ML_SERVICE_URL}/api/swap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoria, peca_atual_id, temperatura, ocasiao, formalidade }),
    });

    const dados = await respostaML.json();
    if (!dados.sucesso) return res.json(dados);

    // Rodízio inteligente: evita ficar indo e voltando entre apenas 2 peças
    const opcoes = dados.outras_opcoes || [];
    const proximaOpcao = opcoes.find((op) => !ids_vistos.includes(op.id)) || opcoes[0];

    if (proximaOpcao && proximaOpcao.id !== dados.nova_peca.id) {
      const pecaCompleta = await prisma.wardrobe_items.findUnique({
        where: { id: proximaOpcao.id },
      });
      if (pecaCompleta) {
        return res.json({
          ...dados,
          nova_peca: {
            ...pecaCompleta,
            rain_resistant: pecaCompleta.rain_resistant ? 1 : 0,
          },
          mensagem: `Substituído por '${pecaCompleta.name}' (compatível com o clima/ocasião).`,
        });
      }
    }

    res.json(dados);
  } catch (err) {
    res.status(503).json({ erro: "Erro ao comunicar com o serviço de IA Python", detalhe: err.message });
  }
});

// ============================================================================
// 5. HISTÓRICO DE LOOKS SALVOS (Prisma -> tabela outfit_logs)
// ============================================================================
app.post("/api/history", async (req, res) => {
  try {
    const { temp_celsius, weather_condition, occasion, top_item_id, bottom_item_id, footwear_item_id, outerwear_item_id, user_feedback } = req.body;

    const log = await prisma.outfit_logs.create({
      data: {
        user_id: DEFAULT_USER_ID,
        temp_celsius: Number(temp_celsius),
        weather_condition: String(weather_condition),
        occasion: String(occasion),
        top_item_id: Number(top_item_id),
        bottom_item_id: Number(bottom_item_id),
        footwear_item_id: Number(footwear_item_id),
        outerwear_item_id: outerwear_item_id ? Number(outerwear_item_id) : null,
        user_feedback: user_feedback || "accepted",
      },
    });
    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao salvar histórico do look", detalhe: err.message });
  }
});

app.get("/api/history", async (req, res) => {
  try {
    const logs = await prisma.outfit_logs.findMany({
      where: { user_id: DEFAULT_USER_ID },
      orderBy: { id: "desc" },
      take: 10,
      include: {
        wardrobe_items_outfit_logs_top_item_idTowardrobe_items: true,
        wardrobe_items_outfit_logs_bottom_item_idTowardrobe_items: true,
        wardrobe_items_outfit_logs_footwear_item_idTowardrobe_items: true,
        wardrobe_items_outfit_logs_outerwear_item_idTowardrobe_items: true,
      },
    });

    const formatado = logs.map((l) => ({
      id: l.id,
      temp_celsius: l.temp_celsius,
      weather_condition: l.weather_condition,
      occasion: l.occasion,
      user_feedback: l.user_feedback,
      created_at: l.created_at,
      top: l.wardrobe_items_outfit_logs_top_item_idTowardrobe_items,
      bottom: l.wardrobe_items_outfit_logs_bottom_item_idTowardrobe_items,
      footwear: l.wardrobe_items_outfit_logs_footwear_item_idTowardrobe_items,
      outerwear: l.wardrobe_items_outfit_logs_outerwear_item_idTowardrobe_items,
    }));

    res.json(formatado);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao buscar histórico", detalhe: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend Node.js + Prisma rodando em http://localhost:${PORT}`);
});
    
