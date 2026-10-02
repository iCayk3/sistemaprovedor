import React from 'react';
import PropTypes from 'prop-types';
import {
    Box,
    Button,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    Typography,
} from '@mui/material';
import { formatCurrency, formatDate } from './cobrancasUtils';

export default function FilaInadimplentesTable({
    delinquentQueue,
    paginatedDelinquentQueue,
    delinquentPage,
    setDelinquentPage,
    delinquentRowsPerPage,
    setDelinquentRowsPerPage,
    onAttend,
}) {
    return (
        <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1} mb={1.5}>
                <Box>
                    <Typography variant="h6" fontWeight={800}>Fila automática de inadimplentes</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Clientes com boletos importados, sem baixa e atrasados há pelo menos 7 dias. Selecione um cliente para consultar contratos e iniciar a cobrança.
                    </Typography>
                </Box>
                <Typography
                    variant="subtitle2"
                    fontWeight={800}
                    color={delinquentQueue.length ? 'error.main' : 'success.main'}
                >
                    • {`${delinquentQueue.length} cliente(s)`}
                </Typography>
            </Stack>
            <TableContainer sx={{ maxHeight: 330 }}>
                <Table size="small" stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell>Código / cliente</TableCell>
                            <TableCell>Vencidos</TableCell>
                            <TableCell>Mais antigo</TableCell>
                            <TableCell>Valor vencido</TableCell>
                            <TableCell>Situação</TableCell>
                            <TableCell align="right">Ação</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedDelinquentQueue.map((item) => (
                            <TableRow key={item.codigoCliente} hover>
                                <TableCell>
                                    <Typography fontWeight={700}>{item.cliente || 'Nome será atualizado pelo RBX'}</Typography>
                                    <Typography variant="caption" color="text.secondary">Código {item.codigoCliente}</Typography>
                                </TableCell>
                                <TableCell>{Number(item.boletosVencidos || 0).toLocaleString('pt-BR')}</TableCell>
                                <TableCell>{formatDate(item.vencimentoMaisAntigo)}</TableCell>
                                <TableCell>{formatCurrency(item.valorVencido)}</TableCell>
                                <TableCell>
                                    <Typography
                                        variant="body2"
                                        fontWeight={700}
                                        color={item.atendimentoAberto ? 'warning.main' : 'error.main'}
                                    >
                                        {item.atendimentoAberto ? 'Em atendimento' : 'Pendente'}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={() => onAttend(item)}
                                        sx={{ textTransform: 'none', fontWeight: 600 }}
                                    >
                                        {item.atendimentoAberto ? 'Ver contratos' : 'Iniciar cobrança'}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {!delinquentQueue.length && (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    Nenhum boleto importado sem baixa atingiu 7 dias de atraso.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            {delinquentQueue.length > 0 && (
                <TablePagination
                    component="div"
                    count={delinquentQueue.length}
                    page={delinquentPage}
                    onPageChange={(_, nextPage) => setDelinquentPage(nextPage)}
                    rowsPerPage={delinquentRowsPerPage}
                    onRowsPerPageChange={(event) => {
                        setDelinquentRowsPerPage(Number(event.target.value));
                        setDelinquentPage(0);
                    }}
                    rowsPerPageOptions={[10, 20, 50]}
                    labelRowsPerPage="Clientes por página"
                    labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
                />
            )}
        </Paper>
    );
}

FilaInadimplentesTable.propTypes = {
    delinquentQueue: PropTypes.array.isRequired,
    paginatedDelinquentQueue: PropTypes.array.isRequired,
    delinquentPage: PropTypes.number.isRequired,
    setDelinquentPage: PropTypes.func.isRequired,
    delinquentRowsPerPage: PropTypes.number.isRequired,
    setDelinquentRowsPerPage: PropTypes.func.isRequired,
    onAttend: PropTypes.func.isRequired,
};
