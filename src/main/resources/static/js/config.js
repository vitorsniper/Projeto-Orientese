/**
 * Configuração centralizada da API
 * Suporta múltiplas formas de configuração:
 * 1. Query parameter: ?apiUrl=https://...
 * 2. localStorage: config_api_url
 * 3. Detecção automática por hostname
 * 4. Default: Render.com
 */

const urlParams = new URLSearchParams(window.location.search);
const apiUrlFromParam = urlParams.get('apiUrl');

const apiUrlFromStorage = localStorage.getItem('config_api_url');

const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

let API_BASE_URL;

if (apiUrlFromParam) {
    API_BASE_URL = apiUrlFromParam;
    localStorage.setItem('config_api_url', apiUrlFromParam);
} else if (apiUrlFromStorage) {
    API_BASE_URL = apiUrlFromStorage;
} else if (isProduction && window.location.hostname.includes('render') || window.location.hostname.includes('onrender')) {
    API_BASE_URL = 'https://api-orientese.onrender.com';
} else if (!isProduction) {
    API_BASE_URL = 'https://api-orientese.onrender.com';
} else {
    API_BASE_URL = 'https://api-orientese.onrender.com';
}

window.CONFIG = {
    API_BASE_URL: API_BASE_URL,
    TIMEOUT: 30000,
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

