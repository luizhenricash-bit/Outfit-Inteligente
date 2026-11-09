# 🎓 Guia Mestre de Apresentação — Defesa para os 3 Professores

Este documento foi preparado sob medida para você apresentar o **Outfit Inteligente** três vezes, adaptando o vocabulário técnico, os arquivos do VS Code que você vai abrir e a demonstração ao vivo para **cada um dos 3 professores**:

> 💡 **Dica de Ouro antes de começar qualquer uma das 3 apresentações:**  
> No canto superior direito do site (`http://localhost:5173`), clique no botão **`🎓 Modo Banca (3 Profs)`**!  
> Ele abre um painel interativo no topo da tela com **3 abas exclusivas** (`1. Prof. Machine Learning`, `2. Prof. Backend`, `3. Prof. Frontend`) contendo o gráfico do Método do Cotovelo, o payload JSON em tempo real e a explicação arquitetural de cada disciplina!

---

## ⚙️ APRESENTAÇÃO 1: Professor de Backend (Java / Arquitetura / API / ORM)

### 1. O que um Professor de Backend / Java mais valoriza?
Professores de Backend que vêm do mundo **Java (Spring Boot / JPA / Hibernate)** avaliam se você entende **engenharia de software, separação de camadas, tipagem de dados, mapeamento objeto-relacional (ORM), integridade referencial no banco de dados e comunicação entre serviços**.

### 2. Como explicar sua Arquitetura usando o vocabulário dele (2 minutos):
1. **Padrão Arquitetural *Polyglot Microservices + API Gateway (BFF)*:**
   > *"Professor, em vez de construir um monolito acoplado, projetamos uma arquitetura em **Microsserviços Poliglotas** com um **API Gateway (Backend-for-Frontend)** na porta `3001` e um **Microsserviço Analítico de IA** na porta `8001`, ambos compartilhando o banco relacional **MySQL 8.0 (`outfit_db`)** na porta `3306`."*
2. **Paralelo direto com Java / Spring Boot / Hibernate:**
   - **No Backend Principal ([`backend-node/server.js`](./backend-node/server.js)):**
     - Usamos **Prisma ORM** ([`backend-node/prisma/schema.prisma`](./backend-node/prisma/schema.prisma)), que cumpre exatamente o papel do **JPA / Hibernate** no Java: ele faz a introspecção do schema relacional do MySQL, garante tipagem estática das entidades (`users`, `wardrobe_items`, `outfit_logs`) e gerencia as *Foreign Keys* (chaves estrangeiras com `ON DELETE CASCADE` e `NO ACTION`).
   - **No Microsserviço de IA ([`ml-service-python/main.py`](./ml-service-python/main.py)):**
     - Usamos **FastAPI + Pydantic**, onde as classes `RecommendRequest` e `SwapRequest` funcionam exatamente como os **DTOs (*Data Transfer Objects*) com *Bean Validation*** do Java: se o JSON enviado pelo Gateway não tiver os tipos corretos (`float`, `bool`, `str`), a requisição é rejeitada automaticamente com HTTP `422 Unprocessable Entity` antes de chegar na regra de negócio.
3. **Orquestração e Tratamento de Exceções em Camadas:**
   - Mostre no [`backend-node/server.js`](./backend-node/server.js) a rota `GET /api/weather`: o backend consome uma API REST externa real (**Open-Meteo**), possui blocos `try/catch` isolados para *Graceful Degradation* (se o serviço de geolocalização por IP falhar, ele faz *fallback* automático para geocodificação sem derrubar o servidor) e retorna códigos HTTP semânticos (`200 OK`, `201 Created`, `400 Bad Request`, `502 Bad Gateway`, `503 Service Unavailable`).

### 3. Quais arquivos abrir no VS Code se o Professor de Backend pedir para ver código:
1. [`database/schema.sql`](./database/schema.sql) — Mostre a modelagem relacional (3 tabelas, tipos `ENUM`, chaves primárias e as 4 *Foreign Keys* na tabela `outfit_logs` apontando para `wardrobe_items`).
2. [`backend-node/prisma/schema.prisma`](./backend-node/prisma/schema.prisma) — Mostre as entidades mapeadas pelo ORM e os relacionamentos bidirecionais.
3. [`backend-node/server.js`](./backend-node/server.js) — Mostre o CRUD transacional (`POST /api/wardrobe`, `POST /api/history` com `include` fazendo o `JOIN` das 4 peças do look) e a orquestração HTTP para a porta `8001`.
4. [`ml-service-python/main.py`](./ml-service-python/main.py) — Mostre os DTOs tipados (`class RecommendRequest(BaseModel)`).

