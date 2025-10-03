import { useEffect, useState } from "react"
import Api from "../../Services/Api"
import { Box, Button, Paper, Typography } from "@mui/material"
import UserGroup from "../../Componentes/UserGroup"

const UseApi = Api()

const status = [
    {
        status: "ATIVO"
    },
    {
        status: "BLOQUEADO"
    },
    {
        status: "INATIVO"
    },
]

const ManagementUser = () => {

    const [usuarios, setUsuarios] = useState([])
    const [refresh, setRefresh] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await UseApi(`usuario`);
                setUsuarios(response);
            } catch (error) {
                console.error('Erro ao buscar dados:', error);
            }
        };

        fetchData();
    }, [refresh]);

    const alterarStatus = async (id, status) => {

        const form = {
            id,
            status
        }

        try {
            await UseApi(`usuario/statuschange`, 'PUT', form);
            alert("Usuario alteador com sucesso");
            setRefresh(!refresh)
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
        }
    }

    const alterarPermissao = async (id, role) => {

        const form = {
            id,
            role
        }

        try {
            await UseApi(`usuario/levelchange`, 'PUT', form);
            alert("Usuario alteador com sucesso");
            setRefresh(!refresh)
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
        }
    }

    return (
        status.map(statu => <UserGroup
            key={statu.status}
            usuarios={usuarios.filter(userstatus => userstatus.status === statu.status)}
            statu={statu.status}
            onChagen={alterarStatus}
            onRoleChange={alterarPermissao}
        />)
    )

}

export default ManagementUser