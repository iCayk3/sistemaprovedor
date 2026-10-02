import React from 'react';
import PropTypes from 'prop-types';
import {
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Paper,
    TextField,
    Typography,
} from '@mui/material';
import { formatCurrency } from './cobrancasUtils';

export default function CobrancaDeleteDialog({
    open,
    onClose,
    deleteTarget,
    deleteReason,
    setDeleteReason,
    onConfirm,
    saving,
    error,
}) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 700 }}>Excluir cobrança paga</DialogTitle>
            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Essa ação não apaga o registro do banco. A cobrança será marcada como excluída e o motivo ficará salvo no histórico.
                </Typography>
                {deleteTarget && (
                    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, mb: 2 }}>
                        <Typography fontWeight={800}>{deleteTarget.protocol}</Typography>
                        <Typography variant="body2">{deleteTarget.client || 'Cliente não informado'}</Typography>
                        <Typography variant="caption" color="text.secondary">
                            Código {deleteTarget.clientCode || '-'} - Valor {formatCurrency(deleteTarget.value)}
                        </Typography>
                    </Paper>
                )}
                <TextField
                    fullWidth
                    required
                    multiline
                    minRows={4}
                    label="Motivo da exclusão"
                    value={deleteReason}
                    onChange={(event) => setDeleteReason(event.target.value)}
                    helperText="Obrigatório. Será salvo com usuário, data e hora."
                />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} sx={{ textTransform: 'none' }}>
                    Cancelar
                </Button>
                <Button
                    color="error"
                    variant="contained"
                    onClick={onConfirm}
                    disabled={saving || !deleteReason.trim()}
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                    {saving ? 'Excluindo...' : 'Excluir cobrança'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

CobrancaDeleteDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    deleteTarget: PropTypes.object,
    deleteReason: PropTypes.string.isRequired,
    setDeleteReason: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    saving: PropTypes.bool,
    error: PropTypes.string,
};
