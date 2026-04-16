import React, { useState } from 'react';
import { X, Database, CheckCircle, AlertTriangle, Loader } from 'lucide-react';

interface MigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMigrate: (onProgress: (current: number, total: number, message: string) => void) => Promise<{ created: number; pricesAdded: number; errors: number }>;
  isDarkMode?: boolean;
}

type MigrationState = 'idle' | 'running' | 'done' | 'error';

export function MigrationModal({ isOpen, onClose, onMigrate, isDarkMode = false }: MigrationModalProps) {
  const [state, setState] = useState<MigrationState>('idle');
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('');
  const [result, setResult] = useState<{ created: number; pricesAdded: number; errors: number } | null>(null);

  if (!isOpen) return null;

  const bg = isDarkMode ? 'bg-gray-900' : 'bg-white';
  const header = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200';
  const textPrimary = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const infoBox = isDarkMode ? 'bg-blue-900/20 border-blue-800 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-700';

  const handleMigrate = async () => {
    setState('running');
    setProgress(0);
    setTotal(0);
    setCurrentMessage('Iniciando migracao...');

    try {
      const res = await onMigrate((current, tot, message) => {
        setProgress(current);
        setTotal(tot);
        setCurrentMessage(message);
      });
      setResult(res);
      setState('done');
    } catch {
      setState('error');
    }
  };

  const handleClose = () => {
    setState('idle');
    setProgress(0);
    setTotal(0);
    setCurrentMessage('');
    setResult(null);
    onClose();
  };

  const pct = total > 0 ? Math.round((progress / total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={state === 'running' ? undefined : handleClose} />
      <div className={`relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${bg}`}>
        <div className={`flex items-center justify-between p-6 border-b ${header}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-teal-900/40' : 'bg-teal-100'}`}>
              <Database className="h-5 w-5 text-teal-600" />
            </div>
            <h2 className={`text-lg font-bold ${textPrimary}`}>Migrar Dados para o Catalogo</h2>
          </div>
          {state !== 'running' && (
            <button onClick={handleClose} className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="p-6">
          {state === 'idle' && (
            <div className="space-y-4">
              <div className={`rounded-xl border p-4 text-sm ${infoBox}`}>
                <p className="font-semibold mb-1">O que sera feito:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Ler todos os itens de Purchase Orders existentes</li>
                  <li>Criar produtos no catalogo para cada descricao unica</li>
                  <li>Registrar historico de precos a partir das POs</li>
                  <li>Ler cotacoes e registrar precos por fornecedor</li>
                  <li>Duplicatas sao ignoradas automaticamente</li>
                </ul>
              </div>
              <p className={`text-sm ${textMuted}`}>
                Esse processo e seguro e nao altera os dados existentes. Pode ser executado multiplas vezes sem criar duplicatas.
              </p>
            </div>
          )}

          {state === 'running' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader className="h-5 w-5 text-blue-500 animate-spin" />
                <span className={`text-sm font-medium ${textPrimary}`}>Migrando dados...</span>
              </div>
              <div className={`w-full rounded-full h-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div
                  className="h-3 rounded-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className={textMuted}>{currentMessage}</span>
                <span className={`font-medium ${textPrimary}`}>{pct}%</span>
              </div>
              {total > 0 && (
                <p className={`text-xs ${textMuted}`}>{progress} de {total} registros</p>
              )}
            </div>
          )}

          {state === 'done' && result && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <span className={`text-base font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>Migracao concluida!</span>
              </div>
              <div className={`rounded-xl border p-4 space-y-2 ${isDarkMode ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'}`}>
                <div className="flex justify-between text-sm">
                  <span className={textMuted}>Produtos criados</span>
                  <span className={`font-bold ${textPrimary}`}>{result.created}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={textMuted}>Precos registrados</span>
                  <span className={`font-bold ${textPrimary}`}>{result.pricesAdded}</span>
                </div>
                {result.errors > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-amber-500">Erros ignorados</span>
                    <span className="font-bold text-amber-500">{result.errors}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {state === 'error' && (
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <span className={`text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>Erro durante a migracao. Tente novamente.</span>
            </div>
          )}
        </div>

        <div className={`flex justify-end gap-3 p-6 border-t ${header}`}>
          {state === 'idle' && (
            <>
              <button onClick={handleClose} className={`px-4 py-2 text-sm font-medium rounded-xl ${isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors`}>
                Cancelar
              </button>
              <button onClick={handleMigrate} className="px-4 py-2 text-sm font-medium rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition-colors">
                Iniciar Migracao
              </button>
            </>
          )}
          {(state === 'done' || state === 'error') && (
            <button onClick={handleClose} className="px-4 py-2 text-sm font-medium rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors">
              Fechar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
