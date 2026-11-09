const API_BASE = "http://localhost:3001/api";

async function request(endpoint, options = {}) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: {"Content-Type": "application/json"},
        ...options,
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.erro || "Erro na comunicação com o servidor.");
    }
    return data;
}

export const api = {
    // Status do MySQL + NOde + Python ML 
    getHealth: () => request("/health"),

    // Clima em tempo real por cidade 

getWeather: (city) => request(`/weather?city=${encodeURIComponent(city)}`),

// Inteligência Artificial K-Means (via Node -> Python)
recommendOutfit: (payload) => 
    request("/recommend", {method: "POST", body: JSON.stringify(payload) }),


swapItem: (payload) => 
    request("/swap", {method: "POST", body: JSON.stringify(payload) }),

// Guarda-Roupa (Node + Prisma -> MySQL)
getWardrobe: () => request("/wardrobe"), 
addWardrobeItem: (item) => request("/wardrobe", {method: "POST", body: JSON.stringify(item) }),
deleteWardrobeItem: (id) => request(`/wardrobe/${id}`, {method: "DELETE" }),

// Histórico de LOoks (Node+ Prisma -> MySQL)
getHistory: () => request("/history"),
saveHistory: (log) => request("/history", {method: "POST", body:JSON.stringify(log) }),
};