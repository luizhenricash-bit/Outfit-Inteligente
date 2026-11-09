# 🎤 Manual Completo de Defesa — Pitch + Códigos Comentados para os 3 Professores

Este guia contém o **Pitch Oficial de Abertura** e os **trechos reais do seu código** nas 3 matérias, explicando **linha por linha o que fazem** e **o que responder quando o professor perguntar: *"Por que você fez dessa forma?"***.

---

## 🚀 1. O PITCH DO OUTFIT INTELIGENTE (Como começar todas as 3 apresentações — 45 segundos)

> **O que falar ao abrir a tela inicial do sistema:**  
> *"Bom dia/Boa noite, professor! Todos os dias as pessoas perdem tempo abrindo o guarda-roupa e o aplicativo de clima no celular tentando decidir o que vestir para o trabalho, para a faculdade ou para um jantar — e muitas vezes saem com a roupa errada para a temperatura ou para a chuva.*  
> *Para resolver isso, eu desenvolvi o **Outfit Inteligente**: um Personal Stylist e Provador Virtual que funciona com **Zero-Fricção**. Assim que o usuário abre o sistema, ele captura automaticamente a geolocalização e consulta a API meteorológica **Open-Meteo** em tempo real (trazendo temperatura, sensação térmica e porcentagem de nuvens/risco de chuva). O usuário só precisa digitar em português natural para onde vai — por exemplo, 'Vou levar minha namorada para jantar, quero uma roupa neutra e se tiver risco de chuva quero levar um moletom' — e a nossa Inteligência Artificial analisa o guarda-roupa real cadastrado no banco MySQL e monta o look completo no Provador Virtual com as fotos reais das roupas do usuário!"*

*(Nesse momento, clique em **"Montar Meu Look"**, deixe a tela deslizar suavemente até o Provador, mostre o robô falando no balão, troque uma peça clicando em **"↻ Outra opção"** e clique em **`🎓 Modo Banca (3 Profs)`** no canto superior direito!)*

---

## 🧠 2. MATÉRIA 1: MACHINE LEARNING (K-Means, Pré-Processamento & Gráfico do Cotovelo)

### Trecho de Código 1: O Método do Cotovelo ([`ml-service-python/elbow_analysis.py`](./ml-service-python/elbow_analysis.py))
```python
inertias = []
valores_k = range(1, 9)

for k in valores_k:
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    kmeans.fit(X_preparado)
    inertias.append(kmeans.inertia_)
```

* **❓ Se o professor perguntar: *"O que é esse Gráfico do Cotovelo e por que você escolheu $K = 3$ dessa forma?"***
  * **🗣️ Sua Resposta:**
    *"Professor, como nossas roupas no banco não tinham um rótulo de grupo pré-definido, tratamos o problema como **Aprendizado Não Supervisionado** usando **K-Means**. Só que no K-Means nós precisamos informar o número de grupos ($K$). Para não chutar um número aleatório, implementei o **Método do Cotovelo (`elbow_analysis.py`)**: eu rodei o K-Means de $K=1$ até $K=8$ medindo a `kmeans.inertia_`, que é a **WCSS (Soma dos Quadrados das Distâncias Intra-Cluster)**. Olhando o gráfico, de $K=1$ para $K=2$ e de $K=2$ para $K=3$ a inércia cai drasticamente, mas a partir de $K=3$ a curva dobra formando um 'cotovelo' (o ganho passa a ser marginal). Além disso, $K=3$ tem sentido físico perfeito no domínio de moda: (1) Frio/Chuva & Formal, (2) Clima Ameno & Trabalho, e (3) Calor & Casual."*

---

### Trecho de Código 2: Pré-Processamento (`StandardScaler` + `OneHotEncoder`) ([`ml-service-python/recommender.py`](./ml-service-python/recommender.py))
```python
scaler = StandardScaler()
num_scaled = scaler.fit_transform(df[['ideal_temp', 'formality_level']])

encoder = OneHotEncoder(sparse_output=False)
color_encoded = encoder.fit_transform(df[['color']])

X = np.hstack([num_scaled, color_encoded, df[['rain_resistant']].values])
kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
df['cluster'] = kmeans.fit_predict(X)
```

