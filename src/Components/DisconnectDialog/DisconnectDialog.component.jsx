
import PropTypes from 'prop-types';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import Stack from '@mui/material/Stack';
import Button from "@mui/material/Button"
import Box from "@mui/material/Box"

export function DisconnectDialog(props) {
  const { onClose, onApprove, open, judgeName } = props;

  const handleClose = () => {
    onClose();
  };

  const handleApprove = () => {
    onApprove();
    onClose();
  }

  return (
    <Dialog onClose={handleClose} open={open}>
      <DialogTitle>Отключить судью: {judgeName}?</DialogTitle>
      <Box padding={2} paddingBottom={5}>
        <Stack direction="row" spacing={2} justifyContent='center'>
          <Button variant='contained' onClick={handleClose}>Нет</Button>
          <Button variant='contained' onClick={handleApprove} color='error'>Да</Button>
        </Stack>
      </Box>
    </Dialog>
  );
}

DisconnectDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  onApprove: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  judgeName: PropTypes.string.isRequired
};

