import * as React from 'react';
import {
    Box, Collapse, IconButton, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Typography, Paper, CircularProgress, Alert,
    Dialog, DialogActions, DialogContent, DialogTitle, TextField, Button
} from '@mui/material';
import AddBoxIcon from '@mui/icons-material/AddBox';
import RemoveIcon from '@mui/icons-material/Remove';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import PropTypes from 'prop-types';
import Api from '../../Services/Api';
import { DialogAction } from '../DialogAction';

const UseApi = Api();

const Row = React.forwardRef(({ row, onOpenDialog, onRemoverCliente }, ref) => {
    const [open, setOpen] = React.useState(false);
    const [portas, setPortas] = React.useState([]);
    const [loadingCtos, setLoadingCtos] = React.useState(false);
    const [erroCto, setErroCto] = React.useState(null);

    const carregarPortaCto = async (id, abrir) => {
        setOpen(abrir);
        setLoadingCtos(true);
        setErroCto(null);
        try {
            const response = await UseApi(`olt/cto/${id}/portas`);
            if (Array.isArray(response)) {
                setPortas(response);
            } else {
                setErroCto("Resposta inválida recebida da API.");
            }
        } catch (error) {
            setErroCto("Erro ao buscar portas da CTO.");
        } finally {
            setLoadingCtos(false);
        }
    };

    React.useImperativeHandle(ref, () => ({
        recarregar: () => carregarPortaCto(row.id, true)
    }));

    return (
        <>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                <TableCell>
                    <IconButton size="small" onClick={() => carregarPortaCto(row.id, !open)}>
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                <TableCell>{row.label}</TableCell>
                <TableCell align="right">{row.lat}</TableCell>
                <TableCell align="right">{row.longi}</TableCell>
            </TableRow>

            <TableRow>
                <TableCell colSpan={6} sx={{ paddingBottom: 0, paddingTop: 0 }}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1 }}>
                            <Typography variant="h6" gutterBottom>
                                Portas / Clientes
                            </Typography>

                            {loadingCtos ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
                                    <CircularProgress />
                                    <Typography sx={{ mt: 2 }}>Carregando Portas...</Typography>
                                </Box>
                            ) : erroCto ? (
                                <Alert severity="error" sx={{ mt: 2 }}>{erroCto}</Alert>
                            ) : (
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Porta</TableCell>
                                            <TableCell align="right">Código Cliente</TableCell>
                                            <TableCell align="right">Nome</TableCell>
                                            <TableCell align="right">Login</TableCell>
                                            <TableCell align="right">CPF/CNPJ</TableCell>
                                            <TableCell align="right">Apelido</TableCell>
                                            <TableCell align="right">Situação</TableCell>
                                            <TableCell align="right" />
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {portas.map((porta) => (
                                            <TableRow
                                                key={porta.id}
                                                sx={{
                                                    backgroundColor: {
                                                        A: '#308a4f',
                                                        S: '#720808',
                                                        C: '#c72121',
                                                        B: '#d37042',
                                                        N: 'transparent'
                                                    }[porta.cliente?.Situacao] || 'transparent'
                                                }}
                                            >
                                                <TableCell>{porta.label}</TableCell>
                                                <TableCell align="right">{porta.cliente?.Codigo ?? ''}</TableCell>
                                                <TableCell align="right">{porta.cliente?.Nome ?? ''}</TableCell>
                                                <TableCell align="right">{porta.login ?? ''}</TableCell>
                                                <TableCell align="right">{porta.cliente?.CNPJ_CNPF ?? ''}</TableCell>
                                                <TableCell align="right">{porta.cliente?.Sigla ?? ''}</TableCell>
                                                <TableCell align="right">
                                                    {{
                                                        S: 'Suspenso',
                                                        A: 'Ativo',
                                                        B: 'Bloqueado',
                                                        N: 'Inativo',
                                                        C: 'Cancelado',
                                                        I: 'Em Instalação',
                                                        E: 'Aguardando Instalação'
                                                    }[porta.cliente?.Situacao] ?? ''}
                                                </TableCell>
                                                <TableCell align="right">
                                                    {porta.cliente?.Codigo ? (
                                                        <RemoveIcon
                                                            sx={{ cursor: 'pointer' }}
                                                            onClick={() => onRemoverCliente(porta.id, row.id)}
                                                        />
                                                    ) : (
                                                        <AddBoxIcon
                                                            sx={{ cursor: 'pointer' }}
                                                            onClick={() => onOpenDialog(porta.id, row.id)}
                                                        />
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
});

Row.displayName = 'Row';

Row.propTypes = {
    row: PropTypes.object.isRequired,
    onOpenDialog: PropTypes.func.isRequired,
    onRemoverCliente: PropTypes.func.isRequired
};

export default function TabelaSubItens({ ctoData }) {
    const [exibirForm, setExibirForm] = React.useState(false);
    const [exibirFormExcluir, setExibirFormExcluir] = React.useState(false);
    const [codigo, setCodigo] = React.useState('');
    const [login, setLogin] = React.useState('');
    const [salvando, setSalvando] = React.useState(false);
    const [portaSelecionada, setPortaSelecionada] = React.useState(null);
    const [ctoSelecionado, setCtoSelecionado] = React.useState(null);
    const [portaSelecionadaExcluir, setPortaSelecionadaExcluir] = React.useState(null);
    const [ctoSelecionadoExcluir, setCtoSelecionadoExcluir] = React.useState(null);

    const rowRefs = React.useRef({});

    const abrirDialog = (portaId, ctoId) => {
        setPortaSelecionada(portaId);
        setCtoSelecionado(ctoId);
        setExibirForm(true);
    };

    const abrirDialogExcluir = (portaId, ctoId) => {
        setExibirFormExcluir(true)
        setPortaSelecionadaExcluir(portaId)
        setCtoSelecionadoExcluir(ctoId)
    }

    const cadastrarClienteNaPorta = async () => {
        setSalvando(true);
        const form = { codigo, porta: portaSelecionada, login };
        try {
            await UseApi('olt/cto/porta/cadastrar', 'POST', form);
            if (ctoSelecionado && rowRefs.current[ctoSelecionado]?.current) {
                await rowRefs.current[ctoSelecionado].current.recarregar();
            }
            
        } catch (err) {
            console.error(err);
        } finally {
            setSalvando(false);
            setExibirForm(false);
            setCodigo('');
            setLogin('')
        }
    };

    const removerClienteDaPorta = async (portaId, ctoId) => {
        try {
            await UseApi(`olt/cto/porta/${portaId}`, 'DELETE');
            if (ctoId && rowRefs.current[ctoId]?.current) {
                await rowRefs.current[ctoId].current.recarregar();
            }
        } catch (err) {
            console.error('Erro ao remover cliente da porta:', err);
        }finally {
            setExibirFormExcluir(false);
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', padding: 2 }}>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell />
                            <TableCell>CTO</TableCell>
                            <TableCell align="right">Latitude</TableCell>
                            <TableCell align="right">Longitude</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {ctoData.map((cto) => {
                            const ref = React.createRef();
                            rowRefs.current[cto.id] = ref;
                            return (
                                <Row
                                    key={cto.id}
                                    ref={ref}
                                    row={cto}
                                    onOpenDialog={abrirDialog}
                                    onRemoverCliente={abrirDialogExcluir}
                                />
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            <DialogAction
                aoChamar={() => removerClienteDaPorta(portaSelecionadaExcluir, ctoSelecionadoExcluir)}
                titulo={"Deletar cliente da porta"}
                contexto={"Deletar cliente dessa porta?"}
                nomeAcao={"Deletar"}
                abrir={exibirFormExcluir}
                aoFechar={() => setExibirFormExcluir(false)}
            />

            <Dialog open={exibirForm} onClose={() => setExibirForm(false)}>
                <DialogTitle>Cadastrar cliente</DialogTitle>
                <DialogContent>
                    <TextField
                        margin="dense"
                        label="Código"
                        fullWidth
                        value={codigo}
                        onChange={(e) => setCodigo(e.target.value)}
                    />
                    <TextField
                        margin="dense"
                        label="Login"
                        fullWidth
                        value={login}
                        onChange={(e) => setLogin(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setExibirForm(false)}>Cancelar</Button>
                    <Button
                        onClick={cadastrarClienteNaPorta}
                        variant="contained"
                        color="primary"
                        disabled={salvando}
                    >
                        {salvando ? <CircularProgress size={20} /> : 'Salvar'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

TabelaSubItens.propTypes = {
    ctoData: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number.isRequired,
        label: PropTypes.string.isRequired,
        clientes: PropTypes.array.isRequired,
        lat: PropTypes.string.isRequired,
        longi: PropTypes.string.isRequired,
    })).isRequired,
};
