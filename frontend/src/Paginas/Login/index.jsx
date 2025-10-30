import * as React from 'react';
import {
  Button, FormControl, InputLabel, OutlinedInput, TextField,
  InputAdornment, Link, IconButton, Box, Typography, Paper
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
}

const CustomEmailField = React.memo(({ value, onChange, codigoErro }) => (
  <>
    <TextField
      error={codigoErro === 401 ? true : false}
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
  </>
));

const CustomPasswordField = React.memo(({ value, onChange, codigoErro }) => {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <FormControl
      sx={sxInputs}
      fullWidth
      variant="outlined"
    >
      <InputLabel size="small" htmlFor="outlined-adornment-password">Senha</InputLabel>
      <OutlinedInput
        error={codigoErro === 401 ? true : false}
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
      {codigoErro === 401 ? <Box sx={{color : 'red', ml : 1}}>
        Usuario ou senha invalidos!
      </Box> : ''}
    </FormControl>
  );
});

const UseApi = Api();

const Login = () => {
  const [usuario, setUsuario] = React.useState('');
  const [senha, setSenha] = React.useState('');
  const [erroCode, setErrorCode] = React.useState(200);

  const controllCodigoDigitoUser = (e) => {
    setErrorCode(200)
    setUsuario(e)
  }

  const controllCodigoDigitoPass = (e) => {
    setErrorCode(200)
    setSenha(e)
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    logar();
  };

  const logar = async () => {
    try {
      const form = { usuario, senha };
      const response = await UseApi('usuario/logar', 'POST', form);
      localStorage.setItem("user", JSON.stringify(response.user))
      window.location.href = "/";
    } catch (error) {
      setErrorCode(error?.status || 500);
      console.error('Erro ao fazer login:', error?.status);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url("/imagens/backgroudlogin1.jpg")`,
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
          Bem-vindo, faça login por favor!
        </Typography>
        <Box component="form" noValidate autoComplete="off" onSubmit={handleSubmit}>
          <CustomEmailField value={usuario} onChange={(e) => controllCodigoDigitoUser(e.target.value)} codigoErro={erroCode} />
          <CustomPasswordField value={senha} onChange={(e) => controllCodigoDigitoPass(e.target.value)} codigoErro={erroCode} />
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
          >
            Entrar
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
