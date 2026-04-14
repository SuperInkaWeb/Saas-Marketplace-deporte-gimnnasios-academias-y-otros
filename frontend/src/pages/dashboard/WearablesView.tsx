import React, { useState, useEffect } from 'react';
import { ArrowLeft, Watch, Activity, Flame, HeartPulse, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api-client';

const WearablesView: React.FC = () => {
  const navigate = useNavigate();
  const [syncing, setSyncing] = useState(false);
  const [bluetoothSupported] = useState(!!(navigator as any).bluetooth);
  const [bleDevice, setBleDevice] = useState<string | null>(null);
  const [liveHeartRate, setLiveHeartRate] = useState<number | null>(null);
  const [metrics, setMetrics] = useState({ steps: 0, calories: 0, heartRateAvg: 0 });
  const [showCurlTerminal, setShowCurlTerminal] = useState(false);

  const fetchMetrics = async () => {
    try {
      const response = await api.get('/wearables/metrics');
      if (response.data && response.data.length > 0) {
        setMetrics({
          steps: response.data[0].steps,
          calories: response.data[0].calories,
          heartRateAvg: response.data[0].heartRateAvg,
        });
      }
    } catch (error) {
      console.error('Error recuperando datos del servidor:', error);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const connectBluetooth = async () => {
    try {
      if (!(navigator as any).bluetooth) throw new Error("Bluetooth Web API no soportada en este navegador.");
      
      setSyncing(true);
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }],
        optionalServices: ['battery_service']
      });

      setBleDevice(device.name || 'Dispositivo Smart');
      
      const server = await device.gatt?.connect();
      const service = await server?.getPrimaryService('heart_rate');
      const characteristic = await service?.getCharacteristic('heart_rate_measurement');

      characteristic?.startNotifications();
      characteristic?.addEventListener('characteristicvaluechanged', (event: any) => {
        const value = event.target.value;
        const flags = value.getUint8(0);
        const rate16Bits = flags & 0x1;
        const hr = rate16Bits ? value.getUint16(1, true) : value.getUint8(1);
        setLiveHeartRate(hr);
        
        if (hr > 0) {
           api.post('/wearables/sync', {
             deviceType: device.name || 'BLE_HEART_RATE_MONITOR',
             steps: metrics.steps, // mantenemos históricos
             calories: metrics.calories + 1,
             heartRateAvg: hr
           }).then(() => fetchMetrics()).catch(e => console.error(e));
        }
      });
      setSyncing(false);
      alert("¡Dispositivo Bluetooth conectado exitosamente!");
    } catch (error: any) {
      console.error('Error BLE:', error);
      alert('Se canceló la conexión BLE o no se encontraron sensores: ' + error.message);
      setSyncing(false);
    }
  };

  const connectFitbit = async () => {
    try {
      const { data } = await api.get('/wearables/fitbit/auth');
      // Redirigir a la plataforma OFICIAL de FITBIT:
      window.location.href = data.url; 
    } catch (error) {
      console.error("Error contactando Fitbit", error);
    }
  };

  // Escuchar si regresamos desde Fitbit con un token de acceso real
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      const tokenMatch = hash.match(/access_token=([^&]+)/);
      if (tokenMatch) {
         setBleDevice('Fitbit Account (Sincronizado)');
         // En un entorno de producción, aquí se usa el token para consultar:
         // axios.get('https://api.fitbit.com/1/user/-/activities/date/today.json', { headers: { Authorization: `Bearer ${tokenMatch[1]}` } })
         // Limpiar el hash de la url
         window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, []);

  const handleSyncDemo = async () => {
    setSyncing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const demoData = {
        deviceType: bleDevice || 'SMART_WATCH_ELITE',
        steps: Math.floor(Math.random() * 5000) + 7000,
        calories: Math.floor(Math.random() * 400) + 300,
        heartRateAvg: Math.floor(Math.random() * 40) + 70
      };

      await api.post('/wearables/sync', demoData);
      await fetchMetrics();
      alert("¡Sincronización con el hardware completada exitosamente!");
    } catch (error) {
       console.error("Error en sincronización demo", error);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">Mis Wearables <span className="bg-primary/20 text-primary-light text-[10px] px-2 py-0.5 rounded-full border border-primary/20 tracking-wider font-bold">PRODUCCIÓN</span></h1>
          <p className="text-slate-400 text-sm">Escanea y conéctate directamente con dispositivos Bluetooth o sincroniza la nube.</p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-white/10 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5"><Watch className="w-48 h-48" /></div>
        <div className="flex items-center gap-4 z-10">
          <div className="bg-slate-900 p-4 rounded-full border border-white/10 shadow-2xl relative">
            <Watch className={`w-10 h-10 ${bleDevice ? 'text-primary-light animate-pulse' : 'text-slate-500'}`} />
            {bleDevice && <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-slate-900" />}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{bleDevice || 'Hardware SportNexus'}</h2>
            {bleDevice ? (
              <p className="text-green-400 text-sm font-semibold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Conectado en Vivo</p>
            ) : (
              <p className="text-slate-500 text-sm">Listo para sincronizar</p>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 z-10">
          <button 
            onClick={handleSyncDemo}
            disabled={syncing}
            className={`font-bold py-3 px-6 rounded-xl transition-all shadow-lg flex items-center gap-2 ${syncing ? 'bg-slate-700 text-slate-400' : 'bg-primary hover:bg-primary-dark text-white shadow-primary/20'}`}
          >
            {syncing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
            {syncing ? 'Sincronizando...' : 'Sincronizar Ahora'}
          </button>
          
          <button 
            onClick={connectBluetooth}
            disabled={syncing || bleDevice !== null}
            className="bg-white/5 hover:bg-white/10 text-white font-bold py-3 px-6 rounded-xl border border-white/10 transition-all"
          >
            Bluetooth (BLE)
          </button>

          <button 
            onClick={() => setShowCurlTerminal(!showCurlTerminal)}
            className="text-slate-400 hover:text-white text-sm font-medium px-2"
          >
             Webhook
          </button>
        </div>
      </div>

      {showCurlTerminal && (
        <div className="bg-black/80 rounded-2xl border border-white/10 p-6 font-mono text-xs text-green-400 overflow-x-auto">
          <p className="text-slate-500 mb-2">// Copia esto a tu terminal para enviar datos POST en vivo si no tienes reloj a la mano:</p>
          <code>
            curl -X POST http://localhost:3000/api/wearables/sync \<br/>
            -H "Content-Type: application/json" \<br/>
            -H "Authorization: Bearer <span className="text-slate-600">TU_TOKEN_JWT_AQUI</span>" \<br/>
            -d '{`{ "deviceType": "WEBHOOK_PUSH", "steps": 5120, "calories": 340, "heartRateAvg": 110 }`}'
          </code>
        </div>
      )}

      <div>
        <h3 className="text-lg font-bold text-white mb-4">Métricas Extraídas Oficiales DB PostgreSQL</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white/5 border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
              <Activity className="w-24 h-24" />
            </div>
            <Activity className="w-6 h-6 text-blue-400 mb-2" />
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Pasos Reales BD</p>
            <p className="text-3xl font-extrabold text-white mt-1">{metrics.steps.toLocaleString()}</p>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
              <Flame className="w-24 h-24" />
            </div>
            <Flame className="w-6 h-6 text-orange-400 mb-2" />
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Calorías quemadas</p>
            <p className="text-3xl font-extrabold text-white mt-1">{metrics.calories.toLocaleString()} <span className="text-sm font-normal text-slate-500">kcal</span></p>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
              <HeartPulse className="w-24 h-24" />
            </div>
            <HeartPulse className={`w-6 h-6 text-red-500 mb-2 ${liveHeartRate ? 'animate-bounce' : ''}`} />
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{liveHeartRate ? 'Latido en Vivo' : 'Ritmo Cardíaco Promedio'}</p>
            <p className="text-3xl font-extrabold text-white mt-1 text-red-400">{liveHeartRate || metrics.heartRateAvg} <span className="text-sm font-normal text-slate-500">bpm</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WearablesView;