* **❓ Se o professor perguntar: *"Por que você usou `StandardScaler` e `OneHotEncoder` antes do K-Means em vez de passar os dados direto do banco?"***
  * **🗣️ Sua Resposta:**
    *"Porque o K-Means agrupa os pontos usando a **Distância Euclidiana**. No meu banco de dados, a temperatura (`ideal_temp`) vai de `5` a `35` (uma variação de 30 pontos), enquanto a formalidade (`formality_level`) só vai de `1` a `5` (variação de 4 pontos). Se eu não usasse o **`StandardScaler`** para deixar as duas variáveis com média 0 e desvio padrão 1, a temperatura ia dominar quase 100% da conta matemática e o modelo ia ignorar a formalidade!*  
    *E na coluna `color` (cor), como é texto (`'preto'`, `'azul'`, `'branco'`), o K-Means não aceita strings. Se eu colocasse números `1, 2, 3` (`LabelEncoder`), o algoritmo acharia que a cor `3` é maior que a cor `1`. Por isso usei o **`OneHotEncoder`**, que cria colunas binárias (`0` ou `1`) sem inventar hierarquia entre as cores."*

---

## ⚙️ 3. MATÉRIA 2: BACKEND & BANCO DE DADOS (Arquitetura, API Gateway, ORM & DTOs)

### Trecho de Código 1: Persistência Relacional com Prisma ORM ([`backend-node/server.js`](./backend-node/server.js))
```javascript
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
```

* **❓ Se o professor de Backend (Java) perguntar: *"Por que você dividiu o Backend em dois serviços (porta 3001 e porta 8001) e usou Prisma ORM?"***
  * **🗣️ Sua Resposta:**
    *"Professor, segui o padrão de **Microsserviços com API Gateway (BFF — Backend for Frontend)**:*
    *1. O serviço principal na porta `3001` concentra toda a regra de negócio transacional (CRUD do guarda-roupa, histórico de looks e integração externa com a API de clima Open-Meteo). Nele utilizei o **Prisma ORM**, que faz exatamente o papel do **JPA / Hibernate no Java**: ele mapeia nossas tabelas relacionais do MySQL (`users`, `wardrobe_items`, `outfit_logs`) com tipagem forte e garante a integridade das 4 **Chaves Estrangeiras (`FOREIGN KEY`)** quando salvamos um look.*
    *2. Já o segundo serviço na porta `8001` é isolado apenas para o motor matemático de Machine Learning em Python (`FastAPI`). Assim, se o cálculo de IA crescer, ele não trava o servidor transacional principal."*

---

### Trecho de Código 2: Validação de Contrato / DTO ([`ml-service-python/main.py`](./ml-service-python/main.py))
```python
class RecommendRequest(BaseModel):
    temperatura: float = 22.0
    chovendo: bool = False
    ocasiao: str = "casual"
    formalidade: Optional[int] = None
    descricao_usuario: Optional[str] = ""
```

* **❓ Se o professor de Backend perguntar: *"Como você garante a segurança dos dados que trafegam entre os dois servidores?"***
  * **🗣️ Sua Resposta:**
    *"Usamos classes baseadas em `BaseModel` (Pydantic), que funcionam exatamente como os **DTOs (Data Transfer Objects) com Bean Validation no Spring Boot**: antes mesmo de executar a função da rota `/api/recommend`, o framework valida se `temperatura` é `float` e se `chovendo` é `boolean`. Se alguém mandar um tipo inválido na requisição HTTP, a API barra na porta e devolve erro `422 Unprocessable Entity` automaticamente."*

---

## 🎨 4. MATÉRIA 3: FRONTEND (JavaScript ES6+, React, Consumo de API & Mascote Interativo)

