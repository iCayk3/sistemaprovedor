import styled from "styled-components"

const DivTableComponent = styled.div`
    display: block;
    justify-content: center;
    align-items: center;
    border-radius: 8px;
    position: relative;

    table {
        width: 100%;
        box-sizing: border-box;
    }

    th, td {
        border-radius: 8px;
        border: 1px solid #dbe9ff;
        padding: 6px;
        text-align: left;
    }

    th {
        background-color: #7192ff;
        width: 100vw;
    }

    td {
        text-align: center;
        width: 2rem;
    }

    @media only screen and (max-width: 600px) {
        h1 {
            font-size: 14px;
        }
    }
`

const TabelaResumo = ({ rows }) => {
    return (
        <DivTableComponent>
            <table>
                <tbody>
                    {rows.map((dados, index) => (
                        <tr key={index}>
                            <th>{dados.label}</th>
                            <td>{dados.value}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </DivTableComponent>
    )
}

export default TabelaResumo
