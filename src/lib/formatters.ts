/**
 * Formatadores comuns usados no sistema
 */

/**
 * Formata um valor numérico para o formato de moeda brasileira (BRL)
 * @param value Valor a ser formatado
 * @returns String no formato R$ x.xxx,xx
 */
export function formatCurrency(value: number | string): string {
  if (typeof value === 'string') {
    // Se já vier formatado como "R$ 123", retorna como está
    if (value.startsWith('R$')) return value;
    
    // Tenta converter para número
    value = parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (isNaN(value)) return "R$ 0,00";
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Formata uma data ISO para o formato brasileiro (DD/MM/YYYY)
 * @param dateStr String de data no formato ISO
 * @returns String no formato DD/MM/YYYY
 */
export function formatDateBR(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString('pt-BR');
} 