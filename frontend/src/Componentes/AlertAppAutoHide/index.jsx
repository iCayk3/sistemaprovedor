import styled from "styled-components"
import { Alert } from "@mui/material";

const DivEstilizada = styled.div``
const TextoEstilizado = styled.span`
    font-size: 16px;
    font-weight: bold;
    position: relative;
`

export default function AlertAppAutoHide({ texto, color, onclose, animationDuration }) {

    return <DivEstilizada>
        {/* <Snackbar
            open
            anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
            animationDuration={750}
            autoHideDuration={2000}
            color={color}
            onClose={onclose}
        >
            <TextoEstilizado>{texto}</TextoEstilizado>
        </Snackbar> */}
        <Alert 
            severity={color}            
        >
            <TextoEstilizado>{texto}</TextoEstilizado>
        </Alert>
    </DivEstilizada>
}