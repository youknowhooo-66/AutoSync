/**
 * PartSearchCombobox
 *
 * A searchable combobox for selecting a part from the company catalog.
 * Uses the GET /api/inventory/parts endpoint with debounced search.
 *
 * Features:
 * - Debounced search (300ms) by name, SKU, manufacturer code, or barcode
 * - Shows on-hand quantity, reserved, and available quantities
 * - Disables selection for items with zero available stock
 * - Supports keyboard navigation (arrows, enter, escape)
 * - Accessible (ARIA attributes, focus management)
 */

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckIcon, ChevronsUpDownIcon, LoaderCircleIcon, PackageXIcon, PlusCircleIcon, SearchIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/services/api';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PartSearchItem {
  id: string;
  name: string;
  sku: string | null;
  manufacturerCode: string | null;
  barcode: string | null;
  brand: string | null;
  description: string | null;
  category: string | null;
  unit: string | null;
  onHandQuantity: string;
  reservedQuantity: string;
  availableQuantity: string;
  location: string | null;
  averageCost: string | null;
  /** Catalog list price (preço de venda). Use as primary price reference. */
  salePrice: string | null;
  canSelectFromStock: boolean;
  active: boolean;
}

interface SearchPartsResponse {
  success: boolean;
  data: {
    items: PartSearchItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface PartSearchComboboxProps {
  /** Currently selected part ID */
  value?: string;
  /** Called with the selected PartSearchItem when the user selects a part */
  onSelect: (part: PartSearchItem) => void;
  /** Optional branchId to scope stock quantities */
  branchId?: string;
  /** Whether to show a "Register new part" shortcut (requires catalog.part.write capability) */
  showCreateLink?: boolean;
  /** Called when user clicks the "Register new part" link */
  onCreatePart?: () => void;
  /** Extra class for the trigger button */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Placeholder when nothing is selected */
  placeholder?: string;
}

// ── Hook: debounced search ─────────────────────────────────────────────────────

function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

// ── Helper: format decimal quantity for display ───────────────────────────────

function formatQty(qty: string, unit?: string | null): string {
  const n = parseFloat(qty);
  if (isNaN(n)) return qty;
  // Remove trailing zeros for whole units, keep 3 decimal places for fractional
  const formatted = Number.isInteger(n) ? n.toString() : n.toFixed(3).replace(/\.?0+$/, '');
  return unit ? `${formatted} ${unit}` : formatted;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PartSearchCombobox({
  value,
  onSelect,
  branchId,
  showCreateLink = false,
  onCreatePart,
  className,
  disabled = false,
  placeholder = 'Buscar peça por nome, SKU ou código...',
}: PartSearchComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const [selectedPart, setSelectedPart] = React.useState<PartSearchItem | null>(null);

  const debouncedQuery = useDebounce(inputValue, 300);

  // ── Fetch parts from API ───────────────────────────────────────────────────
  const queryParams = React.useMemo(() => {
    const params: Record<string, string> = {
      pageSize: '15',
      availability: 'ALL',
      sortBy: debouncedQuery ? 'RELEVANCE' : 'NAME',
    };
    if (debouncedQuery && debouncedQuery.length >= 2) {
      params['q'] = debouncedQuery;
    }
    if (branchId) {
      params['branchId'] = branchId;
    }
    return params;
  }, [debouncedQuery, branchId]);

  const { data, isLoading, isError } = useQuery<SearchPartsResponse>({
    queryKey: ['parts-search', queryParams],
    queryFn: () =>
      api.get('/inventory/parts', { params: queryParams }).then((r) => r.data),
    staleTime: 30_000,
    enabled: open,
  });

  const items = data?.data?.items ?? [];

  // ── Sync selectedPart label from external value ─────────────────────────────
  React.useEffect(() => {
    if (!value) {
      setSelectedPart(null);
      return;
    }
    // If items include the selected part, update the display label
    const found = items.find((i) => i.id === value);
    if (found) {
      setSelectedPart(found);
    }
  }, [value, items]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  function handleSelect(item: PartSearchItem) {
    if (!item.canSelectFromStock) return;
    setSelectedPart(item);
    onSelect(item);
    setOpen(false);
    setInputValue('');
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setInputValue('');
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          id="part-search-combobox-trigger"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={selectedPart ? `Peça selecionada: ${selectedPart.name}` : placeholder}
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal',
            !selectedPart && 'text-muted-foreground',
            className,
          )}
        >
          <span className="truncate">
            {selectedPart ? (
              <>
                {selectedPart.name}
                {selectedPart.sku && (
                  <span className="ml-2 text-xs text-muted-foreground">({selectedPart.sku})</span>
                )}
              </>
            ) : (
              placeholder
            )}
          </span>
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[520px] p-0"
        align="start"
        sideOffset={4}
      >
        <Command shouldFilter={false}>
          {/* Custom input with search icon */}
          <div className="flex items-center border-b px-3">
            <SearchIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              id="part-search-combobox-input"
              placeholder={placeholder}
              value={inputValue}
              onValueChange={setInputValue}
              className="h-11 border-none shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/60"
            />
            {isLoading && (
              <LoaderCircleIcon className="ml-2 h-4 w-4 animate-spin shrink-0 text-muted-foreground" />
            )}
          </div>

          <CommandList className="max-h-[360px]">
            {/* Error state */}
            {isError && (
              <div className="py-6 text-center text-sm text-destructive">
                Erro ao buscar peças. Tente novamente.
              </div>
            )}

            {/* Loading skeleton */}
            {isLoading && !items.length && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Buscando peças...
              </div>
            )}

            {/* Empty state */}
            {!isLoading && !isError && items.length === 0 && (
              <CommandEmpty>
                <div className="flex flex-col items-center gap-2 py-6">
                  <PackageXIcon className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    {debouncedQuery
                      ? `Nenhuma peça encontrada para "${debouncedQuery}"`
                      : 'Nenhuma peça cadastrada'}
                  </p>
                  {showCreateLink && onCreatePart && (
                    <Button
                      id="part-search-create-link"
                      variant="ghost"
                      size="sm"
                      className="mt-1 gap-1.5 text-xs"
                      onClick={() => {
                        setOpen(false);
                        onCreatePart();
                      }}
                    >
                      <PlusCircleIcon className="h-3.5 w-3.5" />
                      Cadastrar nova peça
                    </Button>
                  )}
                </div>
              </CommandEmpty>
            )}

            {/* Results */}
            {!isError && items.length > 0 && (
              <CommandGroup>
                {items.map((item) => {
                  const isSelected = value === item.id;
                  const isDisabled = !item.canSelectFromStock;
                  const available = parseFloat(item.availableQuantity);

                  return (
                    <CommandItem
                      key={item.id}
                      value={item.id}
                      disabled={isDisabled}
                      onSelect={() => handleSelect(item)}
                      className={cn(
                        'flex flex-col items-start gap-0.5 py-2.5 px-3 cursor-pointer',
                        isDisabled && 'opacity-60 cursor-not-allowed',
                      )}
                      aria-disabled={isDisabled}
                      aria-label={
                        isDisabled
                          ? `${item.name} — sem saldo disponível`
                          : `${item.name} — ${formatQty(item.availableQuantity, item.unit)} disponíveis`
                      }
                    >
                      {/* Row 1: Name + selected check + out-of-stock badge */}
                      <div className="flex w-full items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <CheckIcon
                            className={cn(
                              'h-3.5 w-3.5 shrink-0',
                              isSelected ? 'opacity-100 text-primary' : 'opacity-0',
                            )}
                          />
                          <span className="truncate text-sm font-medium leading-tight">
                            {item.name}
                          </span>
                        </div>

                        {isDisabled ? (
                          <Badge
                            variant="outline"
                            className="shrink-0 text-[10px] px-1.5 py-0 text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-400"
                            title="Compra de fornecedor disponível em breve (Etapa 3)"
                          >
                            Sem saldo
                          </Badge>
                        ) : (
                          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                            {formatQty(item.availableQuantity, item.unit)} disp.
                          </span>
                        )}
                      </div>

                      {/* Row 2: SKU / brand / location metadata */}
                      <div className="ml-5.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                        {item.sku && <span>SKU: {item.sku}</span>}
                        {item.brand && <span>{item.brand}</span>}
                        {item.manufacturerCode && <span>Fab: {item.manufacturerCode}</span>}
                        {item.location && <span>📍 {item.location}</span>}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {/* Footer shortcut to create */}
            {showCreateLink && onCreatePart && items.length > 0 && (
              <div className="border-t p-1">
                <Button
                  id="part-search-create-link-footer"
                  variant="ghost"
                  size="sm"
                  className="w-full gap-1.5 justify-start text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setOpen(false);
                    onCreatePart();
                  }}
                >
                  <PlusCircleIcon className="h-3.5 w-3.5" />
                  Não encontrou? Cadastrar nova peça
                </Button>
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