### 4. Pergunta Difícil que ele pode fazer (e sua Resposta Matadora):
* **Pergunta:** *"Por que você tem dois acessos ao banco (Prisma no Node e SQLAlchemy no Python) em vez de um só?"*
* **Sua Resposta:** *"Aplicamos uma separação inspirada em **CQRS (Command Query Responsibility Segregation)**: todas as operações de **Comando/Escrita transacional (CRUD)** passam exclusivamente pelo **Prisma ORM** no Gateway (porta `3001`), garantindo integridade de estado. Já o microsserviço de Machine Learning (porta `8001`) possui acesso **somente leitura (Read-Only Query)** via `SQLAlchemy` para carregar a matriz de atributos diretamente na memória do `Pandas DataFrame`, evitando trafegar milhares de registros via rede a cada inferência."*

---

## 🎨 APRESENTAÇÃO 2: Professor de Frontend & Interfaces (UI/UX / Estado / Componentes)

### 1. O que o Professor de Frontend mais valoriza?
Ele avalia **usabilidade (IHC / redução de carga cognitiva), componentização limpa, gerenciamento de estado assíncrono, consumo de API REST (`fetch`/`async-await`), responsividade e interatividade visual**.

### 2. Como apresentar o Frontend para ele (2 minutos):
1. **Decisão de UX / IHC — "Zero-Fricção" e Fluxo em 2 Atos:**
   > *"Professor, na primeira versão tínhamos dezenas de sliders manuais de temperatura e formalidade. Percebemos que isso gerava alta carga cognitiva e cara de formulário genérico. Reduzimos a interface para **Zero-Fricção**: o navegador captura a localização via API de Geolocalização/IP, busca o clima real sozinho, e o usuário só digita em linguagem natural para onde vai. Quando clica em 'Montar Meu Look', usamos o Hook `useRef` com `scrollIntoView({ behavior: 'smooth' })` para conduzir o olhar do usuário suavemente até o Provador."*
2. **Animação Interativa 2.5D estilo Rive ([`RobotMascotRive.jsx`](./frontend/src/components/RobotMascotRive.jsx)):**
   - Mexa o mouse pela tela e clique no robô!
   - Explique como foi feito no código:
     > *"Não é um GIF nem um vídeo pesado! Nós recortamos o fundo preto da imagem gerando uma camada PNG transparente com o visor limpo (`logo-visor-clean.png`), e sobrepusemos um **SVG vetorial com filtro `feGaussianBlur` (efeito neon)** para desenhar os olhos do robô em tempo real. Um listener global `mousemove` calcula o delta normalizado `(dx, dy)` entre o centro do componente (`getBoundingClientRect()`) e o cursor do mouse, aplicando rotação 3D CSS (`perspective(700px) rotateX/rotateY`) no corpo e movendo os olhos dentro do visor! Além disso, ele tem uma máquina de estados reativa (`isThinking`, `blinking`, `expression`, `jumping`)."*
3. **Gerenciamento de Estado Assíncrono e Prevenção de Repetição (`seenIds`):**
   - Vá ao Provador e clique em **"↻ Outra opção"** em uma peça.
   - Explique: *"Em [`App.jsx`](./frontend/src/App.jsx), mantemos o estado `seenIds` por categoria (`top`, `bottom`, `footwear`, `outerwear`). Quando o usuário pede para trocar só a camisa, fazemos uma atualização imutável de estado trocando apenas a chave `[categoria]` do objeto `look` sem recarregar a página inteira, e enviamos o array `ids_vistos` para o backend garantir que a próxima peça sugerida seja inédita."*
4. **Upload Local de Fotos com `FileReader API`:**
   - Mostre a aba **`Guarda-Roupa`** com a foto real do seu **Moletom preto**: usamos a API nativa `FileReader.readAsDataURL()` do navegador para converter a foto do usuário em `Base64` com preview instantâneo antes mesmo de enviar via `POST /api/wardrobe`.

### 3. Quais arquivos abrir no VS Code para o Professor de Frontend:
1. [`frontend/src/api.js`](./frontend/src/api.js) — Mostre a camada de serviço isolada (Clean Code: nenhum `fetch` solto no meio do HTML/JSX).
2. [`frontend/src/components/RobotMascotRive.jsx`](./frontend/src/components/RobotMascotRive.jsx) — Mostre o cálculo matemático do `handleMouseMove` e os estados do SVG.
3. [`frontend/src/components/MannequinPreview.jsx`](./frontend/src/components/MannequinPreview.jsx) — Mostre a composição do Provador, o balão de fala do stylist e os cards das peças.
4. [`frontend/src/App.jsx`](./frontend/src/App.jsx) — Mostre os Hooks (`useState`, `useEffect`, `useRef`) orquestrando o fluxo completo.

