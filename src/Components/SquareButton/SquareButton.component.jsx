import styled from "@emotion/styled";
import { Badge, Button } from "@mui/material";

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
  console.log(props.badgenumber)
  return (
    <Badge badgeContent={props.badgenumber} color="secondary">
      <CustomButton onClick={() => { navigator.vibrate(80) }} {...props}></CustomButton>
    </Badge>
  )
}
