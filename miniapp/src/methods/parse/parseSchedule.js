export const joinByStartTime = (data) => {
  const grouped = Object.values(
    data.reduce((acc, item) => {
      const key = item.beginLesson;

      if (!acc[key]) {
        acc[key] = {
          beginLesson: item.beginLesson,
          endLesson: item.endLesson,
          dayOfWeek: item.dayOfWeek,
          dayOfWeekString: item.dayOfWeekString,
          date: item.date,
          auditoriums: [],
          disciplines: [],
          kindOfWorks: [],
          lecturers: [],
          lecturerTitles: [],
          lecturerEmails: [],
          streams: [],
          groups: [],
          urls: [],
        };
      }

      acc[key].auditoriums.push(item.auditorium || "none");
      acc[key].disciplines.push(item.discipline || "none");
      acc[key].kindOfWorks.push(item.kindOfWork || "none");
      acc[key].lecturers.push(item.lecturer || "none");
      acc[key].lecturerTitles.push(item.lecturer_title || "none");
      acc[key].lecturerEmails.push(item.lecturerEmail || "none");
      acc[key].streams.push(item.stream || "none");
      acc[key].groups.push(item.group || "none");

      const urls = [];
      urls.push({
        url: item.url1 || "none",
        description: item.url1_description || "none",
      });
      urls.push({
        url: item.url2 || "none",
        description: item.url2_description || "none",
      });
      acc[key].urls.push(...urls);

      return acc;
    }, {})
  );

  return grouped;
};

// Поиск расписания по ключу из текст инпута

export const parseIdSchedule = async (string) => {
  try {
    const response = await fetch(`https://ruz.fa.ru/api/search?term=${string}`);

    const data = await response.json();
    return data
      .filter((elem) => !elem.label.includes(";"))
      .filter((elem) => elem.type !== "lecturer")
      .map((item) => ({
        id: item.id,
        label: item.label,
        type: item.type,
      }));
  } catch (e) {
    return e;
  }
};

// Поиск необходимого расписания

export const parseSchedule = async (id, type, startTime, endTime) => {
  try {
    const response = await fetch(
      `https://ruz.fa.ru/api/schedule/${type}/${id}?start=${startTime}&finish=${endTime}&lng=1`
    );
    const data = await response.json();

    const neededData = data.map((item) => ({
      auditorium: item.auditorium,
      beginLesson: item.beginLesson,
      discipline: item.discipline,
      dayOfWeek: item.dayOfWeek,
      dayOfWeekString: item.dayOfWeekString,
      endLesson: item.endLesson,
      kindOfWork: item.kindOfWork,
      lecturer: item.lecturer,
      lecturer_title: item.lecturer_title,
      lecturerEmail: item.lecturerEmail,
      stream: item.stream,
      group: item.group,
      url1: item.url1,
      url1_description: item.url1_description,
      url2: item.url2,
      url2_description: item.url2_description,
      date: item.date,
    }));
    return joinByStartTime(neededData);
  } catch (e) {
    return e;
  }
};
