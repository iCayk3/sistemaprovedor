import BasicDatePicker from "../BasicDatePicker";
import styled from "styled-components";
import TextoInput from "../TextoInput";
import FieldAutoComplet from "../FieldAutoComplet";

const DivFiltroEstilizada = styled.div`
        margin-bottom: 8px;
        border-radius: 4px;
        display: flex;
        justify-content: center;
        align-items: center;
        .gridItem {
            width: 100%;
        }
        gap: 8px;
        .gridItem:nth-child(1){
            margin-bottom: 0.5rem;
        }
        
        @media only screen and (max-width: 1438px) {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            .gridItem:nth-child(1){
                grid-column: span 2;

            }
        }
        @media only screen and (max-width: 998px) {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            .gridItem:nth-child(1){
                grid-column: span 2;

            }
        }
        @media only screen and (max-width: 768px) {
            display: grid;
            grid-template-columns: repeat(1, 1fr);
            .gridItem:nth-child(1){
                grid-column: span 1;

            }
        }
        @media only screen and (max-width: 600px) {
            display: grid;
            grid-template-columns: repeat(1, 1fr);
            .gridItem:nth-child(1){
                grid-column: span 1;

            }
        }

`
const Filtros = ({ aoAlteradoTecnico, aoAlteradoData, aoAlteradoCliente, aoAlteradoTecnicoLabel, valor, valorInput }) => {

    function selectData(value) {
        if (value === null) {
            aoAlteradoData('')
        } else {
            try {
                aoAlteradoData(value.toISOString().slice(0, 10))
            } catch (e) {
                aoAlteradoData('')
            }

        }
    }

    function selectCliente(value) {
        if (value === null) {
            aoAlteradoCliente('')
        } else {
            aoAlteradoCliente(value)
        }
    }

    return (
        <DivFiltroEstilizada >
            {/* <h3 className="gridItem">Filtros</h3> */}
            {/* <div className="gridItem">
                <TextoInput
                    labelProp={"Código"}
                    placeholderProp={"Informé o código para pesquisa"}
                    // sx={{ '--Input-minHeight': '56px', '--Input-radius': '6px' }}
                    aoAlterado={(value) => selectCliente(value)}
                />
            </div> */}
            <div className="gridItem">
                <BasicDatePicker aoAlterado={(value) => selectData(value)} label={"Selecione a data"} />
            </div>
            <div className="gridItem">
                <FieldAutoComplet
                    valor={valor}
                    inputValue={valorInput}
                    endpoint={`tecnico/equipes`}
                    label={"Técnicos"}
                    aoAlterado={aoAlteradoTecnico}
                    onInputValueChange={aoAlteradoTecnicoLabel} />
            </div>
        </DivFiltroEstilizada>
    )
}

export default Filtros