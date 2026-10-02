import { Box, Paper, Stack, Typography } from "@mui/material";
import Person4Icon from "@mui/icons-material/Person4";
import Groups3Icon from '@mui/icons-material/Groups3';

const ListaEquipe = ({ rows }) => {
    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                gap: 3,
            }}
        >
            {rows && rows.map((dados) => (
                <Paper
                    variant="outlined"
                    key={dados.id}
                    sx={{ p: 2, borderRadius: 2 }}
                >
                    <Typography
                        variant="h6"
                        fontWeight={700}
                        sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}
                    >
                        <Groups3Icon sx={{ mr: 1, color: 'primary.main' }} /> {dados.label}
                    </Typography>
                    <Stack spacing={1}>
                        {dados.tecnicos && dados.tecnicos.map((t) => (
                            <Box
                                key={t.id}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    py: 0.5,
                                }}
                            >
                                <Person4Icon fontSize="small" color="action" />
                                <Typography variant="body2">{t.nome}</Typography>
                            </Box>
                        ))}
                    </Stack>
                </Paper>
            ))}
        </Box>
    );
};

export default ListaEquipe;
