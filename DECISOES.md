# 📒 Registro de Decisões do Projeto — Outfit Inteligente

> Este arquivo registra **o que decidimos e por quê**.
> Formato inspirado em ADR (*Architecture Decision Record*): cada decisão tem **contexto**, **decisão** e **justificativa**.
> Sempre que uma nova decisão for tomada, adicione uma nova seção no final.

---

## ADR-001 — Pilha de tecnologias

- **Contexto:** projeto acadêmico que precisa integrar frontend, backend, serviço de dados com Machine Learning e banco relacional.
- **Decisão:**
  - Frontend: **React + JavaScript**
  - Backend principal: **Node.js + Express** (orquestrador / API Gateway)
  - Serviço de dados e ML: **Python** (FastAPI + scikit-learn)
  - Banco de dados: **MySQL**
  - Acesso ao banco: **SQLAlchemy** (ORM em Python)
- **Justificativa:** cada tecnologia faz o que tem de melhor. Python domina o ecossistema de ML; Node.js é leve para APIs; React é o padrão de mercado para interfaces.

---

## ADR-002 — Estrutura do repositório (monorepo)

- **Decisão:** um único repositório com uma pasta por serviço:
  ```
  outfit_inteligente/
  ├── frontend/
  ├── backend-node/
  ├── ml-service-python/
  └── database/
  ```
- **Justificativa:** facilita a organização, a entrega do trabalho e a apresentação. Cada parte pode ser executada de forma independente.

---

## ADR-003 — Telas do sistema

- **Decisão:** 3 telas principais:
  1. **Dashboard ("Look do Dia")** — clima, ocasião, look recomendado e explicação da IA.
  2. **Provador Virtual** — montagem digital das peças e troca individual de peças.
  3. **Guarda-Roupa** — listagem e cadastro de peças.
- **Justificativa:** cobre os três pilares do projeto (inteligência climática, inteligência de estilo e visualização) com escopo viável.

---

## ADR-004 — Modelagem do banco: características numéricas

- **Contexto:** o K-Means calcula distâncias matemáticas, então precisa de números.
- **Decisão:** cada peça (`wardrobe_items`) possui atributos numéricos:
  - `ideal_temp` (temperatura ideal de uso, em °C)
  - `formality_level` (1 = casual ... 5 = formal)
  - `rain_resistant` (0 = não, 1 = sim)
- **Justificativa:** valores como "muito frio" ou "formal" em texto não permitem calcular distância. Números permitem.

---

## ADR-005 — Usuário dedicado no MySQL (menor privilégio)

- **Decisão:** a aplicação **não usa o usuário `root`**. Foi criado um usuário próprio com permissão **apenas** no banco `outfit_db`.
- **Justificativa:** princípio do menor privilégio. Se a senha da aplicação vazar, o atacante só alcança o banco do projeto, não o servidor inteiro.
- **Aprendizado:** o MySQL armazena senhas como *hash*, por isso não é possível "ver" uma senha esquecida, apenas redefini-la (`ALTER USER`).

---

## ADR-006 — Pré-processamento dos dados (orientação do professor)

- **Contexto:** o K-Means é sensível à escala e não entende texto.
- **Decisão:**
  - **StandardScaler** nas colunas numéricas (`ideal_temp`, `formality_level`, `rain_resistant`) → média 0 e desvio padrão 1.
  - **One-Hot Encoding** nas colunas categóricas (`category`, `color`) → colunas binárias (0/1).
- **Justificativa:**
  - Sem padronização, a temperatura (variação de ~22 unidades) dominaria a formalidade (variação de 4 unidades) no cálculo da distância.
  - Sem One-Hot, codificar cores como 1, 2, 3 criaria uma ordem falsa (ex.: "preto" ficaria "entre" azul e branco).

---

## ADR-007 — Escolha de K = 3 pelo Método do Cotovelo

- **Decisão:** **K = 3** clusters.
- **Evidência** (script `ml-service-python/elbow_analysis.py`, gráfico `grafico_cotovelo.png`):

  | K | Inércia aprox. | Queda |
  |---|---|---|
  | 1 | 68 | — |
  | 2 | 43 | −25 |
  | 3 | 29 | −14 |
  | 4 | 25 | −4 |
  | 5+ | ... | ≈ −3 a −4 |

- **Justificativa:** a inércia cai de forma acentuada até K = 3; a partir daí os ganhos são marginais. A hipótese inicial era K = 4, mas **os dados indicaram K = 3** — a decisão segue os dados, não o palpite.
- **Limitação conhecida:** a base tem apenas 15 peças. Com mais peças cadastradas, o K ideal pode mudar; a análise deve ser refeita periodicamente.

