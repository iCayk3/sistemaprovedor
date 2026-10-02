import { memo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    FormControl,
    IconButton,
    InputAdornment,
    InputLabel,
    Link,
    OutlinedInput,
    Paper,
    TextField,
    Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import AccountCircle from "@mui/icons-material/AccountCircle";
import ArrowCircleLeftIcon from "@mui/icons-material/ArrowCircleLeft";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import Api from "../../Services/Api";

const sxInputs = {
    mb: 2,
    '& .MuiOutlinedInput-root': {
        borderRadius: '12px',
        background: 'rgba(255,255,255,0.05)',
        color: '#fff',
        '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
        '&:hover fieldset': { borderColor: '#00e5ff' },
        '&.Mui-focused fieldset': { borderColor: '#00e5ff' },
    },
    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
};

const CustomEmailField = memo(({ value, onChange }) => (
    <TextField
        label="Usuário"
        name="usuario"
        type="text"
        size="small"
        required
        fullWidth
        value={value}
        onChange={onChange}
        InputProps={{
            startAdornment: (
                <InputAdornment position="start">
                    <AccountCircle sx={{ color: 'rgba(255,255,255,0.7)' }} />
                </InputAdornment>
            ),
        }}
        variant="outlined"
        sx={sxInputs}
    />
));

const CustomPasswordField = memo(({ label, value, onChange, error, helperText }) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <FormControl sx={sxInputs} fullWidth variant="outlined" error={error}>
            <InputLabel size="small" htmlFor={`input-${label}`}>{label}</InputLabel>
            <OutlinedInput
                id={`input-${label}`}
                type={showPassword ? 'text' : 'password'}
                size="small"
                value={value}
                onChange={onChange}
                endAdornment={
                    <InputAdornment position="end">
                        <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            onMouseDown={(e) => e.preventDefault()}
                            edge="end"
                            size="small"
                            sx={{ color: 'rgba(255,255,255,0.7)' }}
                        >
                            {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                    </InputAdornment>
                }
                label={label}
            />
            {helperText && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                    {helperText}
                </Typography>
            )}
        </FormControl>
    );
});

const UseApi = Api();

const Register = () => {
    const [usuario, setUsuario] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [loading, setLoading] = useState(false);
    const [erroMensagem, setErroMensagem] = useState('');
    const [enviado, setEnviado] = useState(false);

    const cadastrar = async (e) => {
        e.preventDefault();
        setErroMensagem('');

        const userClean = usuario.trim();
        if (!userClean) {
            setErroMensagem('Por favor, informe o nome de usuário.');
            return;
        }

        if (senha.length < 8) {
            setErroMensagem('A senha deve ter no mínimo 8 caracteres.');
            return;
        }

        if (senha !== confirmarSenha) {
            setErroMensagem('As senhas digitadas não coincidem.');
            return;
        }

        setLoading(true);
        try {
            await UseApi('usuario', 'POST', { usuario: userClean, senha });
            setEnviado(true);
        } catch (error) {
            setErroMensagem(error.message || 'Erro ao realizar o cadastro. Tente novamente.');
            console.error('Erro ao cadastrar usuário:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                backgroundImage: 'linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url("/imagens/backgroudlogin1.jpg")',
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    position: 'relative',
                    padding: 4,
                    maxWidth: 400,
                    width: '100%',
                    borderRadius: '16px',
                    background: 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    color: '#fff',
                }}
            >
                <Link component={RouterLink} to="/login" variant="body2" sx={{ color: '#00e5ff', display: 'inline-flex', mb: 2 }}>
                    <ArrowCircleLeftIcon />
                </Link>

                {!enviado ? (
                    <Box component="form" noValidate onSubmit={cadastrar}>
                        <Typography variant="h5" fontWeight={600} gutterBottom>
                            Cadastre-se
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 3, color: 'rgba(255,255,255,0.7)' }}>
                            Preencha os dados abaixo para solicitar seu acesso.
                        </Typography>

                        {erroMensagem && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {erroMensagem}
                            </Alert>
                        )}

                        <CustomEmailField
                            value={usuario}
                            onChange={(e) => setUsuario(e.target.value)}
                        />
                        <CustomPasswordField
                            label="Senha"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            error={senha.length > 0 && senha.length < 8}
                            helperText={senha.length > 0 && senha.length < 8 ? 'Mínimo de 8 caracteres' : ''}
                        />
                        <CustomPasswordField
                            label="Confirmar Senha"
                            value={confirmarSenha}
                            onChange={(e) => setConfirmarSenha(e.target.value)}
                            error={confirmarSenha.length > 0 && senha !== confirmarSenha}
                            helperText={confirmarSenha.length > 0 && senha !== confirmarSenha ? 'Senhas não coincidem' : ''}
                        />

                        <Button
                            variant="contained"
                            fullWidth
                            type="submit"
                            disabled={loading}
                            sx={{
                                my: 2,
                                py: 1.2,
                                borderRadius: '12px',
                                background: 'linear-gradient(90deg, #00e5ff, #2979ff)',
                                color: '#fff',
                                fontWeight: 600,
                                '&:hover': {
                                    background: 'linear-gradient(90deg, #2979ff, #00e5ff)',
                                },
                            }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Cadastrar'}
                        </Button>
                    </Box>
                ) : (
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: '#00e5ff' }}>
                            Solicitação enviada!
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 3, color: 'rgba(255,255,255,0.8)' }}>
                            Seu cadastro foi realizado. Aguarde o administrador liberar seu acesso ao sistema.
                        </Typography>
                        <Button
                            variant="outlined"
                            component={RouterLink}
                            to="/login"
                            fullWidth
                            sx={{
                                borderRadius: '12px',
                                borderColor: '#00e5ff',
                                color: '#00e5ff',
                                '&:hover': {
                                    borderColor: '#2979ff',
                                    color: '#2979ff',
                                },
                            }}
                        >
                            Voltar para o Login
                        </Button>
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

export default Register;
