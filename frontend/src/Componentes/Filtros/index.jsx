import { Box } from "@mui/material";
import BasicDatePicker from "../BasicDatePicker";
import FieldAutoComplet from "../FieldAutoComplet";

const Filtros = ({
    aoAlteradoTecnico,
    aoAlteradoData,
    aoAlteradoTecnicoLabel,
    valor,
    valorInput,
}) => {
    const selectData = (value) => {
        if (!value) {
            aoAlteradoData('');
            return;
        }
        try {
            aoAlteradoData(value.toISOString().slice(0, 10));
        } catch {
            aoAlteradoData('');
        }
    };

    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                gap: 2,
                mb: 2,
                alignItems: 'center',
            }}
        >
            <Box>
                <BasicDatePicker
                    aoAlterado={selectData}
                    label="Selecione a data"
                />
            </Box>
            <Box>
                <FieldAutoComplet
                    valor={valor}
                    inputValue={valorInput}
                    endpoint="tecnico/equipes"
                    label="Técnicos"
                    aoAlterado={aoAlteradoTecnico}
                    onInputValueChange={aoAlteradoTecnicoLabel}
                />
            </Box>
        </Box>
    );
};

export default Filtros;