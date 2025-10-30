import { Box, Button, InputAdornment, Link, Paper, TextField, Typography } from "@mui/material"
import AccountCircle from '@mui/icons-material/AccountCircle';
import ArrowCircleLeftIcon from '@mui/icons-material/ArrowCircleLeft';
import InputPass from "../../Componentes/InputPass";
import * as React from 'react';
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
}

const sxInputBtn = {
    my: 2,
    py: 1.2,
    borderRadius: '12px',
    background: 'linear-gradient(90deg, #00e5ff, #2979ff)',
    color: '#fff',
    fontWeight: 600,
    '&:hover': {
        background: 'linear-gradient(90deg, #2979ff, #00e5ff)',
    },
}

const UseApi = Api();

const Passwd = () => {

    const [user, setUser] = React.useState('');
    const [checkUser, setCheckUser] = React.useState(202);
    const [newPass, setNewPass] = React.useState('');
    const [retNewPass, setRetNewPass] = React.useState('')
    const [erroCod, setErroCod] = React.useState(202)
    const [timeoutId, setTimeoutId] = React.useState(null);
    const [enviado, setEnviado] = React.useState(false)



    const handleSubmit = async (e) => {
        e.preventDefault()
        const form = {
            usuario: user,
            senha: newPass,
            senhaNovamente: retNewPass,
        }
        try {
            await UseApi(`usuario/solicitaredefinirsenha`, 'POST', form);
            setEnviado(true)
        } catch (error) {
            console.error("Erro ao aprovar requisição:", error);
        }
    };

    const checarUsuario = async (e) => {
        e.preventDefault()
        try {
            const form = { usuario: user };
            const response = await UseApi('usuario/userchek', 'POST', form);
            if (response) {
                setCheckUser(200)
            } else {
                setCheckUser(404)
            }
            console.log(response)
        } catch (error) {
            setErrorCode(error?.status || 500);
            console.error('Erro ao fazer login:', error?.status);
        }
    };

    const checkPass = React.useCallback(() => {

        if (newPass && retNewPass) {
            if (newPass !== retNewPass) {
                setErroCod(400); // erro
            } else {
                setErroCod(200); // sucesso
            }
        }
    }, [newPass, retNewPass, user]);

    React.useEffect(() => {
        if (timeoutId) clearTimeout(timeoutId);

        // Define novo timeout para 3 segundos
        const id = setTimeout(() => {
            checkPass();
        }, 1000);

        // Salva o id do timeout para controle
        setTimeoutId(id);

        // Limpeza quando componente desmontar ou valores mudarem
        return () => clearTimeout(id);
    }, [newPass, retNewPass, checkPass]);

    const validandoUsuario = (e) => {
        setCheckUser(202)
        setUser(e)
    }

    const checkPassword = (e) => {
        setRetNewPass(e)
        setErroCod(202)
    }

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
                <Box>
                    <Link href="/login" variant="body2" sx={{ color: '#048897', }}>
                        <ArrowCircleLeftIcon sx={{ mb: 4 }} />
                    </Link>
                    {!enviado ? <Box>
                        <Box component="form" noValidate autoComplete="off" onSubmit={checarUsuario}>
                            <TextField
                                error={checkUser === 404 ? true : false}
                                label="Login"
                                name="login"
                                type="text"
                                size="small"
                                required
                                fullWidth
                                value={user}
                                onChange={(e) => validandoUsuario(e.target.value)}
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
                            {checkUser === 404 ? <Typography sx={{ color: 'red' }}>Usuario inválido   </Typography> : ''}
                            {checkUser !== 200 ? <Button
                                variant="contained"
                                fullWidth
                                sx={sxInputBtn}
                                type="submit"
                            // disabled={erroCod !== 200 ? true : false}
                            >
                                Validar usuario
                            </Button> : ''}
                        </Box>
                        {checkUser === 200 ?
                            <Box component="form" noValidate autoComplete="off" onSubmit={handleSubmit}>
                                <InputPass
                                    label={"Digite a nova senha"}
                                    value={newPass} onChange={(e) => setNewPass(e.target.value)}
                                    codigoErro={erroCod}
                                />
                                <InputPass
                                    label={"Digite a senha novamente"}
                                    value={retNewPass}
                                    onChange={(e) => checkPassword(e.target.value)}
                                    messagemErro={"Senhas informadas não são iguais."}
                                    codigoErro={erroCod}
                                />
                                <Button
                                    variant="contained"
                                    fullWidth
                                    sx={sxInputBtn}
                                    type="submit"
                                    disabled={erroCod !== 200 ? true : false}
                                >
                                    Redefinir
                                </Button>
                            </Box> : ''}
                    </Box>
                        :
                        <Box>
                            <Typography>Aguarde a aprovação de algum administrador!</Typography>
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
                        </Box>}
                </Box>

            </Paper>
        </Box>
    )
}

export default Passwd