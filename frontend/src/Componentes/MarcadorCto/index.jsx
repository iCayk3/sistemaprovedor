import React, { useEffect, useState, useMemo } from 'react';
import { AdvancedMarker, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import {
    Box,
    Divider,
    IconButton,
    LinearProgress,
    Paper,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SettingsEthernetIcon from '@mui/icons-material/SettingsEthernet';
import { DialogAction } from '../DialogAction';

const MarcadorCTO = React.memo(({
    lat,
    lng,
    label,
    aoAbrir,
    portas,
    ctoId,
    deletarClienteDaPorta,
    abrirFormulario,
    destacado = false,
}) => {
    const [markerRef, marker] = useAdvancedMarkerRef();
    const [exibir, setExibir] = useState(false);
    const [listaPortas, setListaPortas] = useState([]);

    useEffect(() => {
        setListaPortas(portas || []);
    }, [portas]);

    useEffect(() => {
        if (destacado) {
            setExibir(true);
            if (!portas?.length) {
                aoAbrir(ctoId);
            }
        }
    }, [destacado, ctoId, portas?.length, aoAbrir]);

    const aoClicarMarcador = () => {
        setExibir((prev) => !prev);
        if (!portas?.length) {
            aoAbrir(ctoId);
        }
    };

    const metricas = useMemo(() => {
        const total = listaPortas.length;
        const ocupadas = listaPortas.filter((p) => Boolean(p.cliente?.Codigo)).length;
        const livres = total - ocupadas;
        const percentualOcupado = total > 0 ? Math.round((ocupadas / total) * 100) : 0;
        return { total, ocupadas, livres, percentualOcupado };
    }, [listaPortas]);

    if (!lat || !lng) return null;

    return (
        <>
            <AdvancedMarker
                position={{ lat: parseFloat(lat), lng: parseFloat(lng) }}
                onClick={aoClicarMarcador}
                ref={markerRef}
            >
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out',
                        transform: destacado ? 'scale(1.25)' : 'scale(1)',
                        zIndex: destacado ? 999 : 'auto',
                        filter: destacado ? 'drop-shadow(0 0 10px #ff9800)' : 'none',
                        '&:hover': { transform: 'scale(1.15)' },
                    }}
                >
                    <Box
                        sx={{
                            bgcolor: destacado ? '#e65100' : 'rgba(15, 76, 129, 0.92)',
                            color: '#ffffff',
                            px: 1,
                            py: 0.25,
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 800,
                            whiteSpace: 'nowrap',
                            boxShadow: destacado ? '0 0 12px rgba(230,81,0,0.8)' : '0 2px 6px rgba(0,0,0,0.3)',
                            mb: 0.5,
                            border: destacado ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.4)',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        {label}
                    </Box>
                    <img
                        src="/imagens/cto.png"
                        alt="CTO"
                        style={{ width: '36px', height: '36px', objectFit: 'contain' }}
                    />
                </Box>
            </AdvancedMarker>

            {exibir && marker && (
                <InfoWindow
                    anchor={marker}
                    onCloseClick={() => setExibir(false)}
                >
                    <Box sx={{ p: 1, minWidth: 280, maxWidth: 360, color: 'text.primary' }}>
                        {/* Header da CTO */}
                        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} mb={1}>
                            <Typography variant="subtitle1" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <SettingsEthernetIcon color="primary" fontSize="small" />
                                {label}
                            </Typography>
                            <Typography
                                variant="caption"
                                fontWeight={700}
                                color={metricas.percentualOcupado >= 85 ? 'error.main' : metricas.percentualOcupado >= 50 ? 'warning.main' : 'success.main'}
                            >
                                {`${metricas.percentualOcupado}% ocupada`}
                            </Typography>
                        </Stack>

                        {/* Barra de Progresso de Ocupação */}
                        <Box sx={{ mb: 1.5 }}>
                            <LinearProgress
                                variant="determinate"
                                value={metricas.percentualOcupado}
                                color={metricas.percentualOcupado >= 85 ? 'error' : metricas.percentualOcupado >= 50 ? 'warning' : 'success'}
                                sx={{ height: 6, borderRadius: 3 }}
                            />
                            <Stack direction="row" justifyContent="space-between" mt={0.5}>
                                <Typography variant="caption" color="text.secondary">
                                    Total: <strong>{metricas.total}</strong>
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 700 }}>
                                    Livres: {metricas.livres}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 700 }}>
                                    Ocupadas: {metricas.ocupadas}
                                </Typography>
                            </Stack>
                        </Box>

                        <Divider sx={{ my: 1 }} />

                        {/* Régua de Portas em Grid */}
                        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', mb: 1, display: 'block' }}>
                            Painel de Portas
                        </Typography>

                        {listaPortas.length > 0 ? (
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(2, 1fr)',
                                    gap: 1,
                                    maxHeight: 220,
                                    overflowY: 'auto',
                                    pr: 0.5,
                                }}
                            >
                                {listaPortas.map((portaItem) => {
                                    const ocupada = Boolean(portaItem.cliente?.Codigo);
                                    return (
                                        <Paper
                                            key={portaItem.id}
                                            variant="outlined"
                                            sx={{
                                                p: 0.75,
                                                borderRadius: 1.5,
                                                bgcolor: ocupada ? 'rgba(211, 47, 47, 0.08)' : 'rgba(46, 125, 50, 0.08)',
                                                borderColor: ocupada ? 'rgba(211, 47, 47, 0.3)' : 'rgba(46, 125, 50, 0.3)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                            }}
                                        >
                                            <Box sx={{ minWidth: 0 }}>
                                                <Typography variant="body2" fontWeight={800} noWrap>
                                                    P{portaItem.label}
                                                </Typography>
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        color: ocupada ? 'error.dark' : 'success.dark',
                                                        fontWeight: 600,
                                                        display: 'block',
                                                        fontSize: '11px',
                                                    }}
                                                    noWrap
                                                >
                                                    {ocupada ? `Cód: ${portaItem.cliente.Codigo}` : 'Livre'}
                                                </Typography>
                                            </Box>

                                            <Box>
                                                {ocupada ? (
                                                    <DialogAction
                                                        aoChamar={() => deletarClienteDaPorta(portaItem.id)}
                                                        titulo="Desvincular cliente"
                                                        contexto={`Tem certeza que deseja remover o cliente #${portaItem.cliente.Codigo} da porta ${portaItem.label}?`}
                                                        nomeAcao="Remover"
                                                        icon={
                                                            <Tooltip title="Remover cliente da porta">
                                                                <IconButton size="small" color="error">
                                                                    <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        }
                                                    />
                                                ) : (
                                                    <DialogAction
                                                        aoChamar={() => abrirFormulario(portaItem.id)}
                                                        titulo="Conectar cliente"
                                                        contexto={`Deseja registrar e conectar um cliente na porta ${portaItem.label}?`}
                                                        nomeAcao="Conectar"
                                                        icon={
                                                            <Tooltip title="Conectar cliente nesta porta">
                                                                <IconButton size="small" color="primary">
                                                                    <AddCircleOutlineIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        }
                                                    />
                                                )}
                                            </Box>
                                        </Paper>
                                    );
                                })}
                            </Box>
                        ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                                Nenhuma porta encontrada para esta CTO.
                            </Typography>
                        )}
                    </Box>
                </InfoWindow>
            )}
        </>
    );
});

export default MarcadorCTO;
