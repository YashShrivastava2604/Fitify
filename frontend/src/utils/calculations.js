/**
 * Client-side health calculations (mirrors backend)
 */

export const calculateBMI = (weight, height) => {
  if (!weight || !height) return 0;
  const heightInMeters = height / 100;
  return parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
};

export const getBMICategory = (bmi) => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};

export const calculateBMR = (weight, height, age, gender) => {
  if (!weight || !height || !age) return 0;
  const baseBMR = (10 * weight) + (6.25 * height) - (5 * age);
  return Math.round(gender === 'male' ? baseBMR + 5 : baseBMR - 161);
};

export const calculateTDEE = (bmr, activityLevel = 'sedentary') => {
  const factors = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extra_active: 1.9,
  };
  return Math.round(bmr * (factors[activityLevel] || factors.sedentary));
};

export const calculateCalorieTarget = (tdee, goal = 'maintain') => {
  switch (goal) {
    case 'lose':
      return Math.round(tdee - 500);
    case 'gain':
      return Math.round(tdee + 500);
    default:
      return tdee;
  }
};

export const calculateMacros = (calories, goal = 'maintain') => {
  let proteinPercent, carbsPercent, fatsPercent;

  switch (goal) {
    case 'lose':
      proteinPercent = 0.30;
      carbsPercent = 0.40;
      fatsPercent = 0.30;
      break;
    case 'gain':
      proteinPercent = 0.25;
      carbsPercent = 0.50;
      fatsPercent = 0.25;
      break;
    default:
      proteinPercent = 0.25;
      carbsPercent = 0.45;
      fatsPercent = 0.30;
  }

  return {
    protein: Math.round((calories * proteinPercent) / 4),
    carbs: Math.round((calories * carbsPercent) / 4),
    fats: Math.round((calories * fatsPercent) / 9),
  };
};
