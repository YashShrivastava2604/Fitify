/**
 * Calculate BMI (Body Mass Index)
 * Formula: weight (kg) / (height (m))²
 * @param {Number} weight - Weight in kilograms
 * @param {Number} height - Height in centimeters
 * @returns {Number} BMI value rounded to 1 decimal
 */
const calculateBMI = (weight, height) => {
  if (!weight || !height || height === 0) return 0;
  const heightInMeters = height / 100;
  return parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
};

/**
 * Get BMI category
 * @param {Number} bmi - BMI value
 * @returns {String} Category (underweight, normal, overweight, obese)
 */
const getBMICategory = (bmi) => {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
};

/**
 * Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor Equation
 * Male: BMR = 10W + 6.25H - 5A + 5
 * Female: BMR = 10W + 6.25H - 5A - 161
 * @param {Number} weight - Weight in kg
 * @param {Number} height - Height in cm
 * @param {Number} age - Age in years
 * @param {String} gender - 'male' or 'female'
 * @returns {Number} BMR in calories/day
 */
const calculateBMR = (weight, height, age, gender) => {
  if (!weight || !height || !age) return 0;
  
  const baseBMR = (10 * weight) + (6.25 * height) - (5 * age);
  
  if (gender.toLowerCase() === 'male') {
    return Math.round(baseBMR + 5);
  } else {
    return Math.round(baseBMR - 161);
  }
};

/**
 * Calculate TDEE (Total Daily Energy Expenditure)
 * TDEE = BMR × Activity Factor
 * @param {Number} bmr - Basal Metabolic Rate
 * @param {String} activityLevel - sedentary, lightly_active, moderately_active, very_active, extra_active
 * @returns {Number} TDEE in calories/day
 */
const calculateTDEE = (bmr, activityLevel = 'sedentary') => {
  const activityFactors = {
    sedentary: 1.2,          // Little or no exercise
    lightly_active: 1.375,   // Light exercise 1-3 days/week
    moderately_active: 1.55, // Moderate exercise 3-5 days/week
    very_active: 1.725,      // Hard exercise 6-7 days/week
    extra_active: 1.9,       // Very hard exercise & physical job
  };

  const factor = activityFactors[activityLevel] || activityFactors.sedentary;
  return Math.round(bmr * factor);
};

/**
 * Calculate daily calorie target based on goal
 * @param {Number} tdee - Total Daily Energy Expenditure
 * @param {String} goal - 'lose', 'maintain', 'gain'
 * @returns {Number} Target calories/day
 */
const calculateCalorieTarget = (tdee, goal = 'maintain') => {
  switch (goal.toLowerCase()) {
    case 'lose':
      // 500 cal deficit for ~0.5kg loss per week
      return Math.round(tdee - 500);
    case 'gain':
      // 500 cal surplus for ~0.5kg gain per week
      return Math.round(tdee + 500);
    case 'maintain':
    default:
      return tdee;
  }
};

/**
 * Calculate macronutrient targets
 * @param {Number} calories - Daily calorie target
 * @param {String} goal - 'lose', 'maintain', 'gain'
 * @returns {Object} Macros in grams { protein, carbs, fats }
 */
const calculateMacros = (calories, goal = 'maintain') => {
  let proteinPercent, carbsPercent, fatsPercent;

  switch (goal.toLowerCase()) {
    case 'lose':
      // High protein to preserve muscle during weight loss
      proteinPercent = 0.30;  // 30%
      carbsPercent = 0.40;    // 40%
      fatsPercent = 0.30;     // 30%
      break;
    case 'gain':
      // Moderate protein, higher carbs for muscle building
      proteinPercent = 0.25;  // 25%
      carbsPercent = 0.50;    // 50%
      fatsPercent = 0.25;     // 25%
      break;
    case 'maintain':
    default:
      // Balanced macros
      proteinPercent = 0.25;  // 25%
      carbsPercent = 0.45;    // 45%
      fatsPercent = 0.30;     // 30%
      break;
  }

  // Convert calories to grams
  // Protein: 4 cal/g, Carbs: 4 cal/g, Fats: 9 cal/g
  const protein = Math.round((calories * proteinPercent) / 4);
  const carbs = Math.round((calories * carbsPercent) / 4);
  const fats = Math.round((calories * fatsPercent) / 9);

  return { protein, carbs, fats };
};

/**
 * Calculate ideal weight range based on height
 * Using BMI range of 18.5 - 24.9
 * @param {Number} height - Height in cm
 * @returns {Object} { min, max } weight in kg
 */
const calculateIdealWeightRange = (height) => {
  const heightInMeters = height / 100;
  const minWeight = Math.round(18.5 * heightInMeters * heightInMeters);
  const maxWeight = Math.round(24.9 * heightInMeters * heightInMeters);
  return { min: minWeight, max: maxWeight };
};

module.exports = {
  calculateBMI,
  getBMICategory,
  calculateBMR,
  calculateTDEE,
  calculateCalorieTarget,
  calculateMacros,
  calculateIdealWeightRange,
};
