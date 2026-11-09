import RobotMascotRive from "./RobotMascotRive";

const COLOR_HEX = {
  preto: "#27272a",
  branco: "#f8fafc",
  azul: "#3b82f6",
  cinza: "#94a3b8",
  bege: "#d6c3a5",
  verde: "#22c55e",
  marrom: "#92400e",
  vermelho: "#ef4444",
};

const CATEGORY_CLEAN_NAME = {
  outerwear: "Sobreposição / Agasalho",
  top: "Parte de Cima",
  bottom: "Parte de Baixo",
  footwear: "Calçado",
};

const FOTOS_POR_NOME = {
  "jaqueta de couro preta": "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=500&q=80",
  "sobretudo preto": "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=500&q=80",
  "camisa social azul claro": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=500&q=80",
  "calça alfaiataria cinza": "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=500&q=80",
  "sapato social couro": "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=500&q=80",
  "moletom com capuz cinza": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=500&q=80",
  "calça jeans escura": "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=500&q=80",
  "bota casual": "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=500&q=80",
  "camiseta branca básica": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=500&q=80",
  "bermuda jeans": "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=500&q=80",
  "tênis esportivo branco": "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=500&q=80",
  "chinelo / sandália": "https://images.unsplash.com/photo-1603487742131-4160ec999306?auto=format&fit=crop&w=500&q=80",
  "camisa polo verde": "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&w=500&q=80",
  "calça chino bege": "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=500&q=80",
  "sapatênis casual": "https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=500&q=80",
};

const FOTOS_PADRAO_CATEGORIA = {
  outerwear: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=500&q=80",
  top: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=500&q=80",
  bottom: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=500&q=80",
  footwear: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=500&q=80",
};

export function getColorHex(colorName = "") {
  const key = colorName.toLowerCase().trim();
  return COLOR_HEX[key] || "#8b5cf6";
}

export function getGarmentImageUrl(item) {
  if (!item) return "";
  if (item.image_url && item.image_url.trim() !== "") {
    return item.image_url;
  }
  const nomeChave = (item.name || "").toLowerCase().trim();
  if (FOTOS_POR_NOME[nomeChave]) {
    return FOTOS_POR_NOME[nomeChave];
  }
  return FOTOS_PADRAO_CATEGORIA[item.category] || FOTOS_PADRAO_CATEGORIA.top;
}

