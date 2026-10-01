"""Create a demo tenant and first admin; run with `python -m app.seed`."""
import asyncio
from sqlalchemy import select
from app.core.config import settings
from app.db import SessionLocal
from app.models import Category, Product, Tenant, User
from app.services import password_hash


async def seed() -> None:
    async with SessionLocal() as db:
        tenant = await db.scalar(select(Tenant).where(Tenant.slug == settings.default_tenant_slug))
        if tenant is None:
            tenant = Tenant(name="FastLanches Demo", slug=settings.default_tenant_slug)
            db.add(tenant)
            await db.flush()
        admin = await db.scalar(select(User).where(User.tenant_id == tenant.id, User.email == settings.bootstrap_admin_email))
        if admin is None:
            db.add(User(tenant_id=tenant.id, email=settings.bootstrap_admin_email,
                        password_hash=password_hash.hash(settings.bootstrap_admin_password), role="admin"))
        categories = [
            ("combos", "Combos", "combo", 1), ("burgers", "Burgers", "burger", 2),
            ("sides", "Acompanhamentos", "fries", 3), ("drinks", "Bebidas", "drink", 4),
            ("desserts", "Sobremesas", "dessert", 5),
        ]
        for cid, name, icon, order in categories:
            if not await db.scalar(select(Category).where(Category.id == cid, Category.tenant_id == tenant.id)):
                db.add(Category(id=cid, tenant_id=tenant.id, name=name, icon=icon, sort_order=order))
        rows = [
            ("c1","combos","Combo Clássico",39.9,"X-Burger + Batata média + Refrigerante lata.","photo-1568901346375-23c9450c58cd",[],[],["gluten","milk","egg"],True),
            ("c2","combos","Combo Bacon",44.9,"X-Bacon + Batata média + Refrigerante lata.","photo-1553979459-d2229ba7433a",[],[],["gluten","milk"],True),
            ("c3","combos","Combo Família",59.9,"4 burgers + 2 batatas grandes + 4 refrigerantes.","photo-1571091718767-18b5b1457add",[],[],["gluten","milk","egg"],True),
            ("c4","combos","Combo Veggie",37.9,"Burger de grão-de-bico + Batata + Suco natural.","photo-1520072959219-c595dc870360",[],[],["gluten","soy","sesame"],True),
            ("b1","burgers","X-Burger Especial",28,"Pão brioche, hambúrguer 180g, queijo cheddar, alface, tomate e molho da casa.","photo-1568901346375-23c9450c58cd",["Cebola","Tomate","Alface","Picles"],[("a1","Bacon extra",5),("a2","Queijo cheddar extra",4),("a3","Ovo",3)],["gluten","milk","egg"],True),
            ("b2","burgers","X-Bacon",32,"Hambúrguer 180g, muito bacon crocante e cheddar derretido.","photo-1553979459-d2229ba7433a",["Cebola","Alface"],[("a1","Bacon extra",5)],["gluten","milk"],True),
            ("b3","burgers","X-Salada",30,"Hambúrguer 180g com alface, tomate e maionese verde.","photo-1562967914-608f82629710",["Cebola","Tomate","Alface"],[],["gluten","milk","egg"],True),
            ("b4","burgers","X-Tudo",38,"Hambúrguer, bacon, ovo, presunto, queijo e salada.","photo-1550547660-d9450f859349",["Cebola","Tomate","Alface","Picles"],[("a3","Ovo",3)],["gluten","milk","egg"],True),
            ("b5","burgers","Smash Duplo",34,"Dois smash burgers 90g com cheddar duplo.","photo-1607013251379-e6eecfffe234",["Cebola"],[],["gluten","milk"],True),
            ("b6","burgers","Veggie Burger",26,"Burger de grão-de-bico com molho de ervas.","photo-1520072959219-c595dc870360",["Tomate","Alface"],[],["gluten","soy","sesame"],True),
            ("b7","burgers","Triple Cheddar",42,"Três blends 100g com muito cheddar derretido.","photo-1561758033-d89a9ad46330",[],[],["gluten","milk"],False),
            ("s1","sides","Batata Pequena",12,"Porção individual de 150g.","photo-1630384060421-cb20d0e0649d",[],[],[],True),
            ("s2","sides","Batata Média",18,"Porção para dividir. 250g.","photo-1573080496219-bb080dd4f877",[],[],[],True),
            ("s3","sides","Batata Grande",26,"Porção família. 400g.","photo-1518013431117-eb1465fa5752",[],[],[],True),
            ("s4","sides","Onion Rings",22,"Anéis de cebola empanados, 8 unidades.","photo-1639024471283-03518883512d",[],[],["gluten"],True),
            ("s5","sides","Nuggets (10 un.)",24,"Nuggets de frango com molho barbecue.","photo-1562967916-eb82221dfb92",[],[],["gluten","egg"],True),
            ("d1","drinks","Coca-Cola Lata",7,"Refrigerante 350ml gelado.","photo-1554866585-cd94860890b7",[],[],[],True),
            ("d2","drinks","Guaraná Antarctica",7,"Lata 350ml gelada.","photo-1622483767028-3f66f32aef97",[],[],[],True),
            ("d3","drinks","Suco de Laranja",12,"Suco natural 500ml.","photo-1600271886742-f049cd451bba",[],[],[],True),
            ("d4","drinks","Milkshake Chocolate",18,"Milkshake cremoso 400ml.","photo-1572490122747-3968b75cc699",[],[],["milk"],True),
            ("d5","drinks","Milkshake Morango",18,"Milkshake cremoso 400ml.","photo-1553787499-6f9133860278",[],[],["milk"],True),
            ("d6","drinks","Água Mineral",5,"Garrafa 500ml.","photo-1523362628745-0c100150b504",[],[],[],True),
            ("de1","desserts","Sundae",12,"Sorvete de baunilha com calda de chocolate.","photo-1563805042-7684c019e1cb",[],[],["milk"],True),
            ("de2","desserts","Pudim",9,"Pudim de leite condensado caseiro.","photo-1551024506-0bccd828d307",[],[],["milk","egg"],True),
            ("de3","desserts","Açaí 300ml",15,"Açaí com granola e banana.","photo-1590080875515-8a3a8dc5735e",[],[],["nuts","soy"],True),
            ("de4","desserts","Brownie",14,"Brownie quente com sorvete de creme.","photo-1607920592519-bab2a80efd55",[],[],["gluten","milk","egg","nuts"],True),
        ]
        for pid, cid, name, price, desc, image, ingredients, additions, allergens, available in rows:
            if not await db.scalar(select(Product).where(Product.id == pid, Product.tenant_id == tenant.id)):
                db.add(Product(id=pid, tenant_id=tenant.id, category_id=cid, name=name, price=price,
                    description=desc, image_url=f"https://images.unsplash.com/{image}?w=800&q=80&auto=format&fit=crop",
                    ingredients=ingredients, additions=[{"id": aid, "name": aname, "price": aprice} for aid, aname, aprice in additions],
                    allergens=allergens, available=available))
        await db.commit()
    print(f"Tenant '{settings.default_tenant_slug}', admin e {len(rows)} produtos de demonstração prontos.")


if __name__ == "__main__":
    asyncio.run(seed())
