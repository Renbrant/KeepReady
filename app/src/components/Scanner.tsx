import { useEffect, useRef, useState } from 'preact/hooks';
import { Btn } from './ui';
import { isValidBarcode, normalizeBarcode } from '../lib/barcode';
import { L } from '../lib/i18n';

interface Controls {
  stop: () => void;
}

/**
 * Leitor de código de barras pela câmera. A biblioteca (zxing) só é baixada quando você abre o leitor.
 * Sem câmera, sem permissão ou sem a biblioteca, dá para digitar o código.
 */
export function Scanner({ onCode, onClose }: { onCode: (code: string) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<'starting' | 'scanning' | 'failed'>('starting');
  const [typed, setTyped] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    let controls: Controls | undefined;
    let cancelled = false;
    let done = false;
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('nocamera');
        const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([import('@zxing/browser'), import('@zxing/library')]);
        if (cancelled) return;
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.CODE_128]);
        const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 150 });
        const c = await reader.decodeFromConstraints({ video: { facingMode: { ideal: 'environment' } } }, video.current!, (result) => {
          if (!result || done) return;
          const code = normalizeBarcode(result.getText());
          if (!isValidBarcode(code)) return; // leitura torta: tenta de novo
          done = true;
          onCode(code);
        });
        if (cancelled) c.stop();
        else {
          controls = c;
          setStatus('scanning');
        }
      } catch (e) {
        if (cancelled) return;
        const name = e instanceof Error ? e.name : '';
        setMsg(
          name === 'NotAllowedError'
            ? L('A câmera foi bloqueada. Libere nas permissões do navegador ou digite o código abaixo.', 'The camera is blocked. Allow it in the browser permissions or type the code below.')
            : L('Não consegui abrir a câmera ou carregar o leitor (talvez sem internet). Digite o código abaixo.', 'Could not open the camera or load the scanner (maybe offline). Type the code below.'),
        );
        setStatus('failed');
      }
    })();
    return () => {
      cancelled = true;
      controls?.stop();
    };
  }, []);

  const typedOk = isValidBarcode(typed);
  return (
    <div class="scanner" role="dialog" aria-modal="true" aria-label={L('Ler código de barras', 'Scan barcode')}>
      <div class="scanner-box">
        <div class="row between" style={{ marginBottom: 8 }}>
          <b>{L('Ler código de barras', 'Scan barcode')}</b>
          <Btn small onClick={onClose}>
            {L('Fechar', 'Close')}
          </Btn>
        </div>
        {status !== 'failed' && (
          <div class="scanner-video">
            <video ref={video} playsInline muted autoplay />
            <div class="scanner-line" aria-hidden="true" />
          </div>
        )}
        {status === 'starting' && <div class="xs muted">{L('Abrindo a câmera...', 'Opening the camera...')}</div>}
        {status === 'scanning' && <div class="xs muted">{L('Aponte para o código de barras da embalagem.', 'Point at the barcode on the package.')}</div>}
        {msg && <div class="xs" style={{ color: 'var(--warn)' }}>{msg}</div>}
        <label class="field" style={{ marginTop: 10 }}>
          <span>{L('Ou digite o código (números)', 'Or type the code (digits)')}</span>
          <input type="text" inputMode="numeric" value={typed} onInput={(e) => setTyped((e.currentTarget as HTMLInputElement).value)} placeholder="036000291452" />
        </label>
        {typed && !typedOk && <div class="xs muted">{L('Código inválido: confira os números (8, 12, 13 ou 14 dígitos).', 'Invalid code: check the digits (8, 12, 13 or 14 digits).')}</div>}
        <div style={{ marginTop: 8 }}>
          <Btn kind="primary" disabled={!typedOk} onClick={() => onCode(normalizeBarcode(typed))}>
            {L('Usar este código', 'Use this code')}
          </Btn>
        </div>
      </div>
    </div>
  );
}
