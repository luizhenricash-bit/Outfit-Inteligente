USE outfit_db;

-- Inserir usuário de teste
INSERT INTO users (id, name, email) VALUES (1, 'Estudante Facul', 'aluno@faculdade.edu.br')
ON DUPLICATE KEY UPDATE name=name;

-- Inserir peças de roupas diversificadas para o K-Means clusterizar
INSERT INTO wardrobe_items (user_id, name, category, color, ideal_temp, formality_level, rain_resistant) VALUES
-- Roupas de Frio / Formais
(1, 'Jaqueta de Couro Preta', 'outerwear', 'preto', 12.0, 4, 1),
(1, 'Sobretudo Preto', 'outerwear', 'preto', 8.0, 5, 1),
(1, 'Camisa Social Azul Claro', 'top', 'azul', 18.0, 5, 0),
(1, 'Calça Alfaiataria Cinza', 'bottom', 'cinza', 16.0, 5, 0),
(1, 'Sapato Social Couro', 'footwear', 'preto', 18.0, 5, 0),

-- Roupas de Frio / Casual
(1, 'Moletom com Capuz Cinza', 'outerwear', 'cinza', 14.0, 2, 0),
(1, 'Calça Jeans Escura', 'bottom', 'azul', 18.0, 3, 0),
(1, 'Bota Casual', 'footwear', 'marrom', 15.0, 3, 1),

-- Roupas de Calor / Casual
(1, 'Camiseta Branca Básica', 'top', 'branco', 26.0, 1, 0),
(1, 'Bermuda Jeans', 'bottom', 'azul', 28.0, 1, 0),
(1, 'Tênis Esportivo Branco', 'footwear', 'branco', 25.0, 2, 0),
(1, 'Chinelo / Sandália', 'footwear', 'preto', 30.0, 1, 0),

-- Roupas de Calor / Moderado
(1, 'Camisa Polo Verde', 'top', 'verde', 24.0, 3, 0),
(1, 'Calça Chino Bege', 'bottom', 'bege', 22.0, 4, 0),
(1, 'Sapatênis Casual', 'footwear', 'bege', 23.0, 3, 0);