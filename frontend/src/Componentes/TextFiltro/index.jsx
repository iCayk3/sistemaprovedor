import React, { useState } from 'react';
import { TextField, InputAdornment, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

export default function TextFiltro({ placeholder = "Pesquisar...", onChange }) {
  const [valor, setValor] = useState('');

  const handleChange = (e) => {
    const novoValor = e.target.value;
    setValor(novoValor);
    if (onChange) onChange(novoValor);
  };

  const limpar = () => {
    setValor('');
    if (onChange) onChange('');
  };

  return (
    <TextField
      value={valor}
      onChange={handleChange}
      placeholder={placeholder}
      size="small"
      variant="outlined"
      fullWidth
      sx={{
        '& .MuiOutlinedInput-root': {
          height: 40, // mesma altura do filtro do DataGrid
          borderRadius: '8px',
          backgroundColor: 'rgba(255,255,255,0.05)',
          color: '#fff',
          '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
          '&:hover fieldset': { borderColor: '#00e5ff' },
          '&.Mui-focused fieldset': { borderColor: '#00e5ff' },
        },
        '& input': {
          paddingLeft: '8px',
        },
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon fontSize="small" sx={{ color: '#aaa' }} />
          </InputAdornment>
        ),
        endAdornment: valor && (
          <InputAdornment position="end">
            <IconButton size="small" onClick={limpar}>
              <ClearIcon fontSize="small" sx={{ color: '#aaa' }} />
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
}
