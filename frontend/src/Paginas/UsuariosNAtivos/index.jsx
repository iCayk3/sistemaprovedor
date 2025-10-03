import { Box, Button, Paper, Typography } from "@mui/material"
import { useEffect, useState } from "react";
import Api from "../../Services/Api";

const UseApi = Api()

const UsuariosNAtivos = () => {

    const [usuariosNaoAtivos, setUsuariosNaoAtivos] = useState([])
    const [refresh, setRefresh] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await UseApi(`usuario/notactivate`);
                setUsuariosNaoAtivos(response);
            } catch (error) {
                console.error('Erro ao buscar dados:', error);
            }
        };

        fetchData();
    }, [refresh]);

    const ativar = async (id) => {
        try {
            await UseApi(`usuario/ativar/${id}`, 'POST');
            alert("Usuario ativado com sucesso");
            setRefresh(!refresh)
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
        }
    }

    return <>
        <Box sx={{ display: 'flex', gap: 4 }}>
            {usuariosNaoAtivos.map((dados) => (
                dados && <Paper elevation={3} sx={{ padding: 4, maxWidth: 400, width: '100%' }} key={dados.id}>
                    <Typography variant="h5" gutterBottom>usuario: {dados.usuario}</Typography>
                    <Typography variant="h5" gutterBottom>permissao: {dados.role}</Typography>
                    <Box component="div" noValidate autoComplete="off">
                        <Typography variant="subtitle1" gutterBottom>Clica a baixo para ativar</Typography>
                        <Button
                            variant="outlined"
                            color="info"
                            size="small"
                            fullWidth
                            sx={{ my: 2 }}
                            onClick={() => ativar(dados.id)}
                        >
                            ativar
                        </Button>

                    </Box>
                </Paper>))}
        </Box>
    </>
}

export default UsuariosNAtivos