module.exports = (io) => {
  return (req, _, next) => {
    req.io = io;
    next();
  };
};
