import { Box, Button, FormControl, IconButton, InputAdornment, InputLabel, OutlinedInput, Typography } from "@mui/material"
import { memo, useState } from "react"
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Api from "../../Services/Api";

const usuario = JSON.parse(localStorage.getItem('user'))
const UseApi = Api()

const CustomPasswordField = memo(({ value, onChange }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [passwordError, setPasswordError] = useState(false);

    const handlePasswordChange = (e) => {
        const newPassword = e.target.value;
        onChange(e); // Passa o evento original para o onChange do componente pai
        setPasswordError(newPassword.length < 8 && newPassword.length > 0); // Define o erro se menor que 8 e não vazio
    };

    return (
        <FormControl sx={{ my: 2 }} fullWidth variant="outlined">
            <InputLabel size="small" htmlFor="outlined-adornment-password">Senha</InputLabel>
            <OutlinedInput
                type={showPassword ? 'text' : 'password'}
                name="password"
                size="small"
                value={value}
                onChange={handlePasswordChange} // Usa o novo handler
                endAdornment={
                    <InputAdornment position="end">
                        <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            onMouseDown={(e) => e.preventDefault()}
                            edge="end"
                            size="small"
                        >
                            {showPassword ? <VisibilityOff fontSize="inherit" /> : <Visibility fontSize="inherit" />}
                        </IconButton>
                    </InputAdornment>
                }
                label="Senha"
                inputProps={{ minLength: 8 }} // Adiciona minLength para validação HTML5
                error={passwordError} // Aplica o estilo de erro do Material-UI
            />
            {passwordError && (
                <Typography variant="caption" color="error" sx={{ ml: 2 }}>
                    A senha deve ter no mínimo 8 caracteres.
                </Typography>
            )}
        </FormControl>
    );
});

const SettingsPerfil = () => {

    const [trocaSenha, setTrocaSenha] = useState(false)
    const [senhaAtual, setSenhaAtual] = useState('')
    const [novaSenha, setNovaSenha] = useState('')
    const [confirmaSenha, setConfirmaSenha] = useState('')
    const [passwordError, setPasswordError] = useState(false) 

    const trocarSenha = async () => {
    const form = {
        senhaAtual,
        novaSenha,
        confirmaSenha,
    };

    if (novaSenha !== confirmaSenha) {
        setPasswordError(true);
        alert("Nova senha e confirmação são diferentes");
        return;
    }

    if (novaSenha.length < 8) {
        setPasswordError(true);
        alert("Senha deve ter pelo menos 8 caracteres");
        return;
    }

    try {
        await UseApi('usuario/senha', 'PUT', form);
        alert("Senha alterada com sucesso");
    } catch (err) {
        console.error("Erro ao trocar senha:", err.message);
        alert(`Erro: ${err.message}`);
    }
};


    return <>
        <Typography variant="h4" sx={{ mt: 4 }}>
            Informações do usuário
        </Typography>
        <Typography variant="h6" sx={{ mt: 4 }}>
            Usuario: {usuario.usuario}
        </Typography>
        <Button
            variant="outlined"
            color="info"
            size="small"
            fullWidth
            sx={{ my: 2, width: '20%' }}
            onClick={() => setTrocaSenha(!trocaSenha)}
        >
            Alterar senha?
        </Button>
        {trocaSenha &&
            <Box
                sx={{ width: '30%' }}
            >
                <CustomPasswordField value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} />
                <CustomPasswordField value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} cor={passwordError ? "error" : "primary"}/>
                <CustomPasswordField value={confirmaSenha} onChange={(e) => setConfirmaSenha(e.target.value)} cor={passwordError ? "error" : "primary"}/>
                <Box sx={{display : 'flex', gap : 2}}>
                    <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        fullWidth
                        sx={{ my: 2 }}
                        onClick={() => trocarSenha()}
                    >
                        Salvar
                    </Button>
                    <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        fullWidth
                        sx={{ my: 2 }}
                        onClick={() => setTrocaSenha(!trocaSenha)}
                    >
                        Cancelar
                    </Button>
                </Box>
            </Box>}
    </>
}

export default SettingsPerfil