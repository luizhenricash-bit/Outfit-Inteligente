-- Criar o banco de dados se não existir
CREATE DATABASE IF NOT EXISTS outfit_db;
USE outfit_db;

-- 1. Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de Peças do Guarda-Roupa
CREATE TABLE IF NOT EXISTS wardrobe_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    category ENUM('top', 'bottom', 'footwear', 'outerwear') NOT NULL,
    color VARCHAR(50) NOT NULL,
    ideal_temp FLOAT NOT NULL,           -- Usado pelo K-Means (Ex: 15.0°C)
    formality_level INT NOT NULL,        -- Usado pelo K-Means (1=Casual, 5=Formal)
    rain_resistant TINYINT(1) DEFAULT 0, -- Usado pelo K-Means (0=Não, 1=Sim)
    image_url VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Tabela de Histórico de Recomendações
CREATE TABLE IF NOT EXISTS outfit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    temp_celsius FLOAT NOT NULL,
    weather_condition VARCHAR(50) NOT NULL,
    occasion VARCHAR(50) NOT NULL,
    top_item_id INT NOT NULL,
    bottom_item_id INT NOT NULL,
    footwear_item_id INT NOT NULL,
    outerwear_item_id INT DEFAULT NULL,
    user_feedback ENUM('accepted', 'swapped', 'rejected') DEFAULT 'accepted',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (top_item_id) REFERENCES wardrobe_items(id),
    FOREIGN KEY (bottom_item_id) REFERENCES wardrobe_items(id),
    FOREIGN KEY (footwear_item_id) REFERENCES wardrobe_items(id),
    FOREIGN KEY (outerwear_item_id) REFERENCES wardrobe_items(id)
);