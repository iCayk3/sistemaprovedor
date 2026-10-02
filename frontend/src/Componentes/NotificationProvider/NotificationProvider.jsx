import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
    Snackbar,
    Alert,
    AlertTitle,
    Slide,
    IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { NotificationContext, setGlobalNotifyHandler } from './context';

function SlideTransition(props) {
    return <Slide {...props} direction="left" />;
}

export function NotificationProvider({ children }) {
    const [, setQueue] = useState([]);
    const [current, setCurrent] = useState(null);
    const [open, setOpen] = useState(false);

    // Process next item in queue when current closes
    const processQueue = useCallback(() => {
        setQueue((prevQueue) => {
            if (prevQueue.length > 0) {
                const next = prevQueue[0];
                setCurrent(next);
                setOpen(true);
                return prevQueue.slice(1);
            }
            return prevQueue;
        });
    }, []);

    const showNotification = useCallback(({
        message,
        title = '',
        severity = 'info',
        duration = 4000,
    }) => {
        const item = {
            id: Date.now() + Math.random(),
            message: typeof message === 'string' ? message : JSON.stringify(message),
            title,
            severity,
            duration: severity === 'error' ? Math.max(duration, 6000) : duration,
        };

        setQueue((prev) => {
            if (!open && !current) {
                setCurrent(item);
                setOpen(true);
                return prev;
            }
            return [...prev, item];
        });
    }, [open, current]);

    // Connect global helper
    React.useEffect(() => {
        setGlobalNotifyHandler(showNotification);
        return () => {
            setGlobalNotifyHandler(null);
        };
    }, [showNotification]);

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') return;
        setOpen(false);
    };

    const handleExited = () => {
        setCurrent(null);
        processQueue();
    };

    const showSuccess = useCallback((msg, title = '') => {
        showNotification({ message: msg, title, severity: 'success' });
    }, [showNotification]);

    const showError = useCallback((msg, title = '') => {
        showNotification({ message: msg, title, severity: 'error', duration: 6000 });
    }, [showNotification]);

    const showWarning = useCallback((msg, title = '') => {
        showNotification({ message: msg, title, severity: 'warning' });
    }, [showNotification]);

    const showInfo = useCallback((msg, title = '') => {
        showNotification({ message: msg, title, severity: 'info' });
    }, [showNotification]);

    const contextValue = useMemo(() => ({
        showNotification,
        showSuccess,
        showError,
        showWarning,
        showInfo,
    }), [showNotification, showSuccess, showError, showWarning, showInfo]);

    return (
        <NotificationContext.Provider value={contextValue}>
            {children}
            <Snackbar
                key={current?.id}
                open={open}
                autoHideDuration={current?.duration ?? 4000}
                onClose={handleClose}
                TransitionComponent={SlideTransition}
                TransitionProps={{ onExited: handleExited }}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                sx={{
                    mb: { xs: 2, sm: 3 },
                    mr: { xs: 2, sm: 3 },
                    maxWidth: { xs: '90vw', sm: 420 },
                }}
            >
                {current ? (
                    <Alert
                        onClose={handleClose}
                        severity={current.severity || 'info'}
                        variant="filled"
                        elevation={6}
                        sx={{
                            width: '100%',
                            borderRadius: 2.5,
                            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                            alignItems: 'center',
                            '& .MuiAlert-icon': {
                                fontSize: 26,
                                my: 'auto',
                            },
                            '& .MuiAlert-message': {
                                fontWeight: 500,
                                fontSize: '0.9rem',
                                wordBreak: 'break-word',
                            },
                        }}
                        action={
                            <IconButton
                                size="small"
                                aria-label="close"
                                color="inherit"
                                onClick={handleClose}
                                sx={{ p: 0.5 }}
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        }
                    >
                        {current.title && (
                            <AlertTitle sx={{ fontWeight: 700, mb: 0.3, fontSize: '0.95rem' }}>
                                {current.title}
                            </AlertTitle>
                        )}
                        {current.message}
                    </Alert>
                ) : null}
            </Snackbar>
        </NotificationContext.Provider>
    );
}

NotificationProvider.propTypes = {
    children: PropTypes.node.isRequired,
};
