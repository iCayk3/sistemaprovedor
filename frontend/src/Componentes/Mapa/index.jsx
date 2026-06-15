import * as React from 'react';
import {
    APIProvider,
    Map,
} from '@vis.gl/react-google-maps';
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Button,
    CircularProgress
} from '@mui/material';
import Api from '../../Services/Api';
import FieldAutoComplet from '../FieldAutoComplet';
import MarcadorCTO from '../MarcadorCto';
import debounce from 'lodash/debounce';

const INITIAL_CAMERA = {
    center: { lat: -0.7741140809244029, lng: -47.177572460341565 },
    zoom: 15
};

const UseApi = Api();
const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "";

const Mapa = () => {
    const [olt, setOlt] = React.useState([]);
    const [cto, setCto] = React.useState([]);
    const [oltInput, setOltInput] = React.useState('');
    const [cameraProps, setCameraProps] = React.useState(INITIAL_CAMERA);
    const [portasPorCto, setPortasPorCto] = React.useState({});
    const [exibirForm, setExibirForm] = React.useState(false);
    const [portaSelecionada, setPortaSelecionada] = React.useState(null);
    const [codigo, setCodigo] = React.useState('');
    const [loadingCtos, setLoadingCtos] = React.useState(false);
    const [salvando, setSalvando] = React.useState(false);

    const handleCameraChange = React.useCallback((ev) => {
        setCameraProps(ev.detail);
    }, []);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await UseApi("olt");
                if (Array.isArray(response)) {
                    setOlt(response);
                } else {
                    console.warn("Resposta inesperada:", response);
                }
            } catch (error) {
                console.error('Erro ao buscar dados:', error);
            }
        };
        fetchData();
    }, []);

    const carregarCtos = (e, forcar = false) => {
        if (!e) {
            setOlt([]);
            setCto([]);
            return;
        }

        if (!forcar && e?.id === olt?.id && cto.length > 0) return;

        setOlt(e);
        setLoadingCtos(true);

        const fetchData = async () => {
            try {
                const response = await UseApi(`olt/${e.id}/cto`);
                if (Array.isArray(response)) {
                    setCto(response);
                    setPortasPorCto({});
                } else {
                    console.warn("Resposta inesperada:", response);
                }
            } catch (error) {
                console.error('Erro ao buscar CTOs:', error);
            } finally {
                setLoadingCtos(false);
            }
        };
        fetchData();
    };

    const exibirPortas = async (ctoId) => {
        if (portasPorCto[ctoId]) return;
        try {
            const response = await UseApi(`olt/cto/${ctoId}/portas`);
            if (Array.isArray(response)) {
                setPortasPorCto(prev => ({ ...prev, [ctoId]: response }));
            } else {
                console.warn("Resposta inesperada:", response);
            }
        } catch (error) {
            console.error('Erro ao buscar portas:', error);
        }
    };

    const deletarCliente = React.useCallback(async (id) => {
        await UseApi(`olt/cto/porta/${id}`, 'DELETE');
        await carregarCtos(olt, true);
    }, [olt]);

    const abrirFormulario = (portaId) => {
        setPortaSelecionada(portaId);
        setCodigo('');
        setExibirForm(true);
    };

    const recarregarPortasDaCto = async (ctoId) => {
        try {
            const response = await UseApi(`olt/cto/${ctoId}/portas`);
            if (Array.isArray(response)) {
                setPortasPorCto(prev => ({ ...prev, [ctoId]: response }));
            }
        } catch (error) {
            console.error('Erro ao recarregar portas da CTO:', error);
        }
    };

    const addClientePorta = async (e) => {
        e.preventDefault();
        if (!portaSelecionada || !codigo) return;

        setSalvando(true);
        const form = { codigo, porta: portaSelecionada };

        try {
            await UseApi('olt/cto/porta/cadastrar', 'POST', form);

            const ctoId = Object.entries(portasPorCto).find(([_, portas]) =>
                portas.some(porta => porta.id === portaSelecionada)
            )?.[0];

            if (ctoId) await recarregarPortasDaCto(ctoId);
        } catch (err) {
            console.error('Erro ao salvar cliente:', err);
        } finally {
            setSalvando(false);
            setExibirForm(false);
        }
    };

    const debouncedInputChange = React.useMemo(() => debounce(setOltInput, 300), []);

    return (
        <>
            <div className='controll-form' style={{marginBottom : 10}}>
                <FieldAutoComplet
                    endpoint={'olt'}
                    label={"OLT"}
                    aoAlterado={(e) => carregarCtos(e)}
                    onInputValueChange={debouncedInputChange}
                    valor={olt}
                    inputValue={oltInput}
                />
            </div>

            {googleMapsApiKey ? (
                <APIProvider apiKey={googleMapsApiKey}>
                    <Map
                        mapId={"solprovedordeinternet"}
                        {...cameraProps}
                        style={{ width: '100%', height: '100%' }}
                        onCameraChanged={handleCameraChange}
                    >
                        {loadingCtos ? (
                            <div style={{
                                position: 'absolute', top: 10, right: 10, zIndex: 1000, background: '#fff',
                                padding: '5px 10px', borderRadius: 8, boxShadow: '0 0 5px rgba(0,0,0,0.2)'
                            }}>
                                <CircularProgress size={20} />
                            </div>
                        ) : (
                            cto.map((dados) => (
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
                                />
                            ))
                        )}
                    </Map>
                </APIProvider>
            ) : (
                <div style={{ padding: 16, background: '#fff3cd', borderRadius: 8 }}>
                    Configure VITE_GOOGLE_MAPS_API_KEY para carregar o mapa.
                </div>
            )}

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
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setExibirForm(false)}>Cancelar</Button>
                    <Button
                        onClick={addClientePorta}
                        variant="contained"
                        color="primary"
                        disabled={salvando}
                    >
                        {salvando ? <CircularProgress size={20} /> : 'Salvar'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default Mapa;
