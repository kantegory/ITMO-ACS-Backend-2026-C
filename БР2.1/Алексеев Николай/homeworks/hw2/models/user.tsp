import "./recipe.tsp";
import "./enums.tsp";

model user {
  id: int32;
  role: UserRole;
  login: string;
  firstName: string;
  lastName: string;
  email: string;
  isVerified: boolean;
  createdAt: int32;
  updatedAt: int32;
  photoUrl?: string;
  subscriptions?: subscription[];
  myRecipes?: recipe[];
  savedRecipes?: savedRecipe[];
  likedRecipes?: gradeRecipe[];
  dislikedRecipes?: gradeRecipe[];
}

model subscription {
  id: int32;
  followerId: int32;
  authorId: int32;
  authorLogin: string;
  authorPhotoUrl?: string;
  createdAt: int32;
}