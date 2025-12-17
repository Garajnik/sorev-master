import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./NewRoundPage.module.css";
import { Button, TextField, Typography } from "@mui/material";

export const NewRoundPage = () => {
  const [inputs, setInputs] = useState({
    blue: "",
    red: "",
  });

  const [errors, setErrors] = useState({
    field1: "",
    field2: "",
  });

  useEffect(() => {
    const fetchNames = async () => {
      try {
        const response = await fetch(
          `http://${window.location.host.split(":")[0] + ":8000"
          }/participant_names`
        );
        const data = await response.json();
        setInputs({
          field1: data.redName,
          field2: data.blueName,
        });
      } catch (error) {
        console.error("Error fetching participant names:", error);
      }
    };

    fetchNames();
  },);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs({
      ...inputs,
      [name]: value,
    });
  };

  const navigate = useNavigate();

  const validate = () => {
    let field1Error = "";
    let field2Error = "";

    if (!inputs.blue) {
      field1Error = "Введите ФИО синего участника";
    }

    if (!inputs.red) {
      field2Error = "Введите ФИО красного участника";
    }

    if (field1Error || field2Error) {
      setErrors({
        field1: field1Error,
        field2: field2Error,
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isValid = validate();
    if (isValid) {
      try {
        const response = await fetch(
          `http://${window.location.host.split(":")[0] + ":8000"
          }/connect_participants`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(inputs),
          }
        );
        const data = await response.json();
        console.log(data);
        navigate("/table");
      } catch (error) {
        console.error("Error submitting data:", error);
      }
      setErrors({
        field1: "",
        field2: "",
      });
    }
  };

  return (
    <div className={styles.container}>
      <form className={styles.form}>
        <Typography variant="h4">Создание нового раунда</Typography>
        <TextField error={errors.field1} helperText={errors.field1} name="blue" id="outlined-basic" label="ФИО Синий" variant="outlined" onChange={handleChange} />
        <TextField error={errors.field2} helperText={errors.field2} name="red" id="outlined-basic" label="ФИО Красный" variant="outlined" onChange={handleChange} />
        <Button variant="contained" onClick={handleSubmit}>Начать</Button>
      </form>
    </div>
  );
};