---

## ADR-008 — Interpretação dos clusters

- **Resultado** (script `ml-service-python/explore_clusters.py`):

  | Cluster | Temp. média | Formalidade | Chuva | Nome |
  |---|---|---|---|---|
  | 0 | 11,7 °C | 4,0 | 1,0 | 🧥 Frio e chuva |
  | 1 | 19,1 °C | 3,8 | 0,0 | 👔 Clima ameno / arrumado |
  | 2 | 27,2 °C | 1,2 | 0,0 | 🩳 Calor / casual |

- **Descoberta:** os clusters **misturam categorias** (camisa, calça e sapato no mesmo grupo). O agrupamento foi guiado por clima e formalidade, não por tipo de peça.
- **Por que isso é bom:** cada cluster funciona como um **"contexto de vestir"**, com peças de categorias diferentes que combinam com o mesmo clima.
- **Aprendizado:** o K-Means não decide em etapas (como uma Árvore de Decisão); ele mede a distância usando **todas as características ao mesmo tempo**.

---

## ADR-009 — Fallback com limiar para completar o look

- **Problema:** o cluster 0 (frio e chuva) tem apenas casacos e uma bota — **não tem parte de cima nem de baixo**, então não forma um look completo sozinho.
- **Decisão:** para cada categoria necessária:
  1. Se o cluster escolhido tem peças dessa categoria → escolher a mais próxima do contexto do dia.
  2. Se não tem → buscar no guarda-roupa inteiro a peça mais próxima dessa categoria, **desde que a diferença de temperatura seja de no máximo 8 °C (limiar)**.
  3. Se nenhuma peça respeitar o limiar → avisar o usuário que ele não possui uma peça adequada para o clima.
- **Justificativa:** sem limiar, o sistema poderia sugerir uma bermuda (28 °C) num dia de 10 °C só porque era "a calça mais próxima" disponível.

---

## ADR-010 — Regra de camadas (sobreposição)

- **Decisão:** se a temperatura for **menor que 18 °C**, o look **precisa** ter uma peça `outerwear` (casaco, jaqueta ou moletom).
- **Justificativa:** permite que peças mais leves (ex.: camisa de 18 °C) sejam usadas no frio, desde que haja uma camada por cima. Também atende à visão do projeto de sugerir sobreposições — e permite tirar o casaco quando esquentar ao longo do dia.

---

## ADR-011 — Regra de chuva

- **Decisão:** se estiver chovendo, o **calçado precisa ser impermeável** (`rain_resistant = 1`). Se o usuário não tiver nenhum, o sistema avisa.
- **Justificativa:** pé molhado é o maior desconforto em dia de chuva e é exatamente o tipo de surpresa que o sistema promete evitar.

---

## ADR-012 — Escopo do MVP x Versão 2

- **Decisão:**

  | ✅ MVP (trabalho da faculdade) | 🔜 Versão 2 |
  |---|---|
  | K-Means com K = 3 | Questionário de perfil do usuário |
  | Fallback com limiar de 8 °C | Ajuste de sensação térmica por usuário (ex.: friorento = −3 °C) |
  | Casaco obrigatório abaixo de 18 °C | Aprender com o feedback ("gostei" / "troquei") |
  | Calçado impermeável na chuva | Sugestão de compras (peças que faltam) |
  | Trocar uma peça do look | Avatar do usuário |

- **Justificativa:** MVP (*Produto Mínimo Viável*) — primeiro garantir o núcleo funcionando de ponta a ponta; melhorias só depois. Reduz o risco de chegar à apresentação sem nada funcionando.

---

## 💡 Visão de futuro (roadmap de produto)

Ideias registradas para depois do trabalho, caso o projeto seja validado com usuários reais:

1. **App** — validar se as pessoas usam no dia a dia.
2. **Avatar no app** — mostrar o look no corpo da pessoa (evolução da "montagem digital" do Provador Virtual).
3. **Tela conectada ao armário** — parceria com fabricantes de móveis; o mesmo backend serviria esse novo frontend.

**Desafios conhecidos:** concorrentes existentes (Stylebook, Cladwell, Acloset, Whering), dificuldade do usuário em cadastrar as roupas (possível solução: cadastro por foto) e retenção de uso.
**Diferencial possível:** foco na variação do clima ao longo do dia, relevante no Brasil.

---

## 🛠️ Pendências técnicas conhecidas

- [ ] A URL de conexão (com usuário e senha) está escrita diretamente nos scripts Python e repetida em mais de um arquivo (viola o princípio **DRY**). → Mover para um arquivo `.env` e não enviá-lo ao Git.
