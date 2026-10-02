import { Box, Button, Typography } from "@mui/material";
import { useState } from "react";
import TextoInput from "../../../Componentes/TextoInput";
import Api from "../../../Services/Api";
import { useNotification } from "../../../Componentes/NotificationProvider";

const UseApi = Api();

const CadastroOlt = () => {
    const { showSuccess, showError, showWarning } = useNotification();
    const [nomeOlt, setNomeOlt] = useState('');
    const [latidude, setLatidude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [ipOlt, setIpOlt] = useState('');
    const [modeloOlt, setModeloOlt] = useState('');

    const cadastrarOlt = async (e) => {
        e.preventDefault();
        if (!nomeOlt.trim()) {
            showWarning('Informe o nome da OLT.');
            return;
        }

        const form = {
            nome: nomeOlt,
            ipOlt,
            modeloOlt,
            latidude,
            longitude,
        };

        try {
            const response = await UseApi(`olt`, 'POST', form);
            if (!response) {
                throw new Error('Erro ao enviar o formulário');
            }

            showSuccess(`OLT "${nomeOlt}" cadastrada com sucesso!`);
            setNomeOlt('');
            setLatidude('');
            setLongitude('');
            setIpOlt('');
            setModeloOlt('');
        } catch (error) {
            console.error('Erro na requisição:', error);
            showError(error.message || 'Erro ao cadastrar OLT.');
        }
    };

    return (
        <Box component="form" onSubmit={cadastrarOlt}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
                Informe o nome da OLT
            </Typography>
            <TextoInput
                labelProp="Nome da OLT"
                aoAlterado={(e) => setNomeOlt(e.target.value)}
                valor={nomeOlt}
                obrigatorio
                sx={{ width: '100%' }}
            />
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                    gap: 3,
                    mt: 3,
                }}
            >
                <Box>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        Informe Latitude
                    </Typography>
                    <TextoInput
                        labelProp="Latitude"
                        aoAlterado={(e) => setLatidude(e.target.value)}
                        valor={latidude}
                        sx={{ width: '100%' }}
                    />
                </Box>
                <Box>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        Informe a Longitude
                    </Typography>
                    <TextoInput
                        labelProp="Longitude"
                        aoAlterado={(e) => setLongitude(e.target.value)}
                        valor={longitude}
                        sx={{ width: '100%' }}
                    />
                </Box>
                <Box>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        Modelo da OLT
                    </Typography>
                    <TextoInput
                        labelProp="Modelo da OLT"
                        aoAlterado={(e) => setModeloOlt(e.target.value)}
                        valor={modeloOlt}
                        sx={{ width: '100%' }}
                    />
                </Box>
                <Box>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        IP da OLT
                    </Typography>
                    <TextoInput
                        labelProp="IP"
                        aoAlterado={(e) => setIpOlt(e.target.value)}
                        valor={ipOlt}
                        sx={{ width: '100%' }}
                    />
                </Box>
            </Box>
            <Button type="submit" variant="contained" sx={{ mt: 3 }}>
                Cadastrar
            </Button>
        </Box>
    );
};

export default CadastroOlt;