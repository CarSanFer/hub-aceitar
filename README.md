# Hub Aceitar

Launcher de aplicações internas CSF Platform.

## Estrutura

```
hub-aceitar/
├── public/
│   └── index.html       ← Hub principal
├── api/
│   └── noticias.js      ← Serverless function (Google News RSS)
├── vercel.json
└── package.json
```

## Deploy no Vercel

1. Faz upload deste repositório para GitHub (ex: `CarSanFer/hub-aceitar`)
2. Entra em [vercel.com](https://vercel.com) → **Add New Project**
3. Importa o repositório `hub-aceitar`
4. Clica **Deploy** — sem configuração adicional necessária
5. O hub fica disponível em `https://hub-aceitar.vercel.app`

## Notícias

As notícias são carregadas via `/api/noticias?q=Portugal` — serverless function que
faz fetch do Google News RSS do lado do servidor, evitando bloqueios CORS.
