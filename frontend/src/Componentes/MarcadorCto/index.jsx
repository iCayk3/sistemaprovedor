import React, { useEffect, useState } from 'react';
import { AdvancedMarker, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import { Typography } from '@mui/material';

import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { DialogAction } from '../DialogAction';

const MarcadorCTO = React.memo(({ lat, lng, label, aoAbrir, portas, ctoId, deletarClienteDaPorta, abrirFormulario }) => {
    const [markerRef, marker] = useAdvancedMarkerRef();
    const [exibir, setExibir] = useState(false);
    const [listaPortas, setListaPortas] = useState([]);

    useEffect(() => {
        if (!marker) return;
    }, [marker]);

    useEffect(() => {
        setListaPortas(portas || []);
    }, [portas]);

    const aoMouseEmCima = () => {
        setExibir(prev => !prev);
        if (!portas?.length) {
            aoAbrir(ctoId);
        }
    };

    if (!lat || !lng) return null;

    return (
        <>
            <AdvancedMarker
                position={{ lat: parseFloat(lat), lng: parseFloat(lng) }}
                onClick={aoMouseEmCima}
                ref={markerRef}
            >
                <Typography
                    variant="h5"
                    component="h5"
                    sx={{
                        color: "#832900",
                        marginBottom: 2,
                        width: "16px",
                        fontSize: "14px",
                        textAlign: "center",
                        fontWeight: "bold"
                    }}
                >
                    {label}
                </Typography>
                <img src='imagens/cto.png' alt='CTO' style={{ width: "32px" }} />
            </AdvancedMarker>

            {exibir && marker && (
                <InfoWindow
                    anchor={marker}
                    style={{ color: "#000", height: 300, padding: 8 }}
                    onCloseClick={() => {
                        setExibir(false);
                    }}
                >
                    <div>
                        <h2>{label}</h2>
                        {listaPortas.length > 0 ? (
                            listaPortas.map((dados, idx) => (
                                <h4 key={idx}>
                                    porta {dados.label} : {dados.cliente?.Codigo || "vazio"}
                                    {dados.cliente?.Codigo ? (
                                        <DialogAction
                                            aoChamar={() => deletarClienteDaPorta(dados.id)}
                                            titulo={"Deletar cliente"}
                                            contexto={"Você tem certeza que quer deletar esse cliente?"}
                                            nomeAcao={"Deletar"}
                                            icon={<DeleteIcon sx={{ color: "#610202" }} />}
                                        />
                                    ) : (
                                        <DialogAction
                                            aoChamar={() => abrirFormulario(dados.id)}
                                            titulo={"Registrar cliente"}
                                            contexto={"Você deseja registrar um cliente nessa porta?"}
                                            nomeAcao={"Registrar"}
                                            icon={<AddIcon sx={{ color: "#011158" }} />}
                                        />
                                    )}
                                </h4>
                            ))
                        ) : (
                            <p>Nenhuma porta disponível.</p>
                        )}
                    </div>
                </InfoWindow>
            )}
        </>
    );
});

export default MarcadorCTO;
