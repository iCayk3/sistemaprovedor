import { useState } from "react"
import FieldAutoComplet from "../../../Componentes/FieldAutoComplet"
import { Button, Typography } from "@mui/material"
import TextoInput from "../../../Componentes/TextoInput"
import styled from "styled-components"
import Api from "../../../Services/Api"

const FormularioStyled = styled.form`
    .sub-area{
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 32px;
        margin-top: 32px;
    }
`

const portas = [
    { id: 1, label: "1" },
    { id: 2, label: "2" },
    { id: 3, label: "3" },
    { id: 4, label: "4" },
    { id: 5, label: "5" },
    { id: 6, label: "6" },
    { id: 7, label: "7" },
    { id: 8, label: "8" },
    { id: 9, label: "9" },
    { id: 10, label: "10" },
    { id: 11, label: "11" },
    { id: 12, label: "12" },
    { id: 13, label: "13" },
    { id: 14, label: "14" },
    { id: 15, label: "15" },
    { id: 16, label: "16" },
    { id: 17, label: "17" },
    { id: 18, label: "18" },
    { id: 19, label: "19" },
    { id: 20, label: "20" },
    { id: 21, label: "21" },
    { id: 22, label: "22" },
    { id: 23, label: "23" },
    { id: 24, label: "24" },
];

const UseApi = Api();

const CadastroCto = () => {

    const [olt, setOlt] = useState('')
    const [oltInput, setOltInput] = useState('')
    const [nomeCto, setNomeCto] = useState('')
    const [latidude, setLatidude] = useState('')
    const [longitude, setLongitude] = useState('')
    const [porta, setPorta] = useState('')
    const [portaInput, setPortaInput] = useState('')

    const cadastrarCto = async (e) => {
        e.preventDefault()
        const form = {
            idOlt: olt.id,
            nomeCto,
            portas: porta.id,
            latidude,
            longitude
        }

        try {
            const response = await UseApi(`olt/cto`, 'POST', form);
            console.log(response)
            if (!response) {
                throw new Error('Erro ao enviar o formulário');
            }

            setLatidude('')
            setLongitude('')
            setNomeCto('')
            setPorta('')
            setPortaInput('')

        }
        catch (error) {
            console.error('Erro na requisição:', error);

        }
    }

    return <FormularioStyled onSubmit={(e) => cadastrarCto(e)}>
        <Typography component={"h1"}>
            Selecione a OLT
        </Typography>
        <FieldAutoComplet
            endpoint={'olt'}
            label={"OLT"}
            aoAlterado={setOlt}
            onInputValueChange={setOltInput}
            valor={olt}
            inputValue={oltInput}
        />
        <div className="sub-area">
            <div>
                <Typography component={"h3"}>
                    Informe o nome da CTO
                </Typography>
                <TextoInput
                    labelProp={"Nome da CTO"}
                    aoAlterado={(e) => setNomeCto(e.target.value)}
                    valor={nomeCto}
                    obrigatorio
                    sx={{width : '100%'}}
                />
            </div>
            <div>
                <Typography component={"h3"}>
                    Quantas portas?
                </Typography>
                <FieldAutoComplet
                    dadosProcedimento={portas}
                    label={"Selecione a quantidade de portas"}
                    aoAlterado={setPorta}
                    onInputValueChange={setPortaInput}
                    valor={porta}
                    inputValue={portaInput}
                />
            </div>
            <div>
                <Typography component={"h3"}>
                    Informe Latitude
                </Typography>
                <TextoInput
                    labelProp={"Latidude"}
                    aoAlterado={(e) => setLatidude(e.target.value)}
                    valor={latidude}
                    sx={{width : '100%'}}
                />
            </div>
            <div>
                <Typography component={"h3"}>
                    Informe a Longitude
                </Typography>
                <TextoInput
                    labelProp={"Longitude"}
                    aoAlterado={(e) => setLongitude(e.target.value)}
                    valor={longitude}
                    sx={{width : '100%'}}
                />
            </div>
        </div>
        <Button type="submit" variant="outlined" sx={{ marginTop: 4 }}>
            Cadastrar
        </Button>
    </FormularioStyled>
}

export default CadastroCto