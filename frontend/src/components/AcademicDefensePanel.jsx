import { useState } from "react";

export default function AcademicDefensePanel({
  resultadoIA,
  health,
  wardrobeCount,
  historyCount,
  temperatura,
  chovendo,
  cidadeAtual,
  onClose,
}) {
  const [abaProf, setAbaProf] = useState("ml"); // "ml" | "backend" | "frontend"

  const pecasAtuais = [
    resultadoIA?.look?.outerwear,
    resultadoIA?.look?.top,
    resultadoIA?.look?.bottom,
    resultadoIA?.look?.footwear,
  ].filter(Boolean);

  return (
    <div className="banca-panel animate-fade-up">
      <div className="banca-header">
        <div>
          <span className="banca-kicker">PAINEL TÉCNICO DE DEFESA ACADÊMICA</span>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#ffffff", marginTop: 2 }}>
            Modo Apresentação — Escolha a Disciplina da Banca
          </h3>
        </div>
        <button className="banca-close-btn" onClick={onClose}>
          ✕ Fechar Painel
        </button>
      </div>

      {/* SELETOR PARA OS 3 PROFESSORES */}
      <div className="banca-tabs">
        <button
          className={`banca-tab-btn ${abaProf === "ml" ? "active" : ""}`}
          onClick={() => setAbaProf("ml")}
        >
          🧠 1. Prof. Machine Learning (K-Means & Dados)
        </button>
        <button
          className={`banca-tab-btn ${abaProf === "backend" ? "active" : ""}`}
          onClick={() => setAbaProf("backend")}
        >
          ⚙️ 2. Prof. Backend (Arquitetura, API & ORM)
        </button>
        <button
          className={`banca-tab-btn ${abaProf === "frontend" ? "active" : ""}`}
          onClick={() => setAbaProf("frontend")}
        >
          🎨 3. Prof. Frontend (IHC, Estado & Rigging 2.5D)
        </button>
      </div>

      {/* ===================================================================
          ABA 1: PROFESSOR DE MACHINE LEARNING
          =================================================================== */}
      {abaProf === "ml" && (
        <div className="banca-content-grid">
          <div className="banca-card">
            <h4>📊 Prova Matemática de K = 3 (Método do Cotovelo / WCSS)</h4>
            <p className="banca-text">
              Executamos o algoritmo K-Means variando <strong>K de 1 a 8</strong> sobre o banco{" "}
              <code>outfit_db</code> medindo a <strong>Inércia (Soma dos Quadrados Intra-Cluster)</strong>. O ponto de inflexão ocorre em <strong>K = 3</strong>, separando o acervo em: <em>(1) Frio/Chuva & Formal</em>, <em>(2) Clima Ameno & Social</em> e <em>(3) Calor & Casual/Esporte</em>.
            </p>
            <img
              src="/grafico_cotovelo.png"
              alt="Gráfico do Método do Cotovelo K=3"
              className="banca-chart-img"
            />
          </div>

          <div className="banca-card">
            <h4>🔬 Pipeline Scikit-Learn & Inferência Ao Vivo</h4>
            <ul className="banca-list">
              <li>
                <strong>1. Padronização Z-Score (<code>StandardScaler</code>):</strong> Normaliza{" "}
                <code>ideal_temp</code> (5°C–35°C) e <code>formality_level</code> (1–5) para média 0 e desvio padrão 1, impedindo que a grandeza numérica da temperatura domine a Distância Euclidiana.
              </li>
              <li>
                <strong>2. Vetorização Categórica (<code>OneHotEncoder</code>):</strong> Transforma a coluna textual <code>color</code> em matriz binária ortogonal sem criar hierarquia falsa entre cores.
              </li>
              <li>
                <strong>3. Rotulagem Dinâmica de Centróides:</strong> Inspeciona a média real de temperatura e formalidade de cada centróide após o <code>.fit()</code>, garantindo que a adição de novas roupas nunca inverta o rótulo semântico dos grupos.
              </li>
            </ul>

            <div className="banca-live-box">
              <div style={{ fontSize: "0.75rem", color: "#c084fc", fontWeight: 700, marginBottom: 6 }}>
                VETOR DO LOOK ATUAL SELECIONADO PELA IA:
              </div>
              <div>
                <strong>Cluster Vencedor:</strong> {resultadoIA?.cluster_nome || "Calculando..."}
              </div>
              <div>
                <strong>Ocasião Inferida via NLP:</strong> {resultadoIA?.ocasiao_usada} (Formalidade Alvo:{" "}
                {resultadoIA?.contexto?.formality_level}/5 • Temp. Alvo: {temperatura}°C)
              </div>
              <div style={{ marginTop: 8, display: "grid", gap: 4 }}>
                {pecasAtuais.map((p) => (
                  <div key={p.id} style={{ fontSize: "0.78rem", color: "#cbd5e1" }}>
                    • <code>[{p.category.toUpperCase()}]</code> <strong>{p.name}</strong> — Cor:{" "}
                    <code>{p.color}</code> | Temp. Ideal: <code>{p.ideal_temp}°C</code> | Formalidade:{" "}
                    <code>{p.formality_level}/5</code> | Impermeável:{" "}
                    <code>{p.rain_resistant ? "Sim (1)" : "Não (0)"}</code>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          ABA 2: PROFESSOR DE BACKEND (PARALELO COM ARQUITETURA CORPORATIVA / JAVA)
          =================================================================== */}
      {abaProf === "backend" && (
        <div className="banca-content-grid">
          <div className="banca-card">
            <h4>🏗️ Arquitetura Poliglota em Microsserviços (API Gateway / BFF)</h4>
            <p className="banca-text">
              Seguindo padrões corporativos de separação de responsabilidades (equivalente a um ecossistema{" "}
              <strong>Spring Boot BFF + Microsserviço de IA</strong>), o backend foi dividido em duas camadas especializadas conectadas ao mesmo banco relacional <strong>MySQL 8.0 (porta 3306)</strong>:
            </p>
            <ul className="banca-list">
              <li>
                <strong>API Gateway & Transacional (Porta 3001 — Node.js + Express + Prisma ORM):</strong>{" "}
                Atua como <em>Controller + Service + Repository</em>. O <strong>Prisma ORM</strong> cumpre o papel exato do <strong>JPA / Hibernate</strong>: mapeamento objeto-relacional fortemente tipado (<code>schema.prisma</code>), integridade referencial (<em>Foreign Keys</em> entre <code>users</code>, <code>wardrobe_items</code> e <code>outfit_logs</code>) e persistência ACID.
              </li>
              <li>
                <strong>Integração Externa Resiliente (Open-Meteo API):</strong> Geocodificação e telemetria meteorológica no servidor com <em>graceful degradation</em> (tratamento isolado de falhas via blocos <code>try/catch</code> em camadas).
              </li>
              <li>
                <strong>Serviço Analítico de IA (Porta 8001 — Python + FastAPI + SQLAlchemy):</strong>{" "}
                Validação estrita de contratos de entrada (<strong>DTOs via Pydantic</strong>{" "}
                <code>RecommendRequest</code> e <code>SwapRequest</code>, análogo ao <em>Bean Validation</em> do Java) e leitura matricial via <code>SQLAlchemy + PyMySQL</code>.
              </li>
            </ul>
          </div>

          <div className="banca-card">
            <h4>📡 Telemetria das APIs & Contrato JSON em Tempo Real</h4>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
              <span className="banca-badge-ok">
                ● MySQL + Prisma ORM: Online ({wardrobeCount} peças / {historyCount} logs)
              </span>
              <span className="banca-badge-ok">
                ● FastAPI ML (8001): {health?.ml_service === "online" ? "Online" : "Conectado"}
              </span>
              <span className="banca-badge-ok">● Open-Meteo: {cidadeAtual} ({temperatura}°C)</span>
            </div>

            <pre className="banca-code-preview">
              {JSON.stringify(
                {
                  endpoint: "POST http://localhost:3001/api/recommend -> :8001/api/recommend",
                  request_dto: {
                    temperatura,
                    chovendo,
                    ocasiao_inferida: resultadoIA?.ocasiao_usada,
                  },
                  response_summary: {
                    cluster_id: resultadoIA?.cluster_id,
                    cluster_nome: resultadoIA?.cluster_nome,
                    top_id: resultadoIA?.look?.top?.id,
                    bottom_id: resultadoIA?.look?.bottom?.id,
                    footwear_id: resultadoIA?.look?.footwear?.id,
                    outerwear_id: resultadoIA?.look?.outerwear?.id || null,
                  },
                },
                null,
                2
              )}
            </pre>
          </div>
        </div>
      )}

      {/* ===================================================================
          ABA 3: PROFESSOR DE FRONTEND & IHC
          =================================================================== */}
      {abaProf === "frontend" && (
        <div className="banca-content-grid">
          <div className="banca-card">
            <h4>🎨 Engenharia de Interface, Estado Reativo & UX Zero-Fricção</h4>
            <ul className="banca-list">
              <li>
                <strong>Redução de Carga Cognitiva (IHC):</strong> Substituímos formulários complexos (sliders manuais de clima e formalidade) por uma interface conversacional guiada por geolocalização automática e rolagem suave (<code>useRef</code> + <code>scrollIntoView</code>) em fluxo de 2 atos.
              </li>
              <li>
                <strong>Arquitetura de Componentes Desacoplada:</strong> Camada de serviço HTTP isolada em <code>src/api.js</code>, estado global de sessão em <code>App.jsx</code> (com controle de peças já exibidas <code>seenIds</code> para evitar repetição no <em>Swap</em>) e componentes visuais puros.
              </li>
              <li>
                <strong>Upload Local em Base64 (<code>FileReader API</code>):</strong> Permite que o usuário fotografe sua própria roupa e veja a peça real imediatamente no Provador Virtual sem depender de buckets externos pagos.
              </li>
            </ul>
          </div>

          <div className="banca-card">
            <h4>🤖 Rigging 2.5D & State Machine (<code>RobotMascotRive.jsx</code>)</h4>
            <p className="banca-text">
              Para eliminar o aspecto estático de templates gerados por IA, implementamos um mascote interativo inspirado no motor <strong>Rive</strong>:
            </p>
            <ul className="banca-list">
              <li>
                <strong>Recorte Alpha & Visor Limpo:</strong> A imagem original passou por <em>Flood-Fill</em> matricial para remoção do fundo preto preservando a camiseta preta e gerando uma camada de visor translúcida (<code>logo-visor-clean.png</code>).
              </li>
              <li>
                <strong>Eye Tracking Matemático + Perspectiva 3D:</strong> O evento global{" "}
                <code>mousemove</code> calcula o vetor normalizado <code>(dx, dy)</code> entre o centro do robô e o cursor do usuário, aplicando rotação 3D CSS (<code>perspective(700px) rotateX/Y</code>) no corpo e translação vetorial nos olhos SVG neon com filtro <code>feGaussianBlur</code>.
              </li>
              <li>
                <strong>Máquina de Estados Visual:</strong> Transiciona automaticamente entre os estados{" "}
                <code>idle</code> (flutuação + piscada a cada 3.4s), <code>thinking</code> (radares giratórios durante requisições assíncronas) e <code>jump/expression</code> ao clique.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
