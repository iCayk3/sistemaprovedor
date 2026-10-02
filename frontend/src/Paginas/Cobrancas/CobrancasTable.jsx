import React from 'react';
import PropTypes from 'prop-types';
import {
    Box,
    Button,
    IconButton,
    MenuItem,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TableSkeleton from '../../Componentes/TableSkeleton';
import {
    formatCurrency,
    formatDate,
    isFinalStatus,
    isPaidStatus,
    isPromiseStatus,
    todayIso,
} from './cobrancasUtils';

export default function CobrancasTable({
    isDashboard,
    isPaidList,
    isAutomaticQueue,
    isTracking,
    filteredCharges,
    paginatedCharges,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    loading,
    statusFilter,
    setStatusFilter,
    searchFilter,
    setSearchFilter,
    userFilter,
    setUserFilter,
    actionFilter,
    setActionFilter,
    groupFilter,
    setGroupFilter,
    statusOptions,
    actionFilterOptions,
    userOptions,
    groupOptions,
    onSelectCharge,
    onOpenDeleteDialog,
    onCaptureCharge,
    saving,
}) {
    const pageTitle = isDashboard
        ? 'Resumo da fila'
        : isPaidList
        ? 'Baixas registradas'
        : isAutomaticQueue
        ? 'Disponíveis para captura'
        : 'Fila de cobrança';

    return (
        <Paper
            className={isDashboard ? 'pdf-export-ignore' : undefined}
            variant="outlined"
            sx={{ p: 2, borderRadius: 2 }}
        >
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2} mb={2}>
                <Box>
                    <Typography variant="h6" fontWeight={800}>
                        {pageTitle}
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                        {filteredCharges.length} registros encontrados
                    </Typography>
                </Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flexWrap="wrap">
                    <TextField
                        size="small"
                        label="Buscar"
                        value={searchFilter}
                        onChange={(event) => setSearchFilter(event.target.value)}
                        placeholder="Cliente, código ou protocolo"
                        sx={{ minWidth: { xs: '100%', sm: 240 } }}
                    />
                    <TextField
                        select
                        size="small"
                        label="Status"
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                        sx={{ minWidth: 200 }}
                    >
                        <MenuItem value="Todos">Todos</MenuItem>
                        <MenuItem value="Em aberto">Em aberto</MenuItem>
                        <MenuItem value="Finalizadas">Finalizadas</MenuItem>
                        <MenuItem value="Promessas hoje">Promessas hoje</MenuItem>
                        <MenuItem value="Promessas vencidas">Promessas vencidas</MenuItem>
                        <MenuItem value="Sem atualização há 7 dias">Sem atualização há 7 dias</MenuItem>
                        {statusOptions.map((status) => (
                            <MenuItem key={status} value={status}>{status}</MenuItem>
                        ))}
                    </TextField>
                    {(isDashboard || isTracking) && (
                        <>
                            {isDashboard && (
                                <>
                                    <TextField
                                        select
                                        size="small"
                                        label="Usuário"
                                        value={userFilter}
                                        onChange={(event) => setUserFilter(event.target.value)}
                                        sx={{ minWidth: 170 }}
                                    >
                                        <MenuItem value="Todos">Todos</MenuItem>
                                        {userOptions.map((user) => (
                                            <MenuItem key={user} value={user}>{user}</MenuItem>
                                        ))}
                                    </TextField>
                                    <TextField
                                        select
                                        size="small"
                                        label="Ação"
                                        value={actionFilter}
                                        onChange={(event) => setActionFilter(event.target.value)}
                                        sx={{ minWidth: 180 }}
                                    >
                                        <MenuItem value="Todos">Todas</MenuItem>
                                        {actionFilterOptions.map((action) => (
                                            <MenuItem key={action} value={action}>{action}</MenuItem>
                                        ))}
                                    </TextField>
                                </>
                            )}
                            <TextField
                                select
                                size="small"
                                label="Grupo"
                                value={groupFilter}
                                onChange={(event) => setGroupFilter(event.target.value)}
                                sx={{ minWidth: 170 }}
                            >
                                <MenuItem value="Todos">Todos</MenuItem>
                                {groupOptions.map((group) => (
                                    <MenuItem key={group} value={group}>{group}</MenuItem>
                                ))}
                            </TextField>
                        </>
                    )}
                </Stack>
            </Stack>

            <TableContainer>
                {loading ? (
                    <TableSkeleton rows={8} columns={isPaidList ? 12 : 11} />
                ) : (
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Protocolo</TableCell>
                                <TableCell>Cliente</TableCell>
                                <TableCell>Grupo</TableCell>
                                <TableCell>Ação</TableCell>
                                <TableCell>Data registro</TableCell>
                                <TableCell>Data vencimento</TableCell>
                                <TableCell>Valor</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Situação do atendimento</TableCell>
                                <TableCell>Usuário</TableCell>
                                {isPaidList && <TableCell>Exclusão</TableCell>}
                                <TableCell align="right">{isPaidList ? 'Ações' : 'Detalhes'}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedCharges.map((charge) => (
                                <TableRow key={charge.id} hover>
                                    <TableCell sx={{ fontWeight: 600 }}>{charge.protocol}</TableCell>
                                    <TableCell>
                                        <Typography fontWeight={700} fontSize="inherit">{charge.client || 'Não informado'}</Typography>
                                        <Typography color="text.secondary" variant="caption">
                                            Código {charge.clientCode || '-'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{charge.clientGroup || 'Não informado'}</TableCell>
                                    <TableCell>{charge.action}</TableCell>
                                    <TableCell>{formatDate(charge.date)}</TableCell>
                                    <TableCell>{formatDate(charge.dueDate)}</TableCell>
                                    <TableCell>
                                        <Typography fontSize="inherit">Original: {formatCurrency(charge.value)}</Typography>
                                        {isPaidStatus(charge.status) && (
                                            <Typography color="success.main" variant="caption" display="block">
                                                Pago: {formatCurrency(charge.paidValue ?? charge.value)}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Typography
                                            variant="body2"
                                            fontWeight={700}
                                            color={
                                                charge.excluded
                                                    ? 'error.main'
                                                    : isPromiseStatus(charge.status) && charge.promiseDate && charge.promiseDate <= todayIso()
                                                    ? 'error.main'
                                                    : isFinalStatus(charge.status)
                                                    ? 'success.main'
                                                    : 'warning.main'
                                            }
                                        >
                                            {charge.excluded ? 'Excluída' : charge.status}
                                        </Typography>
                                        {isPromiseStatus(charge.status) && charge.promiseDate && (
                                            <Typography display="block" color="text.secondary" variant="caption">
                                                Promessa: {formatDate(charge.promiseDate)}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Typography
                                            variant="body2"
                                            fontWeight={700}
                                            color={charge.serviceSituation === 'Fechada' ? 'text.secondary' : 'success.main'}
                                        >
                                            {charge.serviceSituation}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography fontSize="inherit">
                                            {charge.responsible || (charge.automatic ? 'Aguardando captura' : charge.lastUser || 'sem usuário')}
                                        </Typography>
                                        {charge.automatic && (
                                            <Typography color="text.secondary" variant="caption" display="block">
                                                Automático • RBX: {charge.rbxStatus || 'não iniciado'}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    {isPaidList && (
                                        <TableCell>
                                            {charge.excluded ? (
                                                <>
                                                    <Typography fontWeight={700} fontSize="inherit">
                                                        {charge.excludedBy || 'sem usuário'}
                                                    </Typography>
                                                    <Typography color="text.secondary" variant="caption" display="block">
                                                        {charge.excludedAt ? new Date(charge.excludedAt).toLocaleString('pt-BR') : '-'}
                                                    </Typography>
                                                    <Typography color="text.secondary" variant="caption" display="block">
                                                        {charge.exclusionReason || 'Motivo não informado'}
                                                    </Typography>
                                                </>
                                            ) : (
                                                <Typography color="text.secondary" variant="caption">Não excluída</Typography>
                                            )}
                                        </TableCell>
                                    )}
                                    <TableCell align="right">
                                        {charge.automatic
                                            && (!charge.responsible || charge.rbxStatus === 'ERRO_ABERTURA_RBX')
                                            && charge.serviceSituation !== 'Fechada' && (
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                disabled={saving}
                                                onClick={() => onCaptureCharge(charge)}
                                                sx={{ mr: 0.5, textTransform: 'none' }}
                                            >
                                                {charge.responsible ? 'Tentar RBX novamente' : 'Capturar'}
                                            </Button>
                                        )}
                                        <IconButton size="small" onClick={() => onSelectCharge(charge)}>
                                            {isDashboard || !charge.editable ? <InfoOutlinedIcon fontSize="small" /> : <EditRoundedIcon fontSize="small" />}
                                        </IconButton>
                                        {isPaidList && !charge.excluded && (
                                            <IconButton size="small" color="error" onClick={() => onOpenDeleteDialog(charge)}>
                                                <DeleteRoundedIcon fontSize="small" />
                                            </IconButton>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!filteredCharges.length && (
                                <TableRow>
                                    <TableCell colSpan={isPaidList ? 12 : 11} align="center">
                                        Nenhuma cobrança encontrada para os filtros selecionados.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </TableContainer>

            {!loading && filteredCharges.length > 0 && (
                <TablePagination
                    component="div"
                    count={filteredCharges.length}
                    page={page}
                    onPageChange={(_, nextPage) => setPage(nextPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(event) => {
                        setRowsPerPage(Number(event.target.value));
                        setPage(0);
                    }}
                    rowsPerPageOptions={[20, 50, 100]}
                    labelRowsPerPage="Linhas por página"
                    labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
                />
            )}
        </Paper>
    );
}

CobrancasTable.propTypes = {
    isDashboard: PropTypes.bool,
    isPaidList: PropTypes.bool,
    isAutomaticQueue: PropTypes.bool,
    isTracking: PropTypes.bool,
    filteredCharges: PropTypes.array.isRequired,
    paginatedCharges: PropTypes.array.isRequired,
    page: PropTypes.number.isRequired,
    setPage: PropTypes.func.isRequired,
    rowsPerPage: PropTypes.number.isRequired,
    setRowsPerPage: PropTypes.func.isRequired,
    loading: PropTypes.bool,
    statusFilter: PropTypes.string.isRequired,
    setStatusFilter: PropTypes.func.isRequired,
    searchFilter: PropTypes.string.isRequired,
    setSearchFilter: PropTypes.func.isRequired,
    userFilter: PropTypes.string.isRequired,
    setUserFilter: PropTypes.func.isRequired,
    actionFilter: PropTypes.string.isRequired,
    setActionFilter: PropTypes.func.isRequired,
    groupFilter: PropTypes.string.isRequired,
    setGroupFilter: PropTypes.func.isRequired,
    statusOptions: PropTypes.array.isRequired,
    actionFilterOptions: PropTypes.array.isRequired,
    userOptions: PropTypes.array.isRequired,
    groupOptions: PropTypes.array.isRequired,
    onSelectCharge: PropTypes.func.isRequired,
    onOpenDeleteDialog: PropTypes.func.isRequired,
    onCaptureCharge: PropTypes.func.isRequired,
    saving: PropTypes.bool,
};
