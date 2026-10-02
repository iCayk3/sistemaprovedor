import { NavLink } from "react-router-dom";
import { styled } from "@mui/material/styles";

const MenuStyled = styled(NavLink)(({ theme }) => ({
    textDecoration: 'none',
    color: theme.palette.text.primary,
    padding: '8px 16px',
    transition: 'background 0.2s',
    '&.active': {
        backgroundColor: theme.palette.primary.main,
        fontWeight: 'bold',
        color: theme.palette.primary.contrastText,
    },
    '&:hover': {
        textDecoration: 'underline',
    },
    '&.active:hover': {
        textDecoration: 'none',
    },
}));

const ItemMenu = ({ to, children }) => {
    return (
        <MenuStyled to={to} end>
            {children}
        </MenuStyled>
    );
};

export default ItemMenu;