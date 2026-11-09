import pandas as pd
import numpy as np
from sqlalchemy import create_engine
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.cluster import KMeans

DB_URL = "mysql+pymysql://outfit_inteligente:outfit123@localhost:3306/outfit_db"
engine = create_engine(DB_URL)

FORMALIDADE_POR_OCASIAO = {
    "casual": 3,
    "trabalho": 5,
    "esporte": 1,
    "festa": 4,
    "evento_formal": 5,
    "date": 4,
}

MAPA_OCASIOES_TEXTO = {
    "date": ["namorada", "namorado", "encontro", "date", "jantar", "romântico", "romantico"],
    "trabalho": ["trabalhar", "trabalho", "reunião", "reuniao", "escritório", "escritorio", "entrevista", "profissional"],
    "evento_formal": ["casamento", "formatura", "gala", "social", "dress code", "terno"],
    "festa": ["festa", "balada", "aniversário", "aniversario", "barzinho", "show", "evento"],
    "esporte": ["academia", "treino", "treinar", "correr", "corrida", "esporte", "parque", "caminhada"],
    "casual": ["faculdade", "aula", "passear", "passeio", "shopping", "mercado", "casa", "casual", "dia a dia"],
}

TERMOS_PECAS = [
    "moletom", "jaqueta", "sobretudo", "casaco", "blusa",
    "camisa social", "camisa polo", "polo", "camiseta", "camisa",
    "alfaiataria", "chino", "jeans", "bermuda", "calça", "calca",
    "sapato", "sapatênis", "sapatenis", "tênis", "tenis", "bota", "chinelo", "sandália"
]

TOM_CLARO = ["branco", "bege", "azul", "cinza"]
TOM_ESCURO = ["preto", "cinza", "marrom", "azul"]
CORES_NEUTRAS = ["preto", "branco", "cinza", "bege"]


def interpretar_pedido_usuario(texto: str):
    """
    Extrai ocasião, cores, paleta de tons, peças específicas citadas pelo nome
    (ex: 'moletom', 'jaqueta') e condições climáticas da frase escrita pelo usuário.
    """
    if not texto or not texto.strip():
        return {
            "ocasiao_detectada": None,
            "cores_diretas": [],
            "paleta_tom": [],
            "pecas_citadas": [],
            "pediu_agasalho": False,
            "condicional_chuva": False,
            "resumo_entendido": "",
        }

    t = texto.lower()

    # 1. Ocasião
    ocasiao_detectada = None
    for ocasiao, palavras in MAPA_OCASIOES_TEXTO.items():
        if any(p in t for p in palavras):
            ocasiao_detectada = ocasiao
            break

    # 2. Cores citadas
    radicais_cor = {
        "preto": ["preto", "preta", "all black"],
        "branco": ["branco", "branca"],
        "azul": ["azul", "azuis"],
        "cinza": ["cinza"],
        "bege": ["bege", "areia", "caqui", "creme"],
        "verde": ["verde"],
        "marrom": ["marrom", "terroso", "cafe"],
        "vermelho": ["vermelho", "vermelha", "vinho"],
    }
    cores_diretas = [cor for cor, termos in radicais_cor.items() if any(termo in t for termo in termos)]

    # 3. Paleta de tons
    paleta_tom = []
    nome_tom = ""
    if any(p in t for p in ["neutro", "neutra", "neutros", "neutras", "basico", "básico", "discreto"]):
        paleta_tom = CORES_NEUTRAS
        nome_tom = "tons neutros"
    elif any(p in t for p in ["tom claro", "tons claros", "claro", "clara", "leve", "suave"]):
        paleta_tom = TOM_CLARO
        nome_tom = "tons claros"
    elif any(p in t for p in ["tom escuro", "tons escuros", "escuro", "escura", "sobrio", "sóbrio"]):
        paleta_tom = TOM_ESCURO
        nome_tom = "tons escuros"

    # 4. Peças específicas pedidas pelo usuário (ex: "quero um moletom")
    pecas_citadas = [termo for termo in TERMOS_PECAS if termo in t]
    pediu_agasalho = any(p in t for p in ["moletom", "jaqueta", "sobretudo", "casaco", "agasalho", "frio"])
    condicional_chuva = any(p in t for p in ["se estiver", "se chover", "condições de chuva", "condicoes de chuva", "caso chova"])

    partes = []
    if ocasiao_detectada:
        partes.append(f"ocasião '{ocasiao_detectada}'")
    if nome_tom:
        partes.append(f"paleta em {nome_tom}")
    if cores_diretas:
        partes.append(f"cor ({', '.join(cores_diretas)})")
    if pecas_citadas:
        partes.append(f"peça solicitada ({', '.join(pecas_citadas)})")

    resumo = "Interpretado do seu pedido: " + ", ".join(partes) + "." if partes else ""

    return {
        "ocasiao_detectada": ocasiao_detectada,
        "cores_diretas": cores_diretas,
        "paleta_tom": paleta_tom,
        "pecas_citadas": pecas_citadas,
        "pediu_agasalho": pediu_agasalho,
        "condicional_chuva": condicional_chuva,
        "resumo_entendido": resumo,
    }


