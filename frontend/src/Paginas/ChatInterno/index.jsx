import AddCommentOutlinedIcon from '@mui/icons-material/AddCommentOutlined';
import SendIcon from '@mui/icons-material/Send';
import {
    Avatar,
    Badge,
    Box,
    Button,
    Divider,
    List,
    ListItemAvatar,
    ListItemButton,
    ListItemText,
    MenuItem,
    Paper,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import Api from '../../Services/Api';

const apiClient = Api();

export default function ChatInterno({ onUnreadChange }) {
    const [usuarioAtual, setUsuarioAtual] = useState(null);
    const [usuarios, setUsuarios] = useState([]);
    const [conversas, setConversas] = useState([]);
    const [ativa, setAtiva] = useState(null);
    const [mensagens, setMensagens] = useState([]);
    const [destinatario, setDestinatario] = useState('');
    const [texto, setTexto] = useState('');
    const [enviando, setEnviando] = useState(false);
    const fimRef = useRef(null);

    const carregarConversas = useCallback(async () => {
        const lista = await apiClient('chat/conversas');
        setConversas(lista);
        onUnreadChange?.(lista.reduce((total, item) => total + item.naoLidas, 0));
        setAtiva((anterior) => anterior || lista[0]?.id || null);
    }, [onUnreadChange]);

    const carregarMensagens = useCallback(async (conversaId) => {
        if (!conversaId) return;
        const lista = await apiClient(`chat/conversas/${conversaId}/mensagens`);
        setMensagens(lista);
        onUnreadChange?.();
    }, [onUnreadChange]);

    useEffect(() => {
        Promise.all([apiClient('usuario/me'), apiClient('chat/usuarios'), carregarConversas()])
            .then(([me, listaUsuarios]) => {
                setUsuarioAtual(me);
                setUsuarios(listaUsuarios);
            });
    }, [carregarConversas]);

    useEffect(() => {
        carregarMensagens(ativa);
        const intervalo = setInterval(() => {
            carregarConversas();
            carregarMensagens(ativa);
        }, 5000);
        return () => clearInterval(intervalo);
    }, [ativa, carregarConversas, carregarMensagens]);

    useEffect(() => {
        fimRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [mensagens]);

    const novaConversa = async () => {
        if (!destinatario) return;
        const conversa = await apiClient('chat/conversas', 'POST', { usuarioId: Number(destinatario) });
        await carregarConversas();
        setAtiva(conversa.id);
        setDestinatario('');
    };

    const enviar = async () => {
        const mensagem = texto.trim();
        if (!mensagem || !ativa || enviando) return;
        setEnviando(true);
        setTexto('');
        try {
            await apiClient(`chat/conversas/${ativa}/mensagens`, 'POST', { texto: mensagem });
            await Promise.all([carregarMensagens(ativa), carregarConversas()]);
        } finally {
            setEnviando(false);
        }
    };

    const conversaAtiva = conversas.find((item) => item.id === ativa);

    return (
        <Paper variant="outlined" sx={{ height: 'calc(100vh - 150px)', minHeight: 560, display: 'flex', overflow: 'hidden' }}>
            <Box sx={{ width: { xs: ativa ? 0 : '100%', md: 330 }, display: { xs: ativa ? 'none' : 'block', md: 'block' }, borderRight: '1px solid', borderColor: 'divider' }}>
                <Stack spacing={1} sx={{ p: 2 }}>
                    <Typography variant="h6" fontWeight={800}>Chat interno</Typography>
                    <TextField select size="small" label="Conversar com" value={destinatario} onChange={(e) => setDestinatario(e.target.value)}>
                        {usuarios.map((usuario) => (
                            <MenuItem key={usuario.id} value={usuario.id}>{usuario.usuario}</MenuItem>
                        ))}
                    </TextField>
                    <Button variant="contained" startIcon={<AddCommentOutlinedIcon />} disabled={!destinatario} onClick={novaConversa}>
                        Iniciar conversa
                    </Button>
                </Stack>
                <Divider />
                <List disablePadding>
                    {conversas.map((conversa) => (
                        <ListItemButton key={conversa.id} selected={conversa.id === ativa} onClick={() => setAtiva(conversa.id)}>
                            <ListItemAvatar>
                                <Badge color="error" badgeContent={conversa.naoLidas}>
                                    <Avatar>{conversa.usuario.slice(0, 1).toUpperCase()}</Avatar>
                                </Badge>
                            </ListItemAvatar>
                            <ListItemText
                                primary={conversa.usuario}
                                secondary={conversa.ultimaMensagem || 'Conversa iniciada'}
                                secondaryTypographyProps={{ noWrap: true }}
                            />
                        </ListItemButton>
                    ))}
                </List>
            </Box>
            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                {conversaAtiva ? (
                    <>
                        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                            <Button sx={{ display: { md: 'none' } }} onClick={() => setAtiva(null)}>Voltar</Button>
                            <Avatar>{conversaAtiva.usuario.slice(0, 1).toUpperCase()}</Avatar>
                            <Typography fontWeight={800}>{conversaAtiva.usuario}</Typography>
                        </Stack>
                        <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: 'action.hover' }}>
                            <Stack spacing={1}>
                                {mensagens.map((mensagem) => {
                                    const propria = mensagem.autorId === usuarioAtual?.id;
                                    return (
                                        <Box key={mensagem.id} sx={{ alignSelf: propria ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                                            <Paper sx={{ px: 1.5, py: 1, bgcolor: propria ? 'primary.main' : 'background.paper', color: propria ? 'primary.contrastText' : 'text.primary' }}>
                                                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{mensagem.texto}</Typography>
                                            </Paper>
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(mensagem.enviadaEm).toLocaleString('pt-BR')}
                                            </Typography>
                                        </Box>
                                    );
                                })}
                                <div ref={fimRef} />
                            </Stack>
                        </Box>
                        <Stack direction="row" spacing={1} sx={{ p: 2 }}>
                            <TextField
                                fullWidth multiline maxRows={4} value={texto} label="Mensagem"
                                onChange={(e) => setTexto(e.target.value.slice(0, 4000))}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        enviar();
                                    }
                                }}
                            />
                            <Button variant="contained" disabled={!texto.trim() || enviando} onClick={enviar} aria-label="Enviar">
                                <SendIcon />
                            </Button>
                        </Stack>
                    </>
                ) : (
                    <Box sx={{ flex: 1, display: 'grid', placeItems: 'center' }}>
                        <Typography color="text.secondary">Selecione ou inicie uma conversa.</Typography>
                    </Box>
                )}
            </Box>
        </Paper>
    );
}
