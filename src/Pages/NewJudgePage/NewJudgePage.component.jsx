import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./NewJudgePage.module.css";
import { Button, TextField, Typography } from "@mui/material";

export const NewJudgePage = () => {
  const [judgeName, setJudgeName] = useState("");
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setJudgeName(e.target.value);
  };

  const handleSubmit = async () => {
    try {
      const response = await axios.post(
        `http://${window.location.host.split(":")[0] + ":5000"
        }/submit_judge_name`,
        {
          judge_name: judgeName,
        }
      );
      if (response.status === 200) {
        navigate("/mobile", { state: { judgeName } });
      }
    } catch (error) {
      console.error("Error sending judge name to server", error);
    }
  };

  return (
    <div className={styles.container}>
      <form className={styles.form}>
        <Typography variant="h4">Подключение:</Typography>
        <TextField id="outlined-basic" label="Введите имя" variant="outlined" />
        <Button variant="contained" >Подключиться</Button>
      </form>
    </div>
  );
};

