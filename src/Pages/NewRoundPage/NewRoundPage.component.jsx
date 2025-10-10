import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./NewRoundPage.module.css";
import { Button, TextField, Typography } from "@mui/material";

export const NewRoundPage = () => {
  const [inputs, setInputs] = useState({
    field1: "",
    field2: "",
  });

  const [errors, setErrors] = useState({
    field1: "",
    field2: "",
  });

  useEffect(() => {
    const fetchNames = async () => {
      try {
        const response = await fetch(
          `http://${window.location.host.split(":")[0] + ":5000"
          }/participant_names`
        );
        const data = await response.json();
        // setInputs({
        //   field1: data.redName,
        //   field2: data.blueName,
        // });
      } catch (error) {
        console.error("Error fetching participant names:", error);
      }
    };

    fetchNames();
  }, []);

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

    if (!inputs.field1) {
      field1Error = "Введите ФИО синего участника";
    }

    if (!inputs.field2) {
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
          `http://${window.location.host.split(":")[0] + ":5000"
          }/update_participant_names`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              redName: inputs.field1,
              blueName: inputs.field2,
            }),
          }
        );
        const data = await response.json();
        console.log(data);
        // Navigate to another page or display a success message
        navigate("/table");
      } catch (error) {
        console.error("Error submitting data:", error);
      }
      // Clear the form
      setInputs({
        field1: "",
        field2: "",
      });
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
        <TextField id="outlined-basic" label="ФИО Синий" variant="outlined" />
        <TextField id="outlined-basic" label="ФИО Красный" variant="outlined" />
        <Button variant="contained" >Начать</Button>
      </form>
    </div>
  );
};

