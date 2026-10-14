import { Text } from '@/components/ui';
import './ContentPage.css';

export default function Privacy() {
  return (
    <div className="cp">
      <header className="cp__head">
        <span className="cp__eyebrow">Legal</span>
        <Text as="h1" size="4xl" weight="black">Política de Privacidade</Text>
        <Text size="sm" className="cp__meta">Última atualização: 12 de outubro de 2026</Text>
      </header>

      <section className="cp__section">
        <Text as="h2" size="xl" weight="black">1. Quais dados coletamos</Text>
        <Text as="p">O FastLanches coleta o mínimo necessário para operar o serviço:</Text>
        <ul>
          <li><strong>Do cliente final (no totem):</strong> CPF e email são opcionais. Você pode fazer um pedido completo sem informar nenhum dos dois.</li>
          <li><strong>Do estabelecimento (cliente SaaS):</strong> nome da loja, CNPJ, nome do responsável, email e telefone.</li>
          <li><strong>Dados de uso:</strong> data e hora dos pedidos, produtos comprados, valor total.</li>
        </ul>
      </section>
      <section className="cp__section">
        <Text as="h2" size="xl" weight="black">2. Para que usamos</Text>
        <ul>
          <li>Processar seu pedido e enviá-lo para a cozinha</li>
          <li>Emitir nota fiscal quando você informar CPF</li>
          <li>Enviar o comprovante por email quando você informar email</li>
          <li>Gerar relatórios agregados para o estabelecimento</li>
          <li>Cumprir obrigações fiscais e legais</li>
        </ul>
      </section>
      <section className="cp__section">
        <Text as="h2" size="xl" weight="black">3. O que NÃO fazemos</Text>
        <ul>
          <li>Não vendemos seus dados para terceiros</li>
          <li>Não compartilhamos dados de pagamento — o processamento é feito direto pelo Mercado Pago</li>
          <li>Não mantemos dados de cartão de crédito em nossos servidores</li>
          <li>Não exigimos CPF para uma compra comum</li>
        </ul>
      </section>
      <section className="cp__section">
        <Text as="h2" size="xl" weight="black">4. Por quanto tempo guardamos</Text>
        <ul>
          <li><strong>Pedidos:</strong> 5 anos (obrigação fiscal)</li>
          <li><strong>CPF e email de nota fiscal:</strong> apenas o necessário para emissão e envio, depois descartados</li>
          <li><strong>Dados do estabelecimento:</strong> enquanto a conta estiver ativa, mais 5 anos após cancelamento</li>
        </ul>
      </section>
      <section className="cp__section">
        <Text as="h2" size="xl" weight="black">5. Seus direitos (LGPD)</Text>
        <Text as="p">Conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018), você tem direito a:</Text>
        <ul>
          <li>Confirmar se tratamos seus dados</li>
          <li>Acessar os dados que temos sobre você</li>
          <li>Corrigir dados incompletos ou desatualizados</li>
          <li>Solicitar anonimização, bloqueio ou eliminação</li>
          <li>Revogar consentimento a qualquer momento</li>
          <li>Solicitar portabilidade a outro fornecedor</li>
        </ul>
        <Text as="p">Para exercer qualquer um desses direitos, entre em contato pelo email privacidade@fastlanches.com.</Text>
      </section>
      <section className="cp__section">
        <Text as="h2" size="xl" weight="black">6. Segurança</Text>
        <Text as="p">Toda comunicação é criptografada via HTTPS. Senhas de acesso são armazenadas com hash Argon2. Dados de pagamento trafegam apenas entre o totem e o processador (Mercado Pago), nunca passando pelos nossos servidores.</Text>
      </section>
    </div>
  );
}
