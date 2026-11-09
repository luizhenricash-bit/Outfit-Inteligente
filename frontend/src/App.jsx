import { useEffect, useRef, useState } from "react";
import { api } from "./api";
import MannequinPreview, { getColorHex, getGarmentImageUrl } from "./components/MannequinPreview";
import RobotMascotRive from "./components/RobotMascotRive";

const EXEMPLOS_PEDIDOS = [
  "Vou levar minha namorada pra jantar, queria ir com uma roupa neutra, verifique o tempo e se estiver com condições de chuva quero um moletom para levar",
  "Reunião no trabalho hoje, quero algo em tom claro e azul",
  "Vou pra faculdade e quero algo leve e branco",
  "Dia de treino e corrida no parque",
];

export default function App() {
  const [activeTab, setActiveTab] = useState("provador");
  const [health, setHealth] = useState(null);
  const [modoProfessor, setModoProfessor] = useState(false);

  // Entrada natural do usuário
  const [descricaoUsuario, setDescricaoUsuario] = useState(
    "Vou levar minha namorada pra jantar, queria ir com uma roupa neutra, verifique o tempo e se estiver com condições de chuva quero um moletom para levar"
  );

  // Clima detectado automaticamente
  const [cidadeAtual, setCidadeAtual] = useState("Localizando...");
  const [temperatura, setTemperatura] = useState(20);
  const [chovendo, setChovendo] = useState(false);
  const [condicaoClima, setCondicaoClima] = useState("");
  const [editandoCidade, setEditandoCidade] = useState(false);
  const [cidadeManual, setCidadeManual] = useState("");

  // Estado do Look e do Consultor
  const [resultadoIA, setResultadoIA] = useState(null);
  const [falaConsultor, setFalaConsultor] = useState(
    "Oi! Me conta para onde você vai hoje e que estilo está afim de usar que eu monto seu look cruzando com o clima lá fora!"
  );
  const [loadingLook, setLoadingLook] = useState(false);
  const [loadingSwap, setLoadingSwap] = useState(null);
  const [seenIds, setSeenIds] = useState({ top: [], bottom: [], footwear: [], outerwear: [] });
  const [trocouAlguma, setTrocouAlguma] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const resultadoRef = useRef(null);

  // Guarda-Roupa e Histórico
  const [wardrobe, setWardrobe] = useState([]);
  const [history, setHistory] = useState([]);
  const [novoItem, setNovoItem] = useState({
    name: "",
    category: "top",
    color: "preto",
    ideal_temp: 20,
    formality_level: 3,
    rain_resistant: false,
    image_url: "",
  });

  useEffect(() => {
    carregarStatusEGuardaRoupa();
    detectarClimaAutomatico();
    carregarHistorico();
  }, []);

  async function carregarStatusEGuardaRoupa() {
    try {
      const [h, items] = await Promise.all([api.getHealth(), api.getWardrobe()]);
      setHealth(h);
      setWardrobe(items);
    } catch (err) {
      console.error(err);
    }
  }

  async function carregarHistorico() {
    try {
      const dados = await api.getHistory();
      setHistory(dados);
    } catch (err) {
      console.error(err);
    }
  }

  function detectarClimaAutomatico() {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const query = `gps:${pos.coords.latitude},${pos.coords.longitude}`;
          await aplicarClimaDaAPI(query, true);
        },
        async () => {
          await aplicarClimaDaAPI("auto", true);
        },
        { timeout: 4000 }
      );
    } else {
      aplicarClimaDaAPI("auto", true);
    }
  }

  async function aplicarClimaDaAPI(query, gerarAutomatico = false) {
    try {
      const w = await api.getWeather(query);
      const condicaoChuva = Boolean(w.chovendo || w.risco_chuva);
      setCidadeAtual(w.cidade);
      setTemperatura(w.temperatura);
      setChovendo(condicaoChuva);
      setCondicaoClima(w.condicao);
      setEditandoCidade(false);
      if (gerarAutomatico) {
        gerarLook(w.temperatura, condicaoChuva, descricaoUsuario, false);
      }
    } catch (err) {
      alert(err.message);
    }
  }

  async function gerarLook(
    temp = temperatura,
    rain = chovendo,
    desc = descricaoUsuario,
    rolarMobile = true
  ) {
    setLoadingLook(true);
    setTrocouAlguma(false);
    try {
      const res = await api.recommendOutfit({
        temperatura: Number(temp),
        chovendo: Boolean(rain),
        ocasiao: "casual",
        descricao_usuario: desc,
      });

      setResultadoIA(res);
      setFalaConsultor(res.explicacao_ia || "");
      setAnimKey((prev) => prev + 1);
      setSeenIds({
        top: res.look?.top ? [res.look.top.id] : [],
        bottom: res.look?.bottom ? [res.look.bottom.id] : [],
        footwear: res.look?.footwear ? [res.look.footwear.id] : [],
        outerwear: res.look?.outerwear ? [res.look.outerwear.id] : [],
      });

      // Rola suavemente até a tela do Provador quando o usuário monta o look
      if (rolarMobile) {
        setTimeout(() => {
          resultadoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 120);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoadingLook(false);
    }
  }

  async function handleSwap(categoria, pecaAtualId) {
    setLoadingSwap(categoria);
    try {
      const res = await api.swapItem({
        categoria,
        peca_atual_id: pecaAtualId,
        temperatura: Number(temperatura),
        ocasiao: resultadoIA?.ocasiao_usada || "casual",
        formalidade: resultadoIA?.contexto?.formality_level,
        descricao_usuario: descricaoUsuario,
        ids_vistos: seenIds[categoria] || [],
      });

      if (res.nova_peca) {
        setResultadoIA((prev) => ({
          ...prev,
          look: {
            ...prev.look,
            [categoria]: res.nova_peca,
          },
        }));
        setFalaConsultor(res.mensagem_consultor || falaConsultor);
        setTrocouAlguma(true);
        setSeenIds((prev) => ({
          ...prev,
          [categoria]: [...(prev[categoria] || []), res.nova_peca.id],
        }));
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoadingSwap(null);
    }
  }

  async function handleSalvarLook() {
    if (!resultadoIA?.look) return;
    try {
      await api.saveHistory({
        occasion: resultadoIA.ocasiao_usada || "casual",
        temp_celsius: Number(temperatura),
        weather_condition: condicaoClima || (chovendo ? "Chuva / Nublado" : "Tempo seco"),
        top_item_id: resultadoIA.look.top?.id || null,
        bottom_item_id: resultadoIA.look.bottom?.id || null,
        footwear_item_id: resultadoIA.look.footwear?.id || null,
        outerwear_item_id: resultadoIA.look.outerwear?.id || null,
        user_feedback: trocouAlguma ? "swapped" : "accepted",
      });
      await carregarHistorico();
      alert("Look salvo nos seus favoritos!");
    } catch (err) {
      alert(err.message);
    }
  }

  function handleUploadFotoLocal(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setNovoItem((prev) => ({ ...prev, image_url: reader.result }));
    };
    reader.readAsDataURL(file);
  }

  async function handleCadastrarPeca(e) {
    e.preventDefault();
    if (!novoItem.name.trim()) return;
    try {
      await api.addWardrobeItem(novoItem);
      setNovoItem({
        name: "",
        category: "top",
        color: "preto",
        ideal_temp: 20,
        formality_level: 3,
        rain_resistant: false,
        image_url: "",
      });
      await carregarStatusEGuardaRoupa();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleRemoverPeca(id) {
    try {
      await api.deleteWardrobeItem(id);
      await carregarStatusEGuardaRoupa();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="app-shell">
      {/* TOPBAR COMPACTA ESTILO APP REAL */}
      <header className="app-topbar">
        <div className="brand-group">
          <img src="/logo-nobg.png" alt="Outfit Mascote" className="brand-avatar" />
          <div>
            <span className="brand-wordmark">
              Outfit <span className="brand-dot">Inteligente</span>
            </span>
          </div>
        </div>

        <nav className="topbar-nav">
          <button
            className={`topbar-tab ${activeTab === "provador" ? "active" : ""}`}
            onClick={() => setActiveTab("provador")}
          >
            Provador
          </button>
          <button
            className={`topbar-tab ${activeTab === "guarda-roupa" ? "active" : ""}`}
            onClick={() => setActiveTab("guarda-roupa")}
          >
            Guarda-Roupa ({wardrobe.length})
          </button>
          <button
            className={`topbar-tab ${activeTab === "historico" ? "active" : ""}`}
            onClick={() => setActiveTab("historico")}
          >
            Favoritos ({history.length})
          </button>
        </nav>

        <div className="topbar-actions">
          {!editandoCidade ? (
            <div
              className="weather-chip"
              onClick={() => setEditandoCidade(true)}
              title="Clique para trocar sua cidade"
            >
              <span style={{ color: "#a855f7" }}>📍</span>
              <span>{cidadeAtual}</span>
              <strong style={{ color: "#ffffff" }}>{temperatura}°C</strong>
              <span style={{ color: "#94a3b8" }}>• {chovendo ? "Risco de chuva" : "Tempo seco"}</span>
            </div>
          ) : (
            <form
              className="weather-chip"
              onSubmit={(e) => {
                e.preventDefault();
                if (cidadeManual.trim()) aplicarClimaDaAPI(cidadeManual.trim(), true);
              }}
            >
              <input
                type="text"
                placeholder="Digite sua cidade..."
                value={cidadeManual}
                onChange={(e) => setCidadeManual(e.target.value)}
                autoFocus
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#fff",
                  outline: "none",
                  fontSize: "0.82rem",
                  width: 140,
                }}
              />
              <button
                type="submit"
                style={{
                  background: "#8b5cf6",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "3px 9px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                OK
              </button>
            </form>
          )}

          <button
            className={`academic-toggle ${modoProfessor ? "active" : ""}`}
            onClick={() => setModoProfessor((v) => !v)}
            title="Ative na hora de apresentar para o professor ver os dados do K-Means!"
          >
            🎓 {modoProfessor ? "Ocultar K-Means" : "Modo Banca"}
          </button>
        </div>
      </header>

      {/* ABA 1: TELA PRINCIPAL (SÓ O ROBÔ + PEDIDO) -> DESCE PARA O PROVADOR COM O ROBÔ FALANDO! */}
      {activeTab === "provador" && (
        <main className="split-workspace">
          {/* TELA PRINCIPAL (TOPO): SÓ O ROBOZINHO ANIMADO + CAIXA DE PEDIDO */}
          <aside className="stylist-left-pane">
            <div className="stylist-ambient-glow" />

            <div className="mascot-stage">
              <RobotMascotRive isThinking={loadingLook} />
              <h2 style={{ fontSize: "1.45rem", fontWeight: 700, color: "#ffffff" }}>
                Para onde vamos hoje?
              </h2>
              <p style={{ fontSize: "0.82rem", color: "#94a3b8", marginTop: 4, marginBottom: 14 }}>
                {condicaoClima || `Clima atual: ${temperatura}°C em ${cidadeAtual}`} • Clique no robô para interagir!
              </p>
            </div>

            {/* COMPOSITOR DE PEDIDO */}
            <div className="chat-composer">
              <div className="composer-box">
                <textarea
                  rows={2}
                  className="composer-textarea"
                  value={descricaoUsuario}
                  onChange={(e) => setDescricaoUsuario(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      gerarLook(temperatura, chovendo, descricaoUsuario, true);
                    }
                  }}
                  placeholder="Me conta: para onde você vai hoje e o que está com vontade de vestir?"
                />
                <div className="composer-footer">
                  <button
                    className="btn-primary-violet"
                    onClick={() => gerarLook(temperatura, chovendo, descricaoUsuario, true)}
                    disabled={loadingLook}
                  >
                    {loadingLook ? "Montando seu visual..." : "Montar Meu Look"}
                  </button>
                </div>
              </div>

              <div className="suggestion-chips">
                {EXEMPLOS_PEDIDOS.map((ex, i) => (
                  <button
                    key={i}
                    className="chip-btn"
                    onClick={() => {
                      setDescricaoUsuario(ex);
                      gerarLook(temperatura, chovendo, ex, true);
                    }}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* TELA DO PROVADOR (PARA ONDE A TELA DESCE COM O ROBÔ FALANDO NO BALÃO!) */}
          <section
            ref={resultadoRef}
            key={animKey}
            style={{ display: "flex", flexDirection: "column", scrollMarginTop: "20px" }}
          >
            {resultadoIA && (
              <MannequinPreview
                look={resultadoIA.look}
                onSwap={handleSwap}
                loadingSwap={loadingSwap}
                falaConsultor={falaConsultor}
                clusterNome={resultadoIA.cluster_nome}
                contexto={resultadoIA.contexto}
                ocasiaoUsada={resultadoIA.ocasiao_usada}
                avisos={resultadoIA.avisos}
                onSalvarLook={handleSalvarLook}
                modoProfessor={modoProfessor}
              />
            )}
          </section>
        </main>
      )}

      {/* ABA 2: GUARDA-ROUPA */}
      {activeTab === "guarda-roupa" && (
        <div className="wardrobe-grid-layout animate-fade-up">
          <form className="studio-card" onSubmit={handleCadastrarPeca}>
            <h3 style={{ fontSize: "1.2rem", marginBottom: 16 }}>Adicionar Peça ao Guarda-Roupa</h3>

            <div className="studio-field">
              <label>Nome da peça</label>
              <input
                className="studio-input"
                placeholder="Ex: Jaqueta Jeans, Camisa Preta..."
                value={novoItem.name}
                onChange={(e) => setNovoItem({ ...novoItem, name: e.target.value })}
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="studio-field">
                <label>Categoria</label>
                <select
                  className="studio-select"
                  value={novoItem.category}
                  onChange={(e) => setNovoItem({ ...novoItem, category: e.target.value })}
                >
                  <option value="top">Parte de Cima</option>
                  <option value="bottom">Parte de Baixo</option>
                  <option value="footwear">Calçado</option>
                  <option value="outerwear">Casaco / Moletom</option>
                </select>
              </div>

              <div className="studio-field">
                <label>Cor principal</label>
                <select
                  className="studio-select"
                  value={novoItem.color}
                  onChange={(e) => setNovoItem({ ...novoItem, color: e.target.value })}
                >
                  {["preto", "branco", "azul", "cinza", "bege", "verde", "marrom", "vermelho"].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="studio-field">
              <label>Foto da sua roupa (do PC ou Celular)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleUploadFotoLocal}
                className="studio-input"
                style={{ fontSize: "0.78rem" }}
              />
              {novoItem.image_url && (
                <img
                  src={novoItem.image_url}
                  alt="Preview"
                  style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 12, marginTop: 6 }}
                />
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="studio-field">
                <label>Clima ideal ({novoItem.ideal_temp}°C)</label>
                <input
                  type="range"
                  min="5"
                  max="35"
                  value={novoItem.ideal_temp}
                  onChange={(e) => setNovoItem({ ...novoItem, ideal_temp: Number(e.target.value) })}
                />
              </div>

              <div className="studio-field">
                <label>Formalidade ({novoItem.formality_level}/5)</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={novoItem.formality_level}
                  onChange={(e) => setNovoItem({ ...novoItem, formality_level: Number(e.target.value) })}
                />
              </div>
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.84rem", marginBottom: 16 }}>
              <input
                type="checkbox"
                checked={novoItem.rain_resistant}
                onChange={(e) => setNovoItem({ ...novoItem, rain_resistant: e.target.checked })}
              />
              Protege da chuva / impermeável
            </label>

            <button type="submit" className="btn-primary-violet">
              Salvar no Guarda-Roupa
            </button>
          </form>

          <div className="catalog-grid">
            {wardrobe.map((item) => (
              <div className="catalog-item-card" key={item.id}>
                <img src={getGarmentImageUrl(item)} alt={item.name} className="catalog-item-photo" />
                <div className="catalog-item-body">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                    <h4 style={{ fontSize: "0.95rem" }}>{item.name}</h4>
                    <button
                      onClick={() => handleRemoverPeca(item.id)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#ef4444",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                      }}
                    >
                      Excluir
                    </button>
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: 6 }}>
                    <i className="color-dot" style={{ backgroundColor: getColorHex(item.color), marginRight: 6 }} />
                    <span style={{ textTransform: "capitalize" }}>{item.color}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA 3: FAVORITOS / HISTÓRICO */}
      {activeTab === "historico" && (
        <div className="studio-card animate-fade-up">
          <h3 style={{ fontSize: "1.25rem", marginBottom: 16 }}>Seus Looks Favoritos</h3>

          {history.length === 0 ? (
            <p style={{ color: "#94a3b8" }}>
              Você ainda não salvou nenhum look. Clique em "♥ Salvar Look" lá no Provador!
            </p>
          ) : (
            <div className="catalog-grid">
              {history.map((h) => (
                <div className="catalog-item-card" key={h.id} style={{ padding: 16 }}>
                  <div style={{ fontSize: "0.75rem", color: "#a855f7", fontWeight: 700 }}>
                    {(h.occasion || "casual").toUpperCase()} • {h.temp_celsius ?? h.temperature_c}°C
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 10, marginBottom: 8 }}>
                    {[h.outerwear, h.top, h.bottom, h.footwear]
                      .filter(Boolean)
                      .map((peca, idx) => (
                        <img
                          key={idx}
                          src={getGarmentImageUrl(peca)}
                          alt={peca.name}
                          style={{
                            width: 44,
                            height: 44,
                            objectFit: "cover",
                            borderRadius: 10,
                            border: "1px solid rgba(255,255,255,0.14)",
                          }}
                        />
                      ))}
                  </div>
                  <ul style={{ listStyle: "none", marginTop: 6, fontSize: "0.86rem", lineHeight: 1.7 }}>
                    {h.outerwear && <li>🧥 {h.outerwear.name}</li>}
                    {h.top && <li>👕 {h.top.name}</li>}
                    {h.bottom && <li>👖 {h.bottom.name}</li>}
                    {h.footwear && <li>👟 {h.footwear.name}</li>}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
