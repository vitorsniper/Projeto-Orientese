# 🔧 Instruções de Deploy - Render.com

## 1️⃣ Preparar o Repositório Local

```powershell
# Entrar no diretório do projeto
cd C:\Users\bai_f\IdeaProjects\Projeto-Orientese

# Verificar status do git
git status

# Adicionar todos os arquivos modificados
git add -A

# Verificar o que será commitado
git status
```

## 2️⃣ Fazer o Commit

```powershell
git commit -m "Refactor: Centralizar configuração da API e melhorar tratamento de erros

- Criar config.js com detecção automática de ambiente
- Substituir 11 URLs hardcoded por variável centralizada
- Melhorar tratamento de erros nas requisições
- Adicionar suporte para múltiplos ambientes (dev/prod)
- Criar guia de troubleshooting"
```

## 3️⃣ Fazer o Push para o GitHub

```powershell
# Fazer push para a branch principal
git push origin main

# Se der erro "rejected", execute:
git pull origin main --rebase
git push origin main
```

## 4️⃣ Verificar o Deploy no Render

1. Acesse: https://dashboard.render.com
2. Clique no seu serviço "api-orientese-xyz"
3. Verifique:
   - ✓ Status mudou para "Deploying..."
   - ✓ Depois de ~3-5 minutos, status muda para "Live"
   - ✓ Verifique os logs para erros

## 5️⃣ Testar a Aplicação

### No Render (Produção)
```
https://api-orientese-xyz.onrender.com/teste-config.html
```

Você deve ver:
- ✅ `CONFIG encontrado`
- ✅ `Ambiente: PRODUÇÃO`
- ✅ `API Base URL: https://api-orientese-xyz.onrender.com`

### Local (Desenvolvimento)
```
http://localhost:8080/teste-config.html
```

Você deve ver:
- ✅ `CONFIG encontrado`
- ✅ `Ambiente: DESENVOLVIMENTO`
- ✅ `API Base URL: http://localhost:8080`

## 6️⃣ Testar o Login

### Produção
```
https://api-orientese-xyz.onrender.com/login.html
```

### Local
```
http://localhost:8080/login.html
```

**Credenciais de teste:**
- Usuário: `admin` (ou o que você tenha cadastrado)
- Senha: Verifique em `application.properties`

## ⚠️ Se Algo Deu Errado

### Erro: "404 Not Found"
- Verifique se o Render completou o deploy (status "Live")
- Aguarde 5 minutos (cold start pode ser lento)
- Verifique os logs do Render

### Erro: "Conexão Recusada"
- A aplicação pode estar parada
- Verifique em **Dashboard** → Seu serviço → **Logs**
- Procure por mensagens de erro do Spring Boot

### Erro: "Unauthorized (401)"
- Verifique as credenciais do banco de dados
- Verifique se as variáveis de ambiente estão configuradas no Render
- Verifique se o banco Oracle está acessível

### Erro de CORS
- Já está configurado em `WebConfig.java`
- Se ainda houver problema, adicione no Render:
  ```
  CORS_ALLOWED_ORIGINS=*
  ```

## 📱 Comandos Rápidos

```powershell
# Ver histórico de commits
git log --oneline -5

# Desfazer último commit (se necessário)
git reset --soft HEAD~1

# Ver mudanças não commitadas
git diff

# Limpar cache de credenciais
git config --global credential.helper wincred
```

## ✅ Checklist Final

- [ ] Todos os arquivos foram criados/modificados
- [ ] `git status` não mostra erros
- [ ] `git commit` foi executado com sucesso
- [ ] `git push` foi executado sem erros
- [ ] Render dashboard mostra "Live"
- [ ] `teste-config.html` funciona tanto local quanto na produção
- [ ] Login funciona em ambos os ambientes
- [ ] Banco de dados está respondendo

---

## 🎉 Parabéns!

Se chegou até aqui e tudo funcionou, sua aplicação está pronta para:
- ✅ Desenvolvimento local
- ✅ Deploy em produção
- ✅ Múltiplos ambientes
- ✅ Manutenção facilitada


