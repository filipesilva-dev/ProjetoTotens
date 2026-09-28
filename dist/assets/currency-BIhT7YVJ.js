const t=new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"});function e(r){return Number.isFinite(r)?t.format(r):"R$ 0,00"}export{e as f};
