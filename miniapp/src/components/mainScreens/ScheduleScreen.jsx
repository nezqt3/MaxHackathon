import useScheduleController from "../../hooks/useScheduleController";
import ScheduleDaySelector from "../schedule/ScheduleDaySelector";
import ScheduleLessonsList from "../schedule/ScheduleLessonsList";
import ScheduleSearchBlock from "../schedule/ScheduleSearchBlock";
import ScheduleWeekNavigator from "../schedule/ScheduleWeekNavigator";

const ScheduleScreen = () => {
  const {
    weekDays,
    weekOffset,
    weekRangeLabel,
    selectedDayIndex,
    handleDaySelect,
    handleWeekChange,
    selectedProfile,
    isEditingProfile,
    handleEnterEditMode,
    shouldExpandSearch,
    searchInputRef,
    searchQuery,
    handleQueryChange,
    isSearchBusy,
    handleSearch,
    searchError,
    searchResults,
    handleSelectProfile,
    handleSearchFocusChange,
    hasProfile,
    hasError,
    isLoadingLessons,
    isReady,
    lessons,
    preparedLessons,
  } = useScheduleController();

  return (
    <section className="screen schedule-screen">
      <ScheduleSearchBlock
        selectedProfile={selectedProfile}
        isEditingProfile={isEditingProfile}
        shouldExpandSearch={shouldExpandSearch}
        onEnterEditMode={handleEnterEditMode}
        searchInputRef={searchInputRef}
        searchQuery={searchQuery}
        onChangeQuery={handleQueryChange}
        isSearchBusy={isSearchBusy}
        onSearch={handleSearch}
        searchError={searchError}
        searchResults={searchResults}
        onSelectProfile={handleSelectProfile}
        onFocusChange={handleSearchFocusChange}
      />

      <div className="schedule-screen__heading">
        <div>
          <h2 className="screen__title">Расписание</h2>
          {!selectedProfile && (
            <p className="screen__subtitle">
              Найдите свою группу или преподавателя, чтобы увидеть расписание.
            </p>
          )}
        </div>
      </div>

      <ScheduleWeekNavigator
        weekRangeLabel={weekRangeLabel}
        weekOffset={weekOffset}
        onChange={handleWeekChange}
      />

      <ScheduleDaySelector
        weekDays={weekDays}
        selectedDayIndex={selectedDayIndex}
        onSelect={handleDaySelect}
      />

      <ScheduleLessonsList
        hasProfile={hasProfile}
        hasError={hasError}
        isLoading={isLoadingLessons}
        isReady={isReady}
        lessons={lessons}
        preparedLessons={preparedLessons}
      />
    </section>
  );
};

export default ScheduleScreen;
