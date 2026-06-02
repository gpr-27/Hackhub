// Lightweight toast system. Wrap the app in <ToastProvider> and call useToast()
// to push success / error / info notifications from anywhere.
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext({ toast: () => {} });

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const remove = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type, message, opts = {}) => {
      const id = ++idRef.current;
      const title = opts.title || (type === 'error' ? 'Something went wrong' : type === 'success' ? 'Success' : 'Heads up');
      setToasts((list) => [...list, { id, type, message, title }]);
      const duration = opts.duration ?? (type === 'error' ? 5000 : 3400);
      if (duration > 0) setTimeout(() => remove(id), duration);
      return id;
    },
    [remove]
  );

  const toast = useCallback(
    (message, opts) => push('info', message, opts),
    [push]
  );
  toast.success = useCallback((m, o) => push('success', m, o), [push]);
  toast.error = useCallback((m, o) => push('error', m, o), [push]);
  toast.info = useCallback((m, o) => push('info', m, o), [push]);

  return (
    <ToastContext.Provider value={{ toast, push, remove }}>
      {children}
      <div className="ui-toast-host" role="region" aria-live="polite" aria-label="Notifications">
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || Info;
          return (
            <div key={t.id} className={`ui-toast ui-toast--${t.type}`} role="status">
              <span className="ui-toast__icon"><Icon size={20} /></span>
              <div className="ui-toast__body">
                <div className="ui-toast__title">{t.title}</div>
                <div className="ui-toast__msg">{t.message}</div>
              </div>
              <button className="ui-toast__close" onClick={() => remove(t.id)} aria-label="Dismiss">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

export default ToastContext;
