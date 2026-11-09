require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 3001;
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8001";
const DEFAULT_USER_ID = 1;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

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
// 2. CLIMA REAL EXATO (GPS / IP / Cidade via Open-Meteo API)
// ============================================================================
async function buscarCoordenadasPorCidade(city) {
  const geoRes = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=pt&format=json`
  );
  const geoData = await geoRes.json();
  if (!geoData.results || geoData.results.length === 0) {
    throw new Error(`Cidade '${city}' não encontrada.`);
  }
  const { latitude, longitude, name, admin1 } = geoData.results[0];
  return {
    latitude,
    longitude,
    cidadeNome: admin1 ? `${name}, ${admin1}` : name,
  };
}

app.get("/api/weather", async (req, res) => {
  const rawQuery = (req.query.city || "auto").trim();
  try {
    let latitude, longitude, cidadeNome;

    if (rawQuery.startsWith("gps:")) {
      const [latStr, lonStr] = rawQuery.replace("gps:", "").split(",");
      latitude = parseFloat(latStr);
      longitude = parseFloat(lonStr);

      try {
        const revRes = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=pt`
        );
        const revData = await revRes.json();
        const city = revData.city || revData.locality || "Sua Localização";
        const state = revData.principalSubdivisionCode?.split("-")[1] || revData.principalSubdivision || "";
        cidadeNome = state ? `${city}, ${state}` : city;
      } catch {
        cidadeNome = "Sua Localização (GPS)";
      }
    } else if (rawQuery.toLowerCase() === "auto" || rawQuery === "") {
      // Tenta descobrir a cidade pelo IP; se falhar, busca São Paulo na Open-Meteo (nunca cai em número fixo!)
      try {
        const ipRes = await fetch("https://ipwho.is/");
        const ipData = await ipRes.json();
        if (ipData && ipData.success && ipData.latitude && ipData.longitude) {
          latitude = Number(ipData.latitude);
          longitude = Number(ipData.longitude);
          cidadeNome = ipData.region_code ? `${ipData.city}, ${ipData.region_code}` : ipData.city;
        }
      } catch {}

      if (!latitude || !longitude) {
        const fallbackGeo = await buscarCoordenadasPorCidade("São Paulo");
        latitude = fallbackGeo.latitude;
        longitude = fallbackGeo.longitude;
        cidadeNome = fallbackGeo.cidadeNome;
      }
    } else {
      const coords = await buscarCoordenadasPorCidade(rawQuery);
      latitude = coords.latitude;
      longitude = coords.longitude;
      cidadeNome = coords.cidadeNome;
    }

    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,precipitation,rain,showers,weather_code,cloud_cover&timezone=auto`
    );
    const weatherData = await weatherRes.json();

    if (!weatherData || !weatherData.current) {
      throw new Error("Resposta inválida da Open-Meteo");
    }

    const temp = Math.round(weatherData.current.temperature_2m);
    const sensacao = Math.round(weatherData.current.apparent_temperature ?? temp);
    const code = weatherData.current.weather_code;
    const nuvens = weatherData.current.cloud_cover ?? 0;
    const chovendo =
      (weatherData.current.precipitation || 0) > 0 ||
      (weatherData.current.rain || 0) > 0 ||
      code >= 51;
    const riscoChuva = chovendo || nuvens >= 75 || (code >= 45 && code <= 99);

    res.json({
      cidade: cidadeNome,
      temperatura: temp,
      sensacao_termica: sensacao,
      chovendo,
      risco_chuva: riscoChuva,
      nuvens_pct: nuvens,
      condicao: chovendo
        ? "Chovendo agora"
        : riscoChuva
        ? `Nublado / Risco de chuva (${nuvens}% nuvens)`
        : temp < 18
        ? "Frio / Tempo firme"
        : "Tempo firme / Limpo",
      fonte: "Open-Meteo Live API",
    });
  } catch (err) {
    res.status(500).json({ erro: "Não foi possível consultar o clima real: " + err.message });
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
    const { name, category, color, ideal_temp, formality_level, rain_resistant, image_url } = req.body;

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
        image_url: image_url || null,
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
    const { categoria, peca_atual_id, temperatura, ocasiao, formalidade, descricao_usuario = "", ids_vistos = [] } = req.body;

    const respostaML = await fetch(`${ML_SERVICE_URL}/api/swap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoria, peca_atual_id, temperatura, ocasiao, formalidade, descricao_usuario }),
    });

    const dados = await respostaML.json();
    if (!dados.sucesso) return res.json(dados);

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
          mensagem: `Substituí por '${pecaCompleta.name}' (${pecaCompleta.color}) — mantém o conforto térmico e respeita o estilo do seu pedido!`,
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
    const {
      temp_celsius,
      temperature_c,
      weather_condition,
      is_raining,
      occasion,
      top_item_id,
      bottom_item_id,
      footwear_item_id,
      outerwear_item_id,
      user_feedback,
      was_swapped,
    } = req.body;

    const tempFinal = Number(temp_celsius ?? temperature_c ?? 20);
    const condicaoFinal =
      weather_condition || (is_raining ? "Chuva / Nublado" : "Tempo seco");
    const feedbackFinal =
      user_feedback || (was_swapped ? "swapped" : "accepted");

    const log = await prisma.outfit_logs.create({
      data: {
        user_id: DEFAULT_USER_ID,
        temp_celsius: Number.isNaN(tempFinal) ? 20 : tempFinal,
        weather_condition: String(condicaoFinal),
        occasion: String(occasion || "casual"),
        top_item_id: Number(top_item_id),
        bottom_item_id: Number(bottom_item_id),
        footwear_item_id: Number(footwear_item_id),
        outerwear_item_id: outerwear_item_id ? Number(outerwear_item_id) : null,
        user_feedback: feedbackFinal,
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

app.listen(PORT, async () => {
  try {
    await prisma.$executeRawUnsafe("ALTER TABLE wardrobe_items MODIFY image_url LONGTEXT");
  } catch {}
  console.log(`🚀 Backend Node.js + Prisma rodando em http://localhost:${PORT}`);
});
