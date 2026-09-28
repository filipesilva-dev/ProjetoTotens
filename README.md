# FastLanches · Totem de Autoatendimento (Pix)

Frontend do sistema **FastLanches** — totem focado em pedidos rápidos com
pagamento **exclusivamente via Pix**. O front é preparado para backend
FastAPI + PostgreSQL: toda comunicação passa por `src/services/*` e hooks
tipados (`useProducts`, `useCategories`). Basta setar
`VITE_USE_MOCKS=false` no `.env` quando a API estiver no ar.
