import pandas as pd
import numpy as np
from sqlalchemy import create_engine
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.cluster import KMeans

# 1. Conexão com o MySQL
DB_URL = "mysql+pymysql://outfit_inteligente:outfit123@localhost:3306/outfit_db"
engine = create_engine(DB_URL)

# 2. Régua de formalidade padrão
FORMALIDADE_POR_OCASIAO = {
    "casual": 3,
    "trabalho": 5,
    "esporte": 1,
    "festa": 4,
    "evento_formal": 5,
    "date": 4,
}

def carregar_dados_e_treinar():
    """Busca as roupas do MySQL e treina o modelo K-Means."""
    query = "SELECT id, name, category, color, ideal_temp, formality_level, rain_resistant FROM wardrobe_items;"
    df = pd.read_sql(query, engine)

    preprocessor = ColumnTransformer(transformers=[
        ('num', StandardScaler(), ['ideal_temp', 'formality_level', 'rain_resistant']),
        ('cat', OneHotEncoder(), ['category', 'color'])
    ])

    X = preprocessor.fit_transform(df)

    # K=3 definido pelo método do cotovelo
    kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
    df['cluster'] = kmeans.fit_predict(X)

    return df, preprocessor, kmeans

def contexto_do_dia(temperatura, chovendo, ocasiao, formalidade=None):
    """Transforma o 'dia' em um ponto no mesmo formato das roupas."""
    if formalidade is None:
        formalidade = FORMALIDADE_POR_OCASIAO.get(ocasiao, 3)

    return {
        "ideal_temp": temperatura,
        "formality_level": formalidade,
        "rain_resistant": 1 if chovendo else 0
    }

def descobrir_cluster_do_dia(dia_info, df_roupas):
    """Calcula a distância euclidiana até os centroides e retorna o cluster mais próximo."""
    medias = df_roupas.groupby('cluster')[['ideal_temp', 'formality_level', 'rain_resistant']].mean()
    ponto_dia = np.array([dia_info['ideal_temp'], dia_info['formality_level'], dia_info['rain_resistant']])

    menor_distancia = float('inf')
    cluster_escolhido = None

    for cluster_id, row in medias.iterrows():
        ponto_cluster = row.values
        distancia = np.linalg.norm(ponto_dia - ponto_cluster)

        if distancia < menor_distancia:
            menor_distancia = distancia
            cluster_escolhido = cluster_id

    return cluster_escolhido, medias

def selecionar_melhor_peca(candidatos, dia_info):
    """
    Entre as peças candidatas, escolhe a que tem menor distância ponderada:
    considera diferença de temperatura e formalidade.
    """
    if candidatos.empty:
        return None

    def calcular_score(row):
        diff_temp = abs(row['ideal_temp'] - dia_info['ideal_temp'])
        diff_form = abs(row['formality_level'] - dia_info['formality_level'])
        # Peso 2 para formalidade respeitar a ocasião
        return diff_temp + (diff_form * 2)

    candidatos = candidatos.copy()
    candidatos['score'] = candidatos.apply(calcular_score, axis=1)
    melhor = candidatos.sort_values('score').iloc[0]
    return melhor.to_dict()

def recomendar_look_completo(temperatura, chovendo, ocasiao, formalidade=None, limiar_temp=8.0):
    """
    Algoritmo principal de recomendação:
    1. Define contexto e descobre o cluster
    2. Busca top, bottom, footwear (no cluster ou via fallback)
    3. Adiciona outerwear se temperatura < 18°C
    """
    df, _, _ = carregar_dados_e_treinar()
    dia = contexto_do_dia(temperatura, chovendo, ocasiao, formalidade)
    cluster_id, _ = descobrir_cluster_do_dia(dia, df)

    pecas_do_cluster = df[df['cluster'] == cluster_id]
    look = {}
    avisos = []

    categorias_obrigatorias = ['top', 'bottom', 'footwear']

    for cat in categorias_obrigatorias:
        # 1. Tentar achar no cluster
        candidatos = pecas_do_cluster[pecas_do_cluster['category'] == cat]

        # Se for calçado e estiver chovendo, filtrar preferencialmente impermeável
        if cat == 'footwear' and dia['rain_resistant'] == 1:
            impermeaveis = candidatos[candidatos['rain_resistant'] == 1]
            if not impermeaveis.empty:
                candidatos = impermeaveis

        peca_escolhida = selecionar_melhor_peca(candidatos, dia)

        # 2. Se não achou no cluster, usar o Fallback no guarda-roupa inteiro
        if peca_escolhida is None:
            candidatos_geral = df[df['category'] == cat]

            if cat == 'footwear' and dia['rain_resistant'] == 1:
                impermeaveis_geral = candidatos_geral[candidatos_geral['rain_resistant'] == 1]
                if not impermeaveis_geral.empty:
                    candidatos_geral = impermeaveis_geral

            peca_fallback = selecionar_melhor_peca(candidatos_geral, dia)

            if peca_fallback is not None:
                diff_temp = abs(peca_fallback['ideal_temp'] - dia['ideal_temp'])
                if diff_temp <= limiar_temp:
                    peca_escolhida = peca_fallback
                    avisos.append(f"A peça '{peca_fallback['name']}' foi trazida de outro grupo (diferença de {diff_temp:.1f}°C).")
                else:
                    avisos.append(f"Aviso: Você não tem uma peça de {cat} ideal para {temperatura}°C (limiar de {limiar_temp}°C excedido).")

        look[cat] = peca_escolhida

    # 3. Regra de Camadas: Casaco obrigatório se temperatura < 18°C
    if dia['ideal_temp'] < 18:
        candidatos_casaco = pecas_do_cluster[pecas_do_cluster['category'] == 'outerwear']
        if candidatos_casaco.empty:
            candidatos_casaco = df[df['category'] == 'outerwear']
        
        casaco = selecionar_melhor_peca(candidatos_casaco, dia)
        look['outerwear'] = casaco
    else:
        look['outerwear'] = None

    return {
        "contexto": dia,
        "cluster_id": int(cluster_id),
        "look": look,
        "avisos": avisos
    }