export default function MannequinPreview({
  look,
  onSwap,
  loadingSwap,
  falaConsultor,
  clusterNome,
  contexto,
  ocasiaoUsada,
  avisos,
  onSalvarLook,
  modoProfessor,
}) {
  const layers = ["outerwear", "top", "bottom", "footwear"];
  const activeLayers = layers.filter((cat) => (cat === "outerwear" ? Boolean(look?.outerwear) : true));

  return (
    <div className="fitting-stage-pane animate-fade-up">
      {/* LADO ESQUERDO DO PROVADOR: SILHUETA HUMANA COM AS ROUPAS NO CORPO */}
      <div className="mannequin-Zone">
        <div className="human-avatar-container">
          <svg className="human-silhouette-svg" viewBox="0 0 260 520" fill="none">
            <defs>
              <linearGradient id="bodyGrad" x1="130" y1="10" x2="130" y2="500" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#2e2b3b" />
                <stop offset="50%" stopColor="#1d1b26" />
                <stop offset="100%" stopColor="#121118" />
              </linearGradient>
            </defs>
            {/* Cabeça e Pescoço */}
            <circle cx="130" cy="42" r="25" fill="url(#bodyGrad)" stroke="rgba(168,85,247,0.35)" strokeWidth="1.4" />
            <rect x="120" y="67" width="20" height="19" rx="6" fill="url(#bodyGrad)" />
            {/* Tronco e Braços */}
            <path
              d="M72 95 C72 86, 100 84, 130 84 C160 84, 188 86, 188 95 L208 215 C210 224, 196 228, 190 220 L174 135 L168 242 L92 242 L86 135 L70 220 C64 228, 50 224, 52 215 Z"
              fill="url(#bodyGrad)"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="1.3"
            />
            {/* Pernas */}
            <path
              d="M92 242 L168 242 L176 435 L144 435 L130 295 L116 435 L84 435 Z"
              fill="url(#bodyGrad)"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1.3"
            />
            {/* Pés */}
            <ellipse cx="100" cy="452" rx="22" ry="11" fill="#1e1b29" stroke="rgba(168,85,247,0.3)" />
            <ellipse cx="160" cy="452" rx="22" ry="11" fill="#1e1b29" stroke="rgba(168,85,247,0.3)" />
          </svg>

          {look?.top && (
            <div className="avatar-wear-slot slot-top" key={`top-${look.top.id}`}>
              <img src={getGarmentImageUrl(look.top)} alt={look.top.name} className="avatar-garment-img" />
            </div>
          )}

          {look?.outerwear && (
            <div className="avatar-wear-slot slot-outerwear" key={`out-${look.outerwear.id}`}>
              <img src={getGarmentImageUrl(look.outerwear)} alt={look.outerwear.name} className="avatar-garment-img" />
            </div>
          )}

          {look?.bottom && (
            <div className="avatar-wear-slot slot-bottom" key={`bot-${look.bottom.id}`}>
              <img src={getGarmentImageUrl(look.bottom)} alt={look.bottom.name} className="avatar-garment-img" />
            </div>
          )}

          {look?.footwear && (
            <div className="avatar-wear-slot slot-footwear" key={`foot-${look.footwear.id}`}>
              <img src={getGarmentImageUrl(look.footwear)} alt={look.footwear.name} className="avatar-garment-img" />
            </div>
          )}
        </div>
      </div>

      {/* LADO DIREITO DO PROVADOR: ROBÔ ANIMADO COM BALÃO DE FALA + VITRINE DAS PEÇAS */}
      <div className="outfit-pieces-column">
        {/* ROBÔ ANIMADO FALANDO A RECOMENDAÇÃO DIRETO NO PROVADOR */}
        <div className="provador-stylist-header">
          <RobotMascotRive size="compact" isThinking={Boolean(loadingSwap)} />

          <div className="provador-speech-bubble">
            <div className="provador-bubble-top">
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#c084fc", letterSpacing: "0.04em" }}>
                DICA DO SEU STYLIST
              </span>
              <button className="btn-save-look" onClick={onSalvarLook}>
                <span>♥</span> Salvar Look
              </button>
            </div>
            <p style={{ fontSize: "0.92rem", lineHeight: 1.55, color: "#f1f5f9", marginTop: 4 }}>
              {falaConsultor}
            </p>
          </div>
        </div>

        {/* MODO PROFESSOR (OCULTO POR PADRÃO; ATIVE NO TOPO PARA MOSTRAR O K-MEANS NA BANCA) */}
        {modoProfessor && (
          <div className="academic-drawer">
            <div>
              <strong>Métricas K-Means (Scikit-Learn):</strong> {clusterNome}
            </div>
            <div>
              <strong>Ocasião:</strong> {ocasiaoUsada} (Formalidade {contexto?.formality_level}/5)
            </div>
            {avisos?.length > 0 && <div>{avisos[0]}</div>}
          </div>
        )}

        <div className="pieces-grid">
          {activeLayers.map((cat) => {
            const item = look?.[cat];
            if (!item) return null;
            const hex = getColorHex(item.color);

            return (
              <div className="piece-fashion-card" key={`${cat}-${item.id}`}>
                <div className="piece-img-wrap">
                  <img src={getGarmentImageUrl(item)} alt={item.name} className="piece-img" />
                  <button
                    className="btn-swap-floating"
                    onClick={() => onSwap(cat, item.id)}
                    disabled={loadingSwap === cat}
                  >
                    {loadingSwap === cat ? "Trocando..." : "↻ Outra opção"}
                  </button>
                </div>

                <div className="piece-meta">
                  <div>
                    <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600 }}>
                      {CATEGORY_CLEAN_NAME[cat]}
                    </span>
                    <div className="piece-title">{item.name}</div>
                    {modoProfessor && (
                      <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: 2 }}>
                        Ideal {item.ideal_temp}°C • Form. {item.formality_level}/5
                      </div>
                    )}
                  </div>
                  <i className="color-dot" style={{ backgroundColor: hex }} title={item.color} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
