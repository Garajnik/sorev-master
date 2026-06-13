//TODO: Узнать, что делать с предупреждениями

import {
  Badge,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Stack,
  Typography,
  IconButton,
} from "@mui/material";
import UndoIcon from "@mui/icons-material/Undo";
import { SquareButton } from "../../Components";
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { postScore, fetchParticipants, undoScore } from "../../api/api";

export function MobilePage() {
  const [judgeName, setJudgeName] = useState("");
  const [participants, setParticipants] = useState({
    blueName: "",
    redName: "",
  });
  const [kicked, setKicked] = useState(false);
  const [roundActive, setRoundActive] = useState(false);
  const [roundEnded, setRoundEnded] = useState(false);
  const [tiebreaker, setTiebreaker] = useState(false);
  const [scoreHistory, setScoreHistory] = useState([]);
  const localScoresRef = useRef({ blue: 0, red: 0 });

  const navigate = useNavigate();

  const scoreCounts = useMemo(() => {
    const counts = {};
    scoreHistory.forEach(({ punch, color, score }) => {
      const key = `${punch}-${color}-${score}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [scoreHistory]);

  const getCount = (punch, color, score) => {
    return scoreCounts[`${punch}-${color}-${score}`] || 0;
  };

  useEffect(() => {
    setJudgeName(localStorage.getItem("judgeName"));
    fetchParticipants()
      .then((data) => {
        setParticipants({ blueName: data.blue, redName: data.red });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const ws = new WebSocket(
      `ws://${window.location.hostname}:8000/ws/${judgeName}`,
    );

    ws.onopen = () => {
      console.log("Connected to server");
    };

    ws.onmessage = (event) => {
      let data = JSON.parse(event.data);
      if (data.data === "participantupd") {
        console.log(data.participants);
        setParticipants({
          blueName: data.participants[0][1],
          redName: data.participants[1][1],
        });
      } else if (data.data === "kicked") {
        setKicked(true);
      } else if (data.data === "roundstate") {
        // Sent right after connecting so a judge who joins mid-competition
        // knows whether scoring is currently allowed.
        setRoundActive(Boolean(data.active));
      } else if (data.data === "roundstart") {
        setRoundEnded(false);
        setTiebreaker(false);
        setRoundActive(true);
      } else if (data.data === "roundend") {
        setRoundActive(false);
        if (localScoresRef.current.blue === localScoresRef.current.red) {
          setTiebreaker(true);
        } else {
          setRoundEnded(true);
        }
        localScoresRef.current = { blue: 0, red: 0 };
      }
    };
    return () => ws.close();
  }, [judgeName]);

  const handleScoreClick = (punch, color, score) => {
    // Scoring is only allowed while the round is in progress.
    if (!roundActive) return;
    // Validate Н (score 4): only allow if the last action for this
    // (punch, color) was a regular score (not already an Н or warning)
    if (score === 4) {
      const punchColorHistory = scoreHistory.filter(
        (h) => h.punch === punch && h.color === color,
      );
      if (punchColorHistory.length === 0) return;
      const lastAction = punchColorHistory[punchColorHistory.length - 1];
      if (lastAction.score === 4 || lastAction.score === 5) return;
    }

    const data = { judge: judgeName, punch: punch, color: color, score: score };
    postScore(data).then((data) => console.log("Success: ", data));

    setScoreHistory((prev) => [
      ...prev,
      { judge: judgeName, punch, color, score },
    ]);

    // Track score locally to detect ties at round end.
    if (punch === "remark") {
      // Замечание: +1 to opposing side
      const opposingColor = color === "blue" ? "red" : "blue";
      localScoresRef.current = {
        ...localScoresRef.current,
        [opposingColor]: localScoresRef.current[opposingColor] + 1,
      };
    } else if (punch === "warn") {
      // Предупреждение: +2 to opposing side
      const opposingColor = color === "blue" ? "red" : "blue";
      localScoresRef.current = {
        ...localScoresRef.current,
        [opposingColor]: localScoresRef.current[opposingColor] + 2,
      };
    } else {
      const delta = score === 4 ? 3 : score;
      localScoresRef.current = {
        ...localScoresRef.current,
        [color]: localScoresRef.current[color] + delta,
      };
    }
  };

  const handleUndo = () => {
    if (!roundActive) return;
    if (scoreHistory.length === 0) return;
    const lastAction = scoreHistory[scoreHistory.length - 1];
    undoScore({
      judge: lastAction.judge,
      punch: lastAction.punch,
      color: lastAction.color,
      score: lastAction.score,
    });

    // Update local score tracking
    if (lastAction.punch === "remark") {
      const opposingColor = lastAction.color === "blue" ? "red" : "blue";
      localScoresRef.current = {
        ...localScoresRef.current,
        [opposingColor]: localScoresRef.current[opposingColor] - 1,
      };
    } else if (lastAction.punch === "warn") {
      const opposingColor = lastAction.color === "blue" ? "red" : "blue";
      localScoresRef.current = {
        ...localScoresRef.current,
        [opposingColor]: localScoresRef.current[opposingColor] - 2,
      };
    } else {
      const delta = lastAction.score === 4 ? 3 : lastAction.score;
      localScoresRef.current = {
        ...localScoresRef.current,
        [lastAction.color]: localScoresRef.current[lastAction.color] - delta,
      };
    }

    setScoreHistory((prev) => prev.slice(0, -1));
  };

  const handleTiebreakerChoice = (color) => {
    postScore({ judge: judgeName, punch: "tiebreak", color, score: 1 });
    setTiebreaker(false);
  };

  return (
    <Box
      display={"flex"}
      sx={{
        gap: 1,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        position: "absolute",
        top: 0,
        bottom: 0,
        right: 0,
        left: 0,
        margin: 2,
        marginRight: 10,
        marginLeft: 10,
      }}
    >
      <Dialog open={kicked}>
        <DialogContent>
          <DialogContentText>
            Вы были отключены главным судьёй
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => navigate("/connect")} variant="contained">
            Ок
          </Button>
        </DialogActions>
      </Dialog>
      {/* Modal blocker: prevents any scoring until the main judge starts the
          round. It has no dismiss button and closes automatically once a
          "roundstart" message arrives. */}
      <Dialog open={!roundActive && !kicked && !roundEnded && !tiebreaker}>
        <DialogTitle>Ожидание начала раунда</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Главный судья ещё не начал раунд. Ввод баллов станет доступен после
            его начала.
          </DialogContentText>
        </DialogContent>
      </Dialog>
      <Dialog open={roundEnded}>
        <DialogContent>
          <DialogContentText>Раунд завершён</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoundEnded(false)} variant="contained">
            Ок
          </Button>
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
          <Button
            onClick={() => handleTiebreakerChoice("blue")}
            variant="contained"
            color="primary"
          >
            {participants.blueName || "Синий"}
          </Button>
          <Button
            onClick={() => handleTiebreakerChoice("red")}
            variant="contained"
            color="error"
          >
            {participants.redName || "Красный"}
          </Button>
        </DialogActions>
      </Dialog>
      <Stack
        direction={"row"}
        spacing={5}
        width={"100%"}
        justifyContent={"space-between"}
      >
        <Typography color="primary">{participants.blueName}</Typography>
        <Typography variant="button">{judgeName}</Typography>
        <Typography color="error">{participants.redName}</Typography>
      </Stack>
      {/* Удар рукой */}
      <Stack
        spacing={2}
        width={"100%"}
        direction={"row"}
        alignItems={"center"}
        justifyContent={"space-between"}
      >
        <Badge
          badgeContent={getCount("hand", "blue", 1)}
          color="secondary"
          max={99}
        >
          <SquareButton
            onClick={() => handleScoreClick("hand", "blue", 1)}
            variant="contained"
          >
            1
          </SquareButton>
        </Badge>
        <Badge
          badgeContent={getCount("hand", "blue", 2)}
          color="secondary"
          max={99}
        >
          <SquareButton
            onClick={() => handleScoreClick("hand", "blue", 2)}
            variant="contained"
          >
            2
          </SquareButton>
        </Badge>
        <SquareButton
          variant="contained"
          sx={{ visibility: "hidden" }}
        ></SquareButton>
        <Badge
          badgeContent={getCount("hand", "blue", 4)}
          color="secondary"
          max={99}
        >
          <SquareButton
            onClick={() => handleScoreClick("hand", "blue", 4)}
            color="success"
            variant="contained"
          >
            Н
          </SquareButton>
        </Badge>
        <Typography width={"20vw"}>Удар рукой</Typography>
        <Badge
          badgeContent={getCount("hand", "red", 4)}
          color="secondary"
          max={99}
        >
          <SquareButton
            onClick={() => handleScoreClick("hand", "red", 4)}
            color="success"
            variant="contained"
          >
            Н
          </SquareButton>
        </Badge>
        <SquareButton
          variant="contained"
          sx={{ visibility: "hidden" }}
        ></SquareButton>
        <Badge
          badgeContent={getCount("hand", "red", 2)}
          color="secondary"
          max={99}
        >
          <SquareButton
            onClick={() => handleScoreClick("hand", "red", 2)}
            color="error"
            variant="contained"
          >
            2
          </SquareButton>
        </Badge>
        <Badge
          badgeContent={getCount("hand", "red", 1)}
          color="secondary"
          max={99}
        >
          <SquareButton
            onClick={() => handleScoreClick("hand", "red", 1)}
            color="error"
            variant="contained"
          >
            1
          </SquareButton>
        </Badge>
      </Stack>
      <Divider sx={{ width: "100%", border: "1px solid grey" }} />
      {/* Удар ногой */}
      <Stack
        spacing={2}
        width={"100%"}
        direction={"row"}
        alignItems={"center"}
        justifyContent={"space-between"}
      >
        <Badge
          badgeContent={getCount("leg", "blue", 1)}
          color="secondary"
          max={99}
        >
          <SquareButton
            onClick={() => handleScoreClick("leg", "blue", 1)}
            variant="contained"
          >
            1
          </SquareButton>
        </Badge>
        <Badge
          badgeContent={getCount("leg", "blue", 2)}
          color="secondary"
          max={99}
        >
          <SquareButton
            onClick={() => handleScoreClick("leg", "blue", 2)}
            variant="contained"
          >
            2
          </SquareButton>
        </Badge>
        <Badge
          badgeContent={getCount("leg", "blue", 3)}
          color="secondary"
          max={99}
        >
          <SquareButton
            onClick={() => handleScoreClick("leg", "blue", 3)}
            variant="contained"
          >
            3
          </SquareButton>
        </Badge>
        <Badge
          badgeContent={getCount("leg", "blue", 4)}
          color="secondary"
          max={99}
        >
          <SquareButton
            onClick={() => handleScoreClick("leg", "blue", 4)}
            color="success"
            variant="contained"
          >
            Н
          </SquareButton>
        </Badge>
        <Typography component="h1" width={"20vw"}>
          Удар ногой
        </Typography>
        <Badge
          badgeContent={getCount("leg", "red", 4)}
          color="secondary"
          max={99}
        >
          <SquareButton
            onClick={() => handleScoreClick("leg", "red", 4)}
            color="success"
            variant="contained"
          >
            Н
          </SquareButton>
        </Badge>
        <Badge
          badgeContent={getCount("leg", "red", 3)}
          color="secondary"
          max={99}
        >
          <SquareButton
            onClick={() => handleScoreClick("leg", "red", 3)}
            color="error"
            variant="contained"
          >
            3
          </SquareButton>
        </Badge>
        <Badge
          badgeContent={getCount("leg", "red", 2)}
          color="secondary"
          max={99}
        >
          <SquareButton
            onClick={() => handleScoreClick("leg", "red", 2)}
            color="error"
            variant="contained"
          >
            2
          </SquareButton>
        </Badge>
        <Badge
          badgeContent={getCount("leg", "red", 1)}
          color="secondary"
          max={99}
        >
          <SquareButton
            onClick={() => handleScoreClick("leg", "red", 1)}
            color="error"
            variant="contained"
          >
            1
          </SquareButton>
        </Badge>
      </Stack>
      <Divider sx={{ width: "100%", border: "1px solid grey" }} />
      {/* Бросок */}
      <Stack
        spacing={2}
        width={"100%"}
        direction={"row"}
        alignItems={"center"}
        justifyContent={"space-between"}
      >
        <Badge
          badgeContent={getCount("throw", "blue", 1)}
          color="secondary"
          max={99}
        >
          <SquareButton
            onClick={() => handleScoreClick("throw", "blue", 1)}
            variant="contained"
          >
            1
          </SquareButton>
        </Badge>
        <Badge
          badgeContent={getCount("throw", "blue", 2)}
          color="secondary"
          max={99}
        >
          <SquareButton
            onClick={() => handleScoreClick("throw", "blue", 2)}
            variant="contained"
          >
            2
          </SquareButton>
        </Badge>
        <Badge
          badgeContent={getCount("throw", "blue", 3)}
          color="secondary"
          max={99}
        >
          <SquareButton
            onClick={() => handleScoreClick("throw", "blue", 3)}
            variant="contained"
          >
            3
          </SquareButton>
        </Badge>
        <Badge
          badgeContent={getCount("throw", "blue", 4)}
          color="secondary"
          max={99}
        >
          <SquareButton
            onClick={() => handleScoreClick("throw", "blue", 4)}
            color="success"
            variant="contained"
          >
            Н
          </SquareButton>
        </Badge>
        <Typography width={"20vw"}>Бросок</Typography>
        <Badge
          badgeContent={getCount("throw", "red", 4)}
          color="secondary"
          max={99}
        >
          <SquareButton
            onClick={() => handleScoreClick("throw", "red", 4)}
            color="success"
            variant="contained"
          >
            Н
          </SquareButton>
        </Badge>
        <Badge
          badgeContent={getCount("throw", "red", 3)}
          color="secondary"
          max={99}
        >
          <SquareButton
            onClick={() => handleScoreClick("throw", "red", 3)}
            color="error"
            variant="contained"
          >
            3
          </SquareButton>
        </Badge>
        <Badge
          badgeContent={getCount("throw", "red", 2)}
          color="secondary"
          max={99}
        >
          <SquareButton
            onClick={() => handleScoreClick("throw", "red", 2)}
            color="error"
            variant="contained"
          >
            2
          </SquareButton>
        </Badge>
        <Badge
          badgeContent={getCount("throw", "red", 1)}
          color="secondary"
          max={99}
        >
          <SquareButton
            onClick={() => handleScoreClick("throw", "red", 1)}
            color="error"
            variant="contained"
          >
            1
          </SquareButton>
        </Badge>
      </Stack>
      <Divider sx={{ width: "100%", border: "1px solid grey" }} />
      {/* Замечание + Предупреждение */}
      <Stack
        direction={"row"}
        width={"100%"}
        justifyContent={"space-between"}
        alignItems={"center"}
      >
        <Badge
          badgeContent={getCount("remark", "blue", 6)}
          color="secondary"
          max={99}
        >
          <Button
            onClick={() => handleScoreClick("remark", "blue", 6)}
            sx={{ height: 50, fontSize: "0.8rem" }}
            variant="contained"
          >
            Замечание
          </Button>
        </Badge>
        <Badge
          badgeContent={getCount("warn", "blue", 5)}
          color="secondary"
          max={99}
        >
          <Button
            onClick={() => handleScoreClick("warn", "blue", 5)}
            sx={{ height: 50, fontSize: "0.8rem" }}
            variant="contained"
          >
            Предупр.
          </Button>
        </Badge>
        <IconButton
          onClick={handleUndo}
          disabled={scoreHistory.length === 0}
          color="warning"
          sx={{ height: 50, width: 50 }}
        >
          <UndoIcon />
        </IconButton>
        <Badge
          badgeContent={getCount("warn", "red", 5)}
          color="secondary"
          max={99}
        >
          <Button
            onClick={() => handleScoreClick("warn", "red", 5)}
            color="error"
            sx={{ height: 50, fontSize: "0.8rem" }}
            variant="contained"
          >
            Предупр.
          </Button>
        </Badge>
        <Badge
          badgeContent={getCount("remark", "red", 6)}
          color="secondary"
          max={99}
        >
          <Button
            onClick={() => handleScoreClick("remark", "red", 6)}
            color="error"
            sx={{ height: 50, fontSize: "0.8rem" }}
            variant="contained"
          >
            Замечание
          </Button>
        </Badge>
      </Stack>
    </Box>
  );
}
