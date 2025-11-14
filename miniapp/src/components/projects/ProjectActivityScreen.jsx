import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import FilterBar from "./FilterBar";
import ProjectCard from "./ProjectCard";
import ProjectDetailsModal from "./ProjectDetailsModal";
import LeaderPanel from "./LeaderPanel";
import ProjectFormModal from "./ProjectFormModal";
import {
  VIEW_MODES,
  PROGRAM_UNIVERSITIES,
  generateId,
  findUniversityMatch,
} from "./utils";
import {
  createProjectRequest,
  updateProjectRequest,
  deleteProjectRequest,
  fetchProjectsRequest,
} from "./projectApi";
import { initialProjects } from "./projectData";

const ProjectActivityScreen = ({ account }) => {
  const [projects, setProjects] = useState(() => initialProjects);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTags, setActiveTags] = useState([]);
  const [viewMode, setViewMode] = useState(VIEW_MODES.AVAILABLE);
  const [selectedProject, setSelectedProject] = useState(null);
  const [managingProject, setManagingProject] = useState(null);
  const [formState, setFormState] = useState({ isOpen: false, editing: null });
  const [notification, setNotification] = useState(null);
  const [error, setError] = useState("");

  const currentUser = useMemo(() => {
    if (!account) {
      return null;
    }
    const universityMatch =
      findUniversityMatch(account.universityTitle) ||
      findUniversityMatch(account.university) ||
      null;
    return {
      id: account.id,
      fullName: account.fullName || "",
      university: account.universityTitle || account.university || "",
      universityId: universityMatch?.id || null,
      course: Number(account.course) || 1,
      group: account.groupLabel || account.group || "",
    };
  }, [account]);

  useEffect(() => {
    let aborted = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await fetchProjectsRequest();
        if (aborted) {
          return;
        }
        if (Array.isArray(data) && data.length > 0) {
          setProjects(data);
        } else {
          setProjects(initialProjects);
        }
      } catch (loadError) {
        console.error("Failed to load projects", loadError);
        if (!aborted) {
          setError("Не удалось загрузить проекты. Попробуйте позже.");
          setProjects(initialProjects);
        }
      } finally {
        if (!aborted) {
          setIsLoading(false);
        }
      }
    };
    load();
    return () => {
      aborted = true;
    };
  }, []);

  useEffect(() => {
    if (!notification) {
      return undefined;
    }
    const timer = setTimeout(() => setNotification(null), 3200);
    return () => clearTimeout(timer);
  }, [notification]);

  const userDirectory = useMemo(() => {
    const directory = {};
    if (currentUser) {
      directory[currentUser.id] = currentUser;
    }
    projects.forEach((project) => {
      if (project.leader?.id) {
        directory[project.leader.id] = project.leader;
      }
      (project.pendingRequests || []).forEach((request) => {
        if (request.user?.id) {
          directory[request.user.id] = request.user;
        }
      });
    });
    return directory;
  }, [currentUser, projects]);

  const tagOptions = useMemo(() => {
    const set = new Set();
    projects.forEach((project) => {
      (project.tags || []).forEach((tag) => set.add(tag));
    });
    return Array.from(set);
  }, [projects]);

  const canViewProject = (project) => {
    if (!currentUser) {
      return true;
    }
    const allowedUniversities = Array.isArray(project.allowedUniversities)
      ? project.allowedUniversities
      : [];
    if (allowedUniversities.length > 0) {
      if (!currentUser.universityId) {
        return false;
      }
      const normalizedIds = allowedUniversities.map((value) => {
        const match = findUniversityMatch(value);
        return match?.id || value;
      });
      if (!normalizedIds.includes(currentUser.universityId)) {
        return false;
      }
    }
    if (
      Number.isFinite(project.minCourse) &&
      currentUser.course < Number(project.minCourse)
    ) {
      return false;
    }
    if (
      Number.isFinite(project.maxCourse) &&
      currentUser.course > Number(project.maxCourse)
    ) {
      return false;
    }
    return true;
  };

  const availableProjects = projects.filter(canViewProject);
  const myProjects = currentUser
    ? projects.filter((project) => project.leader?.id === currentUser.id)
    : [];

  const baseList =
    viewMode === VIEW_MODES.AVAILABLE ? availableProjects : myProjects;

  const normalizedQuery = searchTerm.trim().toLowerCase();

  const visibleProjects = baseList
    .filter((project) => {
      const title = project.title?.toLowerCase() ?? "";
      return title.includes(normalizedQuery);
    })
    .filter((project) => {
      if (activeTags.length === 0) {
        return true;
      }
      return activeTags.every((tag) => project.tags?.includes(tag));
    });

  const showEmptyAvailable =
    !isLoading &&
    viewMode === VIEW_MODES.AVAILABLE &&
    availableProjects.length === 0;

  const showEmptyMine =
    !isLoading && viewMode === VIEW_MODES.MINE && myProjects.length === 0;

  const handleToggleTag = (tag) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag],
    );
  };

  const updateProjectState = (projectId, updater) => {
    let updatedProject = null;
    setProjects((prev) =>
      prev.map((project) => {
        if (project.id !== projectId) {
          return project;
        }
        updatedProject = updater(project);
        return updatedProject;
      }),
    );

    if (updatedProject) {
      setSelectedProject((current) =>
        current?.id === projectId ? updatedProject : current,
      );
      setManagingProject((current) =>
        current?.id === projectId ? updatedProject : current,
      );
    }
    return updatedProject;
  };

  const persistProject = async (project) => {
    if (!project?.id) {
      throw new Error("Нет данных проекта для сохранения");
    }
    try {
      const savedProject = await updateProjectRequest(project);
      setProjects((prev) =>
        prev.map((item) => (item.id === savedProject.id ? savedProject : item)),
      );
      setSelectedProject((current) =>
        current?.id === savedProject.id ? savedProject : current,
      );
      setManagingProject((current) =>
        current?.id === savedProject.id ? savedProject : current,
      );
      return savedProject;
    } catch (persistError) {
      console.error("Failed to synchronize project", persistError);
      const message =
        persistError?.message ||
        "Не удалось синхронизировать проект. Попробуйте обновить страницу.";
      setError(message);
      throw persistError;
    }
  };

  const ensureCurrentUser = () => {
    if (currentUser) {
      return true;
    }
    setError("Заполните данные аккаунта, чтобы выполнить действие.");
    return false;
  };

  const showBanner = (message, tone = "success") => {
    setNotification({ id: Date.now(), message, tone });
    setError("");
  };

  const cloneProject = (project) => {
    if (!project) {
      return null;
    }
    if (typeof structuredClone === "function") {
      return structuredClone(project);
    }
    try {
      return JSON.parse(JSON.stringify(project));
    } catch {
      return null;
    }
  };

  const getProjectSnapshot = (projectId) => {
    if (!projectId) {
      return null;
    }
    const targetProject = projects.find((item) => item.id === projectId);
    return cloneProject(targetProject);
  };

  const handleJoinProject = async (projectId, roleId) => {
    if (!ensureCurrentUser()) {
      return;
    }
    const previousSnapshot = getProjectSnapshot(projectId);
    const updatedProject = updateProjectState(projectId, (project) => {
      const participants = [
        ...(Array.isArray(project.participants) ? project.participants : []),
        { userId: currentUser.id, roleId },
      ];
      const roles = (project.roles || []).map((role) =>
        role.id === roleId
          ? {
              ...role,
              filledCount: Math.min(
                role.requiredCount,
                Number(role.filledCount || 0) + 1,
              ),
            }
          : role,
      );
      const pendingRequests = (project.pendingRequests || []).map((request) =>
        request.user?.id === currentUser.id
          ? { ...request, status: "accepted" }
          : request,
      );
      return { ...project, participants, roles, pendingRequests };
    });
    if (!updatedProject) {
      setError("Проект не найден.");
      return;
    }
    try {
      await persistProject(updatedProject);
      showBanner("Вы присоединились к проекту.");
    } catch {
      if (previousSnapshot) {
        updateProjectState(projectId, () => previousSnapshot);
      }
      setError("Не удалось присоединиться. Попробуйте еще раз.");
    }
  };

  const handleLeaveProject = async (projectId) => {
    if (!ensureCurrentUser()) {
      return;
    }
    const previousSnapshot = getProjectSnapshot(projectId);
    const updatedProject = updateProjectState(projectId, (project) => {
      const participants = (project.participants || []).filter(
        (member) => member.userId !== currentUser.id,
      );
      const roles = (project.roles || []).map((role) => {
        if (
          (project.participants || []).some(
            (member) =>
              member.userId === currentUser.id && member.roleId === role.id,
          )
        ) {
          return {
            ...role,
            filledCount: Math.max(0, Number(role.filledCount || 0) - 1),
          };
        }
        return role;
      });
      return { ...project, participants, roles };
    });
    if (!updatedProject) {
      setError("Проект не найден.");
      return;
    }
    try {
      await persistProject(updatedProject);
      showBanner("Вы покинули проект.", "neutral");
    } catch {
      if (previousSnapshot) {
        updateProjectState(projectId, () => previousSnapshot);
      }
      setError("Не удалось выйти из проекта.");
    }
  };

  const handleSendRequest = async (projectId, roleId, message) => {
    if (!ensureCurrentUser()) {
      return;
    }
    const previousSnapshot = getProjectSnapshot(projectId);
    const updatedProject = updateProjectState(projectId, (project) => ({
      ...project,
      pendingRequests: [
        ...(Array.isArray(project.pendingRequests)
          ? project.pendingRequests
          : []),
        {
          id: generateId("request"),
          user: currentUser,
          roleId,
          message,
          status: "pending",
        },
      ],
    }));
    if (!updatedProject) {
      setError("Проект не найден.");
      return;
    }
    try {
      await persistProject(updatedProject);
      showBanner("Заявка отправлена лидеру.");
    } catch {
      if (previousSnapshot) {
        updateProjectState(projectId, () => previousSnapshot);
      }
      setError("Не удалось отправить заявку. Попробуйте еще раз.");
    }
  };

  const handleRespondRequest = async (projectId, requestId, status) => {
    const previousSnapshot = getProjectSnapshot(projectId);
    const updatedProject = updateProjectState(projectId, (project) => {
      const pendingRequests = Array.isArray(project.pendingRequests)
        ? project.pendingRequests
        : [];
      const request = pendingRequests.find((item) => item.id === requestId);
      if (!request) {
        return project;
      }
      let nextParticipants = project.participants || [];
      let nextRoles = project.roles || [];

      if (status === "accepted") {
        const exists = nextParticipants.some(
          (participant) => participant.userId === request.user?.id,
        );
        if (!exists) {
          nextParticipants = [
            ...nextParticipants,
            { userId: request.user?.id, roleId: request.roleId },
          ];
          nextRoles = nextRoles.map((role) =>
            role.id === request.roleId
              ? {
                  ...role,
                  filledCount: Math.min(
                    role.requiredCount,
                    Number(role.filledCount || 0) + 1,
                  ),
                }
              : role,
          );
        }
      }

      return {
        ...project,
        participants: nextParticipants,
        roles: nextRoles,
        pendingRequests: pendingRequests.map((item) =>
          item.id === requestId ? { ...item, status } : item,
        ),
      };
    });
    if (!updatedProject) {
      setError("Проект не найден.");
      return;
    }
    try {
      await persistProject(updatedProject);
      showBanner(
        status === "accepted" ? "Заявка одобрена." : "Заявка отклонена.",
        status === "accepted" ? "success" : "neutral",
      );
    } catch {
      if (previousSnapshot) {
        updateProjectState(projectId, () => previousSnapshot);
      }
      setError("Не удалось обновить заявку.");
    }
  };

  const handleDeleteProject = async (projectId) => {
    try {
      await deleteProjectRequest(projectId);
      setProjects((prev) => prev.filter((project) => project.id !== projectId));
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
      }
      if (managingProject?.id === projectId) {
        setManagingProject(null);
      }
      showBanner("Проект удален.", "neutral");
    } catch {
      setError("Не удалось удалить проект.");
    }
  };

  const handleSaveProject = async (formValues, projectId) => {
    if (!ensureCurrentUser()) {
      throw new Error("Нет данных о текущем пользователе");
    }
    const allowedUniversities = (formValues.allowedUniversities || [])
      .map((value) => findUniversityMatch(value)?.id)
      .filter(Boolean);
    if (!allowedUniversities.length) {
      throw new Error("Выберите университет из списка программы");
    }
    const payload = {
      ...formValues,
      allowedUniversities,
      minCourse: Number(formValues.minCourse),
      maxCourse: Number(formValues.maxCourse),
      roles: formValues.roles.map((role) => ({
        ...role,
        id: role.id || generateId("role"),
        requiredCount: Number(role.requiredCount) || 1,
        filledCount: Math.min(
          Number(role.filledCount || 0),
          Number(role.requiredCount) || 1,
        ),
      })),
    };
    const leaderRoleExists = payload.roles.some(
      (role) => role.id === formValues.leaderRoleId,
    );
    payload.leaderRoleId = leaderRoleExists ? formValues.leaderRoleId : "";

    if (projectId) {
      const previousSnapshot = getProjectSnapshot(projectId);
      const updatedProject = updateProjectState(projectId, (project) => {
        const preservedParticipants = (project.participants || []).filter(
          (member) => member.userId !== currentUser.id,
        );
        const participants = payload.leaderRoleId
          ? [
              ...preservedParticipants,
              { userId: currentUser.id, roleId: payload.leaderRoleId },
            ]
          : preservedParticipants;
        const roles = payload.roles.map((role) => {
          const participantCount = participants.filter(
            (member) => member.roleId === role.id,
          ).length;
          return {
            ...role,
            filledCount: Math.min(role.requiredCount, participantCount),
          };
        });
        return {
          ...project,
          ...payload,
          participants,
          roles,
          maxPeople: payload.roles.reduce(
            (total, role) => total + role.requiredCount,
            0,
          ),
        };
      });
      if (!updatedProject) {
        throw new Error("Проект не найден");
      }
      try {
        await persistProject(updatedProject);
      } catch (persistError) {
        if (previousSnapshot) {
          updateProjectState(projectId, () => previousSnapshot);
        }
        throw new Error(
          persistError?.message ||
            "Не удалось обновить проект. Попробуйте еще раз.",
        );
      }
      showBanner("Проект обновлен.");
      return;
    }

    const leaderRoleId = payload.leaderRoleId || "";
    const participants = leaderRoleId
      ? [{ userId: currentUser.id, roleId: leaderRoleId }]
      : [];
    const newProject = {
      id: generateId("project"),
      title: payload.title,
      description: payload.description,
      tags: payload.tags,
      leader: currentUser,
      leaderRoleId,
      roles: payload.roles.map((role) => ({
        ...role,
        filledCount:
          role.id === leaderRoleId
            ? Math.min(role.requiredCount, 1)
            : 0,
      })),
      visibility: payload.visibility,
      allowedUniversities: payload.allowedUniversities,
      minCourse: payload.minCourse,
      maxCourse: payload.maxCourse,
      participants,
      pendingRequests: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      maxPeople: payload.roles.reduce((total, role) => total + role.requiredCount, 0),
    };
    const savedProject = await createProjectRequest(newProject);
    setProjects((prev) => [savedProject, ...prev]);
    showBanner("Проект создан.");
  };

  const renderEmptyState = () => {
    if (showEmptyAvailable) {
      return (
        <div className="projects-empty">
          Для ваших параметров пока нет доступных проектов. Создайте свой или измените фильтры.
        </div>
      );
    }

    if (showEmptyMine) {
      return (
        <div className="projects-empty">
          У вас пока нет собственных проектов. Нажмите «Создать» и соберите команду.
        </div>
      );
    }

    if (!isLoading && visibleProjects.length === 0) {
      return (
        <div className="projects-empty">
          Ничего не найдено. Попробуйте изменить поисковый запрос или теги.
        </div>
      );
    }

    return null;
  };

  return (
    <section className="screen projects-screen">
      <header className="projects-screen__header">
        <div>
          <p className="projects-screen__eyebrow">Работа в командах</p>
          <h2 className="screen__title">Проектная деятельность</h2>
          <p className="screen__subtitle">
            Находите команды по интересам или запускайте свои инициативы.
          </p>
        </div>
        <button
          type="button"
          className="projects-screen__create-button"
          onClick={() => setFormState({ isOpen: true, editing: null })}
        >
          +
        </button>
      </header>

      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        tagOptions={tagOptions}
        activeTags={activeTags}
        onToggleTag={handleToggleTag}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {notification && (
        <div className={`projects-banner projects-banner--${notification.tone}`}>
          {notification.message}
        </div>
      )}

      {error && <div className="projects-banner projects-banner--error">{error}</div>}

      {isLoading ? (
        <div className="projects-loading">Загрузка проектов…</div>
      ) : (
        <>
          <div className="projects-list">
            {visibleProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                currentUser={currentUser}
                onOpenDetails={() => setSelectedProject(project)}
                onOpenManage={
                  currentUser && project.leader?.id === currentUser.id
                    ? () => setManagingProject(project)
                    : undefined
                }
              />
            ))}
          </div>
          {renderEmptyState()}
        </>
      )}

      <AnimatePresence>
        {selectedProject && (
          <ProjectDetailsModal
            project={selectedProject}
            currentUser={currentUser}
            userDirectory={userDirectory}
            onClose={() => setSelectedProject(null)}
            onJoin={handleJoinProject}
            onLeave={handleLeaveProject}
            onSendRequest={handleSendRequest}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {managingProject && (
          <LeaderPanel
            project={managingProject}
            userDirectory={userDirectory}
            onClose={() => setManagingProject(null)}
            onEdit={(project) => {
              setFormState({ isOpen: true, editing: project });
              setManagingProject(null);
            }}
            onDelete={(projectId) => {
              if (window.confirm("Удалить проект? Действие нельзя отменить.")) {
                handleDeleteProject(projectId);
              }
            }}
            onRespondRequest={handleRespondRequest}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {formState.isOpen && (
          <ProjectFormModal
            key={formState.editing?.id || "new"}
            project={formState.editing}
            universities={PROGRAM_UNIVERSITIES}
            defaultUniversity={
              currentUser?.universityId || PROGRAM_UNIVERSITIES[0]?.id || ""
            }
            onClose={() => setFormState({ isOpen: false, editing: null })}
            onSubmit={async (values, projectId) => {
              await handleSaveProject(values, projectId);
              setFormState({ isOpen: false, editing: null });
            }}
          />
        )}
      </AnimatePresence>
    </section>
  );
};

export default ProjectActivityScreen;
