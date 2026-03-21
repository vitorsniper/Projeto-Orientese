/**
 * Configuração centralizada da API
 * Use variáveis de ambiente ou defina manualmente aqui
 */

// Detectar ambiente
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

// Base URL da API
const API_BASE_URL = isProduction 
    ? 'https://api-orientese-xyz.onrender.com'
    : 'http://localhost:8080';

// Exportar para uso global
window.CONFIG = {
    API_BASE_URL: API_BASE_URL,
    TIMEOUT: 30000, // 30 segundos
    isProduction: isProduction
};

console.log(`🚀 Ambiente: ${isProduction ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'}`);
console.log(`📡 API Base URL: ${API_BASE_URL}`);

