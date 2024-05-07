const loadDashboard = async (req, res) => {
  try {
    res.render("adminDashboard", {});
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  loadDashboard,
};
