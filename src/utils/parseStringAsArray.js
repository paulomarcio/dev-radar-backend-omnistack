module.exports = (arrayAsString) => {
  return (arrayAsString === undefined) ? [] : arrayAsString.split(',').map(tech => tech.trim());
};