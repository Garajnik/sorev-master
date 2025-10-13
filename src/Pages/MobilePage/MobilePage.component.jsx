import { Box, Button, Stack, Typography } from "@mui/material";

export function MobilePage() {
  return (
    // <Box display={"flex"} sx={{ gap: 3, alignItems: "center", justifyContent: "center", flexDirection: "column", position: "absolute", top: 0, bottom: 0, right: 0, left: 0, margin: 2 }} >
    <Box>
      <Stack spacing={2} direction={"row"}>
        <Button variant="contained">1</Button>
        <Button variant="contained">2</Button>
        <Button variant="contained" sx={{ visibility: 'hidden', }}></Button>
        <Button variant="contained">Н</Button>
        <Typography width={"10vw"}>Удар рукой</Typography>
        <Button variant="contained">Н</Button>
        <Button variant="contained" sx={{ visibility: 'hidden', }}></Button>
        <Button variant="contained">2</Button>
        <Button variant="contained">1</Button>
      </Stack>
      <Stack spacing={2} direction={"row"}>
        <Button variant="contained">1</Button>
        <Button variant="contained">2</Button>
        <Button variant="contained">3</Button>
        <Button variant="contained">Н</Button>
        <Typography width={"10vw"}>Удар ногой</Typography>
        <Button variant="contained">Н</Button>
        <Button variant="contained">3</Button>
        <Button variant="contained">2</Button>
        <Button variant="contained">1</Button>
      </Stack>
      <Stack spacing={2} direction={"row"}>
        <Button variant="contained">1</Button>
        <Button variant="contained">2</Button>
        <Button variant="contained">3</Button>
        <Button variant="contained">Н</Button>
        <Typography width={"10vw"}>Удар ногой</Typography>
        <Button variant="contained">Н</Button>
        <Button variant="contained">3</Button>
        <Button variant="contained">2</Button>
        <Button variant="contained">1</Button>
      </Stack>
      <Stack spacing={2} direction={"row"}>
        <Button variant="contained">Предупреждение</Button>
        <Typography width={"15vw"}>Предупреждение</Typography>
        <Button variant="contained">Предупреждение</Button>
      </Stack>
    </Box>
  )
}

