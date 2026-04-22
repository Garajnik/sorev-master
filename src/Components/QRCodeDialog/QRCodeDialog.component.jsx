import PropTypes from "prop-types";
import DialogTitle from "@mui/material/DialogTitle";
import Dialog from "@mui/material/Dialog";
import QRCode from "qrcode.react";
import { Box, Button } from "@mui/material";
import { useEffect, useState } from "react";

export function QRCodeDialog(props) {
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  const { onClose, open } = props;

  const handleClose = () => {
    onClose();
  };

  useEffect(() => {
    if (open) {
      fetchLocalIp();
    }
  }, [open]);

  const fetchLocalIp = async () => {
    try {
      const response = await fetch(
        `http://${window.location.host.split(":")[0] + ":8000"}/local_ip`,
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      const localIp = data.local_ip;
      setQrCodeUrl(`http://${localIp}:8000/connect`);
    } catch (error) {
      console.error("Failed to fetch local IP:", error);
    }
  };

  return (
    <Dialog onClose={handleClose} open={open}>
      <DialogTitle>Отсканируйте QR для подключения:</DialogTitle>
      <Box
        padding={5}
        display={"flex"}
        alignItems={"center"}
        justifyContent={"center"}
      >
        <QRCode value={qrCodeUrl} size={256} />
      </Box>
      <Button
        variant="contained"
        onClick={handleClose}
        sx={{ borderRadius: 0 }}
      >
        Закрыть
      </Button>
    </Dialog>
  );
}

QRCodeDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
};
