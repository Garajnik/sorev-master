import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  connectParticipants,
  fetchDbParticipants,
  createDbParticipant,
} from "../../api/api";
import styles from "./NewRoundPage.module.css";
import {
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";

export const NewRoundPage = () => {
  const [inputs, setInputs] = useState({ blue: "", red: "" });
  const [errors, setErrors] = useState({ blue: "", red: "" });
  const [dbParticipants, setDbParticipants] = useState([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [newNames, setNewNames] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    fetchDbParticipants()
      .then(setDbParticipants)
      .catch((err) => console.error("Error fetching participants:", err));
  }, []);

  const participantNames = dbParticipants.map((p) => p.name);

  const handleChange = (field) => (_event, value) => {
    setInputs((prev) => ({ ...prev, [field]: value ?? "" }));
  };

  const validate = () => {
    const blueError = inputs.blue ? "" : "Введите ФИО синего участника";
    const redError = inputs.red ? "" : "Введите ФИО красного участника";
    setErrors({ blue: blueError, red: redError });
    return !blueError && !redError;
  };

  const createRound = async () => {
    await connectParticipants(inputs);
    navigate("/table");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const unknown = [inputs.blue, inputs.red].filter(
      (name) => !participantNames.includes(name),
    );

    if (unknown.length > 0) {
      setNewNames(unknown);
      setSaveDialogOpen(true);
    } else {
      await createRound();
    }
  };

  const handleSave = async () => {
    setSaveDialogOpen(false);
    await Promise.all(newNames.map(createDbParticipant));
    await createRound();
  };

  const handleSkipSave = async () => {
    setSaveDialogOpen(false);
    await createRound();
  };

  return (
    <div className={styles.container}>
      <form className={styles.form}>
        <Typography variant="h5">Создание нового раунда</Typography>

        <div className={styles.inputContainer}>
          <Autocomplete
            freeSolo
            options={participantNames}
            value={inputs.blue}
            onInputChange={handleChange("blue")}
            renderInput={(params) => (
              <TextField
                {...params}
                label="ФИО Синий"
                error={!!errors.blue}
                helperText={errors.blue}
              />
            )}
          />

          <Autocomplete
            freeSolo
            options={participantNames}
            value={inputs.red}
            onInputChange={handleChange("red")}
            renderInput={(params) => (
              <TextField
                {...params}
                label="ФИО Красный"
                error={!!errors.red}
                helperText={errors.red}
              />
            )}
          />
        </div>

        <Button variant="contained" onClick={handleSubmit}>
          Начать
        </Button>

        <Button variant="text" onClick={() => navigate("/history")}>
          Прошедшие раунды
        </Button>
      </form>

      <Dialog open={saveDialogOpen} onClose={handleSkipSave}>
        <DialogTitle>Новые участники</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Следующие участники не найдены в базе данных:
            <br />
            {newNames.map((n) => (
              <strong key={n}>
                — {n}
                <br />
              </strong>
            ))}
            Сохранить их для будущих раундов?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSkipSave}>Продолжить без сохранения</Button>
          <Button variant="contained" onClick={handleSave}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
