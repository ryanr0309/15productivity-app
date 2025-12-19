export default function formatTime(date: Date) {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 || 12;

  return `${h12}:${minutes.toString().padStart(2, "0")}${period}`;
}
