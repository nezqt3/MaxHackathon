import { useEffect, useState } from "react";
import ModalSheet from "./ModalSheet";
import { getRoleById, formatUniversityList } from "./utils";

const ProjectDetailsModal = ({
  project,
  currentUser,
  userDirectory,
  onClose,
  onJoin,
  onLeave,
  onSendRequest,
}) => {
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!project) {
      return;
    }
    const firstAvailable =
      (project.roles || []).find(
        (role) => Number(role.filledCount || 0) < Number(role.requiredCount),
      )?.id ?? "";
    setSelectedRoleId(firstAvailable);
    setMessage("");
  }, [project]);

  if (!project) {
    return null;
  }

  const roles = project.roles || [];
  const participantsRaw = Array.isArray(project.participants)
    ? project.participants
    : [];
  const pendingRequests = Array.isArray(project.pendingRequests)
    ? project.pendingRequests
    : [];
  const isLeader = Boolean(
    currentUser && project.leader?.id === currentUser.id,
  );
  const isParticipant = Boolean(
    currentUser &&
      participantsRaw.some((participant) => participant.userId === currentUser.id),
  );
  const userRequest = pendingRequests.find(
    (request) => request.user?.id === currentUser?.id,
  );
  const availableRoles = roles.filter(
    (role) => Number(role.filledCount || 0) < Number(role.requiredCount),
  );

  const universitiesList = formatUniversityList(project.allowedUniversities);
  const universitiesText =
    universitiesList.length > 0 ? universitiesList.join(", ") : "не указаны";
  const courseRangeText =
    Number.isFinite(project.minCourse) && Number.isFinite(project.maxCourse)
      ? `${project.minCourse}–${project.maxCourse}`
      : "не указаны";

  const participants = participantsRaw.map((participant) => {
    const profile =
      userDirectory[participant.userId] || {
        fullName: "Участник",
        university: "Университет",
        course: "",
        group: "",
      };
    const role = getRoleById(roles, participant.roleId);
    return { ...participant, profile, role };
  });

  const resolvedRoleId = selectedRoleId || availableRoles[0]?.id || "";

  const handleJoin = () => {
    if (!resolvedRoleId) {
      return;
    }
    onJoin?.(project.id, resolvedRoleId);
  };

  const handleRequest = () => {
    if (!resolvedRoleId) {
      return;
    }
    onSendRequest?.(project.id, resolvedRoleId, message);
  };

  const renderStatus = () => {
    if (isLeader) {
      return (
        <div className="project-modal__status">
          Вы лидируете в этом проекте. Управляйте командой во вкладке «Мои проекты».
        </div>
      );
    }
    if (isParticipant) {
      const myRole = participantsRaw.find(
        (member) => member.userId === currentUser?.id,
      );
      const roleName = getRoleById(roles, myRole?.roleId)?.name || "";
      return (
        <div className="project-modal__status project-modal__status--success">
          Вы в команде{roleName ? ` (роль: ${roleName})` : ""}.
        </div>
      );
    }
    if (userRequest) {
      if (userRequest.status === "pending") {
        return <div className="project-modal__status">Заявка на рассмотрении.</div>;
      }
      if (userRequest.status === "declined") {
        return (
          <div className="project-modal__status project-modal__status--warning">
            Заявка отклонена. Попробуйте выбрать другую роль.
          </div>
        );
      }
      if (userRequest.status === "accepted") {
        return (
          <div className="project-modal__status project-modal__status--success">
            Заявка одобрена.
          </div>
        );
      }
    }
    return null;
  };

  return (
    <ModalSheet onClose={onClose}>
      <div className="project-modal">
        <div className="project-modal__header">
          <p className="project-modal__eyebrow">
            {project.visibility === "open" ? "Открытый проект" : "Закрытый проект"}
          </p>
          <h3>{project.title}</h3>
          <button
            type="button"
            className="project-modal__close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {project.description && (
          <p className="project-modal__description">{project.description}</p>
        )}

        {project.tags?.length > 0 && (
          <div className="project-modal__tags">
            {project.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        )}

        {project.leader && (
          <div className="project-modal__section">
            <span className="project-modal__section-title">Лидер</span>
            <p className="project-modal__leader-name">{project.leader.fullName}</p>
            <p className="project-modal__leader-meta">
              {project.leader.university}, {project.leader.course} курс, {project.leader.group}
            </p>
          </div>
        )}

        <div className="project-modal__section">
          <span className="project-modal__section-title">Роли</span>
          {availableRoles.length > 0 ? (
            <div className="project-modal__roles">
              {availableRoles.map((role) => (
                <label
                  key={role.id}
                  className={`project-modal__role${selectedRoleId === role.id ? " is-selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role.id}
                    checked={selectedRoleId === role.id}
                    onChange={() => setSelectedRoleId(role.id)}
                  />
                  <div>
                    <p>{role.name}</p>
                    <span>
                      свободно {Math.max(0, role.requiredCount - Number(role.filledCount || 0))}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <p className="project-modal__muted">Все роли заняты.</p>
          )}
        </div>

        <div className="project-modal__section">
          <span className="project-modal__section-title">Условия</span>
          <p className="project-modal__muted">Университеты: {universitiesText}</p>
          <p className="project-modal__muted">Курсы: {courseRangeText}</p>
        </div>

        <div className="project-modal__section">
          <span className="project-modal__section-title">Участники</span>
          <ul className="project-modal__participants">
            {participants.map((participant) => (
              <li key={`${participant.userId}-${participant.roleId}`}>
                <div>
                  <p>{participant.profile.fullName}</p>
                  <span>
                    {participant.role?.name || "роль не указана"}
                    {participant.profile.group ? ` • ${participant.profile.group}` : ""}
                  </span>
                </div>
              </li>
            ))}
            {participants.length === 0 && (
              <li className="project-modal__muted">Команда пока пустая.</li>
            )}
          </ul>
        </div>

        {renderStatus()}

        {!isLeader && !isParticipant && project.visibility === "closed" && (
          <textarea
            className="project-modal__textarea"
            placeholder="Кратко расскажите о себе (необязательно)"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
        )}

        <div className="project-modal__actions">
          {isParticipant ? (
            <button
              type="button"
              className="project-modal__button project-modal__button--danger"
              onClick={() => onLeave?.(project.id)}
            >
              Покинуть проект
            </button>
          ) : project.visibility === "open" ? (
            <button
              type="button"
              className="project-modal__button"
              disabled={!resolvedRoleId}
              onClick={handleJoin}
            >
              Вступить
            </button>
          ) : (
            <button
              type="button"
              className="project-modal__button"
              disabled={!resolvedRoleId || userRequest?.status === "pending"}
              onClick={handleRequest}
            >
              Отправить заявку
            </button>
          )}
        </div>
      </div>
    </ModalSheet>
  );
};

export default ProjectDetailsModal;
