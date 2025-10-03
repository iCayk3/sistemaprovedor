import { Typography } from "@mui/material";
import Person4Icon from "@mui/icons-material/Person4";
import styled from "styled-components";
import Groups3Icon from '@mui/icons-material/Groups3';

// Container para colocar as equipes lado a lado
const EquipesContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 32px; /* Espaçamento entre as equipes */
`;

// Cada equipe com seus técnicos
const EquipeBox = styled.div`
    padding: 16px;
    border-radius: 8px;
    min-width: 200px;
`;

const TecnicoBox = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
`;

const ListaEquipe = ({ rows }) => {
    return (
        <EquipesContainer>
            {rows && rows.map((dados) => (
                <EquipeBox key={dados.id}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        <Groups3Icon sx={{marginRight : 1}}/> {dados.label}
                    </Typography>
                    {dados.tecnicos && dados.tecnicos.map((t) => (
                        <TecnicoBox key={t.id}>
                            <Person4Icon />
                            <Typography variant="body1">{t.nome}</Typography>
                        </TecnicoBox>
                    ))}
                </EquipeBox>
            ))}
        </EquipesContainer>
    );
};

export default ListaEquipe;
