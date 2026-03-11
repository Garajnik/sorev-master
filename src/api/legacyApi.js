import axios from "axios";

const BASE_URL = `http://${window.location.hostname}:5000`;

export const fetchParticipantNames = async () => {
  const response = await axios.get(`${BASE_URL}/participant_names`);
  return response.data;
};

export const postButtonClick = async (postData) => {
  await axios.post(`${BASE_URL}/handle_button_click`, postData);
};

export const fetchLocalIp = async () => {
  const response = await fetch(`${BASE_URL}/local_ip`);
  if (!response.ok) throw new Error("Network response was not ok");
  const data = await response.json();
  return data.local_ip;
};
