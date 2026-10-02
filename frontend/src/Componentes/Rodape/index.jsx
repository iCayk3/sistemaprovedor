import { Box, Typography } from "@mui/material";

const Rodape = () => {
    return (
        <Box
            component="footer"
            sx={{
                mt: 8,
                py: 3,
                width: '100%',
                background: 'linear-gradient(180deg, #0f4c81, #2f80c0)',
                color: '#fff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 0.5,
            }}
        >
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                App de controle de serviço
            </Typography>
            <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: 0.5 }}>
                SOL PROVEDOR DE INTERNET
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.75 }}>
                Desenvolvido por Cayke Silva.
            </Typography>
        </Box>
    );
};

export default Rodape;