def carregar_dados_e_treinar():
    query = "SELECT id, name, category, color, ideal_temp, formality_level, rain_resistant, image_url FROM wardrobe_items;"
    df = pd.read_sql(query, engine)
    df['image_url'] = df['image_url'].fillna('')

    n_clusters = min(3, len(df)) if len(df) > 0 else 1
    preprocessor = ColumnTransformer(transformers=[
        ('num', StandardScaler(), ['ideal_temp', 'formality_level', 'rain_resistant']),
        ('cat', OneHotEncoder(), ['category', 'color'])
    ])
    X = preprocessor.fit_transform(df)

    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    df['cluster'] = kmeans.fit_predict(X)
    return df, preprocessor, kmeans


def contexto_do_dia(temperatura, chovendo, ocasiao, formalidade=None):
    if formalidade is None:
        formalidade = FORMALIDADE_POR_OCASIAO.get(ocasiao, 3)
    return {
        "ideal_temp": temperatura,
        "formality_level": formalidade,
        "rain_resistant": 1 if chovendo else 0
    }


def descobrir_cluster_do_dia(dia_info, df_roupas):
    medias = df_roupas.groupby('cluster')[['ideal_temp', 'formality_level', 'rain_resistant']].mean()
    ponto_dia = np.array([dia_info['ideal_temp'], dia_info['formality_level'], dia_info['rain_resistant']])

    menor_distancia = float('inf')
    cluster_escolhido = None
    for cluster_id, row in medias.iterrows():
        distancia = np.linalg.norm(ponto_dia - row.values)
        if distancia < menor_distancia:
            menor_distancia = distancia
            cluster_escolhido = cluster_id

    media_c = medias.loc[cluster_escolhido]
    temp_m = media_c['ideal_temp']
    form_m = media_c['formality_level']
    chuva_m = media_c['rain_resistant']

    if chuva_m >= 0.5:
        perfil = "Frio & Proteção contra Chuva"
    elif temp_m >= 23:
        perfil = "Calor & Leveza Casual"
    elif form_m >= 3.6:
        perfil = "Clima Ameno & Alinhado/Elegante"
    else:
        perfil = "Clima Ameno & Urbano"

    nome_cluster = f"Cluster {int(cluster_id)} • {perfil} (Média {temp_m:.0f}°C)"
    return cluster_escolhido, nome_cluster, medias


def calcular_score_peca(row, dia_info, cluster_alvo=None, cores_diretas=None, paleta_tom=None, pecas_citadas=None, tem_casaco=False):
    cores_diretas = cores_diretas or []
    paleta_tom = paleta_tom or []
    pecas_citadas = pecas_citadas or []

    peso_temp = 0.45 if (tem_casaco and row['category'] == 'top' and dia_info['ideal_temp'] < 18) else 1.0
    diff_temp = abs(row['ideal_temp'] - dia_info['ideal_temp']) * peso_temp
    diff_form = abs(row['formality_level'] - dia_info['formality_level']) * 3.5

    score = diff_temp + diff_form

    if cluster_alvo is not None and row.get('cluster') == cluster_alvo:
        score -= 3.5

    if dia_info['rain_resistant'] == 1 and row['rain_resistant'] == 1:
        score -= 6.0

    cor_peca = str(row['color']).lower().strip()
    if cor_peca in cores_diretas:
        score -= 8.0
    if cor_peca in paleta_tom:
        score -= 4.5
    elif (cores_diretas or paleta_tom) and cor_peca in CORES_NEUTRAS:
        score -= 1.5

    # Super Bônus quando o usuário pede uma peça específica pelo nome (ex: "quero um moletom")
    nome_peca = str(row['name']).lower()
    if any(termo in nome_peca for termo in pecas_citadas):
        score -= 18.0

    return score


