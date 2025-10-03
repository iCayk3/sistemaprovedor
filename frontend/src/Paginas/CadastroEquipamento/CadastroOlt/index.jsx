import { Button, Typography } from "@mui/material"
import { useState } from "react"
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
const UseApi = Api();

const CadastroOlt = () => {

    const [nomeOlt, setNomeOlt] = useState('')
    const [latidude, setLatidude] = useState('')
    const [longitude, setLongitude] = useState('')
    const [ipOlt, setIpOlt] = useState('')
    const [modeloOlt, setModeloOlt] = useState('')

    const cadastrarOlt = async (e) => {
        e.preventDefault()
        const form = {
            nome: nomeOlt,
            ipOlt,
            modeloOlt,
            latidude,
            longitude
        }

        try {
            console.log(form)
            const response = await UseApi(`olt`, 'POST', form);
            console.log(response)
            if (!response) {
                throw new Error('Erro ao enviar o formulário');
            }

            setNomeOlt('')
            setLatidude('')
            setLongitude('')
            setIpOlt('')
            setModeloOlt('')

        }
        catch (error) {
            console.error('Erro na requisição:', error);

        }
    }

    return <FormularioStyled onSubmit={(e) => cadastrarOlt(e)}>
        <Typography component={"h1"} sx={{ fontSize: "32px" }}>
            Informe o nome da OLT
        </Typography>
        <TextoInput
            labelProp={"Nome da OLT"}
            aoAlterado={(e) => setNomeOlt(e.target.value)}
            valor={nomeOlt}
            obrigatorio
            sx={{width : '100%'}}
        />
        <div className="sub-area">
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
            <div>
                <Typography component={"h3"}>
                    Modelo da OLT
                </Typography>
                <TextoInput
                    labelProp={"Modelo da OLT"}
                    aoAlterado={(e) => setModeloOlt(e.target.value)}
                    valor={modeloOlt}
                    sx={{width : '100%'}}
                />
            </div>
            <div>
                <Typography component={"h3"}>
                    IP da OLT
                </Typography>
                <TextoInput
                    labelProp={"IP"}
                    aoAlterado={(e) => setIpOlt(e.target.value)}
                    valor={ipOlt}
                    sx={{width : '100%'}}
                />
            </div>
        </div>
        <Button type="submit" variant="outlined" sx={{ marginTop: 4 }}>
            Cadastrar
        </Button>
    </FormularioStyled>
}

export default CadastroOlt