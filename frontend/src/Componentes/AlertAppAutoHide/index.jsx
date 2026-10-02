import { Alert, Box, Typography } from "@mui/material";

export default function AlertAppAutoHide({ texto, color = 'info', onclose }) {
    const validSeverity = ['error', 'warning', 'info', 'success'].includes(color)
        ? color
        : color === 'danger'
        ? 'error'
        : 'info';

    return (
        <Box sx={{ my: 1 }}>
            <Alert severity={validSeverity} onClose={onclose}>
                <Typography variant="body2" fontWeight={700}>
                    {texto}
                </Typography>
            </Alert>
        </Box>
    );
}