def recomendar_look_completo(temperatura, chovendo, ocasiao, formalidade=None, descricao_usuario="", limiar_temp=10.0):
    df, _, _ = carregar_dados_e_treinar()
    if df.empty:
        return {"erro": "Seu guarda-roupa está vazio! Cadastre peças primeiro."}

    interpretacao = interpretar_pedido_usuario(descricao_usuario)
    ocasiao_final = interpretacao["ocasiao_detectada"] or ocasiao
    formalidade_final = FORMALIDADE_POR_OCASIAO.get(ocasiao_final, 3) if interpretacao["ocasiao_detectada"] else formalidade

    dia = contexto_do_dia(temperatura, chovendo, ocasiao_final, formalidade_final)
    cluster_id, cluster_nome, _ = descobrir_cluster_do_dia(dia, df)

    # Inclui sobreposição/casaco se estiver frio (< 18°C), chovendo/risco de chuva, ou se o usuário pediu agasalho/moletom
    tem_casaco = (dia['ideal_temp'] < 18) or bool(chovendo) or interpretacao["pediu_agasalho"]
    look = {}
    avisos = []

    if interpretacao["resumo_entendido"]:
        avisos.append(interpretacao["resumo_entendido"])

    if tem_casaco:
        cand_casaco = df[df['category'] == 'outerwear'].copy()
        if not cand_casaco.empty:
            cand_casaco['score'] = cand_casaco.apply(
                lambda r: calcular_score_peca(
                    r, dia, cluster_id,
                    interpretacao["cores_diretas"],
                    interpretacao["paleta_tom"],
                    interpretacao["pecas_citadas"],
                    True
                ),
                axis=1
            )
            look['outerwear'] = cand_casaco.sort_values('score').iloc[0].to_dict()
        else:
            look['outerwear'] = None
    else:
        look['outerwear'] = None

    for cat in ['top', 'bottom', 'footwear']:
        candidatos = df[df['category'] == cat].copy()
        if candidatos.empty:
            look[cat] = None
            continue

        if cat == 'footwear' and dia['rain_resistant'] == 1:
            impermeaveis = candidatos[candidatos['rain_resistant'] == 1]
            if not impermeaveis.empty:
                candidatos = impermeaveis

        candidatos['score'] = candidatos.apply(
            lambda r: calcular_score_peca(
                r, dia, cluster_id,
                interpretacao["cores_diretas"],
                interpretacao["paleta_tom"],
                interpretacao["pecas_citadas"],
                tem_casaco
            ),
            axis=1
        )
        melhor = candidatos.sort_values('score').iloc[0].to_dict()
        look[cat] = melhor

    nomes_pecas = [p['name'] for p in [look.get('outerwear'), look.get('top'), look.get('bottom'), look.get('footwear')] if p]
    clima_txt = f"{temperatura:.0f}°C com condição/risco de chuva" if chovendo else f"{temperatura:.0f}°C e tempo firme"

    explicacao = f"Verifiquei o clima em tempo real ({clima_txt}). Para o seu compromisso ({ocasiao_final}), recomendo: {', '.join(nomes_pecas)}."

    if interpretacao.get("paleta_tom") or interpretacao.get("cores_diretas"):
        explicacao += " Selecionei uma combinação harmônica em tons neutros/solicitados."

    if look.get("outerwear"):
        if chovendo:
            explicacao += f" Como há condições de chuva/céu carregado, incluí '{look['outerwear']['name']}' para você levar, exatamente como pediu!"
        else:
            explicacao += f" Incluí '{look['outerwear']['name']}' como sobreposição para você levar por precaução!"

    return {
        "contexto": dia,
        "ocasiao_usada": ocasiao_final,
        "cluster_id": int(cluster_id),
        "cluster_nome": cluster_nome,
        "look": look,
        "explicacao_ia": explicacao,
        "interpretacao": interpretacao,
        "avisos": avisos,
    }


def trocar_peca(categoria, peca_atual_id, temperatura, ocasiao, formalidade=None, descricao_usuario=""):
    df, _, _ = carregar_dados_e_treinar()
    interpretacao = interpretar_pedido_usuario(descricao_usuario)
    ocasiao_final = interpretacao["ocasiao_detectada"] or ocasiao
    dia = contexto_do_dia(temperatura, chovendo=False, ocasiao=ocasiao_final, formalidade=formalidade)
    cluster_id, _, _ = descobrir_cluster_do_dia(dia, df)

    candidatos = df[(df['category'] == categoria) & (df['id'] != peca_atual_id)].copy()
    if candidatos.empty:
        return {
            "sucesso": False,
            "mensagem": f"Você não possui outra opção de {categoria} cadastrada no guarda-roupa."
        }

    tem_casaco = (dia['ideal_temp'] < 18) or interpretacao["pediu_agasalho"]
    candidatos['score'] = candidatos.apply(
        lambda r: calcular_score_peca(
            r, dia, cluster_id,
            interpretacao["cores_diretas"],
            interpretacao["paleta_tom"],
            interpretacao["pecas_citadas"],
            tem_casaco
        ),
        axis=1
    )
    candidatos_ordenados = candidatos.sort_values('score')
    nova_peca = candidatos_ordenados.iloc[0].to_dict()

    return {
        "sucesso": True,
        "nova_peca": nova_peca,
        "outras_opcoes": candidatos_ordenados[['id', 'name', 'color']].to_dict(orient='records'),
        "mensagem": f"Substituí por '{nova_peca['name']}' ({nova_peca['color']}) — mantém o equilíbrio térmico e o estilo da ocasião!"
    }
