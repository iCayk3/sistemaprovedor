import { Box, Button, InputAdornment, Paper, TextField } from "@mui/material"
import AccountCircle from '@mui/icons-material/AccountCircle';
import InputPass from "../../Componentes/InputPass";
import * as React from 'react';


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

const Passwd = () => {

    const [user, setUser] = React.useState('');
    const [checkUser, setCheckUser] = React.useState(202);
    const [newPass, setNewPass] = React.useState('');
    const [retNewPass, setRetNewPass] = React.useState('')
    const [erroCod, setErroCod] = React.useState(202)
    const [timeoutId, setTimeoutId] = React.useState(null);


    const handleSubmit = (e) => {
        e.preventDefault();
        const form = {
            user,
            retNewPass,
        }
        console.log(form)
    };

    const checkPass = React.useCallback(() => {

        if(checkUser !== 200){
            console.log("checando usuario " + user)
        }

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

    const checkPassword = (e) => {
        setRetNewPass(e)
        setErroCod(202)
    }

    return (
        <>
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
                    <Box component="form" noValidate autoComplete="off" onSubmit={handleSubmit}>
                        <TextField
                            // error={codigoErro === 401 ? true : false}
                            label="Login"
                            name="login"
                            type="text"
                            size="small"
                            required
                            fullWidth
                            value={user}
                            onChange={(e) => setUser(e.target.value)}
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
                        <InputPass label={"Digite a nova senha"} value={newPass} onChange={(e) => setNewPass(e.target.value)} codigoErro={erroCod} />
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
                            disabled = {erroCod !== 200 ? true : false}
                        >
                            Redefinir
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </>
    )
}

export default Passwd