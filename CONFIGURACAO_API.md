# 🔧 Configuração da API - Guia Completo

## ✅ O que foi feito

### 1. **Arquivo de Configuração Centralizada** (`js/config.js`)
- ✓ Criado arquivo que detecta automaticamente o ambiente (produção/desenvolvimento)
- ✓ Define a base URL dinamicamente baseado no host
- ✓ Disponibiliza `window.CONFIG.API_BASE_URL` globalmente

```javascript
// Ambiente de desenvolvimento (localhost)
const API_BASE_URL = 'http://localhost:8080'

// Ambiente de produção (render.com)
const API_BASE_URL = 'https://api-orientese-xyz.onrender.com'
```

### 2. **Refatoração do app.js**
- ✓ Substituídas **11 URLs hardcoded** por `${window.CONFIG.API_BASE_URL}`
- ✓ Melhorado tratamento de erros na função `efetuarLogin`
- ✓ Agora captura mensagens de erro do servidor

### 3. **Atualização dos arquivos HTML**
- ✓ `login.html` - Adicionado `<script src="js/config.js"></script>` antes de `app.js`
- ✓ `index.html` - Adicionado `config.js`
- ✓ `roteiro.html` - Adicionado `config.js`
- ✓ `novo-roteiro.html` - Adicionado `config.js`

---

## 🚀 Próximas Ações Necessárias

### 1️⃣ **Verificar se a aplicação está deployada no Render**

```bash
# Acesse o dashboard do Render
https://dashboard.render.com/

# Verifique:
- ✓ Se o serviço está com status "Live"
- ✓ Se há erros nos logs
- ✓ Se a porta está correta (geralmente 8080)
```

### 2️⃣ **Verificar Variáveis de Ambiente no Render**

Seu arquivo `application.properties` contém credenciais sensíveis. Configure-as como **environment variables** no Render:

```properties
DATASOURCE_URL=jdbc:oracle:thin:@koxavufkzcf93mf1_low?TNS_ADMIN=./src/main/resources/wallet
DATASOURCE_USERNAME=ADMIN
DATASOURCE_PASSWORD=Chut&m&#10000
JWT_SECRET=Chut&m&#123
```

**Para adicionar no Render:**
1. Vá para **Environment** no seu serviço
2. Adicione cada variável
3. Clique em **Save Changes**

### 3️⃣ **Atualizar application.properties para usar variáveis de ambiente**

```properties
spring.datasource.url=${DATASOURCE_URL}
spring.datasource.username=${DATASOURCE_USERNAME}
spring.datasource.password=${DATASOURCE_PASSWORD}
api.security.token.secret=${JWT_SECRET}
```

### 4️⃣ **Fazer Deploy das Mudanças**

```bash
# Committar as mudanças
git add -A
git commit -m "Refactor: Centralizar configuração da API e melhorar tratamento de erros"

# Fazer push
git push origin main

# O Render detectará automaticamente o novo push e fará deploy
```

### 5️⃣ **Testar o Login**

1. Acesse: `https://api-orientese-xyz.onrender.com/login.html` (ou seu domínio custom)
2. Faça login com as credenciais
3. Verifique o console do navegador (`F12` → Console) para:
   - ✓ Mensagem `🚀 Ambiente: PRODUÇÃO`
   - ✓ `📡 API Base URL: https://api-orientese-xyz.onrender.com`

### 6️⃣ **Testar o Login Localmente (antes de fazer push)**

```bash
# Terminal 1: Iniciar a aplicação Spring Boot
mvn spring-boot:run

# Terminal 2: Abrir em navegador
http://localhost:8080/login.html

# Verifique o console do navegador:
# Deve mostrar:
# 🚀 Ambiente: DESENVOLVIMENTO
# 📡 API Base URL: http://localhost:8080
```

---

## 🔍 Troubleshooting

### Problema: "Error: failed to push some refs"

**Solução:**
```bash
git pull origin main --rebase
git push origin main
```

### Problema: "Erro de conexão com o servidor"

**Verificar:**
1. Se a aplicação está rodando no Render (status "Live")
2. Se o banco de dados Oracle está acessível
3. Se as variáveis de ambiente estão configuradas corretamente
4. Verificar logs do Render: **Logs** → Ver erros

### Problema: "404 Not Found" ao acessar a API

**Causas:**
1. Aplicação não está deployada
2. URL base está errada
3. Endpoint não existe no backend

**Verificar:**
```bash
# Testar se a API está respondendo
curl -I https://api-orientese-xyz.onrender.com/

# Testar o endpoint de login
curl -X POST https://api-orientese-xyz.onrender.com/api/login \
  -H "Content-Type: application/json" \
  -d '{"login":"admin","senha":"senha"}'
```

---

## 📋 Checklist Final

- [ ] Arquivo `config.js` foi criado
- [ ] Todos os arquivos HTML foram atualizados com `<script src="js/config.js"></script>`
- [ ] Todas as URLs hardcoded foram substituídas por `${window.CONFIG.API_BASE_URL}`
- [ ] Teste local com `http://localhost:8080/login.html` funciona
- [ ] Variáveis de ambiente foram configuradas no Render
- [ ] Código foi commitado e feito push
- [ ] Render fez deploy automático
- [ ] Login funciona em `https://api-orientese-xyz.onrender.com/login.html`

---

## 💡 Dicas Importantes

1. **NUNCA** committe credenciais em arquivo - sempre use variáveis de ambiente
2. **Cache do navegador** pode causar problemas - use `Ctrl+Shift+Delete` para limpar
3. **CORS** já está configurado no `WebConfig.java` - aceita requisições de qualquer origem
4. **Token JWT** é armazenado em `sessionStorage` - expira quando a aba é fechada

---

## 📞 Contato para Suporte

Se o deploy ainda não funcionar após seguir esses passos:

1. Verifique os **logs do Render**: Dashboard → Logs
2. Verifique se o **banco de dados Oracle** está acessível
3. Procure por mensagens de erro específicas no console do navegador
4. Teste manualmente a API com `curl` ou Postman


