import {
    Button,
    Chip,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Typography,
} from "@mui/material";
import FaceIcon from "@mui/icons-material/Face";
import ClearIcon from "@mui/icons-material/Clear";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import styled from "styled-components";
import { useState } from "react";
import Api from "../../../Services/Api";
import { DialogAction } from "../../../Componentes/DialogAction";
import Person4Icon from '@mui/icons-material/Person4';

const TecnicosDisplay = styled.span`
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;
`;

const DadosDisplay = styled.div`
  display: flex;
  width: 100%;
  gap: 16px;
`;

const UseApi = Api();

const EditarEquipes = ({ tecnicos, equipes, atualizar }) => {
    const [equipesRecebidas, setEquipesRecebidas] = useState(equipes);
    const [tecnicosSemEquipe, setTecnicosSemEquipe] = useState(tecnicos);
    const [excuirTecnico, setExcluirTecnico] = useState(null);
    const [excuirEquipe, setExcluirEquipe] = useState(null);

    const deletar = (id) => {
        setExcluirTecnico(id)
    };

    const atualizarPagina = () => {
        atualizar(prev => !prev)
    }

    const deletarTecnico = async (id) => {
        await UseApi(`tecnico/${id}`, 'DELETE')
        setTecnicosSemEquipe((prev) => prev.filter((t) => t.id !== id));
        atualizarPagina()
        const tecnico = tecnicosSemEquipe.find(t => t.id == id);
        alert(`Técnico: ${tecnico?.nome ?? 'não encontrado'} deletado`);
    }

    const aoExcluirEquipe = async (id) => {
        console.log(id)
        try {
            await UseApi(`tecnico/equipe/${id}`, 'DELETE')
            setEquipesRecebidas((prevEquipes) => {
                const equipeExcluida = prevEquipes.find((eq) => eq.id === id);
                const tecnicosParaMover = equipeExcluida?.tecnicos || [];

                setTecnicosSemEquipe((prev) => {
                    const novosTecnicos = tecnicosParaMover.filter(
                        (t) => !prev.some((existente) => existente.id === t.id)
                    );
                    return [...prev, ...novosTecnicos];
                });
                    return prevEquipes.filter((eq) => eq.id !== id);
                });
        } catch (e) {
            console.log("Erro : ", e)
        }
    };

    const onDragEnd = (result) => {
        const { source, destination, draggableId } = result;
        if (!destination) return;

        const tecnicoId = parseInt(draggableId.split("-")[1]);
        if (source.droppableId === destination.droppableId) return;

        let tecnico = null;

        // Identifica o técnico
        if (source.droppableId === "semEquipe") {
            tecnico = tecnicosSemEquipe.find((t) => t.id === tecnicoId);
            setTecnicosSemEquipe((prev) => prev.filter((t) => t.id !== tecnicoId));
        } else {
            const origem = equipesRecebidas.find(
                (eq) => eq.id.toString() === source.droppableId
            );
            tecnico = origem?.tecnicos.find((t) => t.id === tecnicoId);
        }

        if (!tecnico) return;

        // Remove o técnico de todas as equipes
        setEquipesRecebidas((prev) =>
            prev.map((eq) => ({
                ...eq,
                tecnicos: eq.tecnicos.filter((t) => t.id !== tecnicoId),
            }))
        );

        // Adiciona no destino
        if (destination.droppableId === "semEquipe") {
            setTecnicosSemEquipe((prev) => {
                if (!prev.some((t) => t.id === tecnico.id)) {
                    return [...prev, tecnico];
                }
                return prev;
            });
        } else {
            setEquipesRecebidas((prev) =>
                prev.map((eq) =>
                    eq.id.toString() === destination.droppableId
                        ? {
                            ...eq,
                            tecnicos: eq.tecnicos.some((t) => t.id === tecnico.id)
                                ? eq.tecnicos
                                : [...eq.tecnicos, tecnico],
                        }
                        : eq
                )
            );
        }
    };

    const salvarDados = async (e, t) => {
        const form = { nomeEquipe: e, tecnicos: t };
        try {
            await UseApi("tecnico/equipes", "PUT", form);
            alert("Equipes atualizadas");
        } catch (e) {
            console.log("Erro: " + e);
        }
        console.log(form);
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <DadosDisplay>
                <Typography component="div" sx={{ width: "60%" }}>
                    Equipes
                    {equipesRecebidas.map((eq) => (
                        <Droppable droppableId={eq.id.toString()} key={`equipe-${eq.id}`}>
                            {(provided) => (
                                <List
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    sx={{ border: "1px solid #ccc", borderRadius: 4, marginBottom: 2 }}
                                >
                                    <ListItem>
                                        <ListItemText
                                            primary={
                                                <div style={{ display: "flex", alignItems: "center" }}>
                                                    {eq.label}
                                                    <IconButton
                                                        color="error"
                                                        onClick={() => setExcluirEquipe(eq.id)}
                                                        sx={{ marginLeft: 1 }}
                                                    >
                                                        <ClearIcon />
                                                    </IconButton>
                                                </div>
                                            }
                                        />
                                    </ListItem>
                                    {eq.tecnicos.map((t, index) => (
                                        <Draggable
                                            key={`tecnico-${t.id}`}
                                            draggableId={`tecnico-${t.id}`}
                                            index={index}
                                        >
                                            {(provided) => (
                                                <ListItem
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                >
                                                    <Chip icon={<Person4Icon />} label={t.nome} />
                                                </ListItem>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </List>
                            )}
                        </Droppable>
                    ))}
                    {excuirEquipe && <DialogAction
                        aoChamar={() => aoExcluirEquipe(excuirEquipe)}
                        titulo={"Deletar equipe"}
                        contexto={`Tem certeza que quer deletar a equipe : ${equipesRecebidas.find(t => t.id == excuirEquipe).label}?`}
                        nomeAcao={"Deletar"}
                        abrir
                        aoFechar={() => setExcluirEquipe(null)}
                    />}
                    {excuirTecnico && <DialogAction
                        aoChamar={() => deletarTecnico(excuirTecnico)}
                        titulo={"Deletar técnico"}
                        contexto={`Tem certeza que quer deletar o técnico : ${tecnicosSemEquipe.find(t => t.id == excuirTecnico).nome}?`}
                        nomeAcao={"Deletar"}
                        abrir
                        aoFechar={() => setExcluirTecnico(null)}
                    />}
                </Typography>

                <Typography component="div" sx={{ width: "40%" }}>
                    Técnicos sem equipe
                    <Droppable droppableId="semEquipe">
                        {(provided) => (
                            <List
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                sx={{ border: "1px solid #ccc", borderRadius: 4, padding: 2 }}
                            >
                                {tecnicosSemEquipe.map((t, index) => (
                                    <Draggable
                                        key={`tecnico-${t.id}`}
                                        draggableId={`tecnico-${t.id}`}
                                        index={index}
                                    >
                                        {(provided) => (
                                            <ListItem
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                            >
                                                <Chip icon={<Person4Icon />} label={t.nome} onDelete={() => deletar(t.id)} />
                                            </ListItem>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </List>
                        )}
                    </Droppable>
                </Typography>
            </DadosDisplay>
            <Button
                sx={{ marginTop: 4, width: '59%' }}
                variant="contained"
                onClick={() => salvarDados(equipesRecebidas, tecnicosSemEquipe)}
            >
                Salvar
            </Button>
        </DragDropContext>
    );
};

export default EditarEquipes;
