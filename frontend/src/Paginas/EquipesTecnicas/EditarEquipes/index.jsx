import ClearIcon from "@mui/icons-material/Clear";
import Person4Icon from "@mui/icons-material/Person4";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import {
    Alert,
    Box,
    Button,
    Chip,
    IconButton,
    Paper,
    Stack,
    Typography,
} from "@mui/material";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { useEffect, useMemo, useState } from "react";
import { DialogAction } from "../../../Componentes/DialogAction";
import Api from "../../../Services/Api";

const UseApi = Api();

const TechnicianChip = ({ technician, provided, onDelete }) => (
    <Box
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            p: 1,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            bgcolor: "background.paper",
        }}
    >
        <Chip icon={<Person4Icon />} label={technician.nome} size="small" />
        {onDelete && (
            <IconButton color="error" size="small" onClick={() => onDelete(technician.id)}>
                <ClearIcon fontSize="small" />
            </IconButton>
        )}
    </Box>
);

const DropArea = ({ droppableId, children, emptyText }) => (
    <Droppable droppableId={droppableId}>
        {(provided, snapshot) => (
            <Stack
                ref={provided.innerRef}
                {...provided.droppableProps}
                spacing={1}
                sx={{
                    minHeight: 96,
                    p: 1,
                    border: "1px dashed",
                    borderColor: snapshot.isDraggingOver ? "primary.main" : "divider",
                    borderRadius: 1,
                    bgcolor: snapshot.isDraggingOver ? "action.hover" : "transparent",
                }}
            >
                {children}
                {provided.placeholder}
                {!children?.length && (
                    <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
                        {emptyText}
                    </Typography>
                )}
            </Stack>
        )}
    </Droppable>
);

