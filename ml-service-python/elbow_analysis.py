import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sqlalchemy import create_engine
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.cluster import KMeans

# 1. Conexão com o Banco de Dados MySQL via SQLAlchemy
# Formato: mysql+pymysql://usuario:senha@localhost:3306/nome_do_banco
# (Se seu MySQL tiver senha no root, altere de 'root:@' para 'root:SUASENHA@')
DB_URL = "mysql+pymysql://outfit_inteligente:outfit123@localhost:3306/outfit_db"

print("🔄 Conectando ao MySQL e buscando peças de roupas...")
engine = create_engine(DB_URL)

query = "SELECT category, color, ideal_temp, formality_level, rain_resistant FROM wardrobe_items;"
df = pd.read_sql(query, engine)

print(f"✅ {len(df)} peças de roupa encontradas no banco!")

# 2. Pré-processamento Exigido pelo Professor:
# - OneHotEncoder para texto (category, color)
# - StandardScaler para números (ideal_temp, formality_level, rain_resistant)
preprocessor = ColumnTransformer(
    transformers=[
        ('num', StandardScaler(), ['ideal_temp', 'formality_level', 'rain_resistant']),
        ('cat', OneHotEncoder(), ['category', 'color'])
    ]
)

# Transformar os dados em uma matriz de recursos numéricos padronizados
X_processed = preprocessor.fit_transform(df)

# 3. Cálculo da Inércia para diferentes valores de K (de 1 a 8)
inertias = []
K_range = range(1, 9)

for k in K_range:
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    kmeans.fit(X_processed)
    inertias.append(kmeans.inertia_)

# 4. Gerar e Salvar o Gráfico do Método do Cotovelo
plt.figure(figsize=(8, 5))
plt.plot(K_range, inertias, 'bo-', linewidth=2, markersize=8)
plt.title('Método do Cotovelo (Elbow Method) - Seleção de K no Outfit Inteligente')
plt.xlabel('Número de Clusters (K)')
plt.ylabel('Inércia (Soma dos Erros Quadráticos)')
plt.grid(True)

# Salvar a imagem para usar nos slides da faculdade
output_image = 'grafico_cotovelo.png'
plt.savefig(output_image)
print(f"📊 Gráfico salvo com sucesso como '{output_image}'!")