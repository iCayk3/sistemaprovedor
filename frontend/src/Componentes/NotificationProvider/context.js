import { createContext, useContext } from 'react';

export const NotificationContext = createContext(null);

let globalNotifyHandler = null;

export const setGlobalNotifyHandler = (handler) => {
    globalNotifyHandler = handler;
};

export const notify = {
    success: (message, title) => globalNotifyHandler?.({ message, title, severity: 'success' }),
    error: (message, title) => globalNotifyHandler?.({ message, title, severity: 'error', duration: 6000 }),
    warning: (message, title) => globalNotifyHandler?.({ message, title, severity: 'warning' }),
    info: (message, title) => globalNotifyHandler?.({ message, title, severity: 'info' }),
};

export function useNotification() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification deve ser usado dentro de um NotificationProvider');
    }
    return context;
}
