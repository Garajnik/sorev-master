import { useState, useEffect } from "react";
import "./StartPage.css";
import { useNavigate } from "react-router-dom";

const StartPage = () => {
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
          `http://${
            window.location.host.split(":")[0] + ":5000"
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
      field1Error = "Введите ФИО красного участника";
    }

    if (!inputs.field2) {
      field2Error = "Введите ФИО синего участника";
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
          `http://${
            window.location.host.split(":")[0] + ":5000"
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
    <div className="container">
      <form onSubmit={handleSubmit} className="form">
        <div className="inputGroup">
          <input
            type="text"
            name="field1"
            value={inputs.field1}
            onChange={handleChange}
            placeholder="ФИО Синий"
            className="input"
          />
          {errors.field1 && <div className="error">{errors.field1}</div>}
        </div>
        <div className="inputGroup">
          <input
            type="text"
            name="field2"
            value={inputs.field2}
            onChange={handleChange}
            placeholder="ФИО Красный"
            className="input"
          />
          {errors.field2 && <div className="error">{errors.field2}</div>}
        </div>
        <button type="submit" className="button">
          Начать
        </button>
      </form>
    </div>
  );
};

export default StartPage;
