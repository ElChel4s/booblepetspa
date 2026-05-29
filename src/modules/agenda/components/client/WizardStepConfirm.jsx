import PropTypes from 'prop-types';
import ClientTicketSummary from './ClientTicketSummary';

const WizardStepConfirm = ({
  cartTotals,
  grandTotalPrice,
  grandTotalTime,
  selectedDate,
  uiStartTime,
  uiEndTime,
  selectedGroomer,
  groomersList,
  handleBookingSubmit,
  wizardStep,
  saving,
  setWizardStep,
}) => {
  return (
    <div className="animate-in slide-in-from-bottom-8 space-y-6 w-full max-w-2xl mx-auto">
      <ClientTicketSummary
        cartTotals={cartTotals}
        grandTotalPrice={grandTotalPrice}
        grandTotalTime={grandTotalTime}
        selectedDate={selectedDate}
        uiStartTime={uiStartTime}
        uiEndTime={uiEndTime}
        selectedGroomer={selectedGroomer}
        groomersList={groomersList}
        confirmAction={handleBookingSubmit}
        wizardStep={wizardStep}
      />
      <div className="flex justify-between pt-4">
        <button
          disabled={saving}
          onClick={() => setWizardStep(3)}
          className="bg-white text-black w-full px-6 py-4 rounded-2xl border-[3.5px] border-black font-black text-xs uppercase shadow-[4px_4px_0px_0px_black] hover:-translate-y-1 transition-all active:translate-y-1 active:shadow-none text-center cursor-pointer disabled:opacity-50"
        >
          Volver a editar
        </button>
      </div>
    </div>
  );
};

WizardStepConfirm.propTypes = {
  cartTotals: PropTypes.array.isRequired,
  grandTotalPrice: PropTypes.number.isRequired,
  grandTotalTime: PropTypes.number.isRequired,
  selectedDate: PropTypes.instanceOf(Date),
  uiStartTime: PropTypes.string.isRequired,
  uiEndTime: PropTypes.string.isRequired,
  selectedGroomer: PropTypes.string.isRequired,
  groomersList: PropTypes.array.isRequired,
  handleBookingSubmit: PropTypes.func.isRequired,
  wizardStep: PropTypes.number.isRequired,
  saving: PropTypes.bool,
  setWizardStep: PropTypes.func.isRequired,
};

export default WizardStepConfirm;
