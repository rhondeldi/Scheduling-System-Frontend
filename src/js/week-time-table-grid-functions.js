const formatTime = (hour, minutes) => {
  const period = hour >= 12 ? "PM" : "AM";
  const unformatted_hour = hour % 12 === 0 ? 12 : hour % 12;
  const formattedHour = String(unformatted_hour).padStart(2, "0");
  const formattedMinutes = String(minutes).padStart(2, "0");
  return `${formattedHour}:${formattedMinutes} ${period}`;
};

export function generateTimeSlotRowLabels(startHour, minuteIntervals, dailyTimeSlots) {
  const time_slots = [];
  let hour = startHour;
  let minutes = 0;

  for (let i = 0; i < dailyTimeSlots; i++) {
    const startTime = formatTime(hour, minutes);

    let endHour = hour;
    let endMinutes = minutes + minuteIntervals;

    if (endMinutes >= 60) {
      endHour += Math.floor(endMinutes / 60);
      endMinutes %= 60;
    }

    const endTime = formatTime(endHour, endMinutes);

    time_slots.push(`${startTime} - ${endTime}`);

    minutes += minuteIntervals;
    if (minutes >= 60) {
      hour++;
      minutes %= 60;
    }
  }

  return time_slots;
};