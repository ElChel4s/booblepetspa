import React from 'react';
import PropTypes from 'prop-types';
import AdminAgendaCrudPanel from '../components/AdminAgendaCrudPanel';

const AdminAgendaView = (props) => {
  return <AdminAgendaCrudPanel {...props} />;
};

export default AdminAgendaView;

AdminAgendaView.propTypes = {
  activeTab: PropTypes.string.isRequired,
  agendaData: PropTypes.shape({
    services: PropTypes.array,
    modifiers: PropTypes.array,
    groomers: PropTypes.array,
    schedules: PropTypes.array,
    exceptions: PropTypes.array,
    appointments: PropTypes.array,
    reservations: PropTypes.array,
    pets: PropTypes.array,
  }),
  loading: PropTypes.bool,
  error: PropTypes.any,
  selectedDate: PropTypes.string.isRequired,
  setSelectedDate: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
};