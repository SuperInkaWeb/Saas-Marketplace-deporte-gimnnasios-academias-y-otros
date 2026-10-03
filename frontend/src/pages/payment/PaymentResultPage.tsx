import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import api from '../../api/api-client';

type Result = 'loading' | 'COMPLETED' | 'FAILED' | 'PENDING' | 'REVIEW' | 'ERROR';
type Kind = 'ORDER' | 'MEMBERSHIP';

export default function PaymentResultPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [result, setResult] = useState<Result>('loading');
  const [kind, setKind] = useState<Kind>('MEMBERSHIP');

  const mpPaymentId = params.get('payment_id') || params.get('collection_id');
  const ref = params.get('ref');

  useEffect(() => {
    let cancelled = false;

    const normalize = (s: string): Result =>
      s === 'COMPLETED' || s === 'FAILED' || s === 'PENDING'
        ? s
        : s === 'NEEDS_REVIEW' || s === 'MISMATCH'
        ? 'REVIEW'
        : 'ERROR';

    const run = async () => {
      try {
        let status: string | undefined;
        let type: Kind | undefined;

        if (mpPaymentId && mpPaymentId !== 'null') {
          const { data } = await api.post('/payments/mercadopago/confirm', {
            paymentId: mpPaymentId,
          });
          status = data.status;
          type = data.type;
        }

        // Para saber si fue orden o membresía (y como respaldo si no hay payment_id)
        if (ref && (!status || !type)) {
          const { data } = await api.get(`/payments/status/${ref}`);
          status = status ?? data.status;
          type = type ?? data.type;
        }

        if (cancelled) return;
        if (!status) return setResult('ERROR');
        if (type) setKind(type);
        setResult(normalize(status));
      } catch (e) {
        console.error(e);
        if (!cancelled) setResult('ERROR');
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [mpPaymentId, ref]);

  const isOrder = kind === 'ORDER';

  const view = {
    loading: { icon: <Loader2 className="w-12 h-12 animate-spin text-slate-400" />, title: 'Verificando tu pago...', text: 'Un momento, estamos confirmando con Mercado Pago.' },
    COMPLETED: { icon: <CheckCircle2 className="w-12 h-12 text-green-500" />, title: '¡Pago exitoso!', text: isOrder ? 'Tu compra fue registrada.' : 'Tu membresía ya está activa.' },
    FAILED: { icon: <XCircle className="w-12 h-12 text-red-500" />, title: 'El pago no se completó', text: 'No se realizó ningún cobro. Puedes intentarlo de nuevo.' },
    PENDING: { icon: <Clock className="w-12 h-12 text-amber-500" />, title: 'Pago pendiente', text: isOrder ? 'Cuando se acredite, tu pedido se confirmará automáticamente.' : 'Cuando se acredite, tu membresía se activará automáticamente.' },
    REVIEW: { icon: <Clock className="w-12 h-12 text-amber-500" />, title: 'Recibimos tu pago', text: 'Estamos confirmando tu pedido. Si hay algún problema, te lo resolveremos o te reembolsaremos.' },
    ERROR: { icon: <XCircle className="w-12 h-12 text-red-500" />, title: 'No pudimos verificar el pago', text: 'Si te cobraron, contáctanos con tu comprobante.' },
  }[result];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-6">
      {view.icon}
      <h1 className="text-2xl font-bold text-white">{view.title}</h1>
      <p className="text-slate-400 max-w-md">{view.text}</p>
      {result !== 'loading' && (
        <button
          onClick={() => navigate(isOrder ? '/marketplace' : '/memberships')}
          className="mt-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold"
        >
          {isOrder ? 'Volver a la tienda' : 'Ir a mis membresías'}
        </button>
      )}
    </div>
  );
}