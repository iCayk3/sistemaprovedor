import * as React from 'react';
import {
  Button, FormControl, Checkbox, FormControlLabel, InputLabel,
  OutlinedInput, TextField, InputAdornment, Link, IconButton,
  Box, Typography, Paper
} from '@mui/material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Api from '../../Services/Api';

const CustomEmailField = React.memo(({ value, onChange }) => (
  <TextField
    label="Login"
    name="email"
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

const CustomPasswordField = React.memo(({ value, onChange }) => {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <FormControl sx={{ my: 2 }} fullWidth variant="outlined">
      <InputLabel size="small" htmlFor="outlined-adornment-password">Senha</InputLabel>
      <OutlinedInput
        type={showPassword ? 'text' : 'password'}
        name="password"
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
            >
              {showPassword ? <VisibilityOff fontSize="inherit" /> : <Visibility fontSize="inherit" />}
            </IconButton>
          </InputAdornment>
        }
        label="Senha"
      />
    </FormControl>
  );
});

const UseApi = Api();

const Login = () => {

  const [usuario, setUsuario] = React.useState('');
  const [senha, setSenha] = React.useState('');
  const [erroCode, setErrorCode] = React.useState(200);

  const handleSubmit = (e) => {
    e.preventDefault(); // impede o envio padrão
    logar();
  };

  const logar = async () => {
    try {
      const form = { usuario, senha };
      const response = await UseApi('usuario/logar', 'POST', form);
      localStorage.setItem("user", JSON.stringify(response.user))

      // Redireciona para forçar o AuthProvider a revalidar
      window.location.href = "/";
    } catch (error) {
      setErrorCode(error?.status || 500);
      console.error('Erro ao fazer login:', error);
    }
  };


  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: 'transparent',
      }}
    >
      <Paper elevation={3} sx={{ padding: 4, maxWidth: 400, width: '100%' }}>
        <Typography variant="h5" gutterBottom>Login</Typography>
        <Typography variant="subtitle1" gutterBottom>Bem-vindo, faça login por favor!</Typography>
        <Box component="form" noValidate autoComplete="off" onSubmit={handleSubmit}>
          <CustomEmailField value={usuario} onChange={(e) => setUsuario(e.target.value)} />
          <CustomPasswordField value={senha} onChange={(e) => setSenha(e.target.value)} />
          <Button
            variant="outlined"
            color="info"
            size="small"
            fullWidth
            sx={{ my: 2 }}
            type="submit"
          >
            Entrar
          </Button>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Link href="/register" variant="body2">Cadastre-se</Link>
            <Link href="/" variant="body2">Esqueceu sua senha?</Link>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;
