import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PurchaseRequestStatusBadge } from '@/modules/procurement/components/PurchaseRequestStatusBadge';
import { normalizeDecimalInput, formatStatusText, formatCurrencyBRL } from '@/modules/procurement/utils/procurementUtils';

describe('Procurement Frontend Component & Utility Tests', () => {
  it('should format status text into Portuguese translations correctly', () => {
    expect(formatStatusText('REQUESTED')).toBe('Solicitada');
    expect(formatStatusText('IN_PROGRESS')).toBe('Em andamento');
    expect(formatStatusText('READY_FOR_PICKUP')).toBe('Pronta para retirada');
    expect(formatStatusText('INSTALLED')).toBe('Instalada');
    expect(formatStatusText('CANCELED')).toBe('Cancelada');
  });

  it('should render PurchaseRequestStatusBadge with correct label', () => {
    render(<PurchaseRequestStatusBadge status="READY_FOR_PICKUP" />);
    expect(screen.getByText('Pronta para retirada')).toBeInTheDocument();
  });

  it('should normalize pt-BR decimal input strings into standard decimal strings', () => {
    expect(normalizeDecimalInput('250,90')).toBe('250.90');
    expect(normalizeDecimalInput('1.250,00')).toBe('1250.00');
    expect(normalizeDecimalInput('15.50')).toBe('15.50');
  });

  it('should format BRL currency strings correctly', () => {
    expect(formatCurrencyBRL('250.90')).toMatch(/R\$\s?250,90/);
    expect(formatCurrencyBRL(null)).toBe('A definir');
  });
});