### Por que escolhemos usar **JavaScript com React**? (Resumo Rápido para o Professor)
1. **É 100% JavaScript (ES6+):** Toda a lógica usa `async/await`, `fetch`, `.map()`, `.filter()` e eventos do DOM.
2. **Componentização (Não repetir código):** O robô animado ([`RobotMascotRive.jsx`](./frontend/src/components/RobotMascotRive.jsx)) foi programado uma única vez e reutilizado tanto na tela principal quanto dentro do Provador ao lado do balão de fala.
3. **Atualização Cirúrgica sem Recarregar a Página (*Virtual DOM*):** Quando o usuário clica em **"↻ Outra opção"** para trocar apenas o sapato, o estado do React (`useState`) atualiza somente aquele card no Provador em milissegundos, sem piscar a tela inteira.

---

### Trecho de Código 1: Camada Isolada de Consumo de API em JavaScript Puro ([`frontend/src/api.js`](./frontend/src/api.js))
```javascript
const API_BASE = "http://localhost:3001/api";

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.erro || data.detalhe || "Erro na comunicação com o servidor");
  }
  return data;
}
```

* **❓ Se o professor de Frontend perguntar: *"Por que você criou esse arquivo `api.js` separado em vez de fazer o `fetch` direto nos botões da tela?"***
  * **🗣️ Sua Resposta:**
    *"Para aplicar **Clean Code e Separação de Responsabilidades (DRY — Don't Repeat Yourself)**. Em vez de repetir `fetch('http://localhost:3001/api/...')`, `headers` e tratamento de erro `if (!response.ok)` em 7 lugares diferentes da tela, centralizei toda a comunicação HTTP assíncrona (`async/await`) nessa função `request()` em JavaScript puro. Os componentes visuais apenas chamam `await api.recommendOutfit(...)` ou `await api.swapItem(...)`."*

---

### Trecho de Código 2: O Eye Tracking do Robô seguindo o Mouse ([`frontend/src/components/RobotMascotRive.jsx`](./frontend/src/components/RobotMascotRive.jsx))
```javascript
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
```

* **❓ Se o professor de Frontend perguntar: *"Como você fez esse robô mexer os olhos e inclinar o corpo seguindo o mouse?"***
  * **🗣️ Sua Resposta:**
    *"Eu usei JavaScript puro com eventos do DOM (`window.addEventListener('mousemove')`) combinado com SVG: primeiro pegamos a posição exata do robô na tela com `getBoundingClientRect()`. Depois calculamos a distância horizontal (`dx`) e vertical (`dy`) entre o centro do visor do robô e a posição `(e.clientX, e.clientY)` do mouse do usuário. Usamos uma função `clamp` para limitar o movimento (para o olho não sair de dentro do capacete!) e aplicamos esse valor em tempo real no `transform: translate(x, y)` dos olhos vetoriais em SVG e no `rotateX / rotateY` 3D do corpo!"*

---

### Trecho de Código 3: Troca Inteligente de Peça sem Repetição ([`frontend/src/App.jsx`](./frontend/src/App.jsx))
```javascript
setResultadoIA((prev) => ({
  ...prev,
  look: {
    ...prev.look,
    [categoria]: res.nova_peca,
  },
}));
setSeenIds((prev) => ({
  ...prev,
  [categoria]: [...(prev[categoria] || []), res.nova_peca.id],
}));
```

* **❓ Se o professor de Frontend perguntar: *"O que esse `[categoria]: res.nova_peca` e esse `seenIds` fazem quando clica em 'Outra opção'?"***
  * **🗣️ Sua Resposta:**
    *"Aqui usamos **Propriedade Computada do JavaScript (`[categoria]`)** e *Spread Operator (`...`)*: se o usuário clicou para trocar só a categoria `'footwear'` (calçado), nós copiamos todo o look anterior (`...prev.look`) e substituímos apenas a propriedade `'footwear'` pela `res.nova_peca`, mantendo a camisa, a calça e o moletom intactos! E no `seenIds`, guardamos um array com os IDs que o usuário já viu naquela sessão para o backend nunca repetir a mesma peça em loop."*
