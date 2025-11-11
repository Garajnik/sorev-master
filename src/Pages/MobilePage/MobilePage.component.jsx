import { Badge, Box, Button, Divider, Stack, Typography } from "@mui/material";
import { SquareButton } from "../../Components";
import { useState, useEffect, useRef } from "react";

const participants = {
  blueName: "Петров Петр Петрович",
  redName: "Иван Иванов Иванович",
}

export function MobilePage() {
  const [judgeName, setJudgeName] = useState("")
  const ws = useRef(null)

  useEffect(() => {
    setJudgeName(localStorage.getItem("judgeName"))
  }, [])

  useEffect(() => {
    console.log(judgeName)
    ws.current = new WebSocket(`ws://${window.location.hostname}:8000/ws/${judgeName}`);

    ws.onopen = () => {
      console.log("Connected to server");
    };
  })

  const handleScoreClick = (punch, color, score) => {
    const data = { judge: judgeName, punch: punch, color: color, score: score }
    console.log(JSON.stringify(data))
    fetch("http://localhost:8000/send_score", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(response => response.json()).then(data => console.log('Success: ', data))
  }

  return (
    <Box display={"flex"} sx={{ gap: 1, alignItems: "center", justifyContent: "center", flexDirection: "column", position: "absolute", top: 0, bottom: 0, right: 0, left: 0, margin: 2, marginRight: 10, marginLeft: 10 }} >
      <Stack direction={"row"} spacing={5} width={"100%"} justifyContent={"space-between"}>
        <Typography color="primary">{participants.blueName}</Typography>
        <Typography variant="button">{judgeName}</Typography>
        <Typography color="error">{participants.redName}</Typography>
      </Stack>
      <Stack spacing={2} width={"100%"} direction={"row"} alignItems={"center"} justifyContent={"space-between"}>
        <SquareButton onClick={() => handleScoreClick("hand", "blue", 1)} badgenumber={1} variant="contained">1</SquareButton>
        <SquareButton badgenumber={1} variant="contained">2</SquareButton>
        <SquareButton variant="contained" sx={{ visibility: 'hidden', }}></SquareButton>
        <SquareButton badgenumber={1} color="success" variant="contained">Н</SquareButton>
        <Typography width={"20vw"}>Удар рукой</Typography>
        <SquareButton badgenumber={1} color="success" variant="contained">Н</SquareButton>
        <SquareButton variant="contained" sx={{ visibility: 'hidden', }}></SquareButton>
        <SquareButton badgenumber={1} color="error" variant="contained">2</SquareButton>
        <SquareButton badgenumber={1} color="error" variant="contained">1</SquareButton>
      </Stack>
      <Divider sx={{ width: "100%", border: "1px solid grey" }} />
      <Stack spacing={2} width={"100%"} direction={"row"} alignItems={"center"} justifyContent={"space-between"}>
        <SquareButton badgenumber={1} variant="contained">1</SquareButton>
        <SquareButton badgenumber={1} variant="contained">2</SquareButton>
        <SquareButton badgenumber={1} variant="contained">3</SquareButton>
        <SquareButton badgenumber={1} color="success" variant="contained">Н</SquareButton>
        <Typography component="h1" width={"20vw"}>Удар ногой</Typography>
        <SquareButton badgenumber={1} color="success" variant="contained">Н</SquareButton>
        <SquareButton badgenumber={1} color="error" variant="contained">3</SquareButton>
        <SquareButton badgenumber={1} color="error" variant="contained">2</SquareButton>
        <SquareButton badgenumber={1} color="error" variant="contained">1</SquareButton>
      </Stack>
      <Divider sx={{ width: "100%", border: "1px solid grey" }} />
      <Stack spacing={2} width={"100%"} direction={"row"} alignItems={"center"} justifyContent={"space-between"}>
        <SquareButton badgenumber={1} variant="contained">1</SquareButton>
        <SquareButton badgenumber={1} variant="contained">2</SquareButton>
        <SquareButton badgenumber={1} variant="contained">3</SquareButton>
        <SquareButton badgenumber={1} color="success" variant="contained">Н</SquareButton>
        <Typography width={"20vw"}>Бросок</Typography>
        <SquareButton badgenumber={1} color="success" variant="contained">Н</SquareButton>
        <SquareButton badgenumber={1} color="error" variant="contained">3</SquareButton>
        <SquareButton badgenumber={1} color="error" variant="contained">2</SquareButton>
        <SquareButton badgenumber={1} color="error" variant="contained">1</SquareButton>
      </Stack>
      <Divider sx={{ width: "100%", border: "1px solid grey" }} />
      <Stack direction={"row"} width={"100%"} justifyContent={"space-between"} alignItems={"center"}>
        <Badge color="warning">
          <Button sx={{ height: 50, fontSize: "1rem" }} variant="contained">Предупреждение</Button>
        </Badge>
        <Typography width={"20vw"}>Предупреждение</Typography>
        <Badge color="warning">
          <Button color="error" sx={{ height: 50, fontSize: "1rem" }} variant="contained">Предупреждение</Button>
        </Badge>
      </Stack>
    </Box >
  )
}

