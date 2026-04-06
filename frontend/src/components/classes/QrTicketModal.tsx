import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { X, Calendar, Clock, MapPin, CheckCircle2, QrCode } from 'lucide-react';
import api from '../../api/api-client';

interface QrTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservationId: string;
  classTitle: string;
  gymName: string;
  date: string;
  time: string;
  userName: string;
}

export const QrTicketModal: React.FC<QrTicketModalProps> = ({
  isOpen, onClose, reservationId, classTitle, gymName, date, time, userName
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-slate-900 rounded-3xl w-full max-w-sm overflow-hidden shadow-[0_0_50px_rgba(0,163,255,0.1)] border border-white/10 relative"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-primary-light p-6 text-white text-center relative">
              <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold uppercase tracking-widest text-white mt-2">SportNexus</h2>
              <p className="text-primary-dark font-medium text-xs mt-1">Pase de Acceso Oficial</p>
            </div>

            {/* Ticket Body */}
            <div className="p-8 bg-white relative">
              {/* Recortes de ticket laterales */}
              <div className="absolute top-0 -left-3 w-6 h-6 bg-slate-900 rounded-full -translate-y-1/2" />
              <div className="absolute top-0 -right-3 w-6 h-6 bg-slate-900 rounded-full -translate-y-1/2" />
              
              <div className="border-b border-dashed border-slate-300 mb-6 pb-6 text-center">
                <h3 className="text-2xl font-extrabold text-slate-800">{classTitle}</h3>
                <p className="text-slate-500 font-medium">{userName}</p>
              </div>

              <div className="flex justify-center mb-6">
                <div className="p-2 bg-white rounded-xl shadow-lg border border-slate-100">
                  <QRCodeSVG 
                    value={reservationId} 
                    size={160}
                    fgColor="#0f172a"
                    level="H"
                  />
                </div>
              </div>

              <div className="space-y-3 mt-4 text-sm">
                <div className="flex items-center gap-3 text-slate-600">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="font-medium text-slate-700">{date}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="font-medium text-slate-700">{time}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="font-medium text-slate-700">{gymName}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-100 p-4 text-center text-xs text-slate-400 font-medium">
              ID: {reservationId.split('-')[0].toUpperCase()}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservationInfo: any;
  onSuccess: () => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({
  isOpen, onClose, reservationInfo, onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleScan = async () => {
    setLoading(true);
    try {
      await api.patch(`/classes/reservations/${reservationInfo.id}/attend`);
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (err) {
      alert("Error validando el QR");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-slate-900 rounded-3xl w-full max-w-sm p-8 text-center border border-white/10 relative"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
            
            {success ? (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 mb-4">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-white">¡Asistencia Validada!</h3>
                <p className="text-slate-400 mt-2">El atleta ya puede ingresar.</p>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 border-4 border-dashed border-primary rounded-3xl flex items-center justify-center text-primary mb-6 animate-pulse">
                  <QrCode className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-white">Validar Ingreso</h3>
                <p className="text-slate-400 mt-2 mb-6">Confirmar asistencia para:<br/><strong className="text-white">{reservationInfo?.user?.name}</strong></p>
                <button
                  onClick={handleScan}
                  disabled={loading}
                  className="btn-primary w-full py-3 text-lg"
                >
                  {loading ? 'Escaneando...' : 'Escaneo Exitoso (Simular)'}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
