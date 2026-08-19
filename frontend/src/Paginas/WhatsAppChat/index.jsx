import SendIcon from '@mui/icons-material/Send';
import { Avatar, Badge, Box, List, ListItemAvatar, ListItemButton, ListItemText, Paper, Stack, TextField, Typography, Button } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import Api from '../../Services/Api';
const api = Api();

export default function WhatsAppChat({ onUnreadChange }) {
    const [conversas, setConversas] = useState([]);
    const [ativa, setAtiva] = useState(null);
    const [mensagens, setMensagens] = useState([]);
    const [texto, setTexto] = useState('');
    const fim = useRef(null);
    const carregarConversas = useCallback(async () => {
        const lista = await api('integracoes/whatsapp/conversas');
        setConversas(lista);
        onUnreadChange?.();
        setAtiva((id) => id || lista[0]?.id || null);
    }, [onUnreadChange]);
    const carregarMensagens = useCallback(async (id) => {
        if (id) setMensagens(await api(`integracoes/whatsapp/conversas/${id}/mensagens`));
    }, []);
    useEffect(() => { carregarConversas(); }, [carregarConversas]);
    useEffect(() => {
        carregarMensagens(ativa);
        const timer = setInterval(() => { carregarConversas(); carregarMensagens(ativa); }, 5000);
        return () => clearInterval(timer);
    }, [ativa, carregarConversas, carregarMensagens]);
    useEffect(() => fim.current?.scrollIntoView({ behavior: 'smooth' }), [mensagens]);
    const enviar = async () => {
        const valor = texto.trim();
        if (!valor || !ativa) return;
        setTexto('');
        await api(`integracoes/whatsapp/conversas/${ativa}/mensagens`, 'POST', { texto: valor });
        await carregarMensagens(ativa);
    };
    const contato = conversas.find((c) => c.id === ativa);
    return (
        <Paper variant="outlined" sx={{ height: 'calc(100vh - 150px)', minHeight: 560, display: 'flex', overflow: 'hidden' }}>
            <Box sx={{ width: 330, borderRight: '1px solid', borderColor: 'divider', overflowY: 'auto' }}>
                <Typography variant="h6" fontWeight={800} sx={{ p: 2 }}>WhatsApp</Typography>
                <List disablePadding>{conversas.map((c) => (
                    <ListItemButton key={c.id} selected={c.id === ativa} onClick={() => setAtiva(c.id)}>
                        <ListItemAvatar><Badge color="error" badgeContent={c.naoLidas}><Avatar>{(c.nome || c.numero)[0]}</Avatar></Badge></ListItemAvatar>
                        <ListItemText primary={c.nome || c.numero} secondary={c.ultimaMensagem} secondaryTypographyProps={{ noWrap: true }} />
                    </ListItemButton>
                ))}</List>
            </Box>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {contato ? <>
                    <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Typography fontWeight={800}>{contato.nome || contato.numero}</Typography>
                        <Typography variant="caption">{contato.numero}</Typography>
                    </Box>
                    <Stack spacing={1} sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: 'action.hover' }}>
                        {mensagens.map((m) => <Box key={m.id} sx={{ alignSelf: m.recebida ? 'flex-start' : 'flex-end', maxWidth: '75%' }}>
                            <Paper sx={{ p: 1.25, bgcolor: m.recebida ? 'background.paper' : 'success.main', color: m.recebida ? 'text.primary' : 'white' }}>
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{m.texto}</Typography>
                            </Paper>
                            {!m.recebida && <Typography variant="caption">{m.atendente}</Typography>}
                        </Box>)}<div ref={fim} />
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ p: 2 }}>
                        <TextField fullWidth multiline maxRows={4} label="Responder pelo WhatsApp" value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); } }} />
                        <Button variant="contained" color="success" onClick={enviar} disabled={!texto.trim()}><SendIcon /></Button>
                    </Stack>
                </> : <Box sx={{ flex: 1, display: 'grid', placeItems: 'center' }}><Typography color="text.secondary">Nenhuma conversa recebida.</Typography></Box>}
            </Box>
        </Paper>
    );
}
