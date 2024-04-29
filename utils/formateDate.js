const FormatDateToIST = (date) => {
  const options = {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };
  return date.toLocaleDateString("en-IN", options);
};

module.exports = FormatDateToIST;
