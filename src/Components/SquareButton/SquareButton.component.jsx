import styled from "@emotion/styled";
import { Button } from "@mui/material";

const CustomButton = styled(Button)(({ theme }) => ({
  width: 50,
  height: 50,
  minWidth: 0,
  padding: 0,
  fontSize: "1.3rem",
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

export function SquareButton(props) {
  return (
    <CustomButton {...props}></CustomButton>
  )
}