def trocar_peca(categoria, peca_atual_id, temperatura, ocasiao, formalidade=None):
    """
    Substitui uma peça do look por outra alternativa válida do guarda-roupa.
    Exclui a peça atual e busca a melhor opção seguinte.
    """
    df, _, _ = carregar_dados_e_treinar()
    dia = contexto_do_dia(temperatura, chovendo=False, ocasiao=ocasiao, formalidade=formalidade)

    # Filtrar roupas da mesma categoria, excluindo a peça atual
    candidatos = df[(df['category'] == categoria) & (df['id'] != peca_atual_id)]

    if candidatos.empty:
        return {
            "sucesso": False,
            "mensagem": f"Você não tem outra peça de {categoria} cadastrada no guarda-roupa."
        }

    # Calcula a pontuação para cada candidato alternativo
    def calcular_score(row):
        diff_temp = abs(row['ideal_temp'] - dia['ideal_temp'])
        diff_form = abs(row['formality_level'] - dia['formality_level'])
        return diff_temp + (diff_form * 2)

    candidatos = candidatos.copy()
    candidatos['score'] = candidatos.apply(calcular_score, axis=1)
    
    # Ordena do mais compatível para o menos
    candidatos_ordenados = candidatos.sort_values('score')
    nova_peca = candidatos_ordenados.iloc[0].to_dict()

    return {
        "sucesso": True,
        "nova_peca": nova_peca,
        "outras_opcoes": candidatos_ordenados[['id', 'name', 'color']].to_dict(orient='records'),
        "mensagem": f"Substituído com sucesso por '{nova_peca['name']}'."
    }


# --- TESTE PRÁTICO DO LOOK COMPLETO E TROCA ---
if __name__ == "__main__":
    print("✨ Testando Gerador de Look Completo...\n")

    # Teste 1: Frio, sem chuva, Trabalho
    resultado1 = recomendar_look_completo(temperatura=15, chovendo=False, ocasiao="trabalho")
    print("==================================================")
    print(f"👔 Look 1: 15°C, Trabalho | Cluster: {resultado1['cluster_id']}")
    for cat, peca in resultado1['look'].items():
        nome = peca['name'] if peca else "Nenhum"
        print(f"  - {cat.upper()}: {nome}")
    if resultado1['avisos']:
        print("  📢 Avisos:", resultado1['avisos'])

    # Teste 2: Calor, Casual
    resultado2 = recomendar_look_completo(temperatura=28, chovendo=False, ocasiao="casual")
    print("\n==================================================")
    print(f"☀️ Look 2: 28°C, Casual | Cluster: {resultado2['cluster_id']}")
    for cat, peca in resultado2['look'].items():
        nome = peca['name'] if peca else "Nenhum"
        print(f"  - {cat.upper()}: {nome}")
    if resultado2['avisos']:
        print("  📢 Avisos:", resultado2['avisos'])

    # Teste 3: Chuva e Frio Intenso (Fallback de 8°C)
    resultado3 = recomendar_look_completo(temperatura=10, chovendo=True, ocasiao="trabalho")
    print("\n==================================================")
    print(f"🌧️ Look 3: 10°C, Chuva, Trabalho | Cluster: {resultado3['cluster_id']}")
    for cat, peca in resultado3['look'].items():
        nome = peca['name'] if peca else "Nenhum"
        print(f"  - {cat.upper()}: {nome}")
    if resultado3['avisos']:
        print("  📢 Avisos:", resultado3['avisos'])

    # Teste 4: Troca de Peça (Substituir a Calça Alfaiataria id=4)
    print("\n==================================================")
    print("🔄 Testando Troca de Peça: Trocar a Calça Alfaiataria (id=4)")
    troca = trocar_peca(categoria='bottom', peca_atual_id=4, temperatura=15, ocasiao='trabalho')
    print("Resultado da troca:", troca['mensagem'])
    print("Nova peça escolhida:", troca['nova_peca']['name'], f"({troca['nova_peca']['color']})")