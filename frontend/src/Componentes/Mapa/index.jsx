import * as React from 'react';
import {
    APIProvider,
    Map,
} from '@vis.gl/react-google-maps';
import {
    Alert,
    Autocomplete,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Paper,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import SettingsEthernetIcon from '@mui/icons-material/SettingsEthernet';
import debounce from 'lodash/debounce';
import Api from '../../Services/Api';
import FieldAutoComplet from '../FieldAutoComplet';
import MarcadorCTO from '../MarcadorCto';
import { useNotification } from '../NotificationProvider';

const INITIAL_CAMERA = {
    center: { lat: -0.7741140809244029, lng: -47.177572460341565 },
    zoom: 15,
};

const UseApi = Api();
const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "";

export default function Mapa() {
    const { showSuccess, showError, showWarning, showInfo } = useNotification();
    const [olt, setOlt] = React.useState(null);
    const [cto, setCto] = React.useState([]);
    const [oltInput, setOltInput] = React.useState('');
    const [cameraProps, setCameraProps] = React.useState(INITIAL_CAMERA);
    const [portasPorCto, setPortasPorCto] = React.useState({});
    const [exibirForm, setExibirForm] = React.useState(false);
    const [portaSelecionada, setPortaSelecionada] = React.useState(null);
    const [codigo, setCodigo] = React.useState('');
    const [loadingCtos, setLoadingCtos] = React.useState(false);
    const [salvando, setSalvando] = React.useState(false);
    const [ctoSelecionada, setCtoSelecionada] = React.useState(null);
    const [buscandoGps, setBuscandoGps] = React.useState(false);

    const handleCameraChange = React.useCallback((ev) => {
        setCameraProps(ev.detail);
    }, []);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await UseApi("olt");
                if (Array.isArray(response)) {
                    setOlt(response);
                }
            } catch (error) {
                console.error('Erro ao buscar dados:', error);
            }
        };
        fetchData();
    }, []);

    const carregarCtos = React.useCallback((e, forcar = false) => {
        if (!e) {
            setOlt(null);
            setCto([]);
            setCtoSelecionada(null);
            return;
        }

        if (!forcar && e?.id === olt?.id && cto.length > 0) return;

        setOlt(e);
        setLoadingCtos(true);
        setCtoSelecionada(null);

        const fetchData = async () => {
            try {
                const response = await UseApi(`olt/${e.id}/cto`);
                if (Array.isArray(response)) {
                    setCto(response);
                    setPortasPorCto({});

                    // Auto-enquadrar novas CTOs na tela
                    const coords = response
                        .map(c => ({ lat: parseFloat(c.lat), lng: parseFloat(c.longi) }))
                        .filter(c => !isNaN(c.lat) && !isNaN(c.lng));

                    if (coords.length > 0) {
                        const avgLat = coords.reduce((acc, c) => acc + c.lat, 0) / coords.length;
                        const avgLng = coords.reduce((acc, c) => acc + c.lng, 0) / coords.length;
                        setCameraProps({
                            center: { lat: avgLat, lng: avgLng },
                            zoom: coords.length > 20 ? 14 : 15,
                        });
                        showSuccess(`${response.length} CTOs carregadas.`);
                    }
                }
            } catch (error) {
                console.error('Erro ao buscar CTOs:', error);
                showError(error.message || 'Erro ao carregar CTOs da OLT.');
            } finally {
                setLoadingCtos(false);
            }
        };
        fetchData();
    }, [olt?.id, cto.length, showSuccess, showError]);

    const exibirPortas = React.useCallback(async (ctoId) => {
        if (portasPorCto[ctoId]) return;
        try {
            const response = await UseApi(`olt/cto/${ctoId}/portas`);
            if (Array.isArray(response)) {
                setPortasPorCto(prev => ({ ...prev, [ctoId]: response }));
            }
        } catch (error) {
            console.error('Erro ao buscar portas:', error);
        }
    }, [portasPorCto]);

    const recarregarPortasDaCto = React.useCallback(async (ctoId) => {
        try {
            const response = await UseApi(`olt/cto/${ctoId}/portas`);
            if (Array.isArray(response)) {
                setPortasPorCto(prev => ({ ...prev, [ctoId]: response }));
            }
        } catch (error) {
            console.error('Erro ao recarregar portas da CTO:', error);
        }
    }, []);

    const deletarCliente = React.useCallback(async (id) => {
        try {
            await UseApi(`olt/cto/porta/${id}`, 'DELETE');
            showSuccess('Cliente removido da porta.');
            await carregarCtos(olt, true);
        } catch (err) {
            showError(err.message || 'Erro ao remover cliente da porta.');
        }
    }, [olt, carregarCtos, showSuccess, showError]);

    const abrirFormulario = (portaId) => {
        setPortaSelecionada(portaId);
        setCodigo('');
        setExibirForm(true);
    };

    const addClientePorta = async (e) => {
        e.preventDefault();
        if (!portaSelecionada || !codigo.trim()) {
            showWarning('Selecione uma porta e informe o código do cliente.');
            return;
        }

        setSalvando(true);
        const form = { codigo, porta: portaSelecionada };

        try {
            await UseApi('olt/cto/porta/cadastrar', 'POST', form);
            showSuccess('Cliente vinculado à porta com sucesso!');

            const ctoId = Object.entries(portasPorCto).find(([, portas]) =>
                portas.some(porta => porta.id === portaSelecionada)
            )?.[0];

            if (ctoId) await recarregarPortasDaCto(ctoId);
        } catch (err) {
            console.error('Erro ao salvar cliente:', err);
            showError(err.message || 'Erro ao vincular cliente à porta.');
        } finally {
            setSalvando(false);
            setExibirForm(false);
            setCodigo('');
        }
    };

    const focarCto = React.useCallback((ctoItem) => {
        setCtoSelecionada(ctoItem);
        if (!ctoItem) return;
        const lat = parseFloat(ctoItem.lat);
        const lng = parseFloat(ctoItem.longi);
        if (!isNaN(lat) && !isNaN(lng)) {
            setCameraProps({
                center: { lat, lng },
                zoom: 18,
            });
            exibirPortas(ctoItem.id);
            showInfo(`Visualizando CTO "${ctoItem.label}".`);
        }
    }, [exibirPortas, showInfo]);

    const handleMinhaLocalizacao = () => {
        if (!navigator.geolocation) {
            showError('Geolocalização não é suportada neste navegador.');
            return;
        }
        setBuscandoGps(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setBuscandoGps(false);
                setCameraProps({
                    center: { lat: pos.coords.latitude, lng: pos.coords.longitude },
                    zoom: 17,
                });
                showSuccess('Posição atual GPS centralizada no mapa!');
            },
            (err) => {
                setBuscandoGps(false);
                console.error('Erro GPS:', err);
                showError('Não foi possível obter a sua localização GPS.');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleEnquadrarTodas = () => {
        if (!cto.length) {
            showWarning('Nenhuma CTO para enquadrar.');
            return;
        }
        const coords = cto
            .map(c => ({ lat: parseFloat(c.lat), lng: parseFloat(c.longi) }))
            .filter(c => !isNaN(c.lat) && !isNaN(c.lng));

        if (!coords.length) return;

        const avgLat = coords.reduce((acc, c) => acc + c.lat, 0) / coords.length;
        const avgLng = coords.reduce((acc, c) => acc + c.lng, 0) / coords.length;

        setCameraProps({
            center: { lat: avgLat, lng: avgLng },
            zoom: coords.length > 20 ? 14 : 15,
        });
        showInfo(`${coords.length} CTOs enquadradas no mapa.`);
    };

    const debouncedInputChange = React.useMemo(() => debounce(setOltInput, 300), []);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Barra de Ferramentas do Mapa */}
            <Paper
                elevation={1}
                sx={{
                    p: 2,
                    borderRadius: 2.5,
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                    bgcolor: 'background.paper',
                }}
            >
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    alignItems={{ xs: 'stretch', sm: 'center' }}
                    sx={{ flex: 1, minWidth: 260 }}
                >
                    <Box sx={{ minWidth: { xs: '100%', sm: 260 } }}>
                        <FieldAutoComplet
                            endpoint="olt"
                            label="Selecione a OLT"
                            aoAlterado={(e) => carregarCtos(e)}
                            onInputValueChange={debouncedInputChange}
                            valor={olt}
                            inputValue={oltInput}
                        />
                    </Box>

                    {cto.length > 0 && (
                        <Autocomplete
                            size="small"
                            options={cto}
                            getOptionLabel={(option) => option.label || `CTO #${option.id}`}
                            value={ctoSelecionada}
                            onChange={(_, val) => focarCto(val)}
                            sx={{ minWidth: { xs: '100%', sm: 260 } }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Buscar e Focar CTO"
                                    placeholder="Ex: CTO-01..."
                                />
                            )}
                        />
                    )}
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center">
                    {cto.length > 0 && (
                        <Stack direction="row" spacing={0.5} alignItems="center">
                            <SettingsEthernetIcon color="primary" fontSize="small" />
                            <Typography variant="body2" fontWeight={700} color="primary.main">
                                {`${cto.length} CTOs`}
                            </Typography>
                        </Stack>
                    )}

                    {cto.length > 0 && (
                        <Tooltip title="Enquadrar todas as CTOs no mapa">
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={handleEnquadrarTodas}
                                startIcon={<ZoomOutMapIcon />}
                                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                            >
                                Enquadrar
                            </Button>
                        </Tooltip>
                    )}

                    <Tooltip title="Centralizar na sua posição atual (GPS)">
                        <Button
                            variant="contained"
                            size="small"
                            onClick={handleMinhaLocalizacao}
                            disabled={buscandoGps}
                            startIcon={buscandoGps ? <CircularProgress size={16} color="inherit" /> : <MyLocationIcon />}
                            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                        >
                            Minha Posição
                        </Button>
                    </Tooltip>
                </Stack>
            </Paper>

            {/* Container do Google Maps */}
            {googleMapsApiKey ? (
                <Box
                    sx={{
                        position: 'relative',
                        width: '100%',
                        height: 'calc(100vh - 240px)',
                        minHeight: 560,
                        borderRadius: 2.5,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: 'divider',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    }}
                >
                    <APIProvider apiKey={googleMapsApiKey}>
                        <Map
                            mapId="solprovedordeinternet"
                            {...cameraProps}
                            style={{ width: '100%', height: '100%' }}
                            onCameraChanged={handleCameraChange}
                        >
                            {cto.map((dados) => (
                                <MarcadorCTO
                                    key={dados.id}
                                    lat={dados.lat}
                                    lng={dados.longi}
                                    label={dados.label}
                                    ctoId={dados.id}
                                    aoAbrir={exibirPortas}
                                    portas={portasPorCto[dados.id] || []}
                                    deletarClienteDaPorta={deletarCliente}
                                    abrirFormulario={abrirFormulario}
                                    destacado={ctoSelecionada?.id === dados.id}
                                />
                            ))}
                        </Map>
                    </APIProvider>

                    {loadingCtos && (
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 16,
                                right: 16,
                                zIndex: 1000,
                                bgcolor: 'background.paper',
                                px: 2,
                                py: 1,
                                borderRadius: 2,
                                boxShadow: 3,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                            }}
                        >
                            <CircularProgress size={18} />
                            <Typography variant="body2" fontWeight={700}>
                                Carregando CTOs...
                            </Typography>
                        </Box>
                    )}
                </Box>
            ) : (
                <Alert severity="warning" sx={{ my: 2 }}>
                    Configure <strong>VITE_GOOGLE_MAPS_API_KEY</strong> no seu ambiente para carregar o mapa interativo de CTOs.
                </Alert>
            )}

            {/* Modal de cadastro de cliente na porta */}
            <Dialog open={exibirForm} onClose={() => setExibirForm(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Vincular Cliente à Porta</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Código do Cliente"
                        fullWidth
                        value={codigo}
                        onChange={(e) => setCodigo(e.target.value)}
                        placeholder="Informe o código do cliente"
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setExibirForm(false)} disabled={salvando} sx={{ textTransform: 'none' }}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={addClientePorta}
                        variant="contained"
                        disabled={salvando || !codigo.trim()}
                        sx={{ textTransform: 'none', fontWeight: 700 }}
                    >
                        {salvando ? 'Salvando...' : 'Confirmar Vínculo'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
