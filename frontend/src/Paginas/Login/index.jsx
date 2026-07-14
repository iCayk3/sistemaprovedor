import * as React from 'react';
import {
  Alert,
  Box,
  Button,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  Link,
  OutlinedInput,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Api from '../../Services/Api';

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

const CustomEmailField = React.memo(({ value, onChange, codigoErro }) => (
  <TextField
    error={codigoErro >= 400}
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
          <AccountCircle sx={{ color: 'rgba(255,255,255,0.7)' }} />
        </InputAdornment>
      ),
    }}
    variant="outlined"
    sx={sxInputs}
  />
));

const CustomPasswordField = React.memo(({ value, onChange, codigoErro }) => {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <FormControl sx={sxInputs} fullWidth variant="outlined">
      <InputLabel size="small" htmlFor="outlined-adornment-password">Senha</InputLabel>
      <OutlinedInput
        error={codigoErro >= 400}
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
              sx={{ color: 'rgba(255,255,255,0.7)' }}
            >
              {showPassword ? <VisibilityOff /> : <Visibility />}
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
  const [erroMensagem, setErroMensagem] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const clearError = () => {
    setErrorCode(200);
    setErroMensagem('');
  };

  const controllCodigoDigitoUser = (value) => {
    clearError();
    setUsuario(value);
  };

  const controllCodigoDigitoPass = (value) => {
    clearError();
    setSenha(value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    logar();
  };

  const logar = async () => {
    setLoading(true);
    setErroMensagem('');
    try {
      const response = await UseApi('usuario/logar', 'POST', { usuario, senha });
      localStorage.setItem('user', JSON.stringify(response.user));
      window.location.href = '/';
    } catch (error) {
      const status = error?.status ? `Erro ${error.status}: ` : '';
      const message = error?.message || 'Nao foi possivel conectar ao backend.';
      setErrorCode(error?.status || 500);
      setErroMensagem(`${status}${message}`);
      console.error('Erro ao fazer login:', error);
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
        <Typography variant="h5" gutterBottom fontWeight={600}>Login</Typography>
        <Typography variant="body2" gutterBottom sx={{ mb: 3, color: 'rgba(255,255,255,0.7)' }}>
          Bem-vindo, faca login por favor.
        </Typography>
        {erroMensagem && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {erroMensagem}
          </Alert>
        )}
        <Box component="form" noValidate autoComplete="off" onSubmit={handleSubmit}>
          <CustomEmailField
            value={usuario}
            onChange={(e) => controllCodigoDigitoUser(e.target.value)}
            codigoErro={erroCode}
          />
          <CustomPasswordField
            value={senha}
            onChange={(e) => controllCodigoDigitoPass(e.target.value)}
            codigoErro={erroCode}
          />
          <Button
            variant="contained"
            fullWidth
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
            type="submit"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Link href="/register" variant="body2" sx={{ color: '#00e5ff' }}>
              Cadastre-se
            </Link>
            <Link href="/forgotpass" variant="body2" sx={{ color: '#00e5ff' }}>
              Esqueceu sua senha?
            </Link>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;
