import React, { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronRight, PlusCircle, MinusCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface AuditDiffProps {
  before?: any;
  after?: any;
  title?: string;
}

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'secret',
  'clientsecret',
  'certificate',
  'certificatepassword',
  'privatekey',
  'apikey',
]);

function parseData(val: any): any {
  if (val === null || val === undefined) return null;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (typeof parsed === 'object' && parsed !== null) return parsed;
    } catch {
      return val;
    }
  }
  return val;
}

export function sanitizeDeep(val: any, depth = 0): any {
  if (depth > 5 || val === null || val === undefined) return val;

  if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
    return val;
  }

  if (Array.isArray(val)) {
    return val.slice(0, 50).map((item) => sanitizeDeep(item, depth + 1));
  }

  if (typeof val === 'object') {
    const sanitized: Record<string, any> = {};
    const keys = Object.keys(val).sort();

    for (const key of keys) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        sanitized[key] = '••••••••';
      } else {
        sanitized[key] = sanitizeDeep(val[key], depth + 1);
      }
    }
    return sanitized;
  }

  return String(val);
}

export const AuditDiff: React.FC<AuditDiffProps> = ({ before, after, title = 'Diferença de Dados' }) => {
  const [showTechnicalJson, setShowTechnicalJson] = useState(false);
  const [copied, setCopied] = useState(false);

  const cleanBefore = sanitizeDeep(parseData(before));
  const cleanAfter = sanitizeDeep(parseData(after));

  const handleCopySanitized = () => {
    const payload = JSON.stringify({ before: cleanBefore, after: cleanAfter }, null, 2);
    navigator.clipboard.writeText(payload);
    setCopied(true);
    toast.success('Payload de auditoria sanitizado copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const isObjectBefore = cleanBefore !== null && typeof cleanBefore === 'object' && !Array.isArray(cleanBefore);
  const isObjectAfter = cleanAfter !== null && typeof cleanAfter === 'object' && !Array.isArray(cleanAfter);

  // Compare objects
  const renderDiffContent = () => {
    if (!cleanBefore && !cleanAfter) {
      return (
        <div className="p-4 text-center text-xs text-muted-foreground italic">
          Nenhum dado estruturado disponível para este evento.
        </div>
      );
    }

    // Handle key-by-key comparison when at least one side is an object
    if (isObjectBefore || isObjectAfter) {
      const objBefore = isObjectBefore ? cleanBefore : {};
      const objAfter = isObjectAfter ? cleanAfter : {};
      const allKeys = Array.from(new Set([...Object.keys(objBefore), ...Object.keys(objAfter)])).sort();

      return (
        <div className="flex flex-col gap-2 p-3">
          {allKeys.map((key) => {
            const valBefore = objBefore[key];
            const valAfter = objAfter[key];

            const isAdded = !(key in objBefore) && key in objAfter;
            const isRemoved = key in objBefore && !(key in objAfter);
            const isChanged =
              !isAdded && !isRemoved && JSON.stringify(valBefore) !== JSON.stringify(valAfter);

            let statusBadge = null;
            let containerClass = 'border-border/40 bg-card';

            if (isAdded) {
              statusBadge = (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px]">
                  <PlusCircle className="h-3 w-3 mr-1" /> Adicionado
                </Badge>
              );
              containerClass = 'bg-emerald-500/5 border-emerald-500/20';
            } else if (isRemoved) {
              statusBadge = (
                <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20 text-[9px]">
                  <MinusCircle className="h-3 w-3 mr-1" /> Removido
                </Badge>
              );
              containerClass = 'bg-rose-500/5 border-rose-500/20';
            } else if (isChanged) {
              statusBadge = (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[9px]">
                  <RefreshCw className="h-3 w-3 mr-1" /> Alterado
                </Badge>
              );
              containerClass = 'bg-amber-500/5 border-amber-500/20';
            }

            return (
              <div key={key} className={`p-3 rounded-lg border flex flex-col gap-1.5 transition-all ${containerClass}`}>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-xs text-foreground">{key}</span>
                  {statusBadge}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-1 border-t border-border/40 font-mono">
                  {key in objBefore && (
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground font-sans">Anterior:</span>
                      <span className={`break-all ${isRemoved || isChanged ? 'text-rose-600 font-semibold' : 'text-muted-foreground'}`}>
                        {typeof valBefore === 'object' ? JSON.stringify(valBefore) : String(valBefore)}
                      </span>
                    </div>
                  )}
                  {key in objAfter && (
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground font-sans">Atualizado:</span>
                      <span className={`break-all ${isAdded || isChanged ? 'text-emerald-600 font-semibold' : 'text-muted-foreground'}`}>
                        {typeof valAfter === 'object' ? JSON.stringify(valAfter) : String(valAfter)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // Primitives or arrays
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 text-xs">
        <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/20">
          <span className="font-semibold text-rose-600 block mb-1">Valor Anterior:</span>
          <pre className="font-mono text-muted-foreground whitespace-pre-wrap break-all">
            {cleanBefore !== null ? JSON.stringify(cleanBefore, null, 2) : 'null (Nulo)'}
          </pre>
        </div>
        <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
          <span className="font-semibold text-emerald-600 block mb-1">Valor Novo:</span>
          <pre className="font-mono text-muted-foreground whitespace-pre-wrap break-all">
            {cleanAfter !== null ? JSON.stringify(cleanAfter, null, 2) : 'null (Nulo)'}
          </pre>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card overflow-hidden shadow-xs">
      <div className="flex items-center justify-between p-3.5 bg-surface-muted/60 border-b border-border/60">
        <h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
          {title}
        </h4>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopySanitized}
          className="text-xs h-7 px-2.5 gap-1.5 text-muted-foreground hover:text-foreground"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
          <span>{copied ? 'Copiado' : 'Copiar Payload'}</span>
        </Button>
      </div>

      {renderDiffContent()}

      <div className="p-3 bg-surface-muted/40 border-t border-border/60">
        <button
          onClick={() => setShowTechnicalJson(!showTechnicalJson)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
        >
          {showTechnicalJson ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          <span>Visualização Técnica (JSON Sanitizado)</span>
        </button>

        {showTechnicalJson && (
          <div className="mt-3 p-3 rounded-lg bg-surface-muted border border-border/60 font-mono text-[11px] overflow-x-auto max-h-[250px]">
            <pre className="text-foreground">{JSON.stringify({ before: cleanBefore, after: cleanAfter }, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};
