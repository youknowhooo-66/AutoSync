export function normalizeDecimalInput(value: string): string {
  if (!value) return '0';
  const trimmed = value.trim();
  // Handles pt-BR formatted input like "1.250,90" -> "1250.90" or "250,90" -> "250.90"
  if (trimmed.includes(',')) {
    return trimmed.replace(/\./g, '').replace(',', '.');
  }
  return trimmed;
}

export function formatCurrencyBRL(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return 'A definir';
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(num)) return 'A definir';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num);
}

export function formatStatusText(status: string): string {
  switch (status) {
    case 'REQUESTED':
      return 'Solicitada';
    case 'IN_PROGRESS':
      return 'Em andamento';
    case 'READY_FOR_PICKUP':
      return 'Pronta para retirada';
    case 'INSTALLED':
      return 'Instalada';
    case 'CANCELED':
      return 'Cancelada';
    default:
      return status;
  }
}
