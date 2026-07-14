import * as React from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Api from '../../Services/Api';

const UseApi = Api();

const FieldAutoComplet = ({
    endpoint,
    label,
    aoAlterado,
    dadosProcedimento,
    desabilitar,
    porta,
    obrigatorio,
    valor,
    inputValue,
    onInputValueChange,
    sx
}) => {

    const [data, setData] = React.useState([]);

    React.useEffect(() => {
        const fetchData = async () => {
            if (!endpoint) return;

            try {
                const response = await UseApi(`${endpoint}`);
                setData(response);
            } catch (error) {
                console.error('Erro ao buscar dados:', error);
            }
        };

        fetchData();
    }, [endpoint, UseApi]); // Dependências adequadas


    return (
        <>
            {/* Caso: endpoint ou dados via API */}
            {!porta && !desabilitar && !dadosProcedimento &&
                <Autocomplete
                    value={valor}
                    inputValue={inputValue}
                    onChange={(evento, novoValor) => aoAlterado(novoValor)}
                    onInputChange={(event, novoInput) => onInputValueChange(novoInput)}
                    options={data}
                    getOptionLabel={(option) => option.label || ""}
                    isOptionEqualToValue={(option, value) => option.id === value?.id}
                    disablePortal
                    renderInput={(params) => (
                        <TextField {...params} required={obrigatorio} label={label} sx={sx}/>
                    )}
                />
            }

            {/* Caso: dados estáticos via props */}
            {dadosProcedimento && !endpoint &&
                <Autocomplete
                    value={valor}
                    inputValue={inputValue}
                    onChange={(evento, novoValor) => aoAlterado(novoValor)}
                    onInputChange={(event, novoInput) => onInputValueChange(novoInput)}
                    options={dadosProcedimento}
                    getOptionLabel={(option) => option.label || ""}
                    isOptionEqualToValue={(option, value) => option.id === value?.id}
                    disablePortal
                    renderInput={(params) => (
                        <TextField {...params} required={obrigatorio} label={label} />
                    )}
                />
            }

            {/* Caso: desabilitado */}
            {!porta && desabilitar && !dadosProcedimento && !data &&
                <Autocomplete
                    disabled
                    disablePortal
                    options={[]}
                    renderInput={(params) => (
                        <TextField {...params} label={label} />
                    )}
                />
            }

            {!porta && desabilitar && !dadosProcedimento && !endpoint &&
                <Autocomplete
                    disabled
                    disablePortal
                    options={[]}
                    renderInput={(params) => (
                        <TextField {...params} label={label} />
                    )}
                />
            }

            {/* Caso: com 'porta' ativa */}
            {porta && !desabilitar && !dadosProcedimento && data.length > 0 &&
                <Autocomplete
                    value={valor}
                    inputValue={inputValue}
                    onChange={(evento, novoValor) => aoAlterado(novoValor)}
                    onInputChange={(event, novoInput) => onInputValueChange(novoInput)}
                    options={data}
                    getOptionLabel={(option) => `${option?.label || ''}: ${option?.cliente?.Codigo || ''}`}
                    isOptionEqualToValue={(option, value) => option.id === value?.id}
                    disablePortal
                    renderInput={(params) => (
                        <TextField {...params} required={obrigatorio} label={label} />
                    )}
                />
            }
        </>
    );
}

export default FieldAutoComplet
