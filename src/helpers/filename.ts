import { FormData } from '../types';

/**
 * Gera nome de arquivo padronizado para todos os exports.
 *
 * Formato: instalight_{tipo}_{uc}_{YYYY-MM-DD}.{ext}
 * Exemplo: instalight_memorial_1234567890_2026-05-29.pdf
 *
 * @param tipo - Identificador do documento (procuracao, memorial, etc.)
 * @param fd   - FormData (para extrair o código da UC)
 * @param ext  - Extensão do arquivo (pdf | svg), padrão pdf
 */
export function makeFilename(tipo: string, fd: FormData, ext: 'pdf' | 'svg' = 'pdf'): string {
  const uc   = (fd.codigoUC ?? '').replace(/[^\w]/g, '').slice(0, 20) || 'uc';
  const data = new Date().toISOString().slice(0, 10);
  return `instalight_${tipo}_${uc}_${data}.${ext}`;
}