---

## 🧠 APRESENTAÇÃO 3: Professor de Machine Learning & Ciência de Dados

### 1. O que o Professor de Machine Learning mais valoriza?
Ele quer saber se você **realmente usou Machine Learning (`Scikit-Learn`)** ou se fez apenas um monte de `if/else`, por que escolheu **$K = 3$** no K-Means, como tratou **variáveis em escalas diferentes** antes de calcular a Distância Euclidiana e como funciona a inferência!

### 2. Como apresentar o Modelo de IA para ele (2 minutos):
1. **Abra a Aba 1 do `🎓 Modo Banca` na tela do site!**
   - O gráfico real do **Método do Cotovelo (`grafico_cotovelo.png`)** já vai aparecer na tela!
2. **Justificativa Matemática do $K = 3$ ([`elbow_analysis.py`](./ml-service-python/elbow_analysis.py)):**
   > *"Professor, como o agrupamento de vestuário é um problema de **Aprendizado Não Supervisionado**, usamos o algoritmo **K-Means**. Para não escolher o hiperparâmetro $K$ no chute, criamos o script `elbow_analysis.py` que rodou o K-Means de $K=1$ até $K=8$ medindo a **Inércia (WCSS — Soma dos Quadrados das Distâncias Intra-Cluster)**. Como o gráfico mostra, a maior queda marginal ocorre até $K=3$, onde a curva forma o cotovelo, dividindo perfeitamente o guarda-roupa em 3 arquétipos: Frio/Chuva & Formal, Clima Ameno & Social, e Calor & Casual."*
3. **Por que o Pré-Processamento (`StandardScaler` + `OneHotEncoder`) foi obrigatório ([`recommender.py`](./ml-service-python/recommender.py)):**
   > *"O K-Means calcula a **Distância Euclidiana** no espaço $n$-dimensional. Se jogássemos os dados brutos do banco, a variável `ideal_temp` (que varia de $5$ a $35$, amplitude $30$) esmagaria o peso da variável `formality_level` (que varia apenas de $1$ a $5$, amplitude $4$). Por isso, aplicamos o **`StandardScaler` ($z = \frac{x - \mu}{\sigma}$)** nas variáveis contínuas para igualar a variância, e aplicamos **`OneHotEncoder`** na variável categórica `color` para não criar uma ordem numérica falsa entre cores (como fingir que Azul = 2 é o dobro de Preto = 1)."*
4. **Solução do Problema de Permutação de Rótulos (*Label Switching*) do K-Means:**
   > *"Um detalhe prático que descobrimos quando cadastramos a 16ª peça no banco: como o K-Means não tem rótulo supervisionado, o grupo que antes recebia o ID `0` mudou para o ID `1` após o retreinamento. Para resolver isso de forma definitiva, implementamos uma **Inspeção Dinâmica de Centróides** em `recommender.py`: logo após o `kmeans.fit()`, calculamos a média real de temperatura e formalidade de cada grupo gerado e atribuímos o nome semântico dinamicamente."*
5. **Inferência Híbrida (Clusterização + Distância Euclidiana Ponderada + NLP):**
   - Mostre no [`ml-service-python/recommender.py`](./ml-service-python/recommender.py) como o texto do usuário é vetorizado pelo interpretador NLP (`interpretar_pedido_usuario`), descobre o cluster do dia (`descobrir_cluster_do_dia`) e ranqueia as peças de cada categoria (`top`, `bottom`, `footwear`, `outerwear`) combinando o bônus de pertencer ao cluster vencedor com a Distância Euclidiana e o alinhamento cromático!

### 3. Quais arquivos abrir no VS Code para o Professor de Machine Learning:
1. [`ml-service-python/elbow_analysis.py`](./ml-service-python/elbow_analysis.py) — Mostre o loop `for k in range(1, 9):` salvando `kmeans.inertia_`.
2. [`ml-service-python/explore_clusters.py`](./ml-service-python/explore_clusters.py) — Mostre a análise exploratória das médias de cada cluster.
3. [`ml-service-python/recommender.py`](./ml-service-python/recommender.py) — Mostre as funções `carregar_dados_e_treinar()` (linhas com `StandardScaler`, `OneHotEncoder`, `KMeans(n_clusters=3, random_state=42)`), `interpretar_pedido_usuario()` e `calcular_score_peca()`.
