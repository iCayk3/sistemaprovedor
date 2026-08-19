import AddCommentOutlinedIcon from '@mui/icons-material/AddCommentOutlined';
import CloseIcon from '@mui/icons-material/Close';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import { ChatBox } from '@mui/x-chat';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    Fab,
    IconButton,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Api from '../../Services/Api';

const apiClient = Api();

function extrairTexto(message) {
    return (message?.parts || [])
        .filter((part) => part.type === 'text')
        .map((part) => part.text || '')
        .join('\n')
        .trim();
}

function streamResposta(mensagem) {
    const messageId = mensagem.id;
    const textId = `text-${messageId}`;
    return new ReadableStream({
        start(controller) {
            controller.enqueue({ type: 'start', messageId });
            controller.enqueue({ type: 'text-start', id: textId });
            controller.enqueue({ type: 'text-delta', id: textId, delta: extrairTexto(mensagem) });
            controller.enqueue({ type: 'text-end', id: textId });
            controller.enqueue({ type: 'finish', messageId, finishReason: 'stop' });
            controller.close();
        },
    });
}

export default function AssistenteIa() {
    const [aberto, setAberto] = useState(false);
    const [modo, setModo] = useState('ATENDIMENTO');
    const [status, setStatus] = useState(null);
    const [conversas, setConversas] = useState([]);
    const [conversaAtiva, setConversaAtiva] = useState();
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState('');
    const [chatKey, setChatKey] = useState(0);

    const carregar = useCallback(async () => {
        setCarregando(true);
        setErro('');
        try {
            const [estado, lista] = await Promise.all([
                apiClient('ia/status'),
                apiClient('ia/conversas'),
            ]);
            setStatus(estado);
            let atuais = lista;
            if (atuais.length === 0) {
                const nova = await apiClient('ia/conversas', 'POST', { modo: 'ATENDIMENTO' });
                atuais = [nova];
            }
            setConversas(atuais);
            setConversaAtiva((anterior) =>
                atuais.some((item) => item.id === anterior) ? anterior : atuais[0].id
            );
            setChatKey((valor) => valor + 1);
        } catch (error) {
            setErro(error.message || 'Não foi possível carregar o chat.');
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => {
        if (aberto) carregar();
    }, [aberto, carregar]);

    const criarConversa = async () => {
        setCarregando(true);
        setErro('');
        try {
            const nova = await apiClient('ia/conversas', 'POST', { modo });
            setConversas((atuais) => [nova, ...atuais]);
            setConversaAtiva(nova.id);
            setChatKey((valor) => valor + 1);
        } catch (error) {
            setErro(error.message || 'Não foi possível criar a conversa.');
        } finally {
            setCarregando(false);
        }
    };

    const adapter = useMemo(() => ({
        async listConversations() {
            return { conversations: conversas, hasMore: false };
        },
        async listMessages({ conversationId }) {
            const messages = await apiClient(`ia/conversas/${conversationId}/mensagens`);
            return { messages, hasMore: false };
        },
        async sendMessage({ conversationId, message, signal }) {
            if (signal.aborted) throw new DOMException('Envio cancelado', 'AbortError');
            const texto = extrairTexto(message);
            const resposta = await apiClient(
                `ia/conversas/${conversationId}/mensagens`,
                'POST',
                { mensagem: texto },
            );
            if (signal.aborted) throw new DOMException('Envio cancelado', 'AbortError');
            setConversas((atuais) => atuais.map((item) =>
                item.id === resposta.conversa.id ? resposta.conversa : item
            ));
            return streamResposta(resposta.mensagem);
        },
    }), [conversas]);

    return (
        <>
            <Fab
                color="primary"
                aria-label="Abrir chat interno"
                onClick={() => setAberto(true)}
                sx={{ position: 'fixed', right: 24, bottom: 24, zIndex: 1300 }}
            >
                <SmartToyOutlinedIcon />
            </Fab>
            <Dialog
                open={aberto}
                onClose={() => setAberto(false)}
                fullWidth
                maxWidth="lg"
                PaperProps={{ sx: { height: { xs: '100%', md: '82vh' }, m: { xs: 0, md: 2 } } }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SmartToyOutlinedIcon color="primary" />
                    <Box sx={{ flex: 1 }}>
                        <Typography fontWeight={800}>Chat interno SOL</Typography>
                        <Typography variant="caption" color="text.secondary">
                            Histórico privado por usuário · canal Web interno
                        </Typography>
                    </Box>
                    <IconButton onClick={() => setAberto(false)} aria-label="Fechar">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 2 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                        <TextField
                            select
                            size="small"
                            label="Tipo da nova conversa"
                            value={modo}
                            onChange={(event) => setModo(event.target.value)}
                            sx={{ minWidth: 220 }}
                        >
                            <MenuItem value="ATENDIMENTO">Atendimento</MenuItem>
                            <MenuItem value="ANALISE">Análise de dados</MenuItem>
                        </TextField>
                        <Button
                            variant="outlined"
                            startIcon={<AddCommentOutlinedIcon />}
                            onClick={criarConversa}
                            disabled={carregando || status?.configurada === false}
                        >
                            Nova conversa
                        </Button>
                    </Stack>
                    {status && !status.configurada && (
                        <Alert severity="warning">Configure o provedor de IA para enviar mensagens.</Alert>
                    )}
                    {erro && <Alert severity="error">{erro}</Alert>}
                    {carregando || !conversaAtiva ? (
                        <Box sx={{ flex: 1, display: 'grid', placeItems: 'center' }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <ChatBox
                            key={chatKey}
                            adapter={adapter}
                            initialConversations={conversas}
                            initialActiveConversationId={conversaAtiva}
                            currentUser={{ id: 'usuario-atual', displayName: 'Você', role: 'user' }}
                            members={[
                                { id: 'usuario-atual', displayName: 'Você', role: 'user' },
                                { id: 'assistente-sol', displayName: 'Assistente SOL', role: 'assistant' },
                            ]}
                            features={{
                                conversationList: true,
                                conversationHeader: true,
                                dateDivider: true,
                                attachments: false,
                                helperText: true,
                                suggestions: false,
                            }}
                            onActiveConversationChange={setConversaAtiva}
                            onError={(chatError) => setErro(chatError.message)}
                            roleDisplayNames={{ user: 'Você', assistant: 'Assistente SOL' }}
                            sx={{
                                flex: 1,
                                minHeight: 0,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
