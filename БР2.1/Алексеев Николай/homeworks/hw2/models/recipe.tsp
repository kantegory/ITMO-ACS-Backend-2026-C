import "./enums.tsp";

model recipe {
  id: int32;
  authorId: int32;
  typeId: int32;
  cuisineId: int32;
  title: string;
  desc: string;
  imageUrl: string;
  videoUrl?: string;
  cookTime: int32;
  isPublished: boolean;
  createdAt: int32;
  updatedAt: int32;
  peopleAmount: int16;
  steps: step[];
  ingredients: ingredient[];
  comments?: comment[];
  likes: int32;
  dislikes: int32;
  saves: int32;
}

model createRecipe {
  typeId: int32;
  cuisineId: int32;
  title: string;
  desc: string;
  imageUrl: string;
  videoUrl?: string;
  cookTime: int32;
  peopleAmount: int16;
  steps: step[];
  ingredients: ingredient[];
  isPublished: boolean;
}

model recipeCard {
  recipeId: int32;
  authorId: int32;
  typeId: int32;
  cuisineId: int32;
  title: string;
  desc: string;
  imageUrl: string;
  cookTime: int32;
  createdAt: int32;
  ingredients: ingredient[];
  likes: int32;
  dislikes: int32;
  saves: int32;
}

model step {
  recipeId: int32;
  imageUrl: string;
  text: string;
  number: int16;
}

model ingredient {
  id: int32;
  name: string;
  amount: int16;
  unit: units;
}

model cuisine {
  id: int32;
  name: string;
}

model typeRecipe {
  id: int32;
  name: string;
}

model comment {
  recipeId: int32;
  userId: int32;
  text: string;
  createdAt: int32;
}

model savedRecipe extends recipeCard {
  id: int32;
  userId: int32;
  recipeId: int32;
  createdAt: int32;
}

model gradeRecipe extends recipeCard {
  id: int32;
  userId: int32;
  recipeId: int32;
  createdAt: int32;
  type: grade;
}