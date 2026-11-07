import pandas as pd
from sqlalchemy import create_engine
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.cluster import KMeans

DB_URL = DB_URL = "mysql+pymysql://outfit_inteligente:outfit123@localhost:3306/outfit_db"
engine = create_engine(DB_URL)

# Agora trazemos o "name" só para NÓS lermos o resultado.
# O K-Means não vai usar o nome (veja o ColumnTransformer abaixo).
query = "SELECT name, category, color, ideal_temp, formality_level, rain_resistant FROM wardrobe_items;"
df = pd.read_sql(query, engine)

# Mesmo pré-processamento do cotovelo.
# Colunas que não estão aqui (como "name") são descartadas automaticamente.
preprocessor = ColumnTransformer(transformers=[
    ('num', StandardScaler(), ['ideal_temp', 'formality_level', 'rain_resistant']),
    ('cat', OneHotEncoder(), ['category', 'color'])
])
X = preprocessor.fit_transform(df)

# K=3, escolhido pelo método do cotovelo
kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
df['cluster'] = kmeans.fit_predict(X)

# Mostra as peças agrupadas por cluster
for numero in sorted(df['cluster'].unique()):
    grupo = df[df['cluster'] == numero]
    print(f"\n===== CLUSTER {numero} ({len(grupo)} peças) =====")
    print(grupo[['name', 'category', 'ideal_temp', 'formality_level', 'rain_resistant']].to_string(index=False))

# Média de cada cluster: ajuda a dar um "nome" para o grupo
print("\n===== MÉDIAS POR CLUSTER =====")
print(df.groupby('cluster')[['ideal_temp', 'formality_level', 'rain_resistant']].mean().round(1))