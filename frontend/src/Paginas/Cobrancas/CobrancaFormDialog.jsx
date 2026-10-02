import React from 'react';
import PropTypes from 'prop-types';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    MenuItem,
    Paper,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ClienteRbxPanel from './ClienteRbxPanel';
import {
    fieldSpan,
    formatCurrency,
    formatDate,
    formGridSx,
    isPaidStatus,
    isPromiseStatus,
    normalizeClientCode,
} from './cobrancasUtils';

export default function CobrancaFormDialog({
    open,
    onClose,
    selected,
    form,
    updateForm,
    setForm,
    actionOptions,
    statusOptions,
    canEditSelected,
    canTrackSelected,
    canSaveSelected,
    canEditOriginalValue,
    trackingNote,
    setTrackingNote,
    saveDisabled,
    saving,
    onSubmit,
    rbxClient,
    setRbxClient,
    searchRbxClient,
    rbxLoading,
    validatedClientCode,
    setValidatedClientCode,
    isTracking,
    isRegister,
    selectedRbxContract,
    findChargeInProgressByContract,
    error,
    setError,
}) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{ sx: { width: 'min(980px, calc(100vw - 32px))', maxHeight: 'calc(100vh - 32px)' } }}
        >
            <DialogTitle sx={{ fontWeight: 700 }}>
                {selected
                    ? `${canSaveSelected ? (isTracking ? 'Acompanhar' : 'Editar') : 'Detalhes da'} cobrança ${selected.protocol}`
                    : 'Nova cobrança'}
            </DialogTitle>
            <DialogContent sx={{ overflowX: 'hidden' }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
                {!selected && isRegister && (!validatedClientCode || normalizeClientCode(form.codigoCliente) !== validatedClientCode || !form.cliente) && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Informe o código do cliente e clique na lupa para validar no RBX antes de salvar.
                    </Alert>
                )}
                <Box sx={{ ...formGridSx, pt: 1 }}>
                    <Box sx={{ gridColumn: fieldSpan.third }}>
                        <TextField
                            select
                            fullWidth
                            label="Ação"
                            value={form.acao}
                            onChange={(event) => updateForm('acao', event.target.value)}
                            disabled={!canEditSelected}
                        >
                            {actionOptions.map((item) => (
                                <MenuItem key={item} value={item}>{item}</MenuItem>
                            ))}
                        </TextField>
                    </Box>
                    <Box sx={{ gridColumn: fieldSpan.third }}>
                        <TextField
                            fullWidth
                            type="text"
                            label="Código cliente"
                            value={form.codigoCliente}
                            onChange={(event) => {
                                updateForm('codigoCliente', normalizeClientCode(event.target.value));
                                updateForm('cliente', '');
                                updateForm('grupoCliente', '');
                                updateForm('numeroContrato', '');
                                updateForm('boletoSelecionado', '');
                                updateForm('dataVencimento', '');
                                updateForm('valor', '');
                                setRbxClient(null);
                                setValidatedClientCode('');
                            }}
                            disabled={!canEditSelected}
                            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                            InputProps={{
                                endAdornment: (
                                    <IconButton size="small" onClick={searchRbxClient} disabled={rbxLoading}>
                                        {rbxLoading ? <CircularProgress size={18} /> : <SearchRoundedIcon fontSize="small" />}
                                    </IconButton>
                                ),
                            }}
                        />
                    </Box>
                    {isPromiseStatus(form.status) && (
                        <Box sx={{ gridColumn: fieldSpan.third }}>
                            <TextField
                                fullWidth
                                required
                                type="date"
                                label="Data da promessa"
                                value={form.dataPromessa}
                                onChange={(event) => updateForm('dataPromessa', event.target.value)}
                                InputLabelProps={{ shrink: true }}
                                disabled={!(canEditSelected || canTrackSelected)}
                                helperText="Obrigatório para promessa de pagamento"
                            />
                        </Box>
                    )}
                    <Box sx={{ gridColumn: fieldSpan.third }}>
                        <TextField
                            fullWidth
                            label="Cliente"
                            value={form.cliente}
                            disabled
                            helperText="Preenchido pela busca do código no RBX"
                        />
                    </Box>
                    <Box sx={{ gridColumn: fieldSpan.third }}>
                        <TextField
                            fullWidth
                            label="Grupo"
                            value={form.grupoCliente}
                            disabled
                            helperText="Grupo do cliente no RBX"
                        />
                    </Box>
                    <Box sx={{ gridColumn: fieldSpan.third }}>
                        <TextField
                            select={Boolean(rbxClient) && !selected}
                            fullWidth
                            required={!selected}
                            label="Contrato / ponto de internet"
                            value={form.numeroContrato}
                            onChange={(event) => {
                                const numeroContrato = event.target.value;
                                updateForm('numeroContrato', numeroContrato);
                                updateForm('boletoSelecionado', '');
                                updateForm('dataVencimento', '');
                                updateForm('valor', '');
                                const charge = findChargeInProgressByContract(form.codigoCliente, numeroContrato, null);
                                setError(charge
                                    ? `Já existe uma cobrança em andamento para o contrato ${numeroContrato}: ${charge.protocol} (${charge.status}).`
                                    : '');
                            }}
                            disabled={!rbxClient || Boolean(selected)}
                            helperText={!rbxClient
                                ? 'Busque o cliente para listar os contratos com boletos'
                                : `${rbxClient.contratos.length} contrato(s) com boleto em aberto`}
                        >
                            {(rbxClient?.contratos || []).map((contrato) => (
                                <MenuItem key={contrato.numero} value={contrato.numero}>
                                    Contrato {contrato.numero}{contrato.plano ? ` - ${contrato.plano}` : ''}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Box>
                    {!selected && (
                        <Box sx={{ gridColumn: fieldSpan.third }}>
                            <TextField
                                select
                                fullWidth
                                required
                                label="Boleto em aberto"
                                value={form.boletoSelecionado}
                                onChange={(event) => {
                                    const boletoId = event.target.value;
                                    const boleto = selectedRbxContract?.boletos.find((item) => item.id === boletoId);
                                    setForm((current) => ({
                                        ...current,
                                        boletoSelecionado: boletoId,
                                        dataVencimento: boleto?.vencimento || '',
                                        valor: boleto ? String(boleto.valor) : '',
                                    }));
                                }}
                                disabled={!selectedRbxContract}
                                helperText="Selecione um boleto do contrato"
                            >
                                {(selectedRbxContract?.boletos || []).map((boleto) => (
                                    <MenuItem key={boleto.id} value={boleto.id}>
                                        {formatDate(boleto.vencimento)} - {formatCurrency(boleto.valor)}
                                        {boleto.documento ? ` - ${boleto.documento}` : ''}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Box>
                    )}
                    <Box sx={{ gridColumn: fieldSpan.third }}>
                        <TextField
                            fullWidth
                            type="date"
                            label="Data registro"
                            value={form.data}
                            onChange={(event) => updateForm('data', event.target.value)}
                            InputLabelProps={{ shrink: true }}
                            disabled={!canEditSelected}
                        />
                    </Box>
                    <Box sx={{ gridColumn: fieldSpan.third }}>
                        <TextField
                            fullWidth
                            required
                            type="date"
                            label="Data de vencimento"
                            value={form.dataVencimento}
                            onChange={(event) => updateForm('dataVencimento', event.target.value)}
                            InputLabelProps={{ shrink: true }}
                            disabled={!canEditSelected}
                            helperText="Preenchimento manual"
                        />
                    </Box>
                    <Box sx={{ gridColumn: fieldSpan.third }}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Valor"
                            value={form.valor}
                            onChange={(event) => updateForm('valor', event.target.value)}
                            inputProps={{ step: '0.01', min: '0' }}
                            disabled={!canEditOriginalValue}
                            helperText={canEditOriginalValue
                                ? 'Liberado pelo status selecionado'
                                : 'Valor original bloqueado; selecione Negociação ou Promessa de pagamento'}
                        />
                    </Box>
                    <Box sx={{ gridColumn: fieldSpan.third }}>
                        <TextField
                            select
                            fullWidth
                            label="Status"
                            value={form.status}
                            onChange={(event) => updateForm('status', event.target.value)}
                            disabled={!(canEditSelected || canTrackSelected)}
                        >
                            {statusOptions.map((status) => (
                                <MenuItem key={status} value={status}>{status}</MenuItem>
                            ))}
                        </TextField>
                    </Box>
                    {isPaidStatus(form.status) && (
                        <Box sx={{ gridColumn: fieldSpan.third }}>
                            <TextField
                                fullWidth
                                required
                                type="number"
                                label="Valor pago"
                                value={form.valorPago}
                                onChange={(event) => updateForm('valorPago', event.target.value)}
                                inputProps={{ step: '0.01', min: '0.01' }}
                                disabled={!canSaveSelected}
                                helperText="Pode ser diferente do valor original"
                            />
                        </Box>
                    )}
                    <Box sx={{ gridColumn: fieldSpan.full }}>
                        <TextField
                            fullWidth
                            multiline
                            minRows={3}
                            label="Observação"
                            value={form.observacao}
                            onChange={(event) => updateForm('observacao', event.target.value)}
                            disabled={!canEditSelected}
                        />
                    </Box>
                    {isTracking && canTrackSelected && (
                        <Box sx={{ gridColumn: fieldSpan.full }}>
                            <TextField
                                fullWidth
                                required
                                multiline
                                minRows={3}
                                label={`O que foi feito (${form.status})`}
                                value={trackingNote}
                                onChange={(event) => setTrackingNote(event.target.value)}
                                helperText="Esse texto será salvo no histórico junto com o status selecionado."
                            />
                        </Box>
                    )}
                </Box>

                <ClienteRbxPanel cliente={rbxClient} />

                {rbxClient && (
                    <Alert severity={rbxClient.contratos.length ? 'success' : 'warning'} sx={{ mt: 2 }}>
                        {rbxClient.contratos.length
                            ? 'Selecione primeiro o contrato e depois um dos boletos em aberto vinculados a ele.'
                            : 'O cliente não possui contratos com boletos em aberto no RBX.'}
                    </Alert>
                )}

                {selected && (
                    <>
                        <Divider sx={{ my: 2 }} />
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Criado em</Typography>
                                <Typography fontWeight={700}>
                                    {selected.createdAt ? new Date(selected.createdAt).toLocaleString('pt-BR') : '-'}
                                </Typography>
                                <Typography color="text.secondary" variant="caption">
                                    {selected.createdBy ? `por ${selected.createdBy}` : ''}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Atualizado em</Typography>
                                <Typography fontWeight={700}>
                                    {selected.updatedAt ? new Date(selected.updatedAt).toLocaleString('pt-BR') : '-'}
                                </Typography>
                                <Typography color="text.secondary" variant="caption">
                                    {selected.updatedBy ? `por ${selected.updatedBy}` : ''}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Fechado em</Typography>
                                <Typography fontWeight={700}>
                                    {selected.closedAt ? new Date(selected.closedAt).toLocaleString('pt-BR') : '-'}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Último usuário</Typography>
                                <Typography fontWeight={700}>
                                    {selected.lastUser || '-'}
                                </Typography>
                            </Box>
                        </Stack>
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mt: 2 }}>
                            <Typography variant="subtitle1" fontWeight={800}>Histórico de acompanhamento</Typography>
                            <Stack spacing={1.2} sx={{ mt: 1.5 }}>
                                {selected.history?.length ? selected.history.map((item) => (
                                    <Box
                                        key={item.id}
                                        sx={{
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            borderRadius: 1,
                                            p: 1.5,
                                        }}
                                    >
                                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1}>
                                            <Box>
                                                <Typography fontWeight={800}>
                                                    {item.previousStatus || '-'} para {item.nextStatus || '-'}
                                                </Typography>
                                                <Typography color="text.secondary" variant="body2">
                                                    {item.notes}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                                                <Typography variant="body2" fontWeight={700}>
                                                    {formatCurrency(item.previousValue)} para {formatCurrency(item.nextValue)}
                                                </Typography>
                                                <Typography color="text.secondary" variant="caption">
                                                    {[item.user, item.createdAt ? new Date(item.createdAt).toLocaleString('pt-BR') : null].filter(Boolean).join(' - ')}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </Box>
                                )) : (
                                    <Typography color="text.secondary" variant="body2">
                                        Nenhum acompanhamento registrado.
                                    </Typography>
                                )}
                            </Stack>
                        </Paper>
                    </>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} sx={{ textTransform: 'none' }}>Cancelar</Button>
                {canSaveSelected && (
                    <Button
                        variant="contained"
                        onClick={onSubmit}
                        disabled={saveDisabled}
                        sx={{ textTransform: 'none', fontWeight: 700 }}
                    >
                        {saving ? 'Salvando...' : 'Salvar cobrança'}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}

CobrancaFormDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    selected: PropTypes.object,
    form: PropTypes.object.isRequired,
    updateForm: PropTypes.func.isRequired,
    setForm: PropTypes.func.isRequired,
    actionOptions: PropTypes.array.isRequired,
    statusOptions: PropTypes.array.isRequired,
    canEditSelected: PropTypes.bool,
    canTrackSelected: PropTypes.bool,
    canSaveSelected: PropTypes.bool,
    canEditOriginalValue: PropTypes.bool,
    trackingNote: PropTypes.string.isRequired,
    setTrackingNote: PropTypes.func.isRequired,
    saveDisabled: PropTypes.bool,
    saving: PropTypes.bool,
    onSubmit: PropTypes.func.isRequired,
    rbxClient: PropTypes.object,
    setRbxClient: PropTypes.func.isRequired,
    searchRbxClient: PropTypes.func.isRequired,
    rbxLoading: PropTypes.bool,
    validatedClientCode: PropTypes.string,
    setValidatedClientCode: PropTypes.func.isRequired,
    isTracking: PropTypes.bool,
    isRegister: PropTypes.bool,
    selectedRbxContract: PropTypes.object,
    findChargeInProgressByContract: PropTypes.func.isRequired,
    error: PropTypes.string,
    setError: PropTypes.func.isRequired,
};
