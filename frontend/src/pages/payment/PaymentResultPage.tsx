import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import api from '../../api/api-client';

type Result = 'loading' | 'COMPLETED' | 'FAILED' | 'PENDING' | 'REVIEW' | 'ERROR';
type Kind = 'ORDER' | 'MEMBERSHIP' | 'CLASS' | 'SERVICE';

const KIND_TEXT: Record<Kind, { done: string; pending: string; button: string; to: string }> = {
  ORDER: {
    done: 'Tu compra fue registrada.',
    pending: 'Cuando se acredite, tu pedido se confirmará automáticamente.',
    button: 'Volver a la tienda',
    to: '/marketplace',
  },
  MEMBERSHIP: {
    done: 'Tu membresía ya está activa.',
    pending: 'Cuando se acredite, tu membresía se activará automáticamente.',
    button: 'Ir a mis membresías',
    to: '/memberships',
  },
  CLASS: {
    done: 'Tu reserva de clase está confirmada.',
    pending: 'Cuando se acredite, tu reserva se confirmará automáticamente.',
    button: 'Ir a mis reservas',
    to: '/classes', // AJUSTA
  },
  SERVICE: {
    done: 'Tu pago fue recibido. El profesional confirmará tu cita.',
    pending: 'Cuando se acredite, tu cita quedará registrada automáticamente.',
    button: 'Ver mis citas',
    to: '/professionals', // AJUSTA
  },
};

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

  const t = KIND_TEXT[kind];

  const view = {
    loading: { icon: <Loader2 className="w-12 h-12 animate-spin text-slate-400" />, title: 'Verificando tu pago...', text: 'Un momento, estamos confirmando con Mercado Pago.' },
    COMPLETED: { icon: <CheckCircle2 className="w-12 h-12 text-green-500" />, title: '¡Pago exitoso!', text: t.done },
    FAILED: { icon: <XCircle className="w-12 h-12 text-red-500" />, title: 'El pago no se completó', text: 'No se realizó ningún cobro. Puedes intentarlo de nuevo.' },
    PENDING: { icon: <Clock className="w-12 h-12 text-amber-500" />, title: 'Pago pendiente', text: t.pending },
    REVIEW: { icon: <Clock className="w-12 h-12 text-amber-500" />, title: 'Recibimos tu pago', text: 'Estamos confirmando tu reserva. Si hay algún problema (por ejemplo, la clase se llenó), te lo resolveremos o te reembolsaremos.' },
    ERROR: { icon: <XCircle className="w-12 h-12 text-red-500" />, title: 'No pudimos verificar el pago', text: 'Si te cobraron, contáctanos con tu comprobante.' },
  }[result];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-6">
      {view.icon}
      <h1 className="text-2xl font-bold text-white">{view.title}</h1>
      <p className="text-slate-400 max-w-md">{view.text}</p>
      {result !== 'loading' && (
        <button
          onClick={() => navigate(t.to)}
          className="mt-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold"
        >
          {t.button}
        </button>
      )}
    </div>
  );
}