import { Box, Button, Divider, Stack, Typography } from "@mui/material";
import { SquareButton } from "../../Components";
import { useState, useEffect } from "react";

const participants = {
  blueName: "Петров Петр Петрович",
  redName: "Иван Иванов Иванович",
}

export function MobilePage() {
  const [judgeName, setJudgeName] = useState("")

  useEffect(() => {
    setJudgeName(localStorage.getItem("judgeName"))

  }, [])

  const connectWebSocket = () => {
    try {
      const ws = new WebSocket(`ws://${window.location.hostname}:8000/ws/${judgeName}`);

      ws.onopen = () => {
        console.log("Connected to server");
      };
    }
    catch {
      console.error("Couldn't connect to WebSocket")
    }

  };

  var ws = new WebSocket(`ws://${window.location.hostname}:8000/ws/${localStorage.getItem("judgeName")}`);
  ws.onmessage = function (event) {
    console.log(event)
  }
  ws.onopen = () => { console.log("Connected to WebSocket") }

  const handleScoreClick = (color, type, score) => {
    ws.send(`${color} ${type} ${score}`)
  }

  return (
    <Box display={"flex"} sx={{ gap: 1, alignItems: "center", justifyContent: "center", flexDirection: "column", position: "absolute", top: 0, bottom: 0, right: 0, left: 0, margin: 2, marginRight: 10, marginLeft: 10 }} >
      <Stack direction={"row"} spacing={5} width={"100%"} justifyContent={"space-between"}>
        <Typography color="primary">{participants.blueName}</Typography>
        <Typography variant="button">{judgeName}</Typography>
        <Typography color="error">{participants.redName}</Typography>
      </Stack>
      <Stack spacing={2} width={"100%"} direction={"row"} alignItems={"center"} justifyContent={"space-between"}>
        <SquareButton onClick={() => handleScoreClick("red", "1", "1")} badgenumber={1} variant="contained">1</SquareButton>
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
        <Typography width={"20vw"}>Удар ногой</Typography>
        <SquareButton badgenumber={1} color="success" variant="contained">Н</SquareButton>
        <SquareButton badgenumber={1} color="error" variant="contained">3</SquareButton>
        <SquareButton badgenumber={1} color="error" variant="contained">2</SquareButton>
        <SquareButton badgenumber={1} color="error" variant="contained">1</SquareButton>
      </Stack>
      <Divider sx={{ width: "100%", border: "1px solid grey" }} />
      <Stack direction={"row"} width={"100%"} justifyContent={"space-between"} alignItems={"center"}>
        <Button sx={{ height: 50, fontSize: "1rem" }} variant="contained">Предупреждение</Button>
        <Typography width={"20vw"}>Предупреждение</Typography>
        <Button onClick={connectWebSocket} color="error" sx={{ height: 50, fontSize: "1rem" }} variant="contained">Предупреждение</Button>
      </Stack>
    </Box >
  )
}

