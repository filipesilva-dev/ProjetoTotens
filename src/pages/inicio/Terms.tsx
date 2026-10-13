import { Text } from '@/components/ui';
import './ContentPage.css';

export default function Terms() {
  return (
    <div className="cp">
      <header className="cp__head">
        <span className="cp__eyebrow">Legal</span>
        <Text as="h1" size="4xl" weight="black">Termos de Uso</Text>
        <Text size="sm" className="cp__meta">Última atualização: 12 de outubro de 2026</Text>
      </header>

      <section className="cp__section">
        <Text as="h2" size="xl" weight="black">1. Aceitação dos termos</Text>
        <Text as="p">Ao criar uma conta no FastLanches ou ao utilizar qualquer um de nossos serviços, você concorda com estes termos. Se não concordar com algum item, não utilize a plataforma.</Text>
      </section>
      <section className="cp__section">
        <Text as="h2" size="xl" weight="black">2. Descrição do serviço</Text>
        <Text as="p">O FastLanches é uma plataforma SaaS de autoatendimento para estabelecimentos alimentícios. O serviço inclui:</Text>
        <ul>
          <li>Totem de autoatendimento com pagamento via Pix</li>
          <li>Painel administrativo para gestão de cardápio e pedidos</li>
          <li>Relatórios de vendas e faturamento</li>
          <li>Suporte técnico conforme o plano contratado</li>
        </ul>
      </section>
      <section className="cp__section">
        <Text as="h2" size="xl" weight="black">3. Responsabilidades do cliente</Text>
        <Text as="p">O cliente (estabelecimento) é responsável por:</Text>
        <ul>
          <li>Manter a veracidade das informações cadastradas</li>
          <li>Garantir que possui CNPJ ativo e regularidade fiscal</li>
          <li>Cadastrar corretamente os dados de produtos, preços e alergênicos</li>
          <li>Disponibilizar infraestrutura mínima (energia, internet, totem)</li>
          <li>Cumprir as obrigações fiscais relativas à emissão de nota</li>
        </ul>
      </section>
      <section className="cp__section">
        <Text as="h2" size="xl" weight="black">4. Pagamento e cobrança</Text>
        <Text as="p">Os planos são cobrados de forma mensal ou anual, conforme escolha no momento da contratação. O período de teste gratuito é de 14 dias, sem cobrança e cancelável a qualquer momento.</Text>
        <Text as="p">Em caso de atraso superior a 30 dias, o acesso ao painel pode ser suspenso automaticamente.</Text>
      </section>
      <section className="cp__section">
        <Text as="h2" size="xl" weight="black">5. Cancelamento</Text>
        <Text as="p">Você pode cancelar sua assinatura a qualquer momento pelo painel administrativo. O acesso permanece ativo até o fim do período já pago. Não há reembolso proporcional.</Text>
      </section>
      <section className="cp__section">
        <Text as="h2" size="xl" weight="black">6. Propriedade intelectual</Text>
        <Text as="p">O software, a marca e todos os materiais do FastLanches são de nossa propriedade. Os dados de cardápio e pedidos cadastrados pelo cliente continuam sendo dele.</Text>
      </section>
      <section className="cp__section">
        <Text as="h2" size="xl" weight="black">7. Alterações nos termos</Text>
        <Text as="p">Podemos atualizar estes termos a qualquer momento. Alterações relevantes serão comunicadas por email com antecedência mínima de 15 dias.</Text>
      </section>
      <section className="cp__section">
        <Text as="h2" size="xl" weight="black">8. Foro</Text>
        <Text as="p">Estes termos são regidos pela legislação brasileira. Fica eleito o foro de Brasília — DF para resolução de qualquer controvérsia.</Text>
      </section>
    </div>
  );
}
