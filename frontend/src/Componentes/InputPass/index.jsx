import { Box, FormControl, IconButton, InputAdornment, InputLabel, OutlinedInput } from "@mui/material";
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
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


const InputPass = ({ value, onChange, codigoErro, label, messagemErro }) => {

    const [showPassword, setShowPassword] = React.useState(false);

    return (<>

        <FormControl
            sx={sxInputs}
            fullWidth
            variant="outlined"
        >
            <InputLabel size="small" htmlFor="outlined-adornment-password">{label}</InputLabel>
            <OutlinedInput
                error={codigoErro === 401 || codigoErro === 400 ? true : false}
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
            {codigoErro === 401 || codigoErro === 400 ? <Box sx={{ color: 'red', ml: 1 }}>
                {messagemErro}
            </Box> : ''}
        </FormControl>
    </>);
}

export default InputPass