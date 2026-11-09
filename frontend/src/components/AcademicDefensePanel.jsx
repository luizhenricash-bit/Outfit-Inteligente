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
          🎨 3. Prof. Design Web & Frontend (Checklist Expotech)
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
          ABA 3: PROFESSOR DE DESIGN WEB & FRONTEND (CHECKLIST EXPOTECH)
          =================================================================== */}
      {abaProf === "frontend" && (
        <div className="banca-content-grid">
          <div className="banca-card">
            <h4>🎨 1. Psicologia (Hick, Fitts, Miller) & 2. Semântica HTML5</h4>
            <ul className="banca-list">
              <li>
                <strong>Lei de Hick:</strong> Eliminamos dezenas de filtros manuais de clima e formalidade, concentrando a decisão em <strong>1 único campo conversacional</strong> com detecção automática de clima.
              </li>
              <li>
                <strong>Lei de Fitts:</strong> O botão principal <em>"Montar Meu Look"</em> possui largura total (<code>width: 100%</code>) colado ao campo de texto, e os botões <em>"↻ Outra opção"</em> ficam sobre a própria imagem da peça (distância mínima e área de clique ampla).
              </li>
              <li>
                <strong>Lei de Miller (Chunking 7±2):</strong> Navegação dividida em <strong>3 abas</strong>, <strong>4 sugestões rápidas</strong> e <strong>até 4 peças</strong> agrupadas no Provador.
              </li>
              <li>
                <strong>Semântica HTML5, H1–H4 e Formulários:</strong> Estrutura com{" "}
                <code>&lt;header&gt;</code>, <code>&lt;nav&gt;</code>, <code>&lt;main&gt;</code>,{" "}
                <code>&lt;section&gt;</code>, <code>&lt;aside&gt;</code>, <code>&lt;article&gt;</code> e{" "}
                <code>&lt;footer&gt;</code>; hierarquia lógica de <code>&lt;h1&gt;</code> a{" "}
                <code>&lt;h3&gt;</code>; inputs validados (<code>required</code>, <code>minLength</code>) com{" "}
                <code>&lt;label htmlFor&gt;</code> acessíveis.
              </li>
            </ul>
          </div>

          <div className="banca-card">
            <h4>✨ 3. CSS Box Model & 🚀 4. SEO, Boas Práticas e Rigging 2.5D</h4>
            <ul className="banca-list">
              <li>
                <strong>CSS Box Model & Responsividade:</strong> Reset global{" "}
                <code>box-sizing: border-box</code>, variáveis de cor em <code>:root</code> (alto contraste WCAG AAA <code>#F8FAFC</code> sobre <code>#050507</code>), layout híbrido com{" "}
                <strong>CSS Grid + Flexbox</strong> e <code>@media</code> queries para mobile e desktop.
              </li>
              <li>
                <strong>SEO & Acessibilidade:</strong> Meta tags completas no <code>index.html</code> (
                <code>description</code>, <code>keywords</code>, <code>author</code>, <code>robots</code>,{" "}
                <em>Open Graph</em>) e atributo <code>alt</code> descritivo em todas as imagens{" "}
                <code>&lt;img&gt;</code>.
              </li>
              <li>
                <strong>Mascote Interativo (<code>RobotMascotRive.jsx</code>):</strong> Recorte Alpha PNG transparente + olhos vetoriais SVG com <em>Eye Tracking</em> via evento <code>mousemove</code> e rotação 3D CSS (<code>perspective(700px) rotateX/Y</code>).
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
