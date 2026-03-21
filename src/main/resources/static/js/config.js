/**
 * Configuração centralizada da API
 * Suporta múltiplas formas de configuração:
 * 1. Query parameter: ?apiUrl=https://...
 * 2. localStorage: config_api_url
 * 3. Detecção automática por hostname
 * 4. Default: Render.com
 */

// 1️⃣ Tentar obter da query string
const urlParams = new URLSearchParams(window.location.search);
const apiUrlFromParam = urlParams.get('apiUrl');

// 2️⃣ Tentar obter do localStorage
const apiUrlFromStorage = localStorage.getItem('config_api_url');

// 3️⃣ Detectar ambiente
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

// 4️⃣ Definir prioridade: Query > localStorage > Detectado > Default
let API_BASE_URL;

if (apiUrlFromParam) {
    // Se passou via query parameter
    API_BASE_URL = apiUrlFromParam;
    localStorage.setItem('config_api_url', apiUrlFromParam);
} else if (apiUrlFromStorage) {
    // Se tem no localStorage
    API_BASE_URL = apiUrlFromStorage;
} else if (isProduction && window.location.hostname.includes('render') || window.location.hostname.includes('onrender')) {
    // Se está sendo servido do Render
    API_BASE_URL = 'https://api-orientese.onrender.com';
} else if (!isProduction) {
    // Default para desenvolvimento local
    API_BASE_URL = 'https://api-orientese.onrender.com';
} else {
    // Default geral (Render)
    API_BASE_URL = 'https://api-orientese.onrender.com';
}

// Exportar para uso global
window.CONFIG = {
    API_BASE_URL: API_BASE_URL,
    TIMEOUT: 30000, // 30 segundos
    isProduction: isProduction,
    setApiUrl: function(url) {
        window.CONFIG.API_BASE_URL = url;
        localStorage.setItem('config_api_url', url);
        console.log(`✅ API URL alterada para: ${url}`);
    },
    resetApiUrl: function() {
        localStorage.removeItem('config_api_url');
        location.reload();
    }
};

console.log(`🚀 Ambiente: ${isProduction ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'}`);
console.log(`📡 API Base URL: ${API_BASE_URL}`);
console.log(`💾 Armazenado em localStorage: ${!!apiUrlFromStorage}`);

