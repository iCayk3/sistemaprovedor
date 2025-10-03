import { Fab, FormControl, Typography, Button, IconButton, Box, styled } from "@mui/material";
import TextoInput from "../../../Componentes/TextoInput";
import { useState } from "react";
import Divider from "@mui/material/Divider";
import AddIcon from "@mui/icons-material/Add";
import ClearIcon from '@mui/icons-material/Clear';
import Api from "../../../Services/Api";
import FieldAutoComplet from "../../../Componentes/FieldAutoComplet";
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import Groups3Icon from '@mui/icons-material/Groups3';


const UseApi = Api()

const CadastroStyled = styled("section")`
    width: 100%;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 32px;

    @media only screen and (max-width: 930px) {
            display: block;
            box-sizing: border-box;
            grid-auto-rows: none
        }
`

const CadastrosEquipes = ({ atualizar }) => {
    const [nomeEquipe, setNomeEquipe] = useState('');
    const [tecnicos, setTecnicos] = useState([{ id: null, nome: '' }]);
    const [tecnicosAtualizar, setTecnicosAtualizar] = useState([{ id: null, nome: '' }]);
    const [tecnicoInput0, setTecnicoInput0] = useState('')
    const [tecnico0, setTecnico0] = useState('')

    const adicionarTecnico = ({ atualizar }) => {
        if (!atualizar) {
            setTecnicos([...tecnicos, { id: null, nome: '' }]);
        }
        if (atualizar) {
            setTecnicosAtualizar([...tecnicosAtualizar, { id: null, nome: '' }]);
        }
    };

    const atualizarTecnico = (index, valor, atualizar) => {
        if (!atualizar) {
            const novosTecnicos = [...tecnicos];
            novosTecnicos[index].nome = valor.target.value;
            setTecnicos(novosTecnicos);
        }
        if (atualizar) {
            const novosTecnicos = [...tecnicosAtualizar];
            novosTecnicos[index].nome = valor.target.value;
            setTecnicosAtualizar(novosTecnicos);
        }
    };

    const removerTecnico = (index, atualizar) => {
        if (!atualizar) {
            const novosTecnicos = tecnicos.filter((_, i) => i !== index);
            setTecnicos(novosTecnicos);
        }
        if (atualizar) {
            const novosTecnicos = tecnicosAtualizar.filter((_, i) => i !== index);
            setTecnicosAtualizar(novosTecnicos);
        }
    };

    const atualizarPagina = () => {
        atualizar(prev => !prev)
    }

    const enviarDados = async ({ atualizar }) => {

        const payload = {
            nomeEquipe: atualizar ? tecnico0.id : nomeEquipe,
            tecnicos: atualizar ? tecnicosAtualizar : tecnicos,
        };

        const fetchData = async () => {

            try {
                if (!atualizar) {
                    console.log(payload)
                    await UseApi(`tecnico/equipes`, 'POST', payload);
                    setNomeEquipe('')
                    setTecnicos([{ id: null, nome: '' }]);
                    alert(`Cadastro da equipe ${nomeEquipe} realizado com sucesso`)
                    atualizarPagina()
                }

                if (atualizar) {
                    console.log(payload)
                    await UseApi(`tecnico`, 'POST', payload);
                    setTecnico0('')
                    setTecnicosAtualizar([{ id: null, nome: '' }]);
                    alert(`Equipe "${nomeEquipe}" atualizada com sucesso com os técnicos: \n -${tecnicosAtualizar.map(n => n.nome).join('\n -')}`);
                    atualizarPagina()
                }

            } catch (error) {
                console.error('Erro ao buscar dados:', error);
            }
        };

        fetchData();
    };

    return (
        <CadastroStyled>
            <div>
                <FormControl sx={{ width: '100%', display: 'flex', gap: 2 }}>
                    <Typography variant="h4" component={"h4"} sx={{ marginBottom: 2 }}>
                        Cadastro de equipe
                    </Typography>
                    <Typography variant="h6" component={"h4"} sx={{ marginBottom: 2 }}>
                        Informe o nome da equipe
                    </Typography>
                    <TextoInput
                        labelProp={"Nome da equipe"}
                        obrigatorio
                        valor={nomeEquipe}
                        aoAlterado={(e) => setNomeEquipe(e.target.value)}
                        sx={{ width: '100%' }}
                    />
                    <Typography variant="h6" component={"h4"} sx={{ marginTop: 2 }}>
                        Técnicos
                    </Typography>
                    {tecnicos.map((tecnico, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton
                                color="error"
                                onClick={() => removerTecnico(index)}
                                aria-label="Remover técnico"
                            >
                                <ClearIcon />
                            </IconButton>
                            <TextoInput
                                labelProp={`Nome do técnico ${index + 1}`}
                                valor={tecnico.nome}
                                aoAlterado={(valor) => atualizarTecnico(index, valor)}
                                sx={{ width: '100%' }}
                            />
                        </Box>
                    ))}
                    <Fab size="small" color="primary" aria-label="add" onClick={adicionarTecnico} sx={{ marginTop: 1 }}>
                        <AddIcon />
                    </Fab>

                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => enviarDados(false)}
                        sx={{ marginTop: 2 }}
                    >
                        Cadastrar <Groups3Icon sx={{marginLeft : 2}}/>
                    </Button>
                </FormControl>
                <Divider sx={{ marginTop: 2, width: '100%', marginBottom: 4 }} />
            </div>
            <div>
                <FormControl sx={{ width: '100%', display: 'flex', gap: 2 }}>
                    <Typography variant="h4" component={"h4"} sx={{ marginBottom: 2 }}>
                        Cadastro de técnico
                    </Typography>
                    <Typography variant="h6" component={"h4"} sx={{ marginBottom: 2 }}>
                        Selecione a equipe
                    </Typography>

                    <FieldAutoComplet
                        endpoint={`tecnico/equipes`}
                        obrigatorio
                        nome={"Técnicos"}
                        aoAlterado={setTecnico0}
                        onInputValueChange={setTecnicoInput0}
                        valor={tecnico0}
                        inputValue={tecnicoInput0}
                    />
                    <Typography variant="h6" component={"h4"} sx={{ marginTop: 2 }}>
                        Técnicos
                    </Typography>
                    {tecnicosAtualizar.map((tecnico, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton
                                color="error"
                                onClick={() => removerTecnico(index, true)}
                                aria-label="Remover técnico"
                            >
                                <ClearIcon />
                            </IconButton>
                            {!tecnico0 && <FieldAutoComplet desabilitar label="Sem equipe cadastrada" />}
                            {tecnico0 && <TextoInput
                                labelProp={`Nome do técnico ${index + 1}`}
                                valor={tecnico.nome || " "}
                                aoAlterado={(valor) => atualizarTecnico(index, valor, true)}
                                sx={{ width: '100%' }}
                            />}
                        </Box>
                    ))}
                    <Fab size="small" color="primary" aria-label="add" onClick={() => adicionarTecnico({ atualizar: true })} sx={{ marginTop: 1 }}>
                        <AddIcon />
                    </Fab>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => enviarDados({ atualizar: true })}
                        sx={{ marginTop: 2 }}
                    >
                        Cadastrar técnico <PersonAddIcon sx={{marginLeft : 2}}/> 
                    </Button>
                </FormControl>
                <Divider sx={{ marginTop: 2, marginBottom: 2 }} />
            </div>

        </CadastroStyled>
    );
};

export default CadastrosEquipes;
