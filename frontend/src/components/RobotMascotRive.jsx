import { useEffect, useRef, useState } from "react";

/**
 * Componente de Mascote Interativo estilo Rive (State Machine + Rig 2.5D)
 * - Usa /logo-visor-clean.png (PNG 100% transparente sem fundo preto!)
 * - Olhos em SVG Neon renderizados dentro do visor que:
 *   1. Seguem o cursor do mouse pela tela em tempo real (Eye Tracking)
 *   2. Piscam naturalmente a cada poucos segundos (Blink Loop)
 *   3. Mudam de expressão conforme o Estado (Idle, Pensando/Analisando, Feliz ao Clicar)
 */
export default function RobotMascotRive({ isThinking = false, size = "normal", onInteract }) {
  const containerRef = useRef(null);
  const [lookOffset, setLookOffset] = useState({ x: 0, y: 0, rotX: 0, rotY: 0 });
  const [blinking, setBlinking] = useState(false);
  const [expression, setExpression] = useState("happy"); // "happy" | "curious" | "wink"
  const [jumping, setJumping] = useState(false);

  // Rastreia o mouse na tela inteira (igual aos Inputs de State Machine do Rive)
  useEffect(() => {
    function handleMouseMove(e) {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height * 0.25;

      const dx = (e.clientX - centerX) / (window.innerWidth * 0.5);
      const dy = (e.clientY - centerY) / (window.innerHeight * 0.5);

      const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
      setLookOffset({
        x: clamp(dx * 9, -8, 8),
        y: clamp(dy * 6, -5, 6),
        rotY: clamp(dx * 12, -11, 11),
        rotX: clamp(-dy * 9, -8, 8),
      });
    }

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Loop natural de piscada dos olhos (Blink State)
  useEffect(() => {
    const interval = setInterval(() => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 150);
    }, 3400);
    return () => clearInterval(interval);
  }, []);

  function handleRobotClick() {
    setJumping(true);
    setExpression((prev) => (prev === "happy" ? "curious" : prev === "curious" ? "wink" : "happy"));
    if (onInteract) onInteract();
    setTimeout(() => setJumping(false), 600);
  }

  return (
    <div
      ref={containerRef}
      onClick={handleRobotClick}
      className={`rive-mascot-stage ${size === "compact" ? "rive-compact" : ""} ${isThinking ? "state-thinking" : ""} ${jumping ? "state-jump" : ""}`}
      title="Clique em mim para interagir!"
    >
      <div
        className="rive-rig-body"
        style={{
          transform: `perspective(700px) rotateX(${lookOffset.rotX}deg) rotateY(${lookOffset.rotY}deg)`,
        }}
      >
        {/* Corpo do Robô em PNG Transparente (Sem nenhum fundo preto!) */}
        <img
          src="/logo-visor-clean.png"
          alt="Robô Stylist Interativo"
          className="rive-robot-png"
          draggable={false}
        />

        {/* Camada de Olhos Vetoriais Neon dentro do Visor (Se movem com o Mouse + Piscam!) */}
        <svg
          className="rive-visor-eyes"
          viewBox="0 0 559 514"
          fill="none"
          style={{
            transform: `translate(${lookOffset.x}px, ${lookOffset.y}px)`,
          }}
        >
          <defs>
            <filter id="neonPurpleGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="5" result="blur1" />
              <feGaussianBlur stdDeviation="11" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g
            filter="url(#neonPurpleGlow)"
            style={{
              transformOrigin: "282px 92px",
              transform: blinking ? "scaleY(0.08)" : "scaleY(1)",
              transition: "transform 0.1s ease",
            }}
          >
            {isThinking ? (
              /* ESTADO 1: PENSANDO / ESCANEANDO ROUPAS */
              <>
                <circle
                  cx="250"
                  cy="92"
                  r="16"
                  stroke="#d8b4fe"
                  strokeWidth="6"
                  strokeDasharray="24 14"
                  className="eye-spin"
                />
                <circle
                  cx="316"
                  cy="92"
                  r="16"
                  stroke="#d8b4fe"
                  strokeWidth="6"
                  strokeDasharray="24 14"
                  className="eye-spin"
                />
              </>
            ) : expression === "curious" ? (
              /* ESTADO 2: OLHOS DIGITAIS CURIOSOS QUE OLHAM PARA O CURSOR */
              <>
                <rect x="234" y="74" width="30" height="36" rx="15" fill="#c084fc" />
                <rect x="242" y="80" width="10" height="10" rx="5" fill="#ffffff" />
                <rect x="300" y="74" width="30" height="36" rx="15" fill="#c084fc" />
                <rect x="308" y="80" width="10" height="10" rx="5" fill="#ffffff" />
              </>
            ) : expression === "wink" ? (
              /* ESTADO 3: PISCulhada CHARMOSA DE STYLIST */
              <>
                <path
                  d="M 230 98 C 238 72, 266 72, 272 98"
                  stroke="#d8b4fe"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
                <path
                  d="M 298 92 L 332 92"
                  stroke="#f0abfc"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
              </>
            ) : (
              /* ESTADO PADRÃO: ARCOS FELIZES NEON (^ ^) IGUAIS À SUA LOGO ORIGINAL */
              <>
                <path
                  d="M 230 100 C 237 70, 266 70, 272 100"
                  stroke="#c084fc"
                  strokeWidth="11"
                  strokeLinecap="round"
                />
                <path
                  d="M 230 100 C 237 70, 266 70, 272 100"
                  stroke="#f5d0fe"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                />
                <path
                  d="M 296 102 C 303 73, 331 73, 337 102"
                  stroke="#c084fc"
                  strokeWidth="11"
                  strokeLinecap="round"
                />
                <path
                  d="M 296 102 C 303 73, 331 73, 337 102"
                  stroke="#f5d0fe"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                />
              </>
            )}
          </g>

          {/* Pulso extra no cabide neon do peito quando está analisando */}
          <path
            d="M 281 206 C 281 198, 291 198, 291 205 C 291 210, 283 212, 283 217 L 254 238 C 250 241, 252 246, 258 246 L 309 248 C 315 248, 317 243, 313 240 L 283 217"
            stroke="#e879f9"
            strokeWidth={isThinking ? "6" : "2.5"}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={isThinking ? "0.95" : "0.45"}
            filter="url(#neonPurpleGlow)"
          />
        </svg>
      </div>
    </div>
  );
}
