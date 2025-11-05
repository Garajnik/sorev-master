import { useEffect, useState } from "react";
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `http://${window.location.host.split(":")[0] + ":8000"
        }/connect_judge`,
        {
          name: judgeName,
        }
      );
      if (response.status === 200) {
        localStorage.setItem("judgeName", judgeName)
        navigate("/mobile");
      }
    } catch (error) {
      console.error("Error sending judge name to server", error);
    }
  };

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <Typography variant="h4">Подключение:</Typography>
        <TextField value={judgeName} onChange={(e) => { handleInputChange(e) }} id="outlined-basic" label="Введите имя" variant="outlined" />
        <Button type="submit" variant="contained" >Подключиться</Button>
      </form>
    </div>
  );
};

