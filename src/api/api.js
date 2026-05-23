const BASE_URL = `http://${window.location.hostname}:8000`;

export const fetchParticipants = async () => {
  const response = await fetch(`${BASE_URL}/participants`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  const data = await response.json();
  return JSON.parse(data);
};

export const fetchScores = async () => {
  const response = await fetch(`${BASE_URL}/scores`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  return response.json();
};

export const postScore = async (data) => {
  const response = await fetch(`${BASE_URL}/send_score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const undoScore = async (data) => {
  const response = await fetch(`${BASE_URL}/undo_score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const connectJudge = async (name) => {
  const response = await fetch(`${BASE_URL}/connect_judge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  return response;
};

export const fetchParticipantNames = async () => {
  const response = await fetch(`${BASE_URL}/participant_names`);
  return response.json();
};

export const connectParticipants = async (data) => {
  const response = await fetch(`${BASE_URL}/connect_participants`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const kickJudge = async (judgeName) => {
  const response = await fetch(`${BASE_URL}/kick_judge/${judgeName}`);
  return response;
};

export const postRoundEnd = async () => {
  const response = await fetch(`${BASE_URL}/round_end`, { method: "POST" });
  return response;
};

export const postTiebreaker = async (judgeName, winner) => {
  const response = await fetch(`${BASE_URL}/tiebreaker`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ judge: judgeName, winner }),
  });
  return response;
};

export const fetchDbParticipants = async () => {
  const response = await fetch(`${BASE_URL}/db/participants`);
  return response.json();
};

export const createDbParticipant = async (name) => {
  const response = await fetch(`${BASE_URL}/db/participants`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  return response.json();
};
