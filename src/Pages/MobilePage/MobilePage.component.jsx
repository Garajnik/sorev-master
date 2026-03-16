//TODO: Узнать, что делать с предупреждениями

import { Badge, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, Stack, Typography } from "@mui/material";
import { SquareButton } from "../../Components";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { postScore, fetchParticipants } from "../../api/api";

export function MobilePage() {
  const [judgeName, setJudgeName] = useState("")
  const [participants, setParticipants] = useState({
    blueName: "",
    redName: ""
  })
  const [kicked, setKicked] = useState(false)
  const [roundEnded, setRoundEnded] = useState(false)
  const [tiebreaker, setTiebreaker] = useState(false)
  const localScoresRef = useRef({ blue: 0, red: 0 })

  const navigate = useNavigate();

  useEffect(() => {
    setJudgeName(localStorage.getItem("judgeName"))
    fetchParticipants().then(data => {
      setParticipants({ blueName: data.blue, redName: data.red })
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const ws = new WebSocket(`ws://${window.location.hostname}:8000/ws/${judgeName}`);

    ws.onopen = () => {
      console.log("Connected to server");
    };

    ws.onmessage = (event) => {
      let data = JSON.parse(event.data)
      if (data.data === "participantupd") {
        console.log(data.participants)
        setParticipants(
          {
            blueName: data.participants[0][1],
            redName: data.participants[1][1]
          }
        )
      } else if (data.data === "kicked") {
        setKicked(true)
      } else if (data.data === "roundend") {
        if (localScoresRef.current.blue === localScoresRef.current.red) {
          setTiebreaker(true)
        } else {
          setRoundEnded(true)
        }
        localScoresRef.current = { blue: 0, red: 0 }
      }
    }
    return () => ws.close()
  }, [judgeName])

  const handleScoreClick = (punch, color, score) => {
    const data = { judge: judgeName, punch: punch, color: color, score: score }
    postScore(data).then(data => console.log('Success: ', data))

    // Track score locally to detect ties at round end.
    // score 4 = Н modifier (+3 bonus on top of base already counted)
    // score 5 = П warning (no points)
    const delta = score === 4 ? 3 : score === 5 ? 0 : score
    localScoresRef.current = {
      ...localScoresRef.current,
      [color]: localScoresRef.current[color] + delta
    }
  }

  const handleTiebreakerChoice = (color) => {
    postScore({ judge: judgeName, punch: "tiebreak", color, score: 1 })
    setTiebreaker(false)
  }

  return (
    <Box display={"flex"} sx={{ gap: 1, alignItems: "center", justifyContent: "center", flexDirection: "column", position: "absolute", top: 0, bottom: 0, right: 0, left: 0, margin: 2, marginRight: 10, marginLeft: 10 }} >
      <Dialog open={kicked}>
        <DialogContent>
          <DialogContentText>Вы были отключены главным судьёй</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => navigate("/connect")} variant="contained">Ок</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={roundEnded}>
        <DialogContent>
          <DialogContentText>Раунд завершён</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoundEnded(false)} variant="contained">Ок</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={tiebreaker}>
        <DialogTitle>Раунд завершён</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Очки равны. Выберите участника, которому присудить победу в раунде.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleTiebreakerChoice("blue")} variant="contained" color="primary">
            {participants.blueName || "Синий"}
          </Button>
          <Button onClick={() => handleTiebreakerChoice("red")} variant="contained" color="error">
            {participants.redName || "Красный"}
          </Button>
        </DialogActions>
      </Dialog>
      <Stack direction={"row"} spacing={5} width={"100%"} justifyContent={"space-between"}>
        <Typography color="primary">{participants.blueName}</Typography>
        <Typography variant="button">{judgeName}</Typography>
        <Typography color="error">{participants.redName}</Typography>
      </Stack>
      <Stack spacing={2} width={"100%"} direction={"row"} alignItems={"center"} justifyContent={"space-between"}>
        <SquareButton onClick={() => handleScoreClick("hand", "blue", 1)} badgenumber={1} variant="contained">1</SquareButton>
        <SquareButton onClick={() => handleScoreClick("hand", "blue", 2)} badgenumber={1} variant="contained">2</SquareButton>
        <SquareButton variant="contained" sx={{ visibility: 'hidden', }}></SquareButton>
        <SquareButton onClick={() => handleScoreClick("hand", "blue", 4)} badgenumber={1} color="success" variant="contained">Н</SquareButton>
        <Typography width={"20vw"}>Удар рукой</Typography>
        <SquareButton onClick={() => handleScoreClick("hand", "red", 4)} badgenumber={1} color="success" variant="contained">Н</SquareButton>
        <SquareButton variant="contained" sx={{ visibility: 'hidden', }}></SquareButton>
        <SquareButton onClick={() => handleScoreClick("hand", "red", 2)} badgenumber={1} color="error" variant="contained">2</SquareButton>
        <SquareButton onClick={() => handleScoreClick("hand", "red", 1)} badgenumber={1} color="error" variant="contained">1</SquareButton>
      </Stack>
      <Divider sx={{ width: "100%", border: "1px solid grey" }} />
      <Stack spacing={2} width={"100%"} direction={"row"} alignItems={"center"} justifyContent={"space-between"}>
        <SquareButton onClick={() => handleScoreClick("leg", "blue", 1)} badgenumber={1} variant="contained">1</SquareButton>
        <SquareButton onClick={() => handleScoreClick("leg", "blue", 2)} badgenumber={1} variant="contained">2</SquareButton>
        <SquareButton onClick={() => handleScoreClick("leg", "blue", 3)} badgenumber={1} variant="contained">3</SquareButton>
        <SquareButton onClick={() => handleScoreClick("leg", "blue", 4)} badgenumber={1} color="success" variant="contained">Н</SquareButton>
        <Typography component="h1" width={"20vw"}>Удар ногой</Typography>
        <SquareButton onClick={() => handleScoreClick("leg", "red", 4)} badgenumber={1} color="success" variant="contained">Н</SquareButton>
        <SquareButton onClick={() => handleScoreClick("leg", "red", 3)} badgenumber={1} color="error" variant="contained">3</SquareButton>
        <SquareButton onClick={() => handleScoreClick("leg", "red", 2)} badgenumber={1} color="error" variant="contained">2</SquareButton>
        <SquareButton onClick={() => handleScoreClick("leg", "red", 1)} badgenumber={1} color="error" variant="contained">1</SquareButton>
      </Stack>
      <Divider sx={{ width: "100%", border: "1px solid grey" }} />
      <Stack spacing={2} width={"100%"} direction={"row"} alignItems={"center"} justifyContent={"space-between"}>
        <SquareButton onClick={() => handleScoreClick("throw", "blue", 1)} badgenumber={1} variant="contained">1</SquareButton>
        <SquareButton onClick={() => handleScoreClick("throw", "blue", 2)} badgenumber={1} variant="contained">2</SquareButton>
        <SquareButton onClick={() => handleScoreClick("throw", "blue", 3)} badgenumber={1} variant="contained">3</SquareButton>
        <SquareButton onClick={() => handleScoreClick("throw", "blue", 4)} badgenumber={1} color="success" variant="contained">Н</SquareButton>
        <Typography width={"20vw"}>Бросок</Typography>
        <SquareButton onClick={() => handleScoreClick("throw", "red", 4)} badgenumber={1} color="success" variant="contained">Н</SquareButton>
        <SquareButton onClick={() => handleScoreClick("throw", "red", 3)} badgenumber={1} color="error" variant="contained">3</SquareButton>
        <SquareButton onClick={() => handleScoreClick("throw", "red", 2)} badgenumber={1} color="error" variant="contained">2</SquareButton>
        <SquareButton onClick={() => handleScoreClick("throw", "red", 1)} badgenumber={1} color="error" variant="contained">1</SquareButton>
      </Stack>
      <Divider sx={{ width: "100%", border: "1px solid grey" }} />
      <Stack direction={"row"} width={"100%"} justifyContent={"space-between"} alignItems={"center"}>
        <Badge color="warning">
          <Button onClick={() => handleScoreClick("warn", "blue", 5)} sx={{ height: 50, fontSize: "1rem" }} variant="contained">Предупреждение</Button>
        </Badge>
        <Typography width={"20vw"}>Предупреждение</Typography>
        <Badge color="warning">
          <Button onClick={() => handleScoreClick("warn", "red", 5)} color="error" sx={{ height: 50, fontSize: "1rem" }} variant="contained">Предупреждение</Button>
        </Badge>
      </Stack>
    </Box >
  )
}

