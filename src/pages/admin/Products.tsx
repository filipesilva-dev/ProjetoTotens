import { useNavigate } from 'react-router-dom';
import { Button, Text } from '@/components/ui';
import { useProducts } from '@/hooks/useProducts';
import { formatBRL } from '@/utils/currency';
import './Products.css';

export default function Products() {
  const nav = useNavigate();
  const { products, loading } = useProducts();

  return (
    <div className="prod">
      <div className="prod__head">
        <div>
          <Text as="h1" size="3xl" weight="black">Cardápio</Text>
          <Text tone="muted" size="sm">{products.length} itens cadastrados</Text>
        </div>
        <Button onClick={() => nav('/admin/products/new')}>+ Novo produto</Button>
      </div>

      <div className="prod__table">
        <div className="prod__table-head">
          <span />
          <Text weight="bold" size="sm" tone="muted">PRODUTO</Text>
          <Text weight="bold" size="sm" tone="muted">CATEGORIA</Text>
          <Text weight="bold" size="sm" tone="muted">DISPONÍVEL</Text>
          <Text weight="bold" size="sm" tone="muted" style={{ textAlign: 'right' }}>PREÇO</Text>
          <span />
        </div>

        {loading ? (
          <Text tone="muted" style={{ padding: 'var(--space-5)' }}>Carregando…</Text>
        ) : (
          products.map((p) => (
            <div key={p.id} className="prod__row">
              <img src={p.imageUrl} alt="" className="prod__thumb" />
              <div className="prod__cell-name">
                <Text weight="semibold">{p.name}</Text>
                <Text tone="muted" size="xs" className="prod__desc">{p.description}</Text>
              </div>
              <Text tone="muted" size="sm">{p.categoryId}</Text>
              <span className={`prod__avail ${p.available ? 'prod__avail--on' : 'prod__avail--off'}`}>
                {p.available ? 'Sim' : 'Não'}
              </span>
              <Text weight="black" style={{ textAlign: 'right' }}>{formatBRL(p.price)}</Text>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => nav(`/admin/products/${p.id}`)}
              >
                Editar
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
