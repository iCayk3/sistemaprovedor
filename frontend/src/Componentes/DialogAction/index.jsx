import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton } from '@mui/material';
import React, { useEffect, useState } from 'react';

export function DialogAction({
    aoChamar,
    titulo,
    contexto,
    nomeAcao,
    icon,
    abrir = false,
    aoFechar,
    entradas = false
}) {
    const [open, setOpen] = useState(false);

    // Sincroniza o estado interno com o prop externo 'abrir'
    useEffect(() => {
        setOpen(abrir);
    }, [abrir]);
    
    const handleClose = () => {
        setOpen(false);
        if (aoFechar) aoFechar();
    };

    return (
        <>
            {icon && (
                <IconButton onClick={() => setOpen(true)}>
                    {icon}
                </IconButton>
            )}

            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>{titulo}</DialogTitle>
                {entradas ? <DialogContent>
                    {contexto}
                </DialogContent>
                    :
                    <DialogContent>
                        <DialogContentText>{contexto}</DialogContentText>
                    </DialogContent>
                }
                <DialogActions>
                    <Button onClick={handleClose}>Cancelar</Button>
                    <Button
                        onClick={() => {
                            aoChamar();
                            handleClose();
                        }}
                        color="warning"
                        autoFocus
                    >
                        {nomeAcao}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
