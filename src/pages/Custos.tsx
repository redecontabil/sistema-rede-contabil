import {
  DollarSign,
  TrendingDown,
  PieChart,
  ArrowDownRight,
  Wallet,
  Receipt,
  Building2,
  Users
} from 'lucide-react';
import { IndicatorCard } from '../components/Cards/IndicatorCard';
import { IndicatorGrid } from '../components/Cards/IndicatorGrid';

export function Custos() {
  const indicators = [
    {
      title: 'Custos Totais',
      value: 'R$ 45.890,00',
      icon: <DollarSign className="h-5 w-5 text-white" />,
      trend: {
        value: 8.3,
        isPositive: false,
        text: 'vs. mês anterior'
      },
      color: 'danger'
    },
    {
      title: 'Custos Fixos',
      value: 'R$ 32.450,00',
      icon: <Building2 className="h-5 w-5 text-white" />,
      trend: {
        value: 2.1,
        isPositive: true,
        text: 'redução'
      },
      color: 'primary'
    },
    {
      title: 'Custos Variáveis',
      value: 'R$ 13.440,00',
      icon: <TrendingDown className="h-5 w-5 text-white" />,
      trend: {
        value: 15.4,
        isPositive: false,
        text: 'aumento'
      },
      color: 'warning'
    },
    {
      title: 'Custo por Cliente',
      value: 'R$ 196,12',
      icon: <Users className="h-5 w-5 text-white" />,
      trend: {
        value: 3.2,
        isPositive: true,
        text: 'otimização'
      },
      color: 'success'
    },
    {
      title: 'Despesas Operacionais',
      value: 'R$ 28.670,00',
      icon: <Receipt className="h-5 w-5 text-white" />,
      trend: {
        value: 5.7,
        isPositive: false,
        text: 'vs. previsto'
      },
      color: 'info'
    },
    {
      title: 'Margem de Contribuição',
      value: '42%',
      icon: <PieChart className="h-5 w-5 text-white" />,
      trend: {
        value: 1.5,
        isPositive: true,
        text: 'vs. meta'
      },
      color: 'primary'
    }
  ];

  return (
    <div className="p-6">
      <h1 className="mb-8 text-2xl font-bold">Análise de Custos</h1>
      
      <IndicatorGrid>
        {indicators.map((indicator, index) => (
          <IndicatorCard key={index} {...indicator} />
        ))}
      </IndicatorGrid>

      {/* Outras seções da página de custos */}
    </div>
  );
} 