import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import api from '../../api/api-client';

type Result = 'loading' | 'COMPLETED' | 'FAILED' | 'PENDING' | 'ERROR';

export default function PaymentResultPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [result, setResult] = useState<Result>('loading');

  // Mercado Pago agrega payment_id (o collection_id) a la URL de retorno
  const mpPaymentId = params.get('payment_id') || params.get('collection_id');
  const ref = params.get('ref'); // id de tu Payment local

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        // 1) Si tenemos el payment_id de MP, el backend lo verifica contra la API de MP
        if (mpPaymentId && mpPaymentId !== 'null') {
          const { data } = await api.post('/payments/mercadopago/confirm', {
            paymentId: mpPaymentId,
          });
          if (!cancelled) setResult(data.status as Result);
          return;
        }
        // 2) Si no, solo consultamos el estado local (por ejemplo, pago pendiente)
        if (ref) {
          const { data } = await api.get(`/payments/status/${ref}`);
          if (!cancelled) setResult(data.status as Result);
          return;
        }
        if (!cancelled) setResult('ERROR');
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

  const view = {
    loading: { icon: <Loader2 className="w-12 h-12 animate-spin text-slate-400" />, title: 'Verificando tu pago...', text: 'Un momento, estamos confirmando con Mercado Pago.' },
    COMPLETED: { icon: <CheckCircle2 className="w-12 h-12 text-green-500" />, title: '¡Pago exitoso!', text: 'Tu membresía ya está activa.' },
    FAILED: { icon: <XCircle className="w-12 h-12 text-red-500" />, title: 'El pago no se completó', text: 'No se realizó ningún cobro. Puedes intentarlo de nuevo.' },
    PENDING: { icon: <Clock className="w-12 h-12 text-amber-500" />, title: 'Pago pendiente', text: 'Cuando se acredite, tu membresía se activará automáticamente.' },
    ERROR: { icon: <XCircle className="w-12 h-12 text-red-500" />, title: 'No pudimos verificar el pago', text: 'Si te cobraron, contáctanos con tu comprobante.' },
  }[result];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-6">
      {view.icon}
      <h1 className="text-2xl font-bold text-white">{view.title}</h1>
      <p className="text-slate-400 max-w-md">{view.text}</p>
      {result !== 'loading' && (
        <button
          onClick={() => navigate('/memberships')}
          className="mt-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold"
        >
          Ir a mis membresías
        </button>
      )}
    </div>
  );
}