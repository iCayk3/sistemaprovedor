import { TextField } from "@mui/material";


const TextoInput = ({ labelProp, aoAlterado, obrigatorio, valor, tipo, sx}) => {
  return (
    <TextField
      label={labelProp}
      variant="outlined"   
      type={tipo}
      value={valor}
      required={obrigatorio}
      onChange={aoAlterado}
      sx={sx}
    />
  );
}

export default TextoInput
