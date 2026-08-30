# AetherCode AI 2.1

Site simples de IA para programação com login, Supabase, histórico, planos e Pix.

## 1. Supabase
Abra `site/config.js` e coloque:
- `supabaseUrl`: URL do seu projeto
- `supabaseAnonKey`: chave pública anon/publishable do projeto

No SQL Editor do Supabase, execute `sql.sql`.

Em Authentication > URL Configuration, coloque a URL do site como Site URL/Redirect URL.
Para Google e Apple, habilite os respectivos Providers e configure as credenciais OAuth.

## 2. IA
No servidor, crie `.env` baseado em `server/.env.example` e coloque sua `OPENAI_API_KEY` e modelo compatível.

## 3. Rodar
Na pasta server: `npm install` e `npm start`.
O site abre em `http://localhost:3000`.

## Pix
A tela gera QR/Pix Copia e Cola para os dados definidos em `site/config.js`. A confirmação automática de pagamento exige um provedor/webhook; este pacote não finge confirmar pagamentos sozinho.
