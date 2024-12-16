const map = new Map();

const getHod = async (yeardept) => {
  return map.get(yeardept);
};

const getMentor = async (yeardeptsection) => {
  return map.get(yeardeptsection);
};

const setHod = async (yeardept, hod) => {
  map.set(yeardept, hod);
};

const setMentor = async (yeardeptsection, mentor) => {
  map.set(yeardeptsection, mentor);
};

module.exports = { getHod, getMentor, setHod, setMentor };
