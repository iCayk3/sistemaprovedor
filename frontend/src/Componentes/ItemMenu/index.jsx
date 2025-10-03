import { NavLink } from "react-router-dom";
import styled from "styled-components";

const MenuStyled = styled(NavLink)`
    text-decoration: none;
    color: black;
    padding: 8px 16px;
    transition: background 0.2s;    
  &.active {
    background-color: #4a2512;
    font-weight: bold;
    color: #f4ddb4;
  }
  &:hover{
    text-decoration: underline ;
  }
  &.active:hover{
    text-decoration: none ;
  }
`

const ItemMenu = ({ to, children }) => {
    return <MenuStyled to={to} end className={({ isActive }) => (isActive ? "active" : "")}>
        {children}
    </MenuStyled>
}

export default ItemMenu