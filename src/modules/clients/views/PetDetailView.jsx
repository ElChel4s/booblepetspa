import { useState } from 'react';
import PetFormModal from '../components/PetFormModal';
import {
  PetDetailHeader,
  PetHeroCard,
  PetTechnicalDetails,
  PetGroomerContact,
  PetOwnerCard,
  PetVisitCard
} from '../components/PetDetailComponents';

const PetDetailView = ({ pet, owner, onBack, mode = 'admin' }) => {
  const [isEditing, setIsEditing] = useState(false);
  const isGroomer = mode === 'groomer';

  return (
    <div className="animate-in slide-in-from-right-8 duration-500 pb-20">
      <PetDetailHeader
        onBack={onBack}
        onEdit={() => setIsEditing(true)}
        showEdit={!isGroomer}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-12">
          <PetHeroCard pet={pet} isGroomer={isGroomer} />
        </div>

        <div className="lg:col-span-8 space-y-8">
          <PetTechnicalDetails pet={pet} />
        </div>

        <div className="lg:col-span-4 space-y-8">
          {isGroomer ? (
            <PetGroomerContact owner={owner} />
          ) : (
            <>
              {owner && <PetOwnerCard owner={owner} />}
              {pet.ultima_visita && <PetVisitCard pet={pet} />}
            </>
          )}
        </div>
      </div>

      <PetFormModal isOpen={isEditing} onClose={() => setIsEditing(false)} pet={pet} />
    </div>
  );
};

export default PetDetailView;
