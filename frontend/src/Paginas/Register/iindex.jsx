import { memo, useState } from "react"
import {
    Button, FormControl, Checkbox, FormControlLabel, InputLabel,
    OutlinedInput, TextField, InputAdornment, Link, IconButton,
    Box, Typography, Paper
} from '@mui/material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Api from "../../Services/Api";

const CustomEmailField = memo(({ value, onChange }) => (
    <TextField
        label="usuario"
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
                    <AccountCircle fontSize="inherit" />
                </InputAdornment>
            ),
        }}
        variant="outlined"
    />
));

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

const UseApi = Api()


const Register = () => {

    const [usuario, setUsuario] = useState('')
    const [senha, setSenha] = useState('')
    const [enviado, setEnviado] = useState(false)

    const cadastrar = async () => {
        // Adicionar validação final antes de enviar
        if (senha.length < 8) {
            alert('A senha deve ter no mínimo 8 caracteres.');
            return;
        }
        const form = { usuario, senha }
        await UseApi('usuario', 'POST', form)
        console.log(form)
        setEnviado(true)
    }

    return <>

        <Box
            component="form"
            noValidate
            autoComplete="off"
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                backgroundColor: 'transparent',
                flexDirection: 'column',
            }}
        >
            {!enviado ?
                <Paper elevation={3} sx={{ padding: 4, maxWidth: 400, width: '100%', m: 'auto', height: '100%', maxHeight: 400, mt: '20%' }}>
                    <Typography variant="h5" gutterBottom>Cadastrar-se</Typography>
                    <Typography variant="subtitle1" gutterBottom>Bem-vindo, preencha os campos, por favor!</Typography>
                    <Box>
                        <CustomEmailField value={usuario} onChange={(e) => setUsuario(e.target.value)} />
                        <CustomPasswordField value={senha} onChange={(e) => setSenha(e.target.value)} />
                        <Button
                            variant="outlined"
                            color="info"
                            size="small"
                            fullWidth
                            sx={{ my: 2 }}
                            onClick={() => cadastrar()}
                        >
                            Cadastrar
                        </Button>
                    </Box>
                </Paper>
                :
                <Box>
                    <Typography>Aguarde o administrador liberar o acesso!</Typography>
                    <Button
                        variant="outlined"
                        color="info"
                        size="small"
                        fullWidth
                        sx={{ my: 2 }}
                        href="/login"
                    >
                        Tela de login
                    </Button>
                </Box>

            }
        </Box>
    </>
}

export default Register;
