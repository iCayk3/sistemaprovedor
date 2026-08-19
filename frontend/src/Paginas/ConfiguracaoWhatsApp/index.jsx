import { Alert, Button, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import Api from '../../Services/Api';

const api = Api();

export default function ConfiguracaoWhatsApp() {
    const [config, setConfig] = useState({
        provedor: 'EVOLUTION', ativo: false, evolutionUrl: '', evolutionInstancia: '', evolutionApiKey: '',
        webhookPublicUrl: `${window.location.origin}/api/integracoes/whatsapp/evolution/webhook`,
    });
    const [webhookToken, setWebhookToken] = useState('');
    const [salvando, setSalvando] = useState(false);
    const [aviso, setAviso] = useState('');

    useEffect(() => {
        api('integracoes/whatsapp/configuracao').then((dados) => {
            setConfig({
                ...dados,
                webhookPublicUrl: dados.webhookPublicUrl || `${window.location.origin}/api/integracoes/whatsapp/evolution/webhook`,
            });
            setWebhookToken(dados.webhookToken);
        });
    }, []);

    const alterar = (campo) => (event) => setConfig((atual) => ({
        ...atual,
        [campo]: campo === 'ativo' ? event.target.value === 'true' : event.target.value,
    }));

    const salvar = async () => {
        setSalvando(true);
        setAviso('');
        try {
            const resultado = await api('integracoes/whatsapp/configuracao', 'PUT', config);
            setConfig(resultado);
            setWebhookToken(resultado.webhookToken);
            setAviso('Configuração salva.');
        } catch (error) {
            setAviso(error.message);
        } finally {
            setSalvando(false);
        }
    };

    const webhookUrl = `${(config.webhookPublicUrl || '').replace(/\/+$/, '')}/${webhookToken}`;

    return (
        <Paper variant="outlined" sx={{ p: 3, maxWidth: 760 }}>
            <Stack spacing={2}>
                <Typography variant="h4" fontWeight={800}>Integração WhatsApp</Typography>
                <Alert severity="info">
                    A API Oficial está reservada para implementação futura. Atualmente, selecione Evolution.
                </Alert>
                <TextField select label="Provedor" value={config.provedor} onChange={alterar('provedor')}>
                    <MenuItem value="EVOLUTION">Evolution API</MenuItem>
                    <MenuItem value="OFICIAL">WhatsApp Oficial — em breve</MenuItem>
                </TextField>
                <TextField select label="Integração ativa" value={String(config.ativo)} onChange={alterar('ativo')}>
                    <MenuItem value="true">Sim</MenuItem>
                    <MenuItem value="false">Não</MenuItem>
                </TextField>
                <TextField label="URL da Evolution API" placeholder="https://evo.seudominio.com" value={config.evolutionUrl || ''} onChange={alterar('evolutionUrl')} />
                <TextField label="Nome da instância" value={config.evolutionInstancia || ''} onChange={alterar('evolutionInstancia')} />
                <TextField type="password" label="API key" value={config.evolutionApiKey || ''} onChange={alterar('evolutionApiKey')} helperText="A chave existente é exibida mascarada." />
                <TextField label="URL pública base do webhook" value={config.webhookPublicUrl || ''} onChange={alterar('webhookPublicUrl')} helperText="Precisa ser acessível pela Evolution API; o token será acrescentado automaticamente." />
                {webhookToken && (
                    <TextField label="URL final do webhook MESSAGES_UPSERT" value={webhookUrl} InputProps={{ readOnly: true }} helperText="Será cadastrada automaticamente na instância ao salvar." />
                )}
                {aviso && <Alert severity={aviso === 'Configuração salva.' ? 'success' : 'error'}>{aviso}</Alert>}
                <Button variant="contained" onClick={salvar} disabled={salvando || config.provedor === 'OFICIAL'}>
                    Salvar configuração
                </Button>
            </Stack>
        </Paper>
    );
}
