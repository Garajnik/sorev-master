import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { fetchRounds, fetchRoundScores } from "../../api/api";
import styles from "./HistoryPage.module.css";

const PUNCH_LABELS = {
  hand: "Удар рукой",
  leg: "Удар ногой",
  throw: "Бросок",
  remark: "Замечание",
  warn: "Предупреждение",
  tiebreak: "Доп. балл (ничья)",
};

const punchLabel = (punch) => PUNCH_LABELS[punch] || punch;

const scoreLabel = (punch, score) => {
  if (punch === "tiebreak") return "Победа в раунде";
  if (punch === "remark") return "+1 сопернику";
  if (punch === "warn") return "+2 сопернику";
  if (score === 4) return "Н";
  return String(score);
};

const formatRoundTitle = (round) =>
  `${round.blue_name || "Синий"} — ${round.red_name || "Красный"}`;

export const HistoryPage = () => {
  const [rounds, setRounds] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loadingRounds, setLoadingRounds] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchRounds()
      .then((data) => setRounds(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Failed to load rounds:", err))
      .finally(() => setLoadingRounds(false));
  }, []);

  const handleSelect = (roundId) => {
    setSelectedId(roundId);
    setLoadingDetail(true);
    setDetail(null);
    fetchRoundScores(roundId)
      .then((data) => setDetail(data))
      .catch((err) => console.error("Failed to load round scores:", err))
      .finally(() => setLoadingDetail(false));
  };

  const participantName = (round, color) =>
    color === "blue"
      ? round.blue_name || "Синий"
      : round.red_name || "Красный";

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/")}
          variant="text"
        >
          Назад
        </Button>
        <Typography variant="h5">Прошедшие раунды</Typography>
      </div>

      <div className={styles.content}>
        {/* Round list */}
        <Paper className={styles.roundList} variant="outlined">
          {loadingRounds ? (
            <Box className={styles.centered}>
              <CircularProgress size={28} />
            </Box>
          ) : rounds.length === 0 ? (
            <Box className={styles.centered}>
              <Typography color="text.secondary">
                Прошедших раундов пока нет
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {rounds.map((round) => (
                <ListItemButton
                  key={round.id}
                  selected={round.id === selectedId}
                  onClick={() => handleSelect(round.id)}
                >
                  <ListItemText
                    primary={`Раунд №${round.id} — ${formatRoundTitle(round)}`}
                    secondary={
                      round.ended_at
                        ? `${round.started_at} → ${round.ended_at}`
                        : `${round.started_at} (не завершён)`
                    }
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </Paper>

        {/* Score log */}
        <Paper className={styles.logPanel} variant="outlined">
          {selectedId === null ? (
            <Box className={styles.centered}>
              <Typography color="text.secondary">
                Выберите раунд, чтобы посмотреть лог оценок
              </Typography>
            </Box>
          ) : loadingDetail ? (
            <Box className={styles.centered}>
              <CircularProgress size={28} />
            </Box>
          ) : !detail || detail.error ? (
            <Box className={styles.centered}>
              <Typography color="error">Не удалось загрузить лог</Typography>
            </Box>
          ) : (
            <>
              <div className={styles.logHeader}>
                <Typography variant="h6">
                  Раунд №{detail.round.id}
                </Typography>
                <Typography color="text.secondary">
                  {formatRoundTitle(detail.round)}
                </Typography>
              </div>
              {detail.scores.length === 0 ? (
                <Box className={styles.centered}>
                  <Typography color="text.secondary">
                    В этом раунде не было проставлено оценок
                  </Typography>
                </Box>
              ) : (
                <TableContainer className={styles.tableContainer}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Время</TableCell>
                        <TableCell>Судья</TableCell>
                        <TableCell>Сторона</TableCell>
                        <TableCell>Действие</TableCell>
                        <TableCell>Значение</TableCell>
                        <TableCell>Тип</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {detail.scores.map((s) => (
                        <TableRow
                          key={s.id}
                          className={
                            s.action === "undo" ? styles.undoRow : undefined
                          }
                        >
                          <TableCell>{s.created_at}</TableCell>
                          <TableCell>{s.judge}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={participantName(detail.round, s.color)}
                              color={s.color === "blue" ? "primary" : "error"}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>{punchLabel(s.punch)}</TableCell>
                          <TableCell>{scoreLabel(s.punch, s.score)}</TableCell>
                          <TableCell>
                            {s.action === "undo" ? (
                              <Chip size="small" label="Отмена" color="warning" />
                            ) : (
                              <Chip
                                size="small"
                                label="Оценка"
                                color="success"
                                variant="outlined"
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </Paper>
      </div>
    </div>
  );
};