const EditarEquipes = ({ tecnicos, equipes, atualizar }) => {
    const [equipesRecebidas, setEquipesRecebidas] = useState(equipes);
    const [tecnicosSemEquipe, setTecnicosSemEquipe] = useState(tecnicos);
    const [excuirTecnico, setExcluirTecnico] = useState(null);
    const [excuirEquipe, setExcluirEquipe] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        setEquipesRecebidas(equipes);
    }, [equipes]);

    useEffect(() => {
        setTecnicosSemEquipe(tecnicos);
    }, [tecnicos]);

    const totals = useMemo(() => {
        const vinculados = equipesRecebidas.reduce((total, equipe) => total + (equipe.tecnicos?.length || 0), 0);
        return {
            equipes: equipesRecebidas.length,
            vinculados,
            semEquipe: tecnicosSemEquipe.length,
        };
    }, [equipesRecebidas, tecnicosSemEquipe]);

    const atualizarPagina = () => {
        atualizar((prev) => !prev);
    };

    const deletarTecnico = async (id) => {
        setError("");
        try {
            await UseApi(`tecnico/${id}`, "DELETE");
            setTecnicosSemEquipe((prev) => prev.filter((t) => t.id !== id));
            setExcluirTecnico(null);
            atualizarPagina();
        } catch (requestError) {
            console.error("Erro ao deletar tecnico:", requestError);
            setError(requestError.message || "Erro ao deletar tecnico.");
        }
    };

    const aoExcluirEquipe = async (id) => {
        setError("");
        try {
            await UseApi(`tecnico/equipe/${id}`, "DELETE");
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
            setExcluirEquipe(null);
        } catch (requestError) {
            console.error("Erro ao deletar equipe:", requestError);
            setError(requestError.message || "Erro ao deletar equipe.");
        }
    };

    const onDragEnd = (result) => {
        const { source, destination, draggableId } = result;
        if (!destination || source.droppableId === destination.droppableId) return;

        const tecnicoId = parseInt(draggableId.split("-")[1], 10);
        let tecnico = null;

        if (source.droppableId === "semEquipe") {
            tecnico = tecnicosSemEquipe.find((t) => t.id === tecnicoId);
            setTecnicosSemEquipe((prev) => prev.filter((t) => t.id !== tecnicoId));
        } else {
            const origem = equipesRecebidas.find((eq) => eq.id.toString() === source.droppableId);
            tecnico = origem?.tecnicos.find((t) => t.id === tecnicoId);
        }

        if (!tecnico) return;

        setEquipesRecebidas((prev) =>
            prev.map((eq) => ({
                ...eq,
                tecnicos: eq.tecnicos.filter((t) => t.id !== tecnicoId),
            }))
        );

        if (destination.droppableId === "semEquipe") {
            setTecnicosSemEquipe((prev) => (
                prev.some((t) => t.id === tecnico.id) ? prev : [...prev, tecnico]
            ));
            return;
        }

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
    };

    const salvarDados = async () => {
        setError("");
        try {
            await UseApi("tecnico/equipes", "PUT", {
                nomeEquipe: equipesRecebidas,
                tecnicos: tecnicosSemEquipe,
            });
            atualizarPagina();
        } catch (requestError) {
            console.error("Erro ao salvar equipes:", requestError);
            setError(requestError.message || "Erro ao salvar equipes.");
        }
    };

    const equipeParaExcluir = equipesRecebidas.find((equipe) => equipe.id === excuirEquipe);
    const tecnicoParaExcluir = tecnicosSemEquipe.find((tecnico) => tecnico.id === excuirTecnico);

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Box>
                <Paper variant="outlined" sx={{ p: 2.5, mb: 2, borderRadius: 2 }}>
                    <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2}>
                        <Box>
                            <Typography variant="h5" fontWeight={800}>Editar equipes</Typography>
                            <Typography color="text.secondary">
                                Arraste tecnicos entre equipes ou para a lista sem equipe.
                            </Typography>
                        </Box>
                        <Button variant="contained" startIcon={<SaveRoundedIcon />} onClick={salvarDados}>
                            Salvar alteracoes
                        </Button>
                    </Stack>
                </Paper>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Box
                    sx={{
                        display: "grid",
                        gap: 1.5,
                        gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
                        mb: 2,
                    }}
                >
                    {[
                        ["Equipes", totals.equipes],
                        ["Tecnicos vinculados", totals.vinculados],
                        ["Sem equipe", totals.semEquipe],
                    ].map(([label, value]) => (
                        <Paper key={label} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                            <Typography variant="caption" color="text.secondary">{label}</Typography>
                            <Typography variant="h5" fontWeight={800}>{value}</Typography>
                        </Paper>
                    ))}
                </Box>

                <Box
                    sx={{
                        display: "grid",
                        gap: 2,
                        gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1fr) 380px" },
                    }}
                >
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Typography variant="h6" fontWeight={800}>Equipes</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Solte um tecnico dentro de uma equipe para vincular.
                        </Typography>
                        <Box
                            sx={{
                                display: "grid",
                                gap: 2,
                                gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
                            }}
                        >
                            {equipesRecebidas.map((eq) => {
                                const items = eq.tecnicos.map((t, index) => (
                                    <Draggable key={`tecnico-${t.id}`} draggableId={`tecnico-${t.id}`} index={index}>
                                        {(provided) => <TechnicianChip technician={t} provided={provided} />}
                                    </Draggable>
                                ));

                                return (
                                    <Paper key={`equipe-${eq.id}`} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                            <Box>
                                                <Typography fontWeight={800}>{eq.label}</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {eq.tecnicos.length} tecnico(s)
                                                </Typography>
                                            </Box>
                                            <IconButton color="error" size="small" onClick={() => setExcluirEquipe(eq.id)}>
                                                <ClearIcon fontSize="small" />
                                            </IconButton>
                                        </Stack>
                                        <DropArea droppableId={eq.id.toString()} emptyText="Arraste tecnicos para esta equipe.">
                                            {items}
                                        </DropArea>
                                    </Paper>
                                );
                            })}
                            {!equipesRecebidas.length && (
                                <Alert severity="info">Nenhuma equipe cadastrada.</Alert>
                            )}
                        </Box>
                    </Paper>

                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Typography variant="h6" fontWeight={800}>Tecnicos sem equipe</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Solte aqui para remover o tecnico da equipe atual.
                        </Typography>
                        <DropArea droppableId="semEquipe" emptyText="Nenhum tecnico sem equipe.">
                            {tecnicosSemEquipe.map((t, index) => (
                                <Draggable key={`tecnico-${t.id}`} draggableId={`tecnico-${t.id}`} index={index}>
                                    {(provided) => (
                                        <TechnicianChip
                                            technician={t}
                                            provided={provided}
                                            onDelete={(id) => setExcluirTecnico(id)}
                                        />
                                    )}
                                </Draggable>
                            ))}
                        </DropArea>
                    </Paper>
                </Box>

                {excuirEquipe && (
                    <DialogAction
                        aoChamar={() => aoExcluirEquipe(excuirEquipe)}
                        titulo="Deletar equipe"
                        contexto={`Tem certeza que quer deletar a equipe: ${equipeParaExcluir?.label || "nao encontrada"}?`}
                        nomeAcao="Deletar"
                        abrir
                        aoFechar={() => setExcluirEquipe(null)}
                    />
                )}
                {excuirTecnico && (
                    <DialogAction
                        aoChamar={() => deletarTecnico(excuirTecnico)}
                        titulo="Deletar tecnico"
                        contexto={`Tem certeza que quer deletar o tecnico: ${tecnicoParaExcluir?.nome || "nao encontrado"}?`}
                        nomeAcao="Deletar"
                        abrir
                        aoFechar={() => setExcluirTecnico(null)}
                    />
                )}
            </Box>
        </DragDropContext>
    );
};

export default EditarEquipes;
