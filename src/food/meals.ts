import * as z from 'zod';
import ingredientsData from '../../food/ingredients.json' with { type: 'json' };
import mealsData from '../../food/meals.json' with { type: 'json' };

const ZMealIngredient = z.object({
  id: z.string(),
  name: z.string(),
  quantity: z.string(),
  kcal: z.number(),
});

export const ZMeal = z.object({
  id: z.string(),
  name: z.string(),
  kcal: z.int(),
  ingredients: z.array(ZMealIngredient),
}).meta({ id: 'Meal' });

export type Meal = z.infer<typeof ZMeal>;

const ingredientsMap = new Map(
  ingredientsData.map((i) => [i.id, i]),
);

const parseGrams = (quantity: string): number => {
  return parseFloat(quantity.replace('g', ''));
};

const parsePortionGrams = (portion: string): number => {
  return parseFloat(portion.replace('g', ''));
};

export const getMeals = (): Meal[] => {
  return mealsData.map((meal) => {
    const ingredients = meal.ingredients.map((ref) => {
      const ingredient = ingredientsMap.get(ref.id);
      if (!ingredient) {
        throw new Error(`Unknown ingredient: ${ref.id}`);
      }

      const quantityGrams = parseGrams(ref.quantity);
      const portionGrams = parsePortionGrams(ingredient.energy.portion);
      const kcal = Math.round((ingredient.energy.kcal * quantityGrams) / portionGrams);

      return {
        id: ingredient.id,
        name: ingredient.name,
        quantity: ref.quantity,
        kcal,
      };
    });

    const totalKcal = ingredients.reduce((sum, i) => sum + i.kcal, 0);

    return {
      id: meal.id,
      name: meal.name,
      kcal: totalKcal,
      ingredients,
    };
  });
